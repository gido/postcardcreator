var Client = require('./Client'),
    Postcard = require('./Postcard');

function initializer(user, password, options) {
    return new Client(user, password, options);
}

initializer.Client = Client;
initializer.Postcard = Postcard;

module.exports = initializer;
