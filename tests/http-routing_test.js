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
const httpRouting = require('kronos-http-routing-step');

const managerPromise = ksm.manager().then(manager =>
	Promise.all([

		// ---------------------------
		// register all the steps
		// ---------------------------
		flow.registerWithManager(manager),
		httpRouting.registerWithManager(manager),

		// ---------------------------
		// register all the interceptors
		// ---------------------------

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

			const filePath = path.join(fixturesDir, 'http-routing_flow.json');
			const fileContent = fs.readFileSync(filePath, 'utf8');
			const flowDefintion = JSON.parse(fileContent);

			return flow.loadFlows(manager, flowDefintion).then(() => {
				// get the flow from the manager
				const myFlow = manager.flows['http-routing-flow'];

				console.log('start the flow');

				// ---------------------------
				// Start the flow
				// ---------------------------
				myFlow.start().then(function (step) {
					console.log('flow: started');

					// // trigger the inbound file
					// let message = {
					// 	"info": {},
					// 	"hops": [],
					// 	"payload": {}
					// };
					// message.payload = path.join(fixturesDir, 'accounts.tar');
					//
					// const sendEndpoint = myFlow.endpoints.inFileTrigger;
					// return sendEndpoint.receive(message).then(res => {
					// 	console.log("---------- RESULT -------------");
					// 	console.log("Success");
					// 	console.log("-------------------------------");
					// 	return Promise.reslove("OK");
					// }).catch(err => {
					// 	console.log("---------- ERROR --------------");
					// 	console.log(err);
					// 	console.log("-------------------------------");
					// 	return Promise.reject(err);
					// });
				});

			});



		});

	});
});
