export type RpcOptions = {
    abortPrevious?: boolean;
    url?: string;
    csrfUrl?: string;
    credentials?: RequestCredentials;
    onStream?: (chunk: any) => void;
    onStreamError?: (error: any) => void;
    onStreamComplete?: () => void;
    onUploadProgress?: (info: {
        loaded: number;
        total: number | null;
        percent: number | null;
    }) => void;
    onUploadComplete?: () => void;
};
export type RedirectHandler = (url: string) => Promise<void>;
export declare class RpcClient {
    private readonly redirect;
    private activeAbortController;
    constructor(redirect: RedirectHandler);
    reset(): void;
    call<T = any>(functionName: string, data?: Record<string, any>, optionsOrAbort?: boolean | RpcOptions): Promise<T | void>;
    private getCsrfToken;
    private resolveUrl;
    private resolveCredentials;
    private ensureCsrfToken;
    /**
     * Build the multipart body, with every non-file value written before the
     * first file.
     *
     * Multipart is read in order, so a server that streams an upload — handing
     * the field to the handler while the browser is still sending it — can only
     * see the values that arrived in front of it. Writing files last means the
     * arguments beside them are always reachable, whatever order the caller put
     * the payload's keys in.
     *
     * Within each group the caller's key order is kept, and a `FileList` still
     * appends under one name, which is what makes it arrive as a list.
     */
    private createFormData;
    private assertSuccessfulResponse;
    private clearActiveController;
    private uploadWithProgress;
    private handleStream;
}
