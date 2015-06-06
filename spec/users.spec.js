var postcardcreator = require('../index.js');
var stream = require('stream');

describe('Users', function() {
    var clientOptions = {};
    var client = new postcardcreator.Client('bob@example.org', 'ilovealice');

    beforeEach(function() {
        spyOn(client, 'request');
    });

    it('get the current user', function() {
        client.users.current();

        expect(client.request).toHaveBeenCalledWith({
            url: '/users/current',
            method: 'GET'
        }, undefined);
    });

    it('get the quota user', function() {
        client.users.quota.get(456);

        expect(client.request).toHaveBeenCalledWith({
            url: '/users/456/quota',
            method: 'GET',
        }, undefined);
    });

    it('create a new user', function() {
        var user = {
            tenantId: "CHE",
            email: 'charles@example.org',
            password: 'passw0rd',
            company: null,
            sex: 'MALE',
            givenName: 'Charles',
            familyName: 'Dickens',
            language: 'en',
            newsletterSubscribed: false,
            gtcAccepted: true,
            address: "Rue du Roman 7",
            postCode: "1000",
            place: "Lausanne",
            country: "CHE"
        };

        client.users.create(user);

        expect(client.request).toHaveBeenCalledWith({
            url: '/users',
            method: 'POST',
            body: user,
            json: true
        }, undefined);
    });


    it('create the mailings', function() {
        var callback = function () {};
        client.users.mailings.create(12345, callback);

        expect(client.request).toHaveBeenCalled();

        expect(client.request.mostRecentCall.args[0].url).toBe('/users/12345/mailings');
        expect(client.request.mostRecentCall.args[0].method).toBe('POST');
        expect(client.request.mostRecentCall.args[0].body).toBeDefined();

        // name is generated based on current datetime
        expect(client.request.mostRecentCall.args[0].body.name).not.toBeNull();
        expect(client.request.mostRecentCall.args[0].body.productId).toBe(2);
        expect(client.request.mostRecentCall.args[0].body.source).toBe('MOBILE');
        expect(client.request.mostRecentCall.args[0].body.addressFormat).toBe('PERSON_FIRST');

        expect(client.request.mostRecentCall.args[1]).toBe(callback);
    });

    it('upload the asset', function() {
        // create a fake stream
        var asset = new stream.Readable();
        asset._read = function noop() {}; // this is needed for node v0.10.26
        asset.push('[dataimagehere]');

        client.users.assets.create(12345, {
            title: 'My asset title',
            asset: asset
        });

        expect(client.request).toHaveBeenCalledWith({
            url: '/users/12345/assets',
            method: 'POST',
            formData: {
                title: 'My asset title',
                asset: asset
            },
            json: true
        }, undefined);
    });

});
