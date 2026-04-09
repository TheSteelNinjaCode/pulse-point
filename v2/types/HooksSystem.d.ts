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
export declare class HooksSystem {
    private hooks;
    private currentIndex;
    private onStateChange;
    private pendingEffects;
    private pendingUpdate;
    private hasScheduledRender;
    private batchedUpdates;
    private portalRegistrations;
    private disposed;
    constructor(onStateChange: () => void);
    loadState(savedHooks: any[]): void;
    getHooks(): any[];
    prepareRender(): void;
    runEffects(): void;
    dispose(): void;
    usePortal<T extends HTMLElement>(ref: RefObject<T>, target?: Element | null): PortalInfo;
    getPortalRegistrations(): PortalRegistration[];
    useState<T>(initialValue: T): [T, (val: T | ((prev: T) => T)) => void];
    private scheduleUpdate;
    useRef<T = any>(initialValue?: T | null): RefObject<T>;
    /**
     * Memoizes a computed value, only recalculating when dependencies change
     */
    useMemo<T>(factory: () => T, deps: any[]): T;
    /**
     * Memoizes a callback function, only recreating when dependencies change
     */
    useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    /**
     * Returns a stable reducer dispatch function
     */
    useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void];
    useEffect(callback: () => void | (() => void), deps?: any[]): void;
    /**
     * Like useEffect, but fires synchronously after all DOM mutations
     */
    useLayoutEffect(callback: () => void | (() => void), deps?: any[]): void;
    private areDepsDifferent;
}
