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

const ksm = require('kronos-service-manager');

const tmpIn = path.join(__dirname, 'tmp_in');
const tmpOut = path.join(__dirname, 'tmp_out');


// ------ Steps ------
const flow = require('kronos-flow');
const inboundFile = require('kronos-adapter-inbound-file');
const outboundFile = require('kronos-adapter-outbound-file');
const archiveTar = require('kronos-step-archive-tar');
const passThrough = require('kronos-step-passthrough');


// ------ Interceptors ------
const debugLogInterceptor = require('../lib/debug-log-interceptor.js');
const writeFileInterceptor = require('../lib/writeFile-interceptor.js');
const messageHandlerInterceptor = require('kronos-interceptor-message-handler');
const lineParserInterceptor = require('kronos-interceptor-line-parser');
const streamObj2String = require('kronos-interceptor-stream-obj2string');
const csvTokenizer = require('kronos-interceptor-line-tokenizer-csv');
const headerExtracter = require('kronos-interceptor-line-header');
const token2Obj = require('kronos-interceptor-line-tokens2obj');
const dataProcessorRow = require('kronos-interceptor-object-data-processor-row');
const dataProcessorChunk = require('kronos-interceptor-object-data-processor-chunk');


const managerPromise = ksm.manager().then(manager =>
	Promise.all([

		// ---------------------------
		// register all the steps
		// ---------------------------
		inboundFile.registerWithManager(manager),
		outboundFile.registerWithManager(manager),
		archiveTar.registerWithManager(manager),
		passThrough.registerWithManager(manager),
		flow.registerWithManager(manager),

		// ---------------------------
		// register all the interceptors
		// ---------------------------
		debugLogInterceptor.registerWithManager(manager),
		writeFileInterceptor.registerWithManager(manager),

		messageHandlerInterceptor.registerWithManager(manager),
		lineParserInterceptor.registerWithManager(manager),
		streamObj2String.registerWithManager(manager),
		csvTokenizer.registerWithManager(manager),
		headerExtracter.registerWithManager(manager),
		token2Obj.registerWithManager(manager),
		dataProcessorRow.registerWithManager(manager),
		dataProcessorChunk.registerWithManager(manager)

	]).then(() =>
		Promise.resolve(manager)
	));


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


	it('test', function () {

		return managerPromise.then(function (manager) {
			console.log('started');

			console.log(manager.interceptors);

			// ---------------------------
			// load the flows
			// ---------------------------

			const filePath = path.join(fixturesDir, 'file-extract-check_flow.json');
			const fileContent = fs.readFileSync(filePath, 'utf8');
			const flowDefintion = JSON.parse(fileContent);

			return flow.loadFlows(manager, flowDefintion).then(() => {
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

					console.log("Message:");
					console.log(sendEndpoint.step.name);

					return sendEndpoint.receive(message).then(res => {
						console.log("---------- RESULT -------------");
						console.log("Success");
						console.log("-------------------------------");
						return Promise.resolve("OK");
					}).catch(err => {
						console.log("---------- ERROR --------------");
						console.log(err);
						console.log("-------------------------------");
						return Promise.reject(err);
					});
				});

			});



		});

	});
});
