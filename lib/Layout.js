var _ = require('underscore'),
    fs = require('fs'),
    path = require('path');

var Layout = {};

/*
 @var
  - assetId
*/
Layout.getFrontPage = function(data) {
    var tpl = fs.readFileSync(path.join(__dirname, 'template', 'front.svg.template')).toString();
    var template = _.template(tpl);

    return template(data);
};

/*
 @var
 - message
 - givenName
 - familyName
 - company
 - street
 - postCode
 - place
 - sender.givenName
 - sender.familyName
 - sender.company
 - sender.address  <-- /!\
 - sender.postCode
 - sender.place
*/
Layout.getBackPage = function (data) {
    var tpl = fs.readFileSync(path.join(__dirname, 'template', 'back.svg.template')).toString();
    var template = _.template(tpl);

    return template(data);
};

module.exports = Layout;
