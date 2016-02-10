/* global describe, it, beforeEach */
/* jslint node: true, esnext: true */
"use strict";

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

//const.Stream = require('stream').Readable;

const fs = require('fs');
const path = require("path");
const rimraf = require("rimraf");
const request = require("supertest-as-promised")(Promise);

const fixturesDir = path.join(__dirname, 'fixtures');

const ksm = require('kronos-service-manager');
const kronosEndpoint = require('kronos-endpoint');

const tmpIn = path.join(__dirname, 'tmp_in');
const tmpOut = path.join(__dirname, 'tmp_out');

// ------ Steps ------
const debugStep = require('../lib/debug-step');
const flow = require('kronos-flow');
const httpRouting = require('kronos-http-routing-step');
const loadBalancer = require('kronos-adapter-outbound-loadbalancer');

// ---- interceptors ----
const httpInterceptors = require('kronos-interceptor-http-request');


// ------ Services ------
const koaService = require('kronos-service-koa');


const managerPromise = ksm.manager().then(manager =>
	Promise.all([

		// ---------------------------
		// register all the steps
		// ---------------------------
		debugStep.registerWithManager(manager),
		flow.registerWithManager(manager),
		httpRouting.registerWithManager(manager),
		loadBalancer.registerWithManager(manager),

		// ---------------------------
		// register all the interceptors
		// ---------------------------
		httpInterceptors.registerWithManager(manager),

		// ---------------------------
		// register all the services
		// ---------------------------
		koaService.registerWithManager(manager),

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

			const filePath = path.join(fixturesDir, 'http-send-receive_flow.json');
			const fileContent = fs.readFileSync(filePath, 'utf8');
			const flowDefintion = JSON.parse(fileContent);

			return flow.loadFlows(manager, flowDefintion).then(() => {
				// get the flow from the manager
				const myFlow = manager.flows['http-routing-flow'];

				console.log('start the flow');

				// ---------------------------
				// Start the flow
				// ---------------------------
				return myFlow.start().then(function (step) {
					console.log('flow: started');


					// This endpoint is the OUT endpoint of the previous step.
					// It will be connected with the OUT endpoint of the Adpater
					let sendEndpoint = new kronosEndpoint.SendEndpoint("testEndpointOut");
					const loadBalancerStep = step.steps.get('loadBalancer');
					let inEndPoint = loadBalancerStep.endpoints.in;
					sendEndpoint.connected = inEndPoint;


					const httpRoutingStep = step.steps.get('adapterInboundHttp');
					console.log(httpRoutingStep.endpoints.fileReaderTar.interceptors);

					// get host and port
					const httpServer = manager.services.my_koa_service.server;
					const host = httpServer.address().address;
					const port = httpServer.address().port;

					console.log(`Host: ${host}`);
					console.log(`Port: ${port}`);

					let sendMessage = {
						"hops": [{
							"hop": 1
						}, {
							"hop": 2
						}, {
							"hop": 3
						}],
						"info": {
							"name": "gumbo",
							"any field": "other value"
						},
						"payload": {
							"pay_val": " large Value"
						}
					};

					return sendEndpoint.connected.receive(sendMessage).then(res => {
						console.log("------- Result 1 --------");
						console.log(res);

						const accFile = path.join(fixturesDir, 'accounts.tgz');
						const accStream = fs.createReadStream(
							"/Users/torstenlink/Documents/entwicklung/demo_application/demo_application.zip");

						sendMessage = {
							"hops": [{
								"wupp": 1
							}, {
								"wupp": 2
							}, {
								"wupp": 3
							}],
							"info": {
								"name": "gumbo 2. test",
								"any field": "no value"
							}
						};

						sendMessage.payload = accStream;

						return sendEndpoint.connected.receive(sendMessage).then(res => {

							console.log("------- Result 2 --------");
							console.log(res);

							const resStreamWrite = fs.createWriteStream("Gumbo_back.tar");
							res.payload.pipe(resStreamWrite);

							return Promise.resolve("OK");
						});
					});

				});
			});



		});

	});
});
