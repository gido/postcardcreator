var postcardcreator = require('../index.js');

describe('Client', function() {

    it('should build the correct baseUrl', function(done) {
        var user = 'bob',
            pass = 'bobpass',
            testHost = 'google.com',
            apiVersion = '1.0';
        var client = new postcardcreator.Client(user, pass, {
            'host': testHost
        });

        expect(client.getBaseUrl()).toBe('https://'+user+':'+pass+'@'+testHost+'/rest/'+apiVersion);
        done();
    });

    it('should build the correct baseUrl without SSL', function(done) {
        var user = 'bob',
            pass = 'bobpass',
            testHost = 'google.com',
            apiVersion = '1.0';
        var client = new postcardcreator.Client(user, pass, {
            'host': testHost,
            'useSSL': false,
        });

        expect(client.getBaseUrl()).toBe('http://'+user+':'+pass+'@'+testHost+'/rest/'+apiVersion);
        done();
    });

});
