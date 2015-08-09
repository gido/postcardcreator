var _ = require('underscore');
var fs = require('fs');
var DefaultLayout = require('./Layout');

/**
 Postcard object

 @param {stream.Readable} image
 @param {string} message
 @param {object} recipient the address of the person you want to send the postcard to
     - @member givenName
     - @member familyName
     - @member company
     - @member street
     - @member postCode
     - @member place
 @param {object} sender address of the postcard (optional) If not defined will be automatically filled with authenticated user.
     - @member givenName
     - @member familyName
     - @member company
     - @member street
     - @member postCode
     - @member place
 @param {object} options (optional)
 */
function Postcard(image, message, recipient, sender, options) {
    this.image = image;
    this.recipient = recipient;
    this.message = message;
    this.sender = sender;
    this.options = options || {};
};

/**
 Render the front page layout.

 @param data
    - assetId

 @return string of a SVG rendered template
*/
Postcard.prototype.renderFrontPage = function (data) {

    return DefaultLayout.getFrontPage(data);
};

/**
 Render the back page layout.

 @param missingData
    - sender

 @return string of a SVG rendered template
 */
Postcard.prototype.renderBackPage = function (missingData) {
    var data = {};

    data.message = this.message || missingData.message;
    data.recipient = this.recipient || missingData.recipient;
    data.sender = this.sender || missingData.sender;

    return DefaultLayout.getBackPage(data);
};

module.exports = Postcard;
