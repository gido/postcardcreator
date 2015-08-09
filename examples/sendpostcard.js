var postcardcreator = require('../lib'),
    Postcard = postcardcreator.Postcard,
    fs = require('fs'),
    path = require('path'),

    postcard_user = process.env.POST_USER,
    postcard_pass = process.env.POST_PASSWORD,
    options = {};


if (process.env.TEST) {
    postcard_user = 'bob@example.org';
    postcard_pass = 'ilovealice';
    options = {
        host: 'localhost:3001',
        useSSL: false
    };
}

var client = new postcardcreator.Client(postcard_user, postcard_pass, options);

console.log("Created a client with credentials "+postcard_user);


// Example of using promise
var promise = client.users.current();

promise.then(function(user) {
    console.log('User ID', user.userId);
    console.log('User Email', user.email);
    console.log(user);

    // ... and here an exemple using callback
    client.users.quota.get(user.userId, function(err, quota) {

        if (err) {
            console.log('Error : ', err);
            return;
        }

        if (quota.quota <= 0 || quota.globalQuotaExceeded) {
            console.log('Quota exceeded, need to wait 24h :(');
            return;
        }

        console.log('Quota not exceeded :)');
    });

}, function (error) {
    console.log('ERREUR: ', error);
});


// Exemple of sending a PostCard
var message = "Ceci est un test."; // your message
var assetStream = fs.createReadStream(path.join(__dirname, 'images/yann.jpg')); // your image
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
    if (!err) {
        console.log("Postcard sent with success !");
    } else {
        console.log("Error when sending the postcard. ", err);
    }
});
