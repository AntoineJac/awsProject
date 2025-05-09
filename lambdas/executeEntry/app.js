/* eslint-disable */
const utilsLayer = require('/opt/nodejs/index');
const AWS = require('aws-sdk');
/* eslint-enable */

const { smsQueueUrl, smsQueueBulkUrl, smsSmrtQueueBulkUrl } = process.env;
const sqs = new AWS.SQS();

const returnPayloadSms = (decoded) => {
  if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
    const decodedArgs = decoded.inArguments[0];
    const epochTime = Date.now();
    if (decodedArgs.id) {
      decodedArgs.id = `${decodedArgs.id}|${epochTime}`;
    }
    if (!decodedArgs.ContactKey) {
      decodedArgs.ContactKey = decoded.keyValue;
    }
    if (!decodedArgs.messageChannel) {
      throw new utilsLayer.CustomError('Missing messageChannel', 401, 'returnPayloadSmsFunction');
    }
    if (!decodedArgs.messageContent) {
      throw new utilsLayer.CustomError('Missing messageContent', 401, 'returnPayloadSmsFunction');
    }
    if (decodedArgs.messageChannel === 'SMS' && !decodedArgs.mobileNumber) {
      throw new utilsLayer.CustomError('Missing mobile required fields mobileNumber', 401, 'returnPayloadSmsFunction');
    }
    if (decodedArgs.messageChannel === 'SMS' && !decodedArgs.mobileCountryCode) {
      throw new utilsLayer.CustomError('Missing mobile required fields countryCode', 401, 'returnPayloadSmsFunction');
    }
    return decodedArgs;
  }
  throw new utilsLayer.CustomError('BAD Request OR Empty Arguments', 401, 'returnPayloadSmsFunction');
};

/* eslint-disable no-unused-vars */
const sendSqsMessage = async (payloadSMS) => {
  let smsQueueUrlToUse;

  if (payloadSMS.isBulked === 'True') {
    smsQueueUrlToUse = payloadSMS.messageChannel === 'SMS' ? smsQueueBulkUrl : smsSmrtQueueBulkUrl;
  } else {
    smsQueueUrlToUse = smsQueueUrl;
  }

  const payloadSmsStringify = JSON.stringify(payloadSMS);
  const params = {
    QueueUrl: smsQueueUrlToUse,
    MessageBody: payloadSmsStringify,
  };

  return new Promise((resolve, reject) => {
    sqs.sendMessage(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve('SmsApiQueue');
      }
    });
  });
};

const mcActivityExecute = async (decodeBase6JWT) => new Promise((resolve, reject) => {
  // Decode the post body test
  utilsLayer.processMC(decodeBase6JWT)
    .then((decoded) => {
      if (decoded) {
        const payloadSMS = returnPayloadSms(decoded);
        sendSqsMessage(payloadSMS)
          .then((response) => {
            resolve({
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `SMS has been passed to the ${response}`,
              }),
            });
          })
          .catch((err) => {
            throw new utilsLayer.CustomError(`Error when Sending the SMS Queue, ErrorName: ${err.name}  -  ErrorMessage: ${err.message}`, 401, 'SmsApiQueue');
          });
      }
    })
    .catch((err) => {
      reject(err);
    });
});
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context, callback) => {
  const jwtTokenString = JSON.stringify(event.body);
  const decodeBase6JWT = Buffer.from(jwtTokenString, 'base64').toString('utf-8');
  await mcActivityExecute(decodeBase6JWT, context)
    .then((response) => callback(null, response))
    .catch((err) => callback(null, {
      statusCode: err.code || 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `##ERROR: ErrorName: ${err.name}  -  ErrorMessage: ${err.message}`,
      }),
    }));
};
