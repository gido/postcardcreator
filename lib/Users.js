var fs = require('fs');
var dateFormat = require('dateformat');
var AddressBuilder = require('./AddressBuilder');

module.exports = function (client) {

    function current(callback) {
        var requestParams = {
            url: '/users/current',
            method: 'GET'
        };

        return client.request(requestParams, callback);
    }

    function quota(userId, callback) {
        var requestParams = {
            url: '/users/' + userId + '/quota',
            method: 'GET',
        };

        return client.request(requestParams, callback);
    }

    function mailingsPost(userId, params, callback) {

        callback = (typeof params === 'function' ? params : callback);
        params = (typeof params === 'function' ? {} : params) || {};

        // set default value that just works
        params.name = params.name || 'Mobile App mailing ' + dateFormat(new Date(), 'yyyy-dd-mm HH:MM');
        params.productId = params.productId || 2;
        params.source = params.source || 'MOBILE';
        params.addressFormat = params.addressFormat || 'PERSON_FIRST';

        var requestParams = {
            url: '/users/' + userId + '/mailings',
            method: 'POST',
            body: params,
            json: true
        };

        return client.request(requestParams, callback);
    }

    function recipientsPut(userId, mailingId, params, callback) {

        var recipients = AddressBuilder.buildRecipients(params);
        var opts = {
            url: '/users/' + userId + '/mailings/' + mailingId + '/recipients',
            method: 'PUT',
            body: recipients,
            json: true
        };

        return client.request(opts, callback);
    }

    function assetsPost(userId, params, callback) {
        params = params || {};

        var formData = {
            title: params.title || "Title of image",
            asset: params.asset //fs.createReadStream(assetFilename)
        };

        var opts = {
            url: '/users/' + userId + '/assets',
            method: 'POST',
            formData: formData,
            json: true
        };

        return client.request(opts, callback);
    }

    function generatePagePut(pageNumber) {

        return function pagePut(userId, mailingId, page, callback) {
            var opts = {
                url: '/users/' + userId + '/mailings/' + mailingId + '/pages/' + pageNumber,
                method: 'PUT',
                body: page,
                headers: {
                    'Content-Type': 'image/svg+xml'
                }
            };

            return client.request(opts, callback);
        };
    }

    function orderPost(userId, mailingId, params, callback) {
        params = params || {};

        params.paymentType = params.paymentType || 'SWISS_POST';
        params.division = params.division || 'POST_MAIL';
        params.costCenter = params.costCenter || "64000168";
        params.invoiceRefNo = params.invoiceRefNo || "50000024";

        var opts = {
            url: '/users/' + userId + '/mailings/' + mailingId + '/order',
            method: 'POST',
            body: params,
            json: true
        };

        return client.request(opts, callback);
    }

    // @TODO: find a way to not be forced to specify the userId in each API endpoint
    // call current() when constructing the Client ?
    var resourceApi = {
        current: current,

        quota: {
            get: quota
        },

        mailings: {
            create: mailingsPost,
            post: mailingsPost,
            recipients: {
                put: recipientsPut,
            },
            pages: {
                front: {
                    put: generatePagePut(1)
                },
                back: {
                    put: generatePagePut(2)
                }
            },
            order: {
                create: orderPost,
                post: orderPost
            }
        },

        assets: {
            create: assetsPost,
            post: assetsPost
        }
    };

    return resourceApi;
};
