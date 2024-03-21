/**
 * Web Socket Helper
 *
 * Simplifies using a websocket
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2017-05-17
 */
export type ConfStruct = {
    close?: (sock: WebSocket, ev: CloseEvent) => void;
    error?: (sock: WebSocket, ev: Event) => void;
    message?: (sock: WebSocket, ev: MessageEvent) => void;
    open?: (sock: WebSocket, ev: Event) => void;
};
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
export default function WSHelper(url: string, conf?: ConfStruct, debug?: boolean): WebSocket | false;
