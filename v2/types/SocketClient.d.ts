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
 */
export type SocketOptions = {
    /** The endpoint to connect to. Defaults to the framework's own. */
    url?: string;
    onOpen?: () => void;
    onMessage?: (message: any) => void;
    /** Handshake refusals (as an HTTP-level close) and server error frames. */
    onError?: (error: Error) => void;
    onClose?: (info: {
        code: number;
        reason: string;
        wasClean: boolean;
    }) => void;
};
export type SocketHandle = {
    /** Queue one JSON value. Returns false once the connection is closed. */
    send: (value: any) => boolean;
    close: (code?: number, reason?: string) => void;
    /** Mirrors WebSocket.readyState. */
    readonly readyState: number;
};
export declare class SocketClient {
    private readonly active;
    connect(functionName: string, args?: Record<string, any>, options?: SocketOptions): SocketHandle;
}
