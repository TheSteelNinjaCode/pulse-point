import type { ContextManager } from "./ContextManager.js";
import type { ContextToken } from "./ComponentRuntime.js";
import { type ScopeBundle } from "./utils.js";
export type ComponentBoundaryElement = HTMLElement & {
    __ppBaseComponentId?: string;
    __ppRuntimeComponentId?: string;
    __ppRuntimeParentId?: string | null;
    __ppRawBindings?: Record<string, string>;
    __ppLiteralAttrs?: Set<string>;
    __ppRefCaptureId?: string;
    __ppRefExpr?: string;
    __ppWarnedDynamicComponentId?: boolean;
    __ppWarnedDuplicateComponentId?: boolean;
};
export type ContextProviderBoundaryElement = HTMLElement & {
    __ppContextTokenCaptureId?: string;
    __ppContextValueCaptureId?: string;
    __ppContextBoundaryId?: string;
};
export type NestedBoundaryManagerOptions = {
    componentId: string;
    getRoot: () => HTMLElement | SVGElement;
    getPortalElements: () => Iterable<HTMLElement>;
    getLatestScope: () => Record<string, any>;
    getContextTokenStore: () => Map<string, ContextToken<any>>;
    getContextValueStore: () => Map<string, any>;
    contextManager: ContextManager;
    isEffectManagedSurfaceElement: (element: Element) => boolean;
    shouldSkipEffectManagedAttr: (name: string) => boolean;
    syncAttributes: (target: Element, source: Element, skipEffectAttrs?: boolean, preserveComponentId?: boolean, skipAttrs?: Record<string, string>) => void;
    applyBoundaryBindings: (element: HTMLElement, rawBindings: Record<string, string>, bundle: ScopeBundle, shouldSkipAttr?: (name: string) => boolean) => void;
    materializeFormDefaults: (element: HTMLElement) => void;
    createComponent: (element: HTMLElement) => void;
    refreshContextConsumers: (consumerIds: Iterable<string>) => void;
    /**
     * Whether every child must re-render even when its props are unchanged. Set
     * only while recovering from a failed boundary-content reuse, where a child's
     * root may have been replaced by an empty one and has to repaint itself.
     */
    shouldForceChildRefresh?: () => boolean;
};
export declare class NestedBoundaryManager {
    private readonly options;
    private boundaryOccurrencesByBaseId;
    private parentScopesByBoundaryId;
    constructor(options: NestedBoundaryManagerOptions);
    bootstrap(): void;
    syncNestedBoundaryAttributes(target: Element, source: Element): boolean;
    /**
     * Push freshly rendered owned-template children into a nested boundary.
     *
     * The morpher syncs a nested boundary's attributes but does not recurse into
     * its children, which leaves owned templates (e.g. `{item.copyLabel}` baked by
     * a surrounding `pp-for`) stuck on their first-render content. The incoming
     * `source` element still carries the up-to-date children, so we forward it to
     * the child instance to re-extract and re-render when they changed.
     */
    private refreshNestedOwnedChildren;
    private createBoundaryId;
    private getBoundaryScopeSignature;
    private getElementIndexWithinParent;
    private hashScope;
    private getBoundaryBaseId;
    private ensureBoundaryIdentity;
    private createUniqueCollisionId;
    private bootstrapComponentBoundary;
    /**
     * The merged ancestor scope for one boundary parent, built at most once per
     * bootstrap pass.
     *
     * Reusing the same object across children matters twice over: it skips the
     * repeated `Object.assign` merge of the ancestor chain, and it keeps the
     * scope-descriptor WeakMap warm, so the key filter, signature join and value
     * array are built once instead of once per child.
     */
    private getParentScopeBundle;
    private collectRawBindings;
    private destroyDisconnectedDescendants;
    private syncContextProviderBoundary;
    private resolveContextProviderBoundary;
    private ensureContextProviderBoundaryId;
}
