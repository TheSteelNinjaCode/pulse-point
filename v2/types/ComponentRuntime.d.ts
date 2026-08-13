import type { RefObject, PortalInfo } from "./HooksSystem.js";
export declare const PP_CONTEXT_TYPE: unique symbol;
export type ContextProviderProps<T = any> = {
    value: T;
    children?: unknown;
};
export type ContextProvider<T = any> = (props: ContextProviderProps<T>) => unknown;
export interface PPContext<T = any> {
    readonly $$typeof: symbol;
    readonly defaultValue: T;
    displayName?: string;
    Provider: ContextProvider<T>;
}
export type ContextToken<T = any> = PPContext<T>;
type ContextProvisionDispatcher = <T>(context: ContextToken<T>, value: T) => void;
export declare function withContextProvisionDispatcher<T>(dispatcher: ContextProvisionDispatcher, callback: () => T): T;
export declare function createContext<T>(defaultValue: T): PPContext<T>;
type StateSetter<T> = (updater: T | ((prev: T) => T)) => void;
export type StateHook = {
    (): [undefined, StateSetter<undefined>];
    <T>(initial: () => T): [T, StateSetter<T>];
    <T>(initial: T): [T, StateSetter<T>];
};
export type ReducerHook = {
    <S, A>(reducer: (state: S, action: A) => S, initial: S): [S, (action: A) => void];
    <S, A, I>(reducer: (state: S, action: A) => S, initialArg: I, init: (arg: I) => S): [S, (action: A) => void];
};
export type OptimisticHook = {
    <S>(passthrough: S): [S, (action: S) => void];
    <S, A>(passthrough: S, reducer: (state: S, action: A) => S): [S, (action: A) => void];
};
export type ComponentHooksAPI<Props extends Record<string, any> = Record<string, any>> = {
    state: StateHook;
    effect(cb: () => void | (() => void), deps?: any[]): void;
    layoutEffect(cb: () => void | (() => void), deps?: any[]): void;
    ref<T>(initialValue?: T | null): RefObject<T>;
    memo<T>(factory: () => T, deps?: any[]): T;
    callback<T extends (...args: any[]) => any>(cb: T, deps?: any[]): T;
    reducer: ReducerHook;
    context<T>(context: PPContext<T>): T;
    portal<T extends HTMLElement>(ref: RefObject<T>, target?: Element | null): PortalInfo;
    id(): string;
    errorBoundary(): [unknown, () => void];
    syncExternalStore<T>(subscribe: (onStoreChange: () => void) => (() => void) | void, getSnapshot: () => T): T;
    imperativeHandle<T>(ref: RefObject<T> | ((instance: T | null) => void) | null | undefined, createHandle: () => T, deps?: any[]): void;
    transition(): [boolean, (scope: () => void | Promise<unknown>) => void];
    deferredValue<T>(value: T, initialValue?: T): T;
    optimistic: OptimisticHook;
    props: Props;
};
export type RuntimeRpcOptions = {
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
export type RuntimeSocketOptions = {
    url?: string;
    onOpen?: () => void;
    onMessage?: (message: any) => void;
    onError?: (error: Error) => void;
    onClose?: (info: {
        code: number;
        reason: string;
        wasClean: boolean;
    }) => void;
};
export type RuntimeSocketHandle = {
    send: (value: any) => boolean;
    close: (code?: number, reason?: string) => void;
    readonly readyState: number;
};
export type RuntimePerfPhaseSample = {
    count: number;
    totalMs: number;
    maxMs: number;
};
export type RuntimePerfEntry = {
    renderCount: number;
    phases: Record<string, RuntimePerfPhaseSample>;
};
export type RuntimeUtilityAPI = {
    createContext<T>(defaultValue: T): PPContext<T>;
    mount(): void;
    redirect(url: string): Promise<void>;
    rpc<T = any>(functionName: string, data?: Record<string, any>, optionsOrAbort?: boolean | RuntimeRpcOptions): Promise<T | void>;
    socket(functionName: string, args?: Record<string, any>, options?: RuntimeSocketOptions): RuntimeSocketHandle;
    enablePerf(): void;
    disablePerf(): void;
    getPerfStats(): Record<string, RuntimePerfEntry>;
    resetPerfStats(): void;
};
export type ComponentRuntime<Props extends Record<string, any> = Record<string, any>> = ComponentHooksAPI<Props> & RuntimeUtilityAPI & Record<string, any>;
export {};
