# Postcard Creator API [![Build Status](https://travis-ci.org/gido/postcardcreator.svg?branch=master)](https://travis-ci.org/gido/postcardcreator)
A node.js API for the [Swiss Post Postcard Creator](http://postcardcreator.post.ch).

# Basic usage

```javascript
var path = require('path'),
    Postcardcreator = require('postcardcreator'),
    SSOHelper = require('postcardcreator/helper/SSOPostHelper')(),
    Postcard = Postcardcreator.Postcard;

SSOHelper.getPostcardcreatorToken(postcard_user, postcard_pass, function(err, token) {

    if (err) {
        console.error(err);
        return;
    }

    var client = new Postcardcreator(token);

    var message = "Hello, here is a picture of me. Best!";
    var assetStream = fs.createReadStream(path.join(__dirname, 'me_under_the_sun.jpg'));
    // here is my real address you can use it to send me picture of your works ;-)
    var recipient = {
        salutation: "Monsieur",
        givenName: "Gilles",
        familyName: "Doge",
        company: "Antistatique.net",
        street: "Rue de Sébeillon 9b",
        postCode: "1004",
        place: "Lausanne"
    };

    var postcard = new Postcard(assetStream, message, recipient);

    client.sendPostcard(postcard, function(err, result) {
        if (err) {
            console.log("Error when sending the postcard. ", err);
            handleError(err);
            return;
        }

        console.log("Postcard sent with success !");
        console.log(result);
    });
});
```


# License
MIT
