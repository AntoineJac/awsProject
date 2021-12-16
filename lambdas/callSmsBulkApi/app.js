/* eslint-disable */
const axios = require('axios');
/* eslint-enable */

const { SmsApiGatewayKey, EndpointBulkUrlSMS } = process.env;

const templateSMS = {
  id: '',
  batchId: '',
  numRecords: '',
  messageType: '',
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
  communicationMessages: [],
};

const templateMessage = {
  id: '',
  content: '',
  isSensitive: false,
  description: 'Message Sent by Custom Activity in Journey Builder',
  countryCode: '',
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
  const result = axios.post(EndpointBulkUrlSMS,
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

const replaceTemplateSMS = (data, recordsLength) => {
  const numCharctArray = (data.id.match(/_/g) || []).length - 1;
  const batchId = data.id.split('_')
    .slice(0, numCharctArray)
    .join('_') || data.id;

  templateSMS.id = generateUUID();
  templateSMS.batchId = `batchId${batchId}`;
  templateSMS.numRecords = recordsLength;
  templateSMS.messageType = data.messageChannel;
  templateSMS.sender.party.name = !data.senderName ? 'MultiChoice' : data.senderName;
};

const replaceTemplateMessage = (recordData) => {
  const templateMessageCopy = JSON.parse(JSON.stringify(templateMessage));
  templateMessageCopy.id = !recordData.id ? generateUUID() : recordData.id;
  templateMessageCopy.content = recordData.messageContent;
  templateMessageCopy.countryCode = recordData.mobileCountryCode;
  templateMessageCopy.template = recordData.messageTemplate;
  templateMessageCopy.priority = recordData.priority;
  templateMessageCopy.isSensitive = recordData.isSensitive;
  templateMessageCopy.characteristic = recordData.characteristic;
  templateMessageCopy.searchIndexes = recordData.searchIndexes;
  templateMessageCopy.receiver[0].id = recordData.ContactKey;
  templateMessageCopy.receiver[0].phoneNumber = recordData.mobileNumber;
  templateMessageCopy.receiver[0].party.id = recordData.ContactKey;

  return templateMessageCopy;
};

const replaceTemplate = (records) => {
  replaceTemplateSMS(JSON.parse(records[0].body), records.length);

  records.forEach((record) => {
    const templateMessageIndex = replaceTemplateMessage(JSON.parse(record.body));
    templateSMS.communicationMessages.push(templateMessageIndex);
  });

  return templateSMS;
};

exports.lambdaHandler = async (event, context, callback) => {
  // const TemplateSmsFilled = replaceTemplate(event);
  const TemplateSmsFilled = replaceTemplate(event.Records);
  try {
    const response = await callAPI(TemplateSmsFilled);
    return callback(null, response);
  } catch (err) {
    return callback(`##ERROR: ErrorName: ${err.name}  -  ErrorMessage: ${err.message}`);
  }
};
