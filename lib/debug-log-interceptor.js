/* jslint node: true, esnext: true */

"use strict";

/**
 * This interceptor is for converting some info key names
 * that they match the expected values from the kronos-adapter-outbound-file
 * Copy the key 'name' -> 'file_name'
 */

const Interceptor = require('kronos-interceptor').Interceptor;

/**
 * This interceptor cares about the handling of the messages.
 * It will add the hops and copies the messages
 */
class DebugLogInterceptor extends Interceptor {
	static get name() {
		return "debug-log-interceptor";
	}
	get type() {
		return DebugLogInterceptor.name;
	}

	receive(request, oldRequest) {

		console.log(`-------------- ${this.endpoint.step.name} ------------------`);
		console.log(request.hops);

		return this.connected.receive(request, oldRequest);
	}
}

exports.DebugLogInterceptor = DebugLogInterceptor;

exports.registerWithManager = manager => manager.registerInterceptor(DebugLogInterceptor);
