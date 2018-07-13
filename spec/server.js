var express = require('express'),
    bodyParser = require('body-parser'),
    http = require('http'),
    util = require('util'),
    path = require('path'),
    fs = require('fs'),
    multiparty = require('multiparty');

function createTestServer(options) {
    options = options || {};

    var validAuthToken = options.validAuthToken || "ABC123456",
        host = options.host || "localhost",
        port = options.port || 3000;

    var testUserId    = options.testUserId    || 12345;
    var testNewUserId = options.testNewUserId || 67890;
    var testMailingId = options.testMailingId || 30003;
    var testAssetId   = options.testAssetId   || 40001;
    var testOrderId   = options.testOrderId   || 50001;


    // create a local Express App
    var app = express();
    var auth = function (req, res, next) {
        var bearer = req.get('Authorization');
        var token;

        if (bearer) {
          token = bearer.replace('Bearer ', '');
        }

        if (validAuthToken === token) {
          next();
        } else {
          res.statusCode = 401;
          res.statusText = 'Unauthorized';
          res.json({
            "error": "invalid_token",
            "error_description": "Cannot convert access token to JSON"
          }).send();
        }
    };

    app.use(auth);

    app.use(bodyParser.json()); // for parsing application/json
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    app.use(bodyParser.raw({ type: 'image/svg+xml' }));

    app.get('/rest/2.2/users/current', function(req, res) {
        var data = {
            "tenantId": "CHE",
            "userId": testUserId,
            "email": req.user,
            "company": null,
            "companyAdditional": null,
            "sex": "MALE",
            "title": null,
            "givenName": "Bob",
            "familyName": "",
            "address": "My Street",
            "addressAdditional": null,
            "poBox": null,
            "postCode": "1004",
            "place": "Lausanne",
            "country": "CHE",
            "phone": null,
            "language": "fr",
            "customerNo": null,
            "newsletterSubscribed": true,
            "gtcAccepted": true
        };

        res.json(data);
    });

    app.post('/rest/2.2/users', function(req, res) {
        var userUrl = req.protocol + '://' + req.get('host') + '/rest/2.2/users/' + testNewUserId;

        var requiredKeys = [
            "tenantId",
            "email",
            "password",
            "company",
            "sex",
            "givenName",
            "familyName",
            "language",
            "newsletterSubscribed",
            "gtcAccepted",
            "address",
            "postCode",
            "place",
            "country"
        ];

        var data = req.body;

        for (var requiredKey in requiredKeys) {
            if (!data.hasOwnProperty(requiredKey)) {
                res.status(400).end('Error, missing value '+requiredKey);
                return;
            }
        }

        res.status(201).location(userUrl).end();

    });

    app.get('/rest/2.2/users/:user_id/quota', function(req, res) {
        var quota = {
            "quota": 1,
            "globalQuotaExceeded": false
        };

        res.json(quota);
    });

    app.post('/rest/2.2/users/:user_id/mailings', function(req, res) {
        var mailingUrl = req.protocol + '://' + req.get('host') + '/rest/2.2/users/' + req.params.user_id + '/mailings/' + testMailingId;

        // {"name":"Mobile App mailing 2015-04-22 20:03", "productId":2, "source":"MOBILE", "addressFormat":"PERSON_FIRST"}
        if (!req.body || !req.body.name || !req.body.productId || !req.body.source || !req.body.addressFormat) {
            return res.status(400)
                .send('Bad Request, missing JSON POST parameters')
                .end();

        }

        // all is fine, return a 201 Created.
        res.status(201)
            .location(mailingUrl)
            .end();
    });

    app.post('/rest/2.2/users/:user_id/assets', function(req, res) {
        var assetUrl = req.protocol + '://' + req.get('host') + '/rest/2.2/assets/user/' + testAssetId;

        var form = new multiparty.Form();
        var hasAssetField = false;
        var hasTitleField = false;

        form.on('error', function() {
            errors = 'Server Error';
            res.status(500).end();
        });

        form.on('part', function(part) {
            // filename is "null" when this is a field and not a file
            if (!part.filename) {
                if (part.name === 'title') {
                    hasTitleField = true;
                }
            }

            if (part.filename && part.name) {
                if (part.name === 'asset') {
                    hasAssetField = true;
                }
            }

            // don't read any data
            part.resume();
        });

        form.on('close', function() {
            if (!hasAssetField || !hasTitleField) {
                return res.status(400).end('Bad request. Missing \'asset\' file field or title field');
            }

            res.status(201).location(assetUrl).end();
        });

        form.parse(req);
    });

    app.put('/rest/2.2/users/:user_id/mailings/:mailing_id/recipients', function(req, res) {

        var body = req.body;

        if (!body || !body.recipientFields || !body.recipients
            || body.recipients.length <= 0
            || body.recipients[0].length !== body.recipientFields.length
        ) {

            return res.status(400)
                .send('Bad Request, missing or bad JSON PUT `recipients` and `recipientFields` parameters')
                .end();

        }

        // all is fine, return a 204 No Content
        res.status(204).end();
    });

    var handleSVGPage = function (req, res) {
        if (req.get('Content-Type') !== 'image/svg+xml') {
            return res.status(400).end('Bad Content-Type');
        }

        if (!req.body.toString().indexOf('<svg')) {
            return res.status(400).end('No SVG data found');
        }

        // all is fine, return a 204 No Content
        res.status(204).end();
    }

    app.put('/rest/2.2/users/:user_id/mailings/:mailing_id/pages/1', handleSVGPage);
    app.put('/rest/2.2/users/:user_id/mailings/:mailing_id/pages/2', handleSVGPage);


    app.post('/rest/2.2/users/:user_id/mailings/:mailing_id/order', function (req, res) {
        var testOrderUrl = req.protocol + '://' + req.get('host') + '/rest/2.2/users' + req.params.user_id + '/orders/' + testOrderId;
        var body = req.body;
        /*
        {
            "paymentType": "SWISS_POST",
            "division": "POST_MAIL",
            "costCenter": "64000168",
            "invoiceRefNo": "50000024"
        }
        */

        if (!body || body.paymentType !== 'SWISS_POST' || body.division !== 'POST_MAIL' || !body.costCenter || body.invoiceRefNo !== '50000024') {
            return res.status(400).end('Bad request, missing JSON parameters');
        }

        res.status(201).location(testOrderUrl).end();
    });

    // Start server
    var server = http.createServer(app).listen(port);

    return server;
}

module.exports = createTestServer;
