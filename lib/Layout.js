var _ = require('underscore'),
    fs = require('fs'),
    path = require('path');

var Layout = {};

Layout.FRONT_SVG_TEMPLATE_PATH = path.join(__dirname, 'template', 'front.svg.template');
Layout.BACK_SVG_TEMPLATE_PATH = path.join(__dirname, 'template', 'back.svg.template');

/*
 @var
  - assetId
*/
Layout.getFrontPage = function(data) {
    var tpl = fs.readFileSync(this.FRONT_SVG_TEMPLATE_PATH).toString();
    var template = _.template(tpl);

    return template(data);
};

/*
 @var
 - message
 - recipient.givenName
 - recipient.familyName
 - recipient.company
 - recipient.street
 - recipient.postCode
 - recipient.place
 - sender.givenName
 - sender.familyName
 - sender.company
 - sender.address  <-- /!\
 - sender.postCode
 - sender.place
*/
Layout.getBackPage = function (data) {
    data.message = data.message.split(/\r?\n/)
    var tpl = fs.readFileSync(this.BACK_SVG_TEMPLATE_PATH).toString();
    var template = _.template(tpl);

    return template(data);
};

module.exports = Layout;
