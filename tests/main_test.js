/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

const fs = require('fs');
const path = require("path");
const rimraf = require("rimraf");

const fixturesDir = path.join(__dirname, 'fixtures');

// ------ Steps ------
const flow = require('kronos-flow');
const inboundFile = require('kronos-adapter-inbound-file');
const outboundFile = require('kronos-adapter-outbound-file');
const archiveTar = require('kronos-step-archive-tar');
const passThrough = require('kronos-step-passthrough');


// ------ Interceptors ------
const writeFileInterceptor = require('../lib/writeFile-interceptor.js');
const messageHandlerInterceptor = require('kronos-interceptor-message-handler');
const lineParserInterceptor = require('kronos-interceptor-line-parser');
const streamObj2String = require('kronos-interceptor-stream-obj2string');
const csvTokenizer = require('kronos-interceptor-line-tokenizer-csv');
const headerExtracter = require('kronos-interceptor-line-header');
const token2Obj = require('kronos-interceptor-line-tokens2obj');
const dataProcessorRow = require('kronos-interceptor-object-data-processor-row');
const dataProcessorChunk = require('kronos-interceptor-object-data-processor-chunk');



const ksm = require('kronos-service-manager');

const tmpIn = path.join(__dirname, 'tmp_in');
const tmpOut = path.join(__dirname, 'tmp_out');


describe('main', function () {

	beforeEach(function () {
		// Delete all the the 'volatile' directory
		try {
			rimraf.sync(tmpIn);
			rimraf.sync(tmpOut);
		} catch (err) {
			console.log(err);
		}
		fs.mkdirSync(tmpIn);
		fs.mkdirSync(tmpOut);
	});


	it('test', function (done) {

		ksm.manager().then(function (manager) {
				console.log('started');

				// ---------------------------
				// register all the steps
				// ---------------------------
				inboundFile.registerWithManager(manager);
				outboundFile.registerWithManager(manager);
				archiveTar.registerWithManager(manager);
				passThrough.registerWithManager(manager);
				flow.registerWithManager(manager);

				// ---------------------------
				// register all the interceptors
				// ---------------------------
				writeFileInterceptor.registerWithManager(manager);
				messageHandlerInterceptor.registerWithManager(manager);
				lineParserInterceptor.registerWithManager(manager);
				streamObj2String.registerWithManager(manager);
				csvTokenizer.registerWithManager(manager);
				headerExtracter.registerWithManager(manager);
				token2Obj.registerWithManager(manager);
				dataProcessorRow.registerWithManager(manager);
				dataProcessorChunk.registerWithManager(manager);

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
						console.log("---------- RESULT -------------");
						console.log("Success");
						console.log("-------------------------------");
						done();
					}).catch(err => {
						console.log("---------- ERROR --------------");
						console.log(err);
						console.log("-------------------------------");
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
