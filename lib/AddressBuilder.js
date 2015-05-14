var AddressBuilder = {};

AddressBuilder.requiredFields = {
    'salutation': {
        "name": "Salutation",
        "addressField": "SALUTATION"
    },
    'givenName': {
        "name": "Given Name",
        "addressField": "GIVEN_NAME"
    },
    'familyName': {
        "name": "Family Name",
        "addressField": "FAMILY_NAME"
    },
    'company': {
        "name": "Company",
        "addressField": "COMPANY"
    },
    'companyAddition': {
        "name": "Company",
        "addressField": "COMPANY_ADDITION"
    },
    'street': {
        "name": "Street",
        "addressField": "STREET"
    },
    'postCode': {
        "name": "Post Code",
        "addressField": "ZIP_CODE"
    },
    'place': {
        "name": "Place",
        "addressField": "PLACE"
    }
};

/*
 * Build recipients JSON data before sending it to the API
 */
AddressBuilder.buildRecipients = function (recipient) {
    var recipientFields = [];
    var recipientsData = [];

    var keys = Object.keys(AddressBuilder.requiredFields);
    for (var i in keys) {
        var key = keys[i];
        recipientFields.push(AddressBuilder.requiredFields[key]);
        if (typeof recipient[key] !== "undefined") {
            recipientsData.push(recipient[key]);
        } else {
            recipientsData.push("");
        }
    }

    return {
        recipientFields: recipientFields,
        recipients: [ recipientsData ]
    };
};

module.exports = AddressBuilder;
