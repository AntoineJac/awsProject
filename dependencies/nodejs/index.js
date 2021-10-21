/**
 * Create or decode (verify) string content with a given
 * secret. Create isn't needed for the custom action, but
 * helps in testing the solution
 */
const jsonwebtoken = require('jsonwebtoken');

const { MCSecret } = process.env;

/**
  * Decodes and verifies a given JWT String
  * @param {String} body - JWT string with encoded content
  * @param {String} secret - the key to decode and verify the JWT
  */
const JWTverify = (body, secret) => {
  const result = new Promise((resolve, reject) => {
    if (!body) {
      reject(new Error('missing JWT Token'));
    }

    jsonwebtoken.verify(
      body.toString('utf-8'),
      secret,
      {
        algorithm: 'HS256',
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      },
    );
  });
  return result;
};

const processMC = (token, returnObj) => {
  const result = new Promise((resolve, reject) => {
    JWTverify(token, MCSecret)
      .then((decoded) => {
        // Shorthand for methods that don't do further processing
        if (returnObj) {
          resolve('ok');
        }
        resolve(decoded);
      })
      .catch((err) => {
        reject(err);
      });

    // Comment when testing end-end; Only used for local testing
    // resolve(req.body);
  });
  return result;
};

function CustomError(message, errorCode, errorName) {
  const error = new Error(message);
  error.code = errorCode;
  error.name = errorName;
  return error;
}
CustomError.prototype = Object.create(Error.prototype);

module.exports = {
  processMC,
  JWTverify,
  CustomError,
};
