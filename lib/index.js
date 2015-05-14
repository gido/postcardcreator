var Client = require('./Client');

function initializer(user, password, options) {
    return new Client(user, password, options);
}

initializer.Client = Client;

module.exports = initializer;
