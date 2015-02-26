var chai = require('chai');

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');
chai.use(require('sinon-chai'));