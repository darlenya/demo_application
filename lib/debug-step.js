/* jslint node: true, esnext: true */
"use strict";

const fs = require('fs');
const path = require("path");
const Stream = require('stream').Stream;

const BaseStep = require('kronos-step').Step;

const returnStreamFile = path.join(__dirname, '../tests/fixtures/accounts.tar');


const DebugStep = {
	"name": "debug-step",
	"description": "This step just logs the complete request",
	"endpoints": {
		"in": {
			"in": true
		}
	},

	finalize(manager, stepConfiguration) {
		this.endpoints.in.receive = function (request) {
			console.log("########### received ###########");
			console.log(`# INFO: ${JSON.stringify(request.info)}`);
			console.log(`# HOPS: ${JSON.stringify(request.hops)}`);

			if (request.payload instanceof Stream) {
				const resultFile = fs.createWriteStream("Gumbo.result");
				request.payload.pipe(resultFile);
				console.log("# WRITE file");

				request.payload = fs.createReadStream(returnStreamFile);
			} else {
				console.log(`# PayL: ${JSON.stringify(request.payload)}`);
				request.payload = {
					"return": "val"
				};

			}
			console.log("############## End #############");


			return Promise.resolve(request);
		};

	},

	_start() {
		//console.log("Debug Step started !!!!");

		// this.endpoints.in.receive = function (request) {
		// 	console.log("########### received ###########");
		// 	console.log(request);
		// 	console.log("############## End #############");
		// };

		return Promise.resolve();
	}
};

const DebugStepFactory = Object.assign({}, BaseStep, DebugStep);
exports.registerWithManager = manager => manager.registerStep(DebugStepFactory);
