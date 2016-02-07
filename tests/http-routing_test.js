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
const request = require("supertest-as-promised")(Promise);

const fixturesDir = path.join(__dirname, 'fixtures');

const ksm = require('kronos-service-manager');

const tmpIn = path.join(__dirname, 'tmp_in');
const tmpOut = path.join(__dirname, 'tmp_out');

// ------ Steps ------
const debugStep = require('../lib/debug-step');
const flow = require('kronos-flow');
const httpRouting = require('kronos-http-routing-step');

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
				return myFlow.start().then(function (step) {
					console.log('flow: started');

					const httpRoutingStep = step.steps.get('adapterInboundHttp');
					console.log(httpRoutingStep.endpoints.fileReaderTar.interceptors);

					// get host and port
					const httpServer = manager.services.my_koa_service.server;
					const host = httpServer.address().address;
					const port = httpServer.address().port;

					console.log(`Host: ${host}`);
					console.log(`Port: ${port}`);


					return request(`${host}:${port}`)
						.post('/file/tar')
						.send({
							name: 'Manny',
							species: 'cat'
						})
						.set('X-API-Key', 'foobar')
						.set('Accept', 'application/json')
						// .field('name', 'my awesome avatar')
						// .field('last_name', 'my last awesome avatar')
						.expect(200)
						.then(res => {
							console.log('---------- Result -----------');
							console.log(res.header);
							console.log(res.body);
							return Promise.resolve("OK");
						});

					// return request(`${host}:${port}`)
					// 	.post('/file/tar')
					// 	.send({
					// 		name: 'Manny',
					// 		species: 'cat'
					// 	})
					// 	.set('X-API-Key', 'foobar')
					// 	.set('Accept', 'application/json')
					// 	.expect(200)
					// 	.then(res => {
					// 		console.log('---------- Result -----------');
					// 		//console.log(res);
					// 		return Promise.resolve("OK");
					// 	});


				});
			});



		});

	});
});
