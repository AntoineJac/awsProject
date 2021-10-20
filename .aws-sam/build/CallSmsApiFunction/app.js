const axios = require('axios');
const SmsApiGatewayKey = process.env.SmsApiGatewayKey;

let templateSMS = {
    "id": "",
    "content": "",
    "isSensitive": false,
    "description": "Message Sent by Custom Activity in Journey Builder",
    "countryCode": "",
    "messageType": "SMS",
    "priority": "1",
    "receiver": [
        {
            "id": "",
            "name": "ContactKey",
            "phoneNumber": "",
            "party": {
                "id": "",
                "role": "Customer",
                "name": "ContactKey",
                "@referredType": "Individual"
            }
        }
    ],
    "sender": {
        "id": "JourneyBuilderCustomActivity",
        "name": "MarketingCloud",
        "phoneNumber": "919743464658",
        "party": {
            "id": "JourneyBuilderCustomActivity",
            "role": "SmsApiGateway",
            "name": "",
            "@referredType": "externalSystem"
        }
    }
};

//generates UUID for static content block name and customer key 
const generateUUID =() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

const callAPI = async (paramsTemplateSMS) => {
    let result = axios.post('https://webhook.site/761ab0e3-ace7-42d4-873c-e12a85a4a4cf', 
        paramsTemplateSMS,
        { 
            headers: {
            'x-Gateway-APIKey': SmsApiGatewayKey
            }
        }
    )
    .then((response) => {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
              },
            body: response.data
        }
    })
    .catch((err) => {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
              },
            body: `##ERROR: ErrorName: ${err.name}  -  ErrorMessage: ${err.message}`
        }
    })
    return result;
}

const replaceTemplate = (data) => {
    if (!data.id) {
        data.id = generateUUID();
    }
    if (!data.senderName) {
        data.senderName = 'MultiChoice';
    }
    templateSMS.id = data.id;
    templateSMS.content = data.messageContent;
    templateSMS.countryCode = data.mobileCountryCode;
    templateSMS.receiver[0].id = data.ContactKey;
    templateSMS.receiver[0].phoneNumber = data.mobileNumber;
    templateSMS.receiver[0].party.id = data.ContactKey;
    templateSMS.sender.party.name = data.senderName;
    return templateSMS
}

exports.lambdaHandler = async (event, context, callback) => {
    const messageReceived = JSON.parse(event);
    replaceTemplate(messageReceived);
    const response = await callAPI(templateSMS);
    return callback(null, response)
}