import { BOUNDARY_DIRECT_PROPS } from "./ComponentBoundary.js";
import type { ContextManager } from "./ContextManager.js";
import type { ContextToken } from "./ComponentRuntime.js";
import { type ScopeBundle } from "./utils.js";
export type ComponentBoundaryElement = HTMLElement & {
    __ppBaseComponentId?: string;
    __ppRuntimeComponentId?: string;
    __ppRuntimeParentId?: string | null;
    __ppRawBindings?: Record<string, string>;
    __ppLiteralAttrs?: Set<string>;
    /**
     * Exact prop values written by LoopRowCache's direct value lane. The live
     * DOM attribute is still serialized for HTML semantics, but component props
     * must retain the parent's primitive type (including false/null/empty
     * string) and brace-containing strings must remain data.
     */
    [BOUNDARY_DIRECT_PROPS]?: Record<string, any>;
    __ppRefCaptureId?: string;
    __ppRefExpr?: string;
    __ppWarnedDynamicComponentId?: boolean;
    __ppWarnedDuplicateComponentId?: boolean;
    /**
     * Set by the identity mint when its probes proved the minted id has neither
     * a registered instance nor saved state — never on the reclaim or collision
     * paths. Consumed (and deleted) within the same synchronous bootstrap visit;
     * it lets the mount skip re-probing what the mint just proved absent.
     */
    __ppFreshIdentity?: boolean;
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
    getContextManager: () => ContextManager;
    isEffectManagedSurfaceElement: (element: Element) => boolean;
    shouldSkipEffectManagedAttr: (name: string) => boolean;
    syncAttributes: (target: Element, source: Element, skipEffectAttrs?: boolean, preserveComponentId?: boolean, skipAttrs?: Record<string, string>) => void;
    applyBoundaryBindings: (element: HTMLElement, rawBindings: Record<string, string>, bundle: ScopeBundle, shouldSkipAttr?: (name: string) => boolean) => void;
    materializeFormDefaults: (element: HTMLElement) => void;
    /**
     * Whether the owning component holds ANY captured form-default state right
     * now (mirrors the early-return inside `materializeFormDefaults`). Capture
     * stores fill during the owner's template evaluation, never during its
     * bootstrap pass, so the answer is stable for one pass and is read once per
     * pass instead of once per child.
     */
    hasFormDefaultState: () => boolean;
    createComponent: (element: HTMLElement, parentBundle?: ScopeBundle) => void;
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
    /** Per-pass snapshot of `options.hasFormDefaultState()`; true by default so a
     * call site that forgets to refresh it degrades to the per-child call, whose
     * own early-return keeps behavior identical. */
    private materializeFormsThisPass;
    constructor(options: NestedBoundaryManagerOptions);
    bootstrap(): void;
    /**
     * Refresh exactly the nested boundaries inside directly patched loop rows.
     *
     * This is the targeted counterpart of `bootstrap()`: the patch path already
     * synced each row's boundary attributes, so only the affected children need
     * their props recomputed. Patch eligibility guarantees there are no context
     * providers or owned templates on this surface, and every element already
     * carries its runtime identity from its original mount, so none of the
     * full-pass bookkeeping (occurrence numbering, provider sync, disconnected
     * destruction) applies here.
     */
    refreshPatchedBoundaries(roots: Element[]): void;
    private traversePatchedRow;
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
