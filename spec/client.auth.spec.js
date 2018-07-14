var postcardcreator = require('../index.js'),
    express = require('express'),
    http = require('http');

describe('Postcard Creator API Auth', function () {
    // create a local Express App
    var app = express();

    var auth = function (req, res, next) {
        var bearer = req.get('Authorization');
        var token;

        if (bearer) {
          token = bearer.replace('Bearer ', '');
        }

        if ('ABC123456' === token) {
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

    app.get('/rest/2.2/users/current', function(req, res) {
        res.send('{ "email": "testvalue" }');
    });

    // Start server
    var serverPort = 3001;
    var server = http.createServer(app).listen(serverPort);

    var testHost = 'localhost:3001';

    it('should send correct HTTP Auth for each request', function (done) {
        var client = new postcardcreator.Client('ABC123456', {'host': testHost, 'useSSL': false });
        client.request({
            'url': '/users/current',
            'method': 'GET'
        }, function (err, data) {
            expect(data).toBeTruthy();
            expect(err).toBeFalsy();

            done();
        });
    });

    it('should return 401 when wrong password is set', function(done) {
        var client = new postcardcreator.Client('wrongtoken', {'host': testHost, 'useSSL': false});
        client.request({
            'url': '/users/current',
            'method': 'GET'
        }, function (err, data) {
            expect(err).toBeTruthy();
            expect(err.status).toBe(401);

            expect(data).toBeFalsy();

            //expect(err.nodeClientResponse).toBeTruthy();
            //expect(err.nodeClientResponse.statusCode).toBe(401);

            done();
        });
    });

    // last test to close the server
    it('should stop the test server', function(done) {
        server.close();
        done();
    });
});
