import type { ContextToken } from "./ComponentRuntime.js";
export type ContextRefreshRequester = {
    requestContextRefresh?: () => void;
};
export declare class ContextManager {
    private readonly componentId;
    private readonly getParentId;
    private readonly isCurrentInstance;
    private readonly isRendering;
    private readonly forceUpdate;
    private pendingProvidedContexts;
    private pendingContextTokens;
    private activeProviderBoundaryIds;
    private refreshPending;
    private warnedContextOutsideRender;
    constructor(componentId: string, getParentId: () => string | null, isCurrentInstance: () => boolean, isRendering: () => boolean, forceUpdate: () => void);
    prepareRender(): void;
    consume<T>(context: ContextToken<T>): T;
    provide<T>(context: ContextToken<T>, value: T): void;
    commitRenderContexts(): Set<string> | null;
    syncProviderBoundary(boundaryId: string, parentBoundaryId: string, context: ContextToken<any>, value: any): Set<string>;
    replaceActiveProviderBoundaries(nextBoundaryIds: Set<string>): Set<string>;
    requestRefresh(): void;
    refreshConsumers(consumerIds: Iterable<string>): void;
    destroy(): Set<string> | null;
}
