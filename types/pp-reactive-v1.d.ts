import { Portal, PortalOptions } from "./portal-manager.js";
export declare const CONSTANTS: {
    readonly ATTR_PREFIXES: {
        readonly COMPONENT: "pp-component";
        readonly LOOP: "pp-for";
        readonly SPREAD: "pp-spread";
        readonly REF: "pp-ref";
        readonly IGNORE: "pp-ignore";
    };
    readonly SCRIPT_TYPE: "text/pp";
    readonly MAX_CACHE_SIZE: 2000;
    readonly DEBOUNCE_MS: 16;
    readonly MUSTACHE_PATTERN: RegExp;
};
export declare const RESERVED_WORDS: Set<string>;
interface ReactiveState {
    [key: string]: unknown;
}
export interface Subscription {
    id: string;
    selector: string;
    dependencies: Set<string>;
    callback: (element: Element, changes: {
        key: string;
    }) => void;
    element?: Element;
    component?: string;
}
export interface ParsedMustache {
    type: "static" | "expression";
    content: string;
    expression: string | null;
}
interface EffectOptions {
    deps?: (string | StateGetter<any>)[];
    immediate?: boolean;
}
interface CacheableClass {
    invalidateCache(key?: string): void;
    clearAllCaches(): void;
    getCacheStats(): Record<string, CacheStats>;
}
interface CacheStats {
    size: number;
    maxSize: number;
    hitRate?: number;
    hits: number;
    misses: number;
}
export interface Ref<T = any> {
    current: T | null;
}
type StateValue<T> = T extends undefined ? T | undefined : T;
type StateSetter<T> = (value: T | ((prev: T) => T)) => void;
type StateGetter<T> = (() => T) & {
    value: T;
    __pphp_key?: string;
    __pphp_fullKey?: string;
    __pphp_component?: string;
};
declare global {
    interface Window {
        [key: string]: any;
    }
}
export declare function capitalize(str: string): string;
export declare function valueToString(value: unknown): string;
export declare function isStateGetter(value: unknown): value is StateGetter<any>;
export declare function extractStateValue(value: unknown): unknown;
export declare function extractStateValueSmart(value: unknown, options?: {
    forComparison?: boolean;
    forLogical?: boolean;
    forceExtract?: boolean;
}): unknown;
export declare function extractContextValues(context: Record<string, any>, smartExtract?: boolean): Record<string, any>;
export declare function expressionNeedsValueExtraction(expression: string): boolean;
declare enum HydrationPhase {
    NOT_STARTED = "not_started",
    SCRIPTS_EXECUTING = "scripts_executing",
    LOOPS_PROCESSING = "loops_processing",
    EFFECTS_RUNNING = "effects_running",
    PORTALS_RENDERING = "portals_rendering",
    COMPLETE = "complete"
}
interface LifecycleHooks {
    beforeScripts?: () => void;
    afterScripts?: () => void;
    beforeLoops?: () => void;
    afterLoops?: () => void;
    beforeEffects?: () => void;
    afterEffects?: () => void;
    beforePortals?: () => void;
    afterPortals?: () => void;
}
export declare class ScopeResolver {
    private static scopeCache;
    private static commentCache;
    private static trackedElements;
    private static cleanupScheduled;
    private static readonly CLEANUP_INTERVAL;
    private static readonly MAX_TRACKED_ELEMENTS;
    private static lastCleanup;
    static findScope(element: Element | Text): string | null;
    private static findScopeUncached;
    private static findScopeInSiblings;
    private static parseCommentNode;
    private static isValidScopeName;
    static removeScopeComments(): void;
    static preCacheAllScopes(): void;
    private static trackElement;
    private static scheduleCleanup;
    private static performCleanup;
    static clearCache(): void;
    static invalidateElement(element: Element): void;
    static invalidateTree(root: Element): void;
    static getCacheStats(): {
        trackedElements: number;
        lastCleanup: number;
        cleanupScheduled: boolean;
    };
    static forceCleanup(): void;
}
export declare class ExpressionValidator {
    static validate(expression: string, component: string): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    };
    private static validateAST;
    private static validateBranch;
    private static hasTrailingOrLeadingQuote;
    private static suggestQuoteFix;
    private static looksLikeUnquotedLiteral;
    private static isAlreadyQuoted;
    private static countQuotes;
    private static validateSyntax;
    private static checkBrackets;
    private static checkParentheses;
}
export declare class DOMCache implements CacheableClass {
    private static instance;
    private componentElementsCache;
    private scriptElementsCache;
    private templateElementsCache;
    private selectorCache;
    private elementComponentCache;
    private parentComponentCache;
    private contextComponentCache;
    private elementDepthCache;
    private elementChildrenCache;
    private cacheHits;
    private cacheMisses;
    private static readonly CACHE_KEYS;
    static getInstance(): DOMCache;
    queryComponentElements(component: string): Element[];
    querySelectorAll(selector: string): Element[];
    getElementComponent(element: Element): string;
    getContextComponent(element: Element): string;
    getParentOfComponent(componentName: string, elementInComponent: Element): string;
    getElementDepthCached(element: Element): number;
    getFirstComponentElement(component: string): Element | null;
    getComponentScripts(component: string, element?: Element): HTMLScriptElement[];
    getComponentTemplates(component: string, element?: Element): HTMLTemplateElement[];
    querySelector(selector: string): Element | null;
    findElementForComponent(startElement: Element, targetComponent: string): Element | null;
    invalidateCache(key?: string): void;
    invalidateByComponent(component: string): void;
    invalidateByPrefix(component: string): void;
    invalidateElement(element: Element): void;
    clearAllCaches(): void;
    getCacheStats(): Record<string, CacheStats>;
    resetStats(): void;
}
declare class SubscriptionManager {
    private subscriptions;
    private elementSubscriptions;
    private keyIndex;
    private cleanupQueue;
    private cleanupScheduled;
    addSubscription(subscription: Subscription): void;
    removeSubscription(id: string): void;
    cleanupElement(element: Element): void;
    private scheduleCleanup;
    private processCleanupQueue;
    getSubscription(id: string): Subscription | undefined;
    getSubscriptionsForKey(key: string): Set<string> | undefined;
    getAllSubscriptions(): Map<string, Subscription>;
    cleanupStaleSubscriptions(): void;
    getStats(): {
        totalSubscriptions: number;
        elementSubscriptions: number;
        keyIndexes: number;
    };
}
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    private hits;
    private misses;
    constructor(maxSize: number);
    keys(): K[];
    deleteByPrefix(prefix: string): number;
    getKeysByPrefix(prefix: string): K[];
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    size(): number;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    getStats(): CacheStats;
    resetStats(): void;
}
export declare class MustacheParser {
    private static readonly EXPRESSION_CACHE;
    static parseSpreadDirective(content: string): {
        spreads: string[];
        objects: Array<{
            key: string;
            value: string;
        }[]>;
    };
    private static parseSpreadParts;
    private static parseObjectProperties;
    private static parseObjectParts;
    private static findPropertySeparator;
    static decodeEntities: (html: string) => string;
    static parse(content: string): ParsedMustache[];
    private static parseContentWithNesting;
    private static isValidExpression;
    private static extractNestedExpression;
    private static checkForMismatchedQuotes;
    static isSingleExpression(content: string): string | null;
    static extractExpressions(content: string): string[];
}
export declare class StateManager {
    subscriptionManager: SubscriptionManager;
    private stateStore;
    private updateQueue;
    private isUpdating;
    private eventBus;
    private contextCache;
    private previousValues;
    private originalStateStore;
    private domUpdateCallbacks;
    private domUpdateScheduled;
    private suspendNotifications;
    constructor();
    suspendSubscriptions(): void;
    resumeSubscriptions(): void;
    static findExistingStateKey(key: string, component: string, stateStore: ReactiveState): string | null;
    clearSubscriptions(): void;
    clearComponentSubscriptions(componentName: string): void;
    clearState(): void;
    clearComponentState(componentName: string): void;
    onDOMUpdateComplete(callback: () => void): void;
    setInitialState(key: string, value: unknown): void;
    batchStateUpdates<T>(fn: () => T): T;
    invalidateContextCache(): void;
    private setupGlobalStateProxy;
    private notifySubscribers;
    private notifyPathBasedSubscribers;
    private isPathDependency;
    private getPathValue;
    private deepEqual;
    private scheduleFlush;
    flushUpdates(): void;
    getState(): ReactiveState;
    setState(key: string, value: unknown): void;
    hasState(key: string): boolean;
    addSubscription(subscription: Subscription): void;
    removeSubscription(id: string): void;
    onStateChange(callback: (key: string) => void): () => void;
    batch<T>(fn: () => T): T;
    getSubscriptions(): Map<string, Subscription>;
    getKeyIndex(): Map<string, Set<string>>;
    destroy(): void;
}
export declare class ExpressionEvaluator implements CacheableClass {
    private expressionCache;
    private dependencyCache;
    private commonExpressionsCache;
    private dependencyParser;
    private static readonly CACHE_KEYS;
    constructor();
    private normalizeExpression;
    private precompileCommonExpressions;
    extractDependencies(expression: string, component: string, stateManager: StateManager): string[];
    evaluateExpression(expression: string, context: Record<string, any>, component: string): unknown;
    private transformContextForEvaluation;
    private compileExpression;
    private buildArguments;
    private isStale;
    private prepareSafeContext;
    private isValidJavaScriptIdentifier;
    invalidateCache(key?: string): void;
    invalidateByComponent(component: string): void;
    clearAllCaches(): void;
    getCacheStats(): Record<string, CacheStats>;
    private getDependencyParserStats;
    cleanupStaleExpressions(): number;
}
export declare class PP {
    hydrationStarted: boolean;
    hydrationDone: boolean;
    protected static instance: PP | null;
    protected initialized: boolean;
    private stateManager;
    private expressionEvaluator;
    private componentManager;
    private domBindingManager;
    private hydrationCallbacks;
    private portalManager;
    private hydrationResolve;
    private hydrationPromise;
    private portalHydrationPromises;
    private portalHydrationResolvers;
    private lifecycleManager;
    private pendingEffects;
    constructor();
    initialize(): Promise<void>;
    private processAllLoops;
    private runPendingEffects;
    private triggerLoopUpdatesFromEffects;
    onPhase(phase: HydrationPhase, callback: () => void): void;
    waitForPhase(phase: HydrationPhase): Promise<void>;
    registerLifecycleHooks(hooks: LifecycleHooks): void;
    private disconnectObservers;
    private reconnectObservers;
    private scheduleCommentCleanup;
    createPortal(content: HTMLElement | DocumentFragment | string, container: Element | string, options?: PortalOptions): string;
    removePortal(portalId: string): boolean;
    hasPortal(portalId: string): boolean;
    getPortal(portalId: string): Portal | undefined;
    markPortalHydrated(portalId: string): void;
    updatePortal(portalId: string, content: HTMLElement | DocumentFragment | string, options?: PortalOptions): boolean;
    protected cleanup(): void;
    ref<T = any>(initialValue?: T | null): Ref<T>;
    hydrated(): Promise<void>;
    onHydrated(cb: () => void): void;
    private markHydrationStart;
    get isHydrated(): boolean;
    get isHydrating(): boolean;
    private markHydrated;
    state<T>(keyOrInitialValue: string | T, initialValue?: T): [StateGetter<StateValue<T>>, StateSetter<StateValue<T>>];
    private looksLikeVariableName;
    effect(callback: () => void | (() => void), depsOrOptions?: (string | StateGetter<any>)[] | EffectOptions): () => void;
    private extractDependencyNames;
    private resolveDependencies;
    private createComponentScopedGlobals;
    protected deleteAllComponentObjects(): void;
    static resetInstance(): void;
    destroy(): void;
}
export {};
