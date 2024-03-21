/**
 * Veins
 *
 * Allows clients to connect to the backend via websocket so events can be
 * tracked in real time
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2019-03-29
 */

// Ouroboros modules
import { empty } from '@ouroboros/tools';

// Communication
import WSHelper from './wshelper';

// Types
export type authCallback = () => Promise<string>;
export type errorCallback = (error: any) => void;
export type messageCallback = (msg: any) => void;
export type MessageStruct = {
	data?: any,
	error?: {
		code: number,
		msg: any
	},
	key: string
}

/**
 * Veins
 *
 * Class to handle communicating via WebSocket
 *
 * @name Veins
 * @access public
 */
export default class Veins {

	// The callback that returns the authorization key
	auth: authCallback;

	// Keep track of a valid close
	close: boolean = true;

	// The callback to pass any errors to
	error?: errorCallback;

	// The message callbacks stored by key
	keys: Record<string, messageCallback[]> = {};

	// The ping interval ID
	ping: number = 0;

	// The websocket instances
	socket: WebSocket | null | false = null;

	// The websocket url
	url: string;

	/**
	 * Veins
	 *
	 * Initialises the instance
	 *
	 * @name Veins
	 * @access public
	 * @param url The URL to open the websocket connection
	 * @param auth The callback to fetch the auth key and return as a Promise
	 * @param error The callback for whenever there's an error
	 * @returns Veins
	 */
	constructor(url: string, auth: authCallback, error?: errorCallback) {

		// Store the values
		this.url = url;
		this.auth = auth;
		this.error = error;
	}

	/**
	 * Open
	 *
	 * Opens a new websocket by first sending a message to webpoll to start the
	 * authentication handshake, then making the connection, and finally sending
	 * all the track messages stored
	 *
	 * @name _open
	 * @access private
	 * @return void
	 */
	private _open() {

		// Store this
		const _this = this;

		// Call the auth callback
		this.auth().then((auth: string) => {

			// Create the websocket
			this.socket = WSHelper(this.url, {

				open: _this._sockOpen.bind(_this, auth),
				message: _this._sockMessage.bind(_this),
				close: _this._sockClose.bind(_this)
			});

			// If we got false
			if(this.socket === false) {
				if(this.error) {
					(_this.error as errorCallback)('Websockets not supported');
				}
				return;
			}

			// If we have no ping interval
			if(this.ping === 0) {

				// Setup the ping interval
				this.ping = setInterval(() => {

					// Send a ping message over the socket to keep it alive
					if(this.socket) {
						(_this.socket as WebSocket).send(JSON.stringify({
							_type: 'ping'
						}));
					}

				}, 300000);
			}
		});
	}

	/**
	 * Sock Close
	 *
	 * Handles socket close event
	 *
	 * @name _sockClose
	 * @access private
	 * @returns void
	 */
	private _sockClose() {

		// If we have a ping interval
		if(this.ping !== 0) {
			clearInterval(this.ping);
		}

		// If it's a valid close
		if(this.close) {
			this.socket = null;
		}

		// Else, wait 5 seconds, and reopen the socket
		else {
			this.close = true;
			setTimeout(() => {
				this._open();
			}, 5000);
		}
	}

	/**
	 * Sock Message
	 *
	 * Recieves messages from websockets and directs the data to the appropriate
	 * callback
	 *
	 * @name _sockMessage
	 * @access private
	 * @param WebSocket sock The socket the message came on
	 * @param MessageEvent ev The event message received
	 * @return void
	 */
	private _sockMessage(sock: WebSocket, ev: MessageEvent) {

		// Store this
		const _this = this;

		// Needed so we don't repeat code due to some messages being text, and
		//	some being blobs
		function handleMsg(msg: MessageStruct) {

			// If we got an error
			if(msg.error) {
				if(_this.error) {
					_this.error(
						`Websocket failed: ${msg.error.msg} (${msg.error.code})`
					);
				}
				return;
			}

			// If we have the key
			if(msg.key in _this.keys) {

				// Call each callback
				for(const f of _this.keys[msg.key]) {
					f(msg.data);
				}
			}
		}

		// If we got a string back
		if(typeof ev.data === 'string') {

			// If we're authorized
			if(ev.data === 'authorized') {

				// Reset the close flag
				this.close = false;
				return;
			}

			// If it's pong
			if(ev.data === 'pong') {
				return;
			}

			// Convert it to JSON
			handleMsg(JSON.parse(ev.data));
		}

		// Else we got a blob
		else {

			// Screw you javascript
			const r = new FileReader();
			r.addEventListener('loadend', () => {

				// Parse the data
				const oMsg = JSON.parse(r.result as string);

				// Handle it
				handleMsg(oMsg);
			});
			r.readAsText(ev.data);
		}
	}

