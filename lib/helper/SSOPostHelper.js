var request = require('request');
var _ = require('underscore');

/**
 * Helper function to interact with the SSO (Single Sign On) of the Swiss Post.
 */
function SSOPostHelper() {

};

SSOPostHelper.prototype.buildLoginURL = function() {
  var url = 'https://account.post.ch/SAML/IdentityProvider/?login';

  url += '&app=pcc&service=pcc';
  url += '&targetURL=https://postcardcreator.post.ch';
  url += '&abortURL=https://postcardcreator.post.ch';
  url += '&inMobileApp=true';

  return url;
};

/**
 * Get a Postcard Creator Access Token by authenticated user with email/password against the SSO.
 * This is really a hacky, not reliable and not future-proof way to achieve to achieve the goal...
 *
 * @param string email
 * @param string password
 * @param Function callback called with params (err, token)
 *                 In case of sucess token is an object with:
 *                   - access_token: {string} that represent the token
 *                   - type: {string} type of the token ('bearer')
 *                   - expires_in: {integer} in seconds (around 3600)
 */
SSOPostHelper.prototype.getPostcardcreatorToken = function(email, password, callback) {
  var cookieJar = request.jar();
  var helper = this;

  // 1. Access the Login Form (purpose: fetch cookies)
  helper._getCredentialsForm(cookieJar, function(err, response, body) {
    if (err) {
      callback(err);
      return;
    }
    // 2. Submit the Login Form
    helper._submitCredentialsForm(email, password, cookieJar, function(err, response, body) {
      if (err) {
        callback(err);
        return;
      }

      // 3. Then we are redirected to a page that only contain a form to create a POST request. Get this page.
      helper._getSAMLResponseForm(cookieJar, function(err, response, body) {
        if (err) {
          callback(err);
          return;
        }

        // 4. POST to the same page to reach the next step...
        helper._requestSAMLResponse(cookieJar, function(err, result) {
          if (err) {
            callback(err);
            return;
          }

          // 5. Finally we get the RelayState and SAMLResponse serialized that we can forward
          // to Postcard Creator Service Provider and get our access token.
          helper._requestAccessToken(result.RelayState, result.SAMLResponse, function (err, response, token) {
            if (err) {
              callback(err);
              return;
            }

            callback(null, token);
          });
        });
      });
    });
  });
};

SSOPostHelper.prototype._getCredentialsForm = function (cookieJar, callback) {
  var self = this;
  this.request(self.buildLoginURL(), function (err, response, body) {
    if (err) {
      callback(err, null);
      return;
    }

    if (response.statusCode !== 302) {
      callback('Response is not a 302 redirect but '+response.statusCode);
      return;
    }

    // manually store cookie during a 302 response
    // because the lib seem to don't do it in this case
    response.headers['set-cookie'].forEach(function(aCookie) {
      var cookie = request.cookie(aCookie);
      cookieJar.setCookie(cookie, self.buildLoginURL());
    });

    // follow the redirection (with our brand new cookies)
    var urlRedirection = response.headers.location;
    self.request({ url: urlRedirection, jar: cookieJar }, function (err, response, body) {
      if (err) {
        callback(err);
        return;
      }

      callback(err, response, body);
    });
  });
};

SSOPostHelper.prototype._submitCredentialsForm = function (email, password, cookieJar, callback) {
  var opts = {
    url: this.buildLoginURL(),
    method: 'POST',
    form: {
      isiwebuserid: email,
      isiwebpasswd: password,
      confirmLogin: ''
    },
    jar: cookieJar
  };

  this.request(opts, function (err, httpResponse, body) {
    if (err) {
      callback(err, null);
      return;
    }

    // One way to know if we are correctly logged is to check if the response set new cookies
    // @TODO Follow the redirect and extract error messages from the HTML Form.
    if (typeof httpResponse.headers['set-cookie'] === "undefined" || httpResponse.headers['set-cookie'].length < 1) {
      callback("Error, check your credentials.");
      return;
    }

    callback(err, httpResponse, body);
  });
};

SSOPostHelper.prototype._getSAMLResponseForm = function (cookieJar, callback) {
  var opts = {
    url: this.buildLoginURL(),
    method: 'GET',
    jar: cookieJar
  };

  this.request(opts, function (err, response, body) {
    if (err) {
      callback(err, null);
      return;
    }

    callback(err, response, body);
  });
};

SSOPostHelper.prototype._requestSAMLResponse = function (cookieJar, callback) {
  var opts = {
    url: this.buildLoginURL(),
    method: 'POST',
    jar: cookieJar
  };

  this.request(opts, function (err, httpResponse, body) {
    var result = {};
    var matches;

    if (err) {
      callback(err, null);
      return;
    }

    if (!(matches = body.match(/<input type="hidden" name="RelayState" value="([^"]+)"\/>/))) {
      callback("Can't extract RelayState value from response.");
      return;
    }

    result.RelayState = matches[1];

    if (!(matches = body.match(/<input type="hidden" name="SAMLResponse" value="([^"]+)"\/>/))) {
      callback("Can't extract SAMLResponse from response");
      return;
    }

    result.SAMLResponse = matches[1];

    callback(null, result);
  });
};

SSOPostHelper.prototype._requestAccessToken = function (relayState, SAMLResponse, callback) {
  var opts = {
    url: 'https://postcardcreator.post.ch/saml/SSO/alias/defaultAlias',
    method: 'POST',
    form: {
      RelayState: relayState,
      SAMLResponse: SAMLResponse
    },
    json: true,
  };

  this.request(opts, function (err, response, body) {
    if (err) {
      callback(err, null);
      return;
    }

    callback(null, response, body);
  });
};


SSOPostHelper.prototype.request = function (options, callback) {
  if (_.isString(options)) {
      options = { url: options, method: 'GET' };
  }

  options.followRedirect = false;
  options.headers = options.headers || {};
  options.headers['Accept'] = '*/*';
  options.headers['Accept-Charset'] = 'utf-8';
  options.headers['User-Agent'] = 'Mozilla/5.0 (Linux; Android 5.1; Nexus 5 Build/LMY47I) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Mobile';
  options.headers['X-Requested-With'] = 'ch.post.it.pcc';

  return request(options, callback);
};

module.exports = SSOPostHelper;
