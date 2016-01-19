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
const flow = require('kronos-flow');
const inboundFile = require('kronos-adapter-inbound-file');
const outboundFile = require('kronos-adapter-outbound-file');
const archiveTar = require('kronos-step-archive-tar');


const ksm = require('kronos-service-manager');


describe('main', function () {

	// beforeEach(function () {
	// 	// Delete all the the 'volatile' directory
	// 	try {
	// 		rimraf.sync(tmpIn);
	// 		rimraf.sync(tmpOut);
	// 	} catch (err) {
	// 		console.log(err);
	// 	}
	// 	fs.mkdirSync(tmpIn);
	// 	fs.mkdirSync(tmpOut);
	// });


	it('test', function (done) {

		ksm.manager().then(function (manager) {
				console.log('started');

				// ---------------------------
				// register all the steps
				// ---------------------------
				inboundFile.registerWithManager(manager);
				outboundFile.registerWithManager(manager);
				archiveTar.registerWithManager(manager);
				flow.registerWithManager(manager);

				// ---------------------------
				// load the flows
				// ---------------------------

				const filePath = path.join(fixturesDir, 'main-flow.json');
				const fileContent = fs.readFileSync(filePath, 'utf8');
				const flowDefintion = JSON.parse(fileContent);

				flow.loadFlows(manager, manager.scopeReporter, flowDefintion);

				// get the flow from the manager
				const myFlow = manager.flows['untar-applications'];

				console.log('start the flow');

				// ---------------------------
				// Start the flow
				// ---------------------------
				myFlow.start().then(function (step) {
					console.log('flow: started');

					// trigger the inbound file
					let message = {
						"info": {},
						"hops": [],
						"payload": {}
					};
					message.payload = path.join(fixturesDir, 'accounts.tar');

					const sendEndpoint = myFlow.endpoints.inFileTrigger;
					sendEndpoint.receive(message).then(res => {
						console.log(res);
						done();
					}).catch(err => {
						console.log(err);
						done(err);
					});
				}).catch(function (err) {
					console.log(err);
				});



			},
			function (err) {
				console.log(err);
			});

	});
});
