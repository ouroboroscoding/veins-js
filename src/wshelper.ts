/**
 * Web Socket Helper
 *
 * Simplifies using a websocket
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2017-05-17
 */

// Types
export type ConfStruct = {
	close?: (sock: WebSocket, ev: CloseEvent) => void,
	error?: (sock: WebSocket, ev: Event) => void,
	message?: (sock: WebSocket, ev: MessageEvent) => void,
	open?: (sock: WebSocket, ev: Event) => void
}

/**
 * WSHelper
 *
 * WebSocket helper function
 *
 * @param url The URL to connect to to start the websocket
 * @param conf The callbacks for different stages of websocket communication
 * @param debug Optional, set to true to get more feedback
 * @returns WebSocket | false
 */
export default function WSHelper(
	url: string,
	conf: ConfStruct = {},
	debug: boolean = false
): WebSocket | false {

	// If we can't handle websockets
	if(!('WebSocket' in window)) {
		console.error('websocket: WebSockets not supported');
		return false;
	}

	// Else, if it's not an object, we have a problem
	else if(typeof conf !== 'object') {
		console.error('websocket: second argument must be an object');
		return false;
	}

	// Create the WebSocket
	const oSock = new WebSocket(url);

	// Set the open callback
	oSock.onopen = (ev: Event) => {

		// If an open callback is set
		if(conf.open) {
			conf.open(oSock, ev);
		}

		// Else, just log the event
		else if(debug) {
			console.log('websocket opened:', ev);
		}
	}

	// Set the message callback
	oSock.onmessage	= (ev: MessageEvent) => {

		// If a message callback is set
		if(conf.message) {
			conf.message(oSock, ev);
		}

		// Else, just log the event
		else if(debug) {
			console.log('websocket message:', ev);
		}
	}

	// Set the error callback
	oSock.onerror = (ev: Event) => {

		// If an error callback is set
		if(conf.error) {
			conf.error(oSock, ev);
		}

		// Else, just log the event
		else if(debug) {
			console.log('websocket error:', ev);
		}
	}

	// Set the close callback
	oSock.onclose = (ev: CloseEvent) => {

		// If a close callback is set
		if(conf.close) {
			conf.close(oSock, ev);
		}

		// Else, just log the event
		else if(debug) {
			console.log('websocket closed:', ev);
		}
	}

	// Return the socket
	return oSock;
}