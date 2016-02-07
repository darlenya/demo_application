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

			console.log(request.info);
			console.log(request.payload);
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
