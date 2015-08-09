var postcardcreator = require('../index.js');
var Postcard = require('../lib/Postcard');
var TestServer = require('./server');
var fs = require('fs');
var path = require('path');

describe('Send a Postcard with the Test Server', function() {

    // start the test server
    var server = new TestServer({
        user: 'bob@example.org',
        pass: 'ilovealice',
        host: 'localhost',
        port: 3002,

        testUserId: 12345,
        testNewUserId: 67890,
        testMailingId: 30003,
        testAssetId: 40001,
        testOrderId: 50001
    });

    it ('should send the postcard with success', function(done) {
        var client = new postcardcreator('bob@example.org', 'ilovealice', {
            host: 'localhost:3002',
            useSSL: false
        });

        var asset = fs.createReadStream(path.join(__dirname, 'fixtures', 'image.jpg'));
        var recipient = {
            salutation: "Monsieur",
            givenName: "Bob",
            familyName: "Bobby",
            company: null,
            street: "Street Test 4",
            postCode: "1004",
            place: "Lausanne"
        };
        var message = 'This is a test';

        var postcard = new Postcard(asset, message, recipient);

        client.sendPostcard(postcard, function(err, result) {
            expect(err).toEqual(null);

            expect(result.user.userId).toBe(12345);
            expect(result.mailingId).toBe('30003');
            expect(result.assetId).toBe('40001');
            expect(result.orderId).toBe('50001');
            expect(result.recipient).toBe(recipient);
            expect(result.message).toBe('This is a test');

            server.close();
            done();
        });
    });
});
