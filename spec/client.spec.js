var postcardcreator = require('../index.js');

describe('Client', function() {

    it('should build the correct baseUrl', function() {
        var client = new postcardcreator.Client('ABC123456', {
            'host': 'google.com'
        });

        expect(client.getBaseUrl()).toBe('https://google.com/rest/2.0');
    });

    it('should build the correct baseUrl without SSL', function() {
        var client = new postcardcreator.Client('ABC123456', {
            'host': 'google.com',
            'useSSL': false,
        });

        expect(client.getBaseUrl()).toBe('http://google.com/rest/2.0');
    });
});
