var postcardcreator = require('../index.js');

describe('Client', function() {

    it('should build the correct baseUrl', function() {
        var client = new postcardcreator.Client('bob', 'bobpass', {
            'host': 'google.com'
        });

        expect(client.getBaseUrl()).toBe('https://bob:bobpass@google.com/rest/1.0');
    });

    it('should build the correct baseUrl without SSL', function() {
        var client = new postcardcreator.Client('bob', 'bobpass', {
            'host': 'google.com',
            'useSSL': false,
        });

        expect(client.getBaseUrl()).toBe('http://bob:bobpass@google.com/rest/1.0');
    });

    it('should build the correct baseUrl without user/pass', function() {
        var client = new postcardcreator.Client(null, null, {
            host: 'www.yahoo.com'
        });

        expect(client.getBaseUrl()).toBe('https://www.yahoo.com/rest/1.0');
    });

});
