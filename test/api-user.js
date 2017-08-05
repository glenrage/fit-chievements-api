'use strict';

const expect = require('chai').expect;
const superagent = require('superagent');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const server = require('../app.js');

// const cleanDB = require('./lib/clean-db.js');
const url = `http://localhost:${process.env.PORT}`;

describe('testing api/user route', function() {
  //start the server
  // before(done => serverCtrl.serverUp(server, done));
  //stop the server
  // after(done => serverCtrl.serverDown(server, done));
  //flush database before each describe block
  describe('#GET ', () => {
    it('should respond with a 200 status', done => {
      superagent.get(`${url}/`)
      .send()
      .end((err, res) => {
        expect(res.staus).to.equal(200);
      });
      done();
    });
  });

  // describe('#POST api/user', () => {
  //   it('should respond with a 201 status', done => {
  //     superagent.post(`${url}/api/user`)
  //     .send(exampleUser)
  //     .end((err, res) => {
  //       expect(res.status).to.equal(201);
  //     });
  //     done();
  //   });
  //   it('should respond with a user object', done => {
  //     superagent.post(`${url}/api/user`)
  //     .send(exampleUser)
  //     .end((err, res) => {
  //       expect(res.body).to.be.instanceOf(Object);
  //     });
  //     done();
  //   });
  // });
  //
  // describe('#PUT api/user', () => {
  //   it('should respond with a 201 status', done => {
  //     superagent.put(`${url}/api/user/${12345}`)
  //     .send(exampleUser)
  //     .end((err, res) => {
  //       expect(res.status).to.equal(201);
  //     });
  //     done();
  //   });
  // });
  //
  // describe('#DELETE api/user', () => {
  //   it('should respond with a 204 status', done => {
  //     superagent.delete(`${url}/api/user/${12345}`)
  //     .send(exampleUser)
  //     .end((err, res) => {
  //       expect(res.status).to.equal(204);
  //     });
  //     done();
  //   });
  // });
});
