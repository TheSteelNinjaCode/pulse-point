export interface StateUpdateScheduler {
    shouldDefer(): boolean;
    enqueue(callback: () => void): void;
}
export declare class NativeInputUpdateScheduler implements StateUpdateScheduler {
    private deferredEventDepth;
    private callbacks;
    private frameHandle;
    private timerHandle;
    shouldDefer(): boolean;
    enqueue(callback: () => void): void;
    flush(): void;
    runWithDeferral<T>(shouldDefer: boolean, callback: () => T): T;
    /**
     * Coalesce updates to at most one flush per animation frame. This keeps
     * derived UI live while batching native input bursts that land in one frame.
     */
    private scheduleFlushOnNextFrame;
    private cancelScheduledFlush;
}
export declare const nativeInputUpdateScheduler: NativeInputUpdateScheduler;
