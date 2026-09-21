/**
 * The browser half of a server socket.
 *
 * `pp.socket(name, args, handlers)` opens one WebSocket to the server's
 * socket endpoint, names the function in the `name` query parameter, and
 * sends the arguments as the connection's first frame — one JSON object,
 * exactly the payload `pp.rpc` would have posted. Every frame after that is
 * one JSON value, in either direction.
 *
 * The arguments travel in a frame rather than the URL on purpose: a URL is
 * logged by every proxy on the way, and an argument is data.
 *
 * A frame of the shape `{"error": "…"}` (that key alone) is reserved by the
 * wire: it is how the server reports a failure inside an open connection,
 * where no HTTP status line exists any more. It is routed to `onError`
 * rather than `onMessage`, followed by the server closing.
 *
 * ## Staying connected
 *
 * A quiet connection is not a dead one, so the handle keeps itself alive the
 * way Socket.IO does:
 *
 * - **Heartbeat.** Every `heartbeatInterval` ms an open connection sends
 *   `{"__pp": "ping"}`; the server answers `{"__pp": "pong"}`. If no frame at
 *   all arrives within `heartbeatTimeout` of a ping, the connection is
 *   treated as dead — a laptop that slept, a proxy that dropped it — and
 *   replaced. Control frames (an object whose only key is `__pp`) never reach
 *   `onMessage`.
 * - **Reconnect.** A connection that ends for any reason other than the ones
 *   below is reopened with exponential backoff and jitter, the arguments
 *   frame is sent again, and `send` calls made meanwhile are buffered and
 *   flushed after it. The server function runs again from the top for the
 *   new connection, exactly as it did for the first.
 * - **No reconnect** after `handle.close()`, after a `{"error": …}` frame
 *   (the server refused or the function failed — trying again would fail
 *   again), after a 1000 close (the function returned: the conversation is
 *   over), or after a policy close (1003, 1007, 1008, 1009, 1010).
 * - The browser's `online` event and a hidden tab becoming visible again
 *   skip the backoff wait, and verify an open connection with a ping.
 *
 * Messages the server sent while the connection was down are not replayed:
 * a page that must not miss one should re-fetch what it needs in `onOpen`
 * when `info.reconnected` is true.
 */
export type SocketCloseInfo = {
    code: number;
    reason: string;
    wasClean: boolean;
    /** True when the handle is about to reconnect; false when it is done. */
    willReconnect: boolean;
};
export type SocketOptions = {
    /** The endpoint to connect to. Defaults to the framework's own. */
    url?: string;
    /** Every successful open; `reconnected` is false only for the first. */
    onOpen?: (info: {
        reconnected: boolean;
    }) => void;
    onMessage?: (message: any) => void;
    /** Handshake refusals (as an HTTP-level close) and server error frames. */
    onError?: (error: Error) => void;
    /** Every closed connection, including one about to be replaced. */
    onClose?: (info: SocketCloseInfo) => void;
    /** A reconnect is scheduled `delay` ms from now. */
    onReconnecting?: (info: {
        attempt: number;
        delay: number;
    }) => void;
    /** Reopen after an unexpected close. Default true. */
    reconnect?: boolean;
    /** First backoff delay in ms. Default 1000. */
    reconnectDelay?: number;
    /** Backoff ceiling in ms. Default 30000. */
    reconnectDelayMax?: number;
    /** Give up after this many consecutive failed attempts. Default Infinity. */
    maxReconnectAttempts?: number;
    /** Ping period in ms; 0 disables the heartbeat. Default 25000. */
    heartbeatInterval?: number;
    /** How long to wait for any frame after a ping, in ms. Default 20000. */
    heartbeatTimeout?: number;
};
export type SocketHandle = {
    /**
     * Queue one JSON value. While reconnecting the value is buffered and sent
     * once the connection is back. Returns false once the handle is closed
     * for good, or when the buffer is full.
     */
    send: (value: any) => boolean;
    /** Close for good: no reconnect follows. */
    close: (code?: number, reason?: string) => void;
    /** Mirrors WebSocket.readyState; CONNECTING while waiting to reconnect. */
    readonly readyState: number;
};
export declare class SocketClient {
    private readonly active;
    connect(functionName: string, args?: Record<string, any>, options?: SocketOptions): SocketHandle;
}