	/**
	 * Sock Open
	 *
	 * Handles the open event from the socket
	 *
	 * @name _sockOpen
	 * @access private
	 * @param sock The websocket that was opened
	 */
	private _sockOpen(auth: string, sock: WebSocket) {

		// Init the message list
		const lMsgs = [];

		// Add the connect message
		lMsgs.push({
			_type: 'connect',
			key: auth
		});

		// Add each track message
		for(const k of Object.keys(this.keys)) {
			lMsgs.push({
				_type: 'track',
				key: k
			});
		}

		// Send the messages
		sock.send(JSON.stringify(lMsgs))
	}

	/**
	 * Subscribe
	 *
	 * Takes a key and an event type and a) opens a new websocket or uses an
	 * existing one, then b) sends a tracking message through the websocket so the
	 * backend knows to send the key type to us
	 *
	 * @name subscribe
	 * @access public
	 * @param key The key to track
	 * @param callback The callback for any messages of the key value
	 * @return void
	 */
	subscribe(key: string, callback: messageCallback) {

		// If we don't have the key for the given service, add the list with
		//	the callback
		if(!(key in this.keys)) {
			this.keys[key] = [ callback ]
		}

		// Else, add the callback, to the given service/key
		else {
			this.keys[key].push(callback);
		}

		// If we have no socket
		if(!this.socket) {

			// If it's null
			if(this.socket === null) {

				// Set socket to false so we don't try to re-open
				this.socket = false;

				// Open a new one
				this._open();
			}
		}

		// Else if it's open
		else if(this.socket.readyState === 1) {

			// Send the tracking message through the websocket
			this.socket.send(JSON.stringify({
				_type: 'track',
				key
			}));
		}

		// Else {
		//	If we have no socket, or it's opening, then upon opening all keys in
		//	the tracking list will be sent as messages
		// }

		// Return the unsubscribe
		return {
			unsubscribe: () => {
				return this.unsubscribe(key, callback);
			}
		}
	}

	/**
	 * Untrack
	 *
	 * Removes a callback and notifies the websocket we are not tracking anymore
	 *
	 * @name unsubscribe
	 * @access public
	 * @param key The key to stop tracking
	 * @param callback The callback associated with the track
	 * @return bool
	 */
	unsubscribe(key: string, callback: messageCallback) {

		// If we have the key
		if(key in this.keys) {

			// Go through each callback
			for(let i = 0; i < this.keys[key].length; ++i) {

				// If the callback matches
				if(callback === this.keys[key][i]) {

					// Remove the callback
					this.keys[key].splice(i, 1);

					// If we have no more callbacks
					if(this.keys[key].length === 0) {

						// If we have a socket
						if(this.socket && this.socket.readyState === 1) {

							// Notify the websocket we aren't tracking the key
							//	anymore
							this.socket.send(JSON.stringify({
								_type: 'untrack',
								key
							}));
						}

						// Remove the key
						delete this.keys[key];

						// If we have no more keys in the service
						if(empty(this.keys)) {

							// Turn off the ping interval
							if(this.ping) {
								clearInterval(this.ping);
								this.ping = 0;
							}

							// Close the socket if we have one
							this.close = true;
							if(this.socket) {
								this.socket.close(
									1000,
									'nothing else to track'
								);
							}
						}
					}

					// Callback found and removed
					return true;
				}
			}
		}

		// Callback not found
		return false;
	}
}