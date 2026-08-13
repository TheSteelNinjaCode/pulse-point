import { type ScopeBundle } from "./utils.js";
type PerfPhaseName = "script" | "compile" | "template" | "domDiff" | "bindEvents" | "bindRefs" | "bootstrapNested" | "portals" | "restoreFocus" | "layoutEffects" | "effects" | "total";
type PerfSample = {
    count: number;
    totalMs: number;
    maxMs: number;
};
type PerfComponentEntry = {
    renderCount: number;
    phases: Record<PerfPhaseName, PerfSample>;
};
export declare class Component {
    private static readonly MAX_SYNC_RERENDERS;
    private static readonly MAX_RENDER_FUNCTION_CACHE_SIZE;
    private static readonly renderFunctionCache;
    private el;
    /**
     * The boundary this component is anchored to. Today always an
     * `ElementBoundary` over `el`; identity and template reads go through it,
     * so a range-shaped boundary can slot in without touching those paths.
     */
    private boundary;
    private id;
    private rawTemplate;
    private renderFunction;
    private renderPipelineInitialized;
    private templateFn;
    private hooksSystem;
    private _eventManager;
    private latestScope;
    private __ppRefStore;
    private __ppRefSeq;
    private __ppRefCaptureIdsByElement;
    private __ppRefExprsByElement;
    private _refBindingManager;
    private __ppInputValueStore;
    private __ppInputValueSeq;
    private __ppSelectValueStore;
    private __ppSelectValueSeq;
    private __ppCheckedValueStore;
    private __ppCheckedValueSeq;
    private __ppContextTokenStore;
    private __ppContextTokenSeq;
    private __ppContextValueStore;
    private __ppContextValueSeq;
    private __ppDefaultValueStore;
    private __ppDefaultValueSeq;
    private __ppDefaultCheckedStore;
    private __ppDefaultCheckedSeq;
    private readonly __ppLoopValueIds;
    private readonly __ppLoopOwnerKey;
    private __ppLoopValueSeq;
    private _formControlManager;
    private passiveEffectsVersion;
    private isRendering;
    private props;
    private ownedChildren;
    private lastRenderedHtml;
    private renderCount;
    private _portalManager;
    private parentId;
    private initialChildrenHtml;
    /** Set while extracting owned templates; read by `parentCompiledOurContent`. */
    private subtreeHadOwnedTemplate;
    private pendingEventElements;
    private _traversalManager;
    private _contextManager;
    private _focusManager;
    private _domMorpher;
    private _ownedTemplateManager;
    private propBindingManager;
    private _nestedBoundaryManager;
    private _attributeSyncManager;
    private _lastRawScopeKeySig;
    private _lastSortedKeys;
    private _lastHtmlProbes?;
    private _lastSortedScopeKeySig;
    private _cachedHooksAPI;
    private _cachedRuntimeAPI;
    private _propFnCache;
    private _interpolationFnCache;
    private _scopeEvalFnCache;
    private _refEvalFnCache;
    private hadNestedRuntimeStructures;
    private loopRowCache;
    private loopKeepResolved;
    private usesLoops;
    private boundaryContentCache;
    private boundaryKeepResolved;
    private forceChildBoundaryRefresh;
    /**
     * True while the current `applyDomDiff` reconciles against DOM this
     * component itself committed on a previous render. Only then may the morph
     * skip byte-equal subtrees: committed DOM has bound-handler attributes
     * stripped, so byte-equality proves there is nothing left to bind. The
     * first morph after mount reconciles the materialized template, where an
     * unbound handler is byte-identical to the render output.
     */
    private morphingFromCommittedRender;
    private __ppLoopRowsFn;
    private __ppBoundaryHtmlFn;
    private static perfEnabled;
    private static perfStats;
    constructor(element: HTMLElement | SVGElement);
    private get eventManager();
    private get refBindingManager();
    private get formControlManager();
    private get portalManager();
    private get attributeSyncManager();
    private get traversalManager();
    private get contextManager();
    private get ownedTemplateManager();
    private get nestedBoundaryManager();
    /**
     * Built on first use: a component that reuses its static server markup never
     * saves or restores focus, and mounting a large tree should not pay for the
     * manager's closure captures per component.
     */
    private get focusManager();
    /** Built on first use, for the same reason as `focusManager`. */
    private get domMorpher();
    private initializeRenderPipeline;
    private syncParentId;
    static setPerfEnabled(enabled: boolean): void;
    static getPerfEnabled(): boolean;
    static resetPerfStats(): void;
    static getPerfStats(): Record<string, PerfComponentEntry>;
    private static createEmptyPerfEntry;
    private recordPerfPhase;
    private startPerfTimer;
    private endPerfTimer;
    /**
     * Extract this component's own <script> by splicing its serialized form out
     * of `initialChildrenHtml`, skipping the parse + re-serialize round-trip the
     * fallback path below pays for every script-bearing component.
     *
     * `initialChildrenHtml` is itself an innerHTML serialization of the live
     * subtree, so the live script element's outerHTML appears in it verbatim.
     * The splice is taken only when that serialization occurs exactly once —
     * any ambiguity (or divergence between the live DOM and the stored string,
     * possible on a lazy initialization long after mount) falls back to the
     * parse path, which stays the source of truth. Templates carrying a
     * <textarea> also stay on the parse path, because parsing is what applies
     * their initial-content normalization.
     */
    private spliceOwnScriptFromInitialHtml;
    private findOwnScript;
    /**
     * A scriptless component may reuse the server-rendered DOM when its own
     * surface has no work for PulsePoint to evaluate. Nested component bodies are
     * deliberately excluded: each nested boundary owns and initializes its body.
     * The boundary's opening attributes remain part of the parent-owned surface,
     * so any binding or runtime metadata there keeps the normal render path.
     */
    private canReuseStaticInitialMarkup;
    /**
     * Establish the same empty component bookkeeping the normal render path
     * would create, retain the committed server markup, and hand each nested
     * boundary to its own Component instance. No lifecycle work is skipped:
     * eligible components have no script, bindings, refs, effects, providers,
     * portals, controlled inputs, directives, or owned content.
     *
     * `committedHtml` is the innerHTML snapshot the constructor already took;
     * eligibility guarantees nothing mutated the subtree since (no owned
     * templates were extracted), so re-serializing the subtree here would produce
     * the same string a second time.
     */
    private reuseStaticInitialMarkup;
    /** True when any descendant element is a component boundary; stops at the first hit. */
    private subtreeHasComponentBoundary;
    /**
     * Did the surrounding component compile this boundary's content, rather than
     * mask it and restore it verbatim?
     *
     * This is the mirror of `TemplateCompiler.findAndMask`, which masks a nested
     * boundary when it carries a script or an owned template anywhere in its
     * subtree, and otherwise treats its internals as the parent's own markup.
     * Both sides must agree: whatever the parent masked, this component still has
     * to compile itself, and whatever the parent compiled, this component must
     * not compile a second time.
     *
     * Read from the markup captured at construction, because a component's
     * `<script>` is emptied during mount — the element survives in
     * `initialChildrenHtml`, its body does not.
     */
    private parentCompiledOurContent;
    /**
     * Escape every brace in markup the parent already compiled, so this component
     * renders it as the literal data it is instead of compiling it again.
     *
     * Escaping has to happen on the template STRING, before the compiler runs:
     * `&#123;` written into the DOM is parsed straight back to a bare `{`, which
     * is exactly why the server carries brace entities through deferred templates
     * with one additional HTML-encoding layer.
     */
    private neutralizeScriptlessTemplate;
    /**
     * Recover the state <script> a composition component authored as slot content.
     *
     * When this component's authored root is another component tag, its own
     * `<script>` is projected into that child's boundary and wrapped in a
     * `<template pp-owner="thisId">`. Because the script physically lives behind a
     * nested `pp-component`, `findOwnScript` never reaches it, and the owned
     * children (which resolve in THIS component's scope) reference state that was
     * never established. Pull that script out of the slot template this component
     * owns so `pp.state(...)` runs here, in the scope its bindings read from.
     */
    private findOwnedSlotScript;
    private applyBoundaryBindings;
    private computePropsFromAttributes;
    refreshPropsFromParent(forceRender?: boolean, parentBundle?: ScopeBundle): void;
    /**
     * Refresh this nested component's owned-template children from the parent's
     * latest render output.
     *
     * Owned children (the markup passed between a component's tags) are extracted
     * and cached once when the component instance is created. When the owning
     * parent re-renders, the morpher stops at this nested boundary and never
     * descends into it, so updated children — e.g. a `{item.copyLabel}` baked by a
     * surrounding `pp-for` — would otherwise be dropped and the child would stay
     * frozen on its first-render content. The morpher hands us the incoming
     * boundary element so we can re-extract the owned templates and re-render when
     * their content actually changed.
     */
    refreshOwnedChildrenFromElement(sourceEl: Element): boolean;
    private getCachedFunction;
    private createRenderFunction;
    private resolveCapturedRefValue;
    private resolvePlainRefValue;
    private readonly __ppRefCaptureFn;
    private readonly __ppSelectValueCaptureFn;
    private readonly __ppCheckedValueCaptureFn;
    private readonly __ppInputValueCaptureFn;
    private readonly __ppContextTokenCaptureFn;
    private readonly __ppContextValueCaptureFn;
    private createRefCaptureFunction;
    private createSelectValueCaptureFunction;
    private createCheckedValueCaptureFunction;
    private createInputValueCaptureFunction;
    private createContextTokenCaptureFunction;
    private createContextValueCaptureFunction;
    private __ppContextLookupFn;
    private createContextLookupFunction;
    private readonly __ppDefaultValueCaptureFn;
    private readonly __ppDefaultCheckedCaptureFn;
    private createDefaultValueCaptureFunction;
    private createDefaultCheckedCaptureFunction;
    private readonly __ppLoopCaptureFn;
    private readonly __ppLoopReadFn;
    private clearLoopValues;
    private createLoopCaptureFunction;
    private consumeContext;
    private registerProvidedContext;
    requestContextRefresh(): void;
    private refreshContextConsumers;
    private makeHooksAPI;
    private makeRuntimeAPI;
    private syncTrackedPortals;
    private morphTrackedPortalRoot;
    private applyPortals;
    private render;
    /**
     * Offers `error` to this component's own boundary, then to each ancestor
     * boundary in turn. Returns false when nothing in the chain catches it, so
     * the caller still logs rather than swallowing the failure.
     */
    private deliverErrorToBoundary;
    captureComponentError(error: unknown): boolean;
    private schedulePassiveEffects;
    private applyDomDiff;
    private isInsideTrackedPortal;
    private isEffectManagedSurfaceElement;
    private collectEventElements;
    private hasEventAttributes;
    private invalidateTraversalCache;
    private getTraversalCache;
    private collectManagedInputs;
    private resolveForwardedComponentRefTarget;
    private syncAttributes;
    private bindRefs;
    private bindControlledSelectValues;
    private bindControlledCheckedValues;
    private bindControlledInputValues;
    private bindUncontrolledInputDefaults;
    private bindUncontrolledFormResets;
    private bootstrapNestedComponents;
    private materializeNestedBoundaryFormDefaults;
    forceUpdate(): void;
    private destroyNestedComponents;
    destroy(): void;
}
export {};
