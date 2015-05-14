var postcardcreator = require('../index.js'),
    express = require('express'),
    http = require('http');

describe('Postcard Creator API Auth', function () {
    // create a local Express App
    var app = express();


    var auth = require('http-auth');
    var basic = auth.basic({
            realm: "Web."
        }, function (username, password, callback) { // Custom authentication method.
            callback(username === "bob@example.org" && password === "ilovealice");
        }
    );
    app.use(auth.connect(basic));
    //app.use(express.urlencoded());

    app.get('/rest/1.0/users/current', function(req, res) {
        res.send('{ "email": "'+req.user+'" }');
    });

    // Start server
    var serverPort = 3000;
    var server = http.createServer(app).listen(serverPort);

    var testHost = 'localhost:3000';

    it('should send correct HTTP Auth for each request', function (done) {
        var client = new postcardcreator.Client('bob@example.org', 'ilovealice', {'host': testHost, 'useSSL': false });
        client.request({
            'url': '/users/current',
            'method': 'GET'
        }, function (err, data) {
            expect(data).toBeTruthy();
            expect(err).toBeFalsy();

            //expect(data.nodeClientResponse).toBeDefined();
            //expect(data.nodeClientResponse.statusCode).toBe(200);

            expect(data.email).toBe('bob@example.org');

            done();
        });
    });

    it('should return 401 when wrong password is set', function(done) {
        var client = new postcardcreator.Client('bob@example.org', 'wrongpass', {'host': testHost, 'useSSL': false});
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
