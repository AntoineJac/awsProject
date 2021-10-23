const axios = require('axios');

const { SmsApiGatewayKey, EndpointUrlSMS } = process.env;

const templateSMS = {
  id: '',
  content: '',
  isSensitive: false,
  description: 'Message Sent by Custom Activity in Journey Builder',
  countryCode: '',
  messageType: '',
  template: '',
  characteristic: [],
  searchIndexes: [],
  priority: '1',
  receiver: [
    {
      id: '',
      name: 'ContactKey',
      phoneNumber: '',
      party: {
        id: '',
        role: 'Customer',
        name: 'ContactKey',
        '@referredType': 'Individual',
      },
    },
  ],
  sender: {
    id: 'JourneyBuilderCustomActivity',
    name: 'MarketingCloud',
    phoneNumber: '919743464658',
    party: {
      id: 'JourneyBuilderCustomActivity',
      role: 'SmsApiGateway',
      name: '',
      '@referredType': 'externalSystem',
    },
  },
};

// generates UUID for static content block name and customer key
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  /* eslint-disable no-bitwise */
  const r = (Math.random() * 16) | 0;
  const v = c === 'x' ? r : (r & 0x3) | 0x8;
  /* eslint-enable no-bitwise */
  return v.toString(16);
});

const callAPI = async (paramsTemplateSMS) => {
  const result = axios.post(EndpointUrlSMS,
    paramsTemplateSMS,
    {
      headers: {
        'x-Gateway-APIKey': SmsApiGatewayKey,
      },
    })
    .then((response) => JSON.stringify({
      message: `API call sent succesfully: Response: ${response.data}`,
    }))
    .catch((err) => { throw new Error(err); });
  return result;
};

const replaceTemplate = (data) => {
  templateSMS.id = !data.id ? generateUUID() : data.id;
  templateSMS.content = data.messageContent;
  templateSMS.countryCode = data.mobileCountryCode;
  templateSMS.messageType = data.messageChannel;
  templateSMS.template = data.messageTemplate;
  templateSMS.characteristic = data.messageCharacteristic;
  templateSMS.searchIndexes = data.messageSearchIndexes;
  templateSMS.receiver[0].id = data.ContactKey;
  templateSMS.receiver[0].phoneNumber = data.mobileNumber;
  templateSMS.receiver[0].party.id = data.ContactKey;
  templateSMS.sender.party.name = !data.senderName ? 'MultiChoice' : data.senderName;
  return templateSMS;
};

exports.lambdaHandler = async (event, context, callback) => {
  // const TemplateSmsFilled = replaceTemplate(event);
  const TemplateSmsFilled = replaceTemplate(event.Records[0].body);
  try {
    const response = await callAPI(TemplateSmsFilled);
    return callback(null, response);
  } catch (err) {
    return callback(`##ERROR: ErrorName: ${err.name}  -  ErrorMessage: ${err.message}`);
  }
};
