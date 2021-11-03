const chai = require('chai');
const app = require('../../index');

const { expect } = chai;
const token = 'testTokens';
const encodedPayload = '';

describe('Check Validate Token function', () => {
  // eslint-disable-next-line no-unused-vars
  let envCache;
  // eslint-disable-next-line no-undef
  before(() => {
    envCache = process.env;
    envCache = { MCSecret: token };
  });

  it('should return decode payload', (done) => {
    app.processMC(encodedPayload)
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body)
          .to.be.an('object')
          .and.deep.include({ foo: 'bar' });
        // finally call the done() callback
        // to terminate the test
        return done();
      })
      .catch((err) => done(err));
  });

  it('should return 200 response', (done) => {
    app.processMC(encodedPayload, 'test')
      .then((result) => {
        expect(result).to.be.a('object');
        expect(result.statusCode).to.equal(200);
        expect(result.body)
          .to.be.an('string')
          .and.be.equal('ok');
        return done();
      })
      .catch((err) => done(err));
  });
});

describe('Check Validate Error Token function', () => {
  it('should return empty token error', (done) => {
    app.processMC(null)
      .then(() => done())
      .catch((err) => {
        expect(err).to.be.a('object');
        expect(err.statusCode).to.equal(400);
        expect(err.body)
          .to.be.an('string')
          .and.contains('message":"##ERROR: JWT Error: name : noToken');
        return done(err);
      });
  });

  it('should return invalid error', (done) => {
    app.processMC(encodedPayload.substring(1))
      .then(() => done())
      .catch((err) => {
        expect(err).to.be.a('object');
        expect(err.statusCode).to.equal(400);
        expect(err.body)
          .to.be.an('string')
          .and.contains('##ERROR: JWT Error: name : JsonWebTokenError');
        return done(err);
      });
  });
});
