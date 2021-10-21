const chai = require('chai');
const app = require('../../index');

const { expect } = chai;
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2MzQ1Njk5MTh9.akX09qvbmXH-rq4AHDBqTCbF1GIfRKpJXU--cNRRkmE';

describe('Check Validate Token function', () => {
  it('should return decode payload', (done) => {
    app.validateToken(token, (err, result) => {
      // call the done() callback with the error if any
      // to terminate the test with an error
      if (err) return done(err);
      // add some assertions
      expect(result).to.be.a('object');
      expect(result.statusCode).to.equal(200);
      expect(result.body)
        .to.be.an('object')
        .and.deep.include({ foo: 'bar' });
      // finally call the done() callback
      // to terminate the test
      return done();
    });
  });
  it('should return 200 response', (done) => {
    app.validateToken(token, (err, result) => {
      // call the done() callback with the error if any
      // to terminate the test with an error
      if (err) return done(err);
      // add some assertions
      expect(result).to.be.a('object');
      expect(result.statusCode).to.equal(200);
      expect(result.body)
        .to.be.an('string')
        .and.be.equal('ok');
      // finally call the done() callback
      // to terminate the test
      return done();
    }, 'test');
  });
});

describe('Check Validate Error Token function', () => {
  it('should return empty token error', (done) => {
    app.validateToken(null, (err) => {
      // add some assertions
      expect(err).to.be.a('object');
      expect(err.statusCode).to.equal(400);
      expect(err.body)
        .to.be.an('string')
        .and.contains('message":"##ERROR: JWT Error: name : noToken');
      done();
      // finally call the done() callback
      // to terminate the test
    });
  });
  it('should return invalid error', (done) => {
    app.validateToken(token.substring(1), (err) => {
      // add some assertions
      expect(err).to.be.a('object');
      expect(err.statusCode).to.equal(400);
      expect(err.body)
        .to.be.an('string')
        .and.contains('##ERROR: JWT Error: name : JsonWebTokenError');
      done();
    }, 'test');
  });
});

// let response = JSON.parse(result.body);
