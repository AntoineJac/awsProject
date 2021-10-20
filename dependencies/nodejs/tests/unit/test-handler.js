'use strict';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2MzQ1Njk5MTh9.akX09qvbmXH-rq4AHDBqTCbF1GIfRKpJXU--cNRRkmE';

const app = require('../../index.js');
const chai = require('chai');
const expect = chai.expect;
var event, context;

describe('Check Validate Token function', function () {
    it('should return decode payload', function(done) {
        app.validateToken(token, function(err, result) {
            // call the done() callback with the error if any
            // to terminate the test with an error
            if (err) return done(err);
            // add some assertions
            expect(result).to.be.a('object');
            expect(result.statusCode).to.equal(200);
            expect(result.body)
                .to.be.an('object')
                .and.deep.include({ foo: "bar" });
            // finally call the done() callback
            // to terminate the test
            done();
        })
    })
    it('should return 200 response', function(done) {
        app.validateToken(token, function(err, result) {
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
            done();
        }, 'test')
    })
});

describe('Check Validate Error Token function', function () {
    it('should return empty token error', function(done) {
        app.validateToken(null, function(err, result) {
            // add some assertions
            expect(err).to.be.a('object');
            expect(err.statusCode).to.equal(400);
            expect(err.body)
                .to.be.an('string')
                .and.contains('message":"##ERROR: JWT Error: name : noToken');
            done();
            // finally call the done() callback
            // to terminate the test
        })
    })
    it('should return invalid error', function(done) {
        app.validateToken(token.substring(1), function(err, result) {
            // add some assertions
            expect(err).to.be.a('object');
            expect(err.statusCode).to.equal(400);
            expect(err.body)
                .to.be.an('string')
                .and.contains('##ERROR: JWT Error: name : JsonWebTokenError');
            done();
        }, 'test')
    })
});

//let response = JSON.parse(result.body);
