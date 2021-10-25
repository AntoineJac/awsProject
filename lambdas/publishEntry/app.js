/* eslint-disable */
const utilsLayer = require('/opt/nodejs/index');
/* eslint-enable */

exports.lambdaHandler = async (event, context, callback) => {
  const jwtTokenString = JSON.stringify(event.body);
  const decodeBase6JWT = Buffer.from(jwtTokenString, 'base64').toString('utf-8');
  await utilsLayer.processMC(decodeBase6JWT, 'returnObj')
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
