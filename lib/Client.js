var request = require('request');
var Q = require('q');
var _ = require('underscore');
var Users = require('./Users');
var DefaultLayout = require('./Layout');

var defaultHost = 'postcardcreator.post.ch';

/**
 Client constructor.
 @constructor
 @param {string} user
 @param {string} password
 @param {object} options (optional)
 - @member {string} host
 - @member {bool} useSSL
 */
function Client(user, password, options) {
    options = options || {};
    this.user = user;
    this.password = password;
    this.host = options.host || defaultHost;
    this.proxy = options.proxy || null;

    if (typeof options.useSSL !== "undefined") {
        this.useSSL = options.useSSL;
    } else {
        // default value
        this.useSSL = true;
    }

    var usersResources = Users(this);
    this.users = usersResources;
}

/**
 Send a Postcard.

 @param {stream.Readable} image
 @param {string} message
 @param {object} recipient
 - @member givenName
 - @member familyName
 - @member company
 - @member street
 - @member zipCode
 - @member place

 @param {object} options (optional)
 @param {function} callback (optional)
 */
Client.prototype.sendPostcard = function (image, recipient, message, options, callback) {
    var deferred = Q.defer();
    var client = this;

    callback = (typeof options === 'function' ? options : callback);
    options = (typeof options === 'object' ? options : {});

    var postcardResult = {
        recipient: recipient,
        message: message
    };

    /*
     * @TODO argh! I don't how to cleanup this code by using promise
     * without loosing variable scope (userId, mailingId, assetId, ...)
     */
    client.users.current(function(err, user) {

        if (err) {
            console.log('** ERROR ** on users.current() ', err);
            return deferred.reject(err);
        }

        var userId = user.userId;
        postcardResult.user = user;

        // create the mailing
        client.users.mailings.create(userId, {}, function (err, result) {

            if (err) {
                console.log('** ERROR ** on mailings.create() ', err);
                return deferred.reject(err);
            }

            var mailingId = result.nodeClientResponse.headers['location'].match(/[0-9]+$/)[0];
            postcardResult.mailingId = mailingId;

            // upload assets
            client.users.assets.create(userId, { asset: image }, function (err, result) {

                if (err) {
                    console.log('** ERROR during assets.create() ', err);
                    return deferred.reject(err);
                }

                var assetId = result.nodeClientResponse.headers['location'].match(/[0-9]+$/)[0];
                postcardResult.assetId = assetId;

                // set recipients
                client.users.mailings.recipients.put(userId, mailingId, recipient, function(err, result) {

                    if (err) {
                        console.log('** ERROR during recipients.put() ** ', err);
                        return deferred.reject(err);
                    }

                    var frontLayout = DefaultLayout.getFrontPage({ assetId: assetId });
                    var backLayout = DefaultLayout.getBackPage({
                        message: message,
                        givenName: recipient.givenName,
                        familyName: recipient.familyName,
                        company: recipient.company,
                        street: recipient.street,
                        postCode: recipient.postCode,
                        place: recipient.place,
                        sender: user
                    });

                    // define the layout of the frontpage
                    client.users.mailings.pages.front.put(userId, mailingId, frontLayout, function(err, result) {

                        if (err) {
                            console.log('** ERROR during mailings.pages.front.put() ** ', err);
                            return deferred.reject(err);
                        }

                        // define the layout of the back page
                        client.users.mailings.pages.back.put(userId, mailingId, backLayout, function(err, result) {

                            if (err) {
                                console.log('** ERROR during mailings.pages.back.put() ** ', err);
                                return deferred.reject(err);
                            }

                            // Create the Order
                            client.users.mailings.order.create(userId, mailingId, {}, function(err, result) {

                                if (err) {
                                    console.log('** ERROR during mailings.order.create() ** ', err);
                                    return deferred.reject(err);
                                }

                                var orderId = result.nodeClientResponse.headers['location'].match(/[0-9]+$/)[0];
                                postcardResult.orderId = orderId;

                                // ** END **
                                deferred.resolve(postcardResult);
                            });
                        });
                    });
                });
            });
        });
    });

    return deferred.promise.nodeify(callback);
};

/**
 Get the base Url which will be used for all request with this client.

 @returns {string} - the API base URL
 */
Client.prototype.getBaseUrl = function () {
    return (this.useSSL ? 'https':'http') + '://' + this.user + ':' + this.password + '@' + this.host + '/rest/1.0';
};

/**
 Make an authenticated request against the API.

 @param {object} options - options for HTTP request.
 @param {function} callback - when request is complete
 - @param {object} error - an error object if there is a problem
 - @param {object} data - the JSON-parsed data
 */
Client.prototype.request = function (options, callback) {
    var deferred = Q.defer();
    var client = this;

    if (_.isString(options)) {
        options = { url: options, method: 'GET', json: true };
    }

    // Add base URL if we weren't given an absolute one
    if (options.url.indexOf('http') !== 0) {
        options.url = client.getBaseUrl() + options.url;
    }

    options.headers = options.headers || {};
    options.headers['Accept'] = '*/*';
    options.headers['Accept-Charset'] = 'utf-8';
    options.headers['User-Agent'] = 'Mozilla/5.0 (Linux; Android 5.1; Nexus 5 Build/LMY47I) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Mobile';

    if (this.proxy) {
        options.proxy = this.proxy;
    }

    // do the request
    request(options, function(err, response, body) {
        var data;

        try {
            if (err) {
                data = err;
            } else {
                data = body ? JSON.parse(body) : {};
            }
        } catch (e) {
            data = { status: 500, message: (e.message || 'Invalid JSON body') };
        }

        //request doesn't think 4xx is an error - we want an error for any non-2xx status codes
        var error = null;
        if (err || (response && (response.statusCode < 200 || response.statusCode > 206))) {
            error = {};
            // response is null if server is unreachable
            if (response) {
                error.status = response.statusCode;
                error.message = 'Unable to complete HTTP request';
            } else {
                error.status = 500;
                error.message = 'Unable to reach host: "'+client.host+'"';
            }
        }

        //hang response off the JSON-serialized data, as unenumerable to allow for stringify.
        Object.defineProperty(data, 'nodeClientResponse', {
            value: response,
            configurable: true,
            writeable: true,
            enumerable: false
        });

        error && Object.defineProperty(error, 'nodeClientResponse', {
            value: response,
            configurable: true,
            writeable: true,
            enumerable: false
        });

        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(data);
        }
    });


    // Return promise, but also support original node callback style
    return deferred.promise.nodeify(callback);
};

module.exports = Client;
