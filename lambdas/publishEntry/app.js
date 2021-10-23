/* eslint-disable */
const utilsLayer = require('/opt/nodejs/index');
/* eslint-enable */

exports.lambdaHandler = async (event, context, callback) => {
  await utilsLayer.processMC(event.body, 'returnObj')
    .then((response) => context.succeed(response))
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
