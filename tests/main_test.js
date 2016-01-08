/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const fs = require('fs');
const path = require("path");

const fixturesDir = path.join(__dirname, 'fixtures');


const manager = require('kronos-service-manager').manager;
const flow = require('kronos-flow');
const inboundFile = require('kronos-adapter-inbound-file');
const outboundFile = require('kronos-adapter-outbound-file');


manager().then(function (manager) {
	console.log('started');


	// ---------------------------
	// register all the steps
	// ---------------------------
	flow.registerWithManager(manager);
	inboundFile.registerWithManager(manager);
	outboundFile.registerWithManager(manager);

	// ---------------------------
	// load the flows
	// ---------------------------
	const flowDefintion = require(path.join(fixturesDir, 'main-flow.json'));
	flow.flow.loadFlows(manager, manager.scopeReporter, flowDefintion);

	// get the flow from the manager
	const myFlow = manager.getFlow('untar-applications');

	myFlow.start().then(function (step) {
		console.log('flow: started');



	}.catch(function (err) {
		console.log(err);
	}));



}).catch(function (err) {
	console.log(err);
});
