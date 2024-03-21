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
export type authCallback = () => Promise<string>;
export type errorCallback = (error: any) => void;
export type messageCallback = (msg: any) => void;
export type MessageStruct = {
    data?: any;
    error?: {
        code: number;
        msg: any;
    };
    key: string;
};
/**
 * Veins
 *
 * Class to handle communicating via WebSocket
 *
 * @name Veins
 * @access public
 */
export default class Veins {
    auth: authCallback;
    close: boolean;
    error?: errorCallback;
    keys: Record<string, messageCallback[]>;
    ping: number;
    socket: WebSocket | null | false;
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
    constructor(url: string, auth: authCallback, error?: errorCallback);
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
    private _open;
    /**
     * Sock Close
     *
     * Handles socket close event
     *
     * @name _sockClose
     * @access private
     * @returns void
     */
    private _sockClose;
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
    private _sockMessage;
    /**
     * Sock Open
     *
     * Handles the open event from the socket
     *
     * @name _sockOpen
     * @access private
     * @param sock The websocket that was opened
     */
    private _sockOpen;
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
    subscribe(key: string, callback: messageCallback): {
        unsubscribe: () => boolean;
    };
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
    unsubscribe(key: string, callback: messageCallback): boolean;
}
