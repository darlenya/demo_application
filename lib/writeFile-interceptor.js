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
class WriteFileinfoInterceptor extends Interceptor {
	static get type() {
		return "write-file-interceptor";
	}
	get type() {
		return WriteFileinfoInterceptor.type;
	}

	receive(request, oldRequest) {
		request.info.file_name = request.info.name;

		return this.connected.receive(request, oldRequest);
	}
}

exports.WriteFileinfoInterceptor = WriteFileinfoInterceptor;

exports.registerWithManager = manager => manager.registerInterceptor(WriteFileinfoInterceptor);
