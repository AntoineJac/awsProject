const utilsLayer = require('/opt/nodejs/index');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const returnPayloadSms = (decoded) => {
  if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
    const decodedArgs = decoded.inArguments[0];
    if (!decodedArgs.ContactKey) {
      decodedArgs.ContactKey = decoded.keyValue;
    }
    if (!decodedArgs.messageChannel) {
      throw new utilsLayer.CustomError("Missing messageChannel", 401, "returnPayloadSmsFunction")
    }
    if (!decodedArgs.messageContent) {
      throw new utilsLayer.CustomError("Missing messageContent", 401, "returnPayloadSmsFunction")
    }
    if (decodedArgs.messageChannel == "SMS" && !decodedArgs.mobileNumber) {
      throw new utilsLayer.CustomError("Missing mobile required fields mobileNumber", 401, "returnPayloadSmsFunction")
    }
    if (decodedArgs.messageChannel == "SMS" && !decodedArgs.mobileCountryCode) {
      throw new utilsLayer.CustomError("Missing mobile required fields countryCode", 401, "returnPayloadSmsFunction")
    }
    return decodedArgs
  } else {
    throw new utilsLayer.CustomError("BAD Request OR Empty Arguments", 401, "returnPayloadSmsFunction")
  }
}

const invokeSmsApiLambda = async (payloadSMS) => {
  const params = {
      FunctionName: 'sam-hello-world-CallSmsApiFunction-cz6icpbBQzOj',
      InvocationType: 'Event',
      Payload: payloadSMS
  };

  return new Promise((resolve, reject) => {
      lambda.invoke(params, (err,data) => {
          if (err) {
              console.log(err, err.stack);
              reject(err);
          }
          else {
              console.log(data);
              resolve(data);
          }
      });     
  });
}

const mcActivityExecute = async (event, context) => {
    return new Promise((resolve, reject) => {
      // Decode the post body
      utilsLayer.processMC(event.body)
          .then((decoded) => {
              if (decoded) {
                  const payloadSMS = JSON.stringify(returnPayloadSms(decoded));
                  invokeSmsApiLambda(payloadSMS)
                  .then((responseData) => {
                    resolve({
                        statusCode: 200,
                        headers: {
                          'Content-Type': 'application/json',
                        },  
                        body: 'SMS has been passed to the CallApiFunction'
                    })
                  })
                  .catch((err) => {})
              }
          })
          .catch((err) => {
            reject({
                statusCode: err.code || 400,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `##ERROR: ErrorName: ${err.name}  -  ErrorMessage: ${err.message}`
                })
            }) 
          })
    });
};
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
  await mcActivityExecute(event, context)
    .then((response) => {
      return callback(null, response)
    })
    .catch((err) => {
      return callback(null, err)
    });
}


