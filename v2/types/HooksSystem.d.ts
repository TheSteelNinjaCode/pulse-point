import { type StateUpdateScheduler } from "./StateUpdateScheduler.js";
export interface RefObject<T = any> {
    current: T | null;
}
export interface PortalInfo {
    sourceParent: Element | null;
}
export interface PortalRegistration {
    ref: RefObject<any>;
    target: Element | null;
    info: PortalInfo;
}
type StateUpdater<T> = T | ((prev: T) => T);
type StateSetter<T> = (val: StateUpdater<T>) => void;
export declare class HooksSystem {
    private readonly stateUpdateScheduler;
    private static anonymousIdCounter;
    /**
     * How many errors one boundary absorbs before it stops catching. Without a
     * cap, a fallback that itself throws (or a child that is rerendered
     * unchanged after failing) spins the render loop forever.
     */
    private static readonly MAX_BOUNDARY_CAPTURES;
    private boundaryError;
    private hasErrorBoundaryHook;
    private boundaryErrorCaptureCount;
    private uncaughtErrorHandler;
    private hooks;
    private currentIndex;
    private onStateChange;
    private componentLabel;
    private pendingLayoutEffects;
    private pendingEffects;
    private currentEffectPhase;
    private pendingSynchronousRenderUpdate;
    private pendingSynchronousLayoutUpdate;
    private pendingUpdate;
    private hasScheduledRender;
    private portalRegistrations;
    private isRenderWindowOpen;
    private warnedHookOutsideRender;
    private warnedHookAfterDispose;
    private currentHookTypes;
    private committedHookTypes;
    private disposed;
    constructor(onStateChange: () => void, componentLabel?: string, stateUpdateScheduler?: StateUpdateScheduler);
    loadState(savedHooks: any[]): void;
    getHooks(): any[];
    prepareRender(): void;
    startRenderPhase(): void;
    finishRenderPhase(): boolean;
    private recordHook;
    private validateHookSignature;
    runLayoutEffects(): boolean;
    /** Whether the last render queued any passive effects to run. */
    hasPendingEffects(): boolean;
    runEffects(): void;
    private runEffectCleanup;
    private runEffectCallback;
    dispose(): void;
    usePortal<T extends HTMLElement>(ref: RefObject<T>, target?: Element | null): PortalInfo;
    getPortalRegistrations(): PortalRegistration[];
    useState<T>(initialValue: T): [T, StateSetter<T>];
    useState<T>(initialValue: () => T): [T, StateSetter<T>];
    private resolveInitialState;
    private createStateSetter;
    private scheduleUpdate;
    useRef<T = any>(initialValue?: T | null): RefObject<T>;
    /**
     * Memoizes a computed value, only recalculating when dependencies change
     */
    useMemo<T>(factory: () => T, deps?: any[]): T;
    /**
     * Memoizes a callback function, only recreating when dependencies change
     */
    useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
    /**
     * Returns a stable reducer dispatch function
     */
    useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void];
    useReducer<S, A, I>(reducer: (state: S, action: A) => S, initialArg: I, init: (arg: I) => S): [S, (action: A) => void];
    useEffect(callback: () => void | (() => void), deps?: any[]): void;
    /**
     * Like useEffect, but fires synchronously after all DOM mutations
     */
    useLayoutEffect(callback: () => void | (() => void), deps?: any[]): void;
    /**
     * Declares this component as an error boundary and reports the error it is
     * currently holding.
     *
     * Unlike React — where a boundary only catches errors thrown *below* it —
     * this also catches throws from the declaring component's own render and
     * effects, because in PulsePoint the boundary and the fallback markup live
     * in the same single-root component. Errors bubble to the nearest ancestor
     * boundary when the throwing component has none.
     *
     * The boundary latches: it keeps holding the error until `reset()` is
     * called, which is also what re-arms it after
     * `MAX_BOUNDARY_CAPTURES` failures.
     */
    useErrorBoundary(): [unknown, () => void];
    /**
     * Hands an error to this component's boundary. Returns false when there is
     * no boundary here (so the caller can keep walking up the tree) or when the
     * boundary has already given up.
     */
    captureError(error: unknown): boolean;
    /**
     * Registers the fallback used when an effect or cleanup throws. Component
     * wires this to the boundary walk so effect failures surface the same way
     * render failures do.
     */
    setUncaughtErrorHandler(handler: (error: unknown) => boolean): void;
    private reportUncaughtError;
    /**
     * Returns a stable, DOM-safe unique id for the life of this hook slot.
     *
     * Ids are derived from the component id plus the hook index, so the same
     * slot keeps the same id across rerenders and two instances of the same
     * component never collide. Use it to pair labels, inputs, and ARIA
     * attributes instead of hand-rolling counters in component scripts.
     */
    useId(): string;
    private createStableId;
    /**
     * Subscribes to an external mutable source (matchMedia, localStorage,
     * a socket, a global store) and rerenders when its snapshot changes.
     *
     * `subscribe` must be referentially stable across renders — wrap it in
     * `pp.callback(..., [])` — otherwise the store is resubscribed every render.
     */
    useSyncExternalStore<T>(subscribe: (onStoreChange: () => void) => (() => void) | void, getSnapshot: () => T): T;
    /**
     * Exposes an imperative API on a ref owned by a parent component, instead of
     * the raw DOM node. Pairs with `pp-ref-forward` so a parent can call
     * `dialogRef.current.open()` without reaching into the child's markup.
     */
    useImperativeHandle<T>(ref: RefObject<T> | ((instance: T | null) => void) | null | undefined, createHandle: () => T, deps?: any[]): void;
    /**
     * Tracks whether work started inside `startTransition` is still in flight.
     *
     * PulsePoint renders synchronously, so this does not deprioritize the
     * render the way React's concurrent scheduler does. It does give a correct
     * `isPending` flag for both synchronous and promise-returning scopes, which
     * is what transitions are used for in practice (disabling a submit button
     * while an `pp.rpc()` call resolves).
     */
    useTransition(): [boolean, (scope: () => void | Promise<unknown>) => void];
    /**
     * Returns a lagging copy of `value` that catches up one commit later, so an
     * expensive derived subtree (filtered lists, charts) is not recomputed on
     * every keystroke while the input itself stays responsive.
     */
    useDeferredValue<T>(value: T, initialValue?: T): T;
    /**
     * Applies pending actions on top of a server-owned value so the UI can show
     * the result before an `pp.rpc()` round trip finishes. Pending actions are
     * dropped as soon as the base value changes, which is the point at which the
     * server has confirmed (or rejected) the optimistic guess.
     */
    useOptimistic<S, A = S>(passthrough: S, reducer?: (state: S, action: A) => S): [S, (action: A) => void];
    private normalizeDeps;
    private describeDeps;
    private emitDiagnostic;
    private areDepsDifferent;
}
export {};
