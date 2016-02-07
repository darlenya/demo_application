/* jslint node: true, esnext: true */
"use strict";

const fs = require('fs');
const path = require("path");


const BaseStep = require('kronos-step').Step;

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

			for (let key in request) {
				console.log(key);
			}

			console.log(request.info);

			let options = {
				"encoding": 'binary'
			};
			let writeStream = fs.createWriteStream("result.bytes", options);
			request.stream.pipe(writeStream);

			//console.log(request.stream);
			console.log("############## End #############");
			return Promise.resolve("OK");
		};

	},

	_start() {
		console.log("Debug Step started !!!!");

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
