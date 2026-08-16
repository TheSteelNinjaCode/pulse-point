import { type DirectChildDerivation, type DirectPropsSchemaEntry } from "./ComponentBoundary.js";
import { type PreparedRowPlan } from "./LoopRowCache.js";
import { type ScopeBundle } from "./utils.js";
type PerfPhaseName = "script" | "compile" | "template" | "domDiff" | "bindEvents" | "bindRefs" | "bootstrapNested" | "portals" | "restoreFocus" | "layoutEffects" | "effects" | "ctor" | "ctorSerialize" | "ctorProps" | "ctorPipeline" | "destroy" | "total";
type PerfSample = {
    count: number;
    totalMs: number;
    maxMs: number;
};
type PerfComponentEntry = {
    renderCount: number;
    phases: Record<PerfPhaseName, PerfSample>;
};
/**
 * Construction blueprints shared across structurally identical instances.
 *
 * A list or churned panel mounts many components whose initial markup is
 * byte-identical (loop-cloned children, repeated cards). Deriving the raw
 * template, splicing the script, and compiling the render/template functions
 * are pure functions of that markup, so instances after the first reuse the
 * result instead of re-deriving it. Restricted to subtrees with no owned
 * templates anywhere: owned-content extraction resolves owner ids against the
 * live registry, which is instance state.
 */
type PipelineBlueprint = {
    rawTemplate: string;
    scriptContent: string;
    usesLoops: boolean;
    hasBoundaryCall: boolean;
    captureNeeds: number;
    propsOnlyRuntime: boolean;
    bodyPlan: PreparedBodyPlan | null;
    renderFunction: Function;
    /** Compiled template functions by scope-key signature. */
    templateFns: Map<string, Function>;
    /** Compiled body-plan value functions by scope-key signature. */
    bodyValuesFns: Map<string, Function>;
    /**
     * Sorted scope-key shape shared by every instance, published by the first
     * render. Valid only while the committed scope is exactly the shared render
     * function's return object — no capture helpers, loop helpers, or boundary
     * resolver installed (`captureNeeds === 0`, no loops, no boundary calls);
     * the same compiled script always returns the same top-level binding shape.
     */
    scopeShape: {
        sortedKeys: string[];
        sortedKeySig: string;
    } | null;
};
/**
 * A component body plan with its slot bitmasks resolved once, plus a
 * `PreparedRowPlan`-shaped view for `applyRowValuePatch` (which reads only
 * `slots`; the plan has no key or boundary slots by construction).
 */
type PreparedBodyPlan = {
    rootTag: string;
    size: number;
    fullMask: number;
    slotBitsByValue: number[];
    exprs: string[];
    applyPlan: PreparedRowPlan;
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
    private pipelineBlueprint;
    /**
     * Built on first need, like the DOM-side managers: a compile-proven
     * props-only script (and a scriptless wrapper) can never reach a hook, an
     * effect, a portal, or an error boundary of its own, so nothing here is
     * observable for it. Invariant: null implies the component has recorded no
     * hook state and owns no portal registrations or boundary error.
     */
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
    private __ppLoopValueIds;
    private __ppLoopOwnerKey;
    private __ppLoopValueSeq;
    private _formControlManager;
    private passiveEffectsVersion;
    private isRendering;
    private props;
    private ownedChildren;
    private lastRenderedHtml;
    private renderCount;
    /**
     * True from construction until the first state save when the bootstrap's
     * identity mint proved this id had no instance and no saved state — the
     * state-restore and preserve-prior-entry probes are no-ops for it. Never
     * set for reclaimed, collided, or externally seeded ids.
     */
    private freshStateId;
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
    private _propBindingManager;
    private _nestedBoundaryManager;
    private _attributeSyncManager;
    private _lastRawScopeKeySig;
    private _lastSortedKeys;
    private _lastHtmlProbes?;
    private _lastSortedScopeKeySig;
    private _cachedHooksAPI;
    private _cachedRuntimeAPI;
    /** Per-instance context-provision dispatcher, allocated on first render. */
    private _provisionDispatcher;
    private _refEvalFnCache;
    private hadNestedRuntimeStructures;
    private loopRowCache;
    private loopKeepResolved;
    private usesLoops;
    /** Capture-helper families this template can reach; see computeCaptureNeeds. */
    private captureNeeds;
    /** Script was conservatively proven to observe no runtime member but props. */
    private propsOnlyRuntime;
    /** Direct-write body plan; see TemplateCompiler.compileComponentBodyPlan. */
    private bodyPlan;
    /** Previous render's body-plan values; null forces a full-slot write. */
    private bodyPlanValues;
    private bodyPlanValuesFn;
    private bodyPlanDisabled;
    /** The live own <script> element, removed by the body plan's mount commit. */
    private liveOwnScriptEl;
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
    /** Resolved live containers of this component's keyed loops, by loop id. */
    private _loopContainers;
    /**
     * Rows patched by the fused value lane whose boundary props changed;
     * their child components are refreshed after the template evaluation that
     * recorded them, at the same point the two-phase patch path refreshed them.
     */
    private _patchedBoundaryRows;
    /** Verified boundary roots adopted out-of-band during the current morph. */
    private __ppBoundaryHtmlFn;
    private static perfEnabled;
    private static perfStats;
    constructor(element: HTMLElement | SVGElement, bootstrapParentBundle?: ScopeBundle);
    /**
     * Build the HooksSystem on first need, wiring the same state-change,
     * error-delivery, and saved-state restore the constructor used to perform
     * eagerly. Called before any render whose script can reach the full runtime;
     * props-only and scriptless components never construct one.
     */
    private ensureHooksSystem;
    private get eventManager();
    private get refBindingManager();
    private get formControlManager();
    private get portalManager();
    private get attributeSyncManager();
    private get traversalManager();
    private get contextManager();
    private get ownedTemplateManager();
    /**
     * Built on first use: a schema-built direct row reads its props straight
     * from the sidecar at mount, so most churned children never evaluate a prop
     * expression at all and should not pay the manager plus its resolver
     * closure per instance.
     */
    private get propBindingManager();
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
    /**
     * Loop and boundary machinery per template shape. Only loop-bearing
     * templates generate a `__pp_loop_rows(...)` call, and every scope key costs
     * a signature entry plus an argument on every render, so a component with no
     * `pp-for` must not pay for the row cache it can never use — and likewise
     * for the boundary content resolver.
     */
    private installLoopMachinery;
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
    /**
     * Record the props schema of a direct-built row shape from this instance's
     * REAL props run. Refused (null) whenever the boundary carries anything a
     * per-sibling replay cannot represent: captured raw `{expr}` bindings (they
     * evaluate in the parent scope per pass), literal-brace markers (their
     * strip-and-exempt bookkeeping is per element), or a missing sidecar.
     * Everything else is exact: sidecar-backed names replay the typed per-row
     * value, and every other attribute is part of the shared prototype, so the
     * value this run produced is the value every sibling's run would produce.
     */
    private recordDirectPropsSchema;
    /**
     * The element-child index path from this boundary root to its own script,
     * recorded once per direct-built shape so structurally identical siblings
     * skip the recursive own-script walk.
     */
    private deriveScriptPath;
    refreshPropsFromParent(forceRender?: boolean, parentBundle?: ScopeBundle, parentScopeKnownUnused?: boolean): void;
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
    private __ppRefCaptureFn;
    private __ppSelectValueCaptureFn;
    private __ppCheckedValueCaptureFn;
    private __ppInputValueCaptureFn;
    private __ppContextTokenCaptureFn;
    private __ppContextValueCaptureFn;
    private createRefCaptureFunction;
    private createSelectValueCaptureFunction;
    private createCheckedValueCaptureFunction;
    private createInputValueCaptureFunction;
    private createContextTokenCaptureFunction;
    private createContextValueCaptureFunction;
    private __ppContextLookupFn;
    private createContextLookupFunction;
    private __ppDefaultValueCaptureFn;
    private __ppDefaultCheckedCaptureFn;
    private createDefaultValueCaptureFunction;
    private createDefaultCheckedCaptureFunction;
    private __ppLoopCaptureFn;
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
    /**
     * Apply direct row patches to the live keyed nodes of this component's
     * loops. Every target is verified — present in the container's key index and
     * still parented there — before anything is written; a single failed
     * verification aborts the whole pass and the caller falls back to a full
     * re-render with patching disabled.
     */
    /**
     * Commit a changed render by writing the body plan's changed values straight
     * to the live DOM, skipping the parse + morph. Plan eligibility guarantees
     * the body's entire dynamic surface is captured by the plan's slots, so a
     * changed rendered string implies changed values and the direct writes
     * produce the same DOM the morph would have. Any verification failure —
     * a non-primitive value, a throwing expression (contained per-expression
     * only by the string pipeline), a structure mismatch, or a change the plan
     * cannot see — falls back to the normal `applyDomDiff` path, which remains
     * the source of truth.
     *
     * At mount (`lastRenderedHtml === ""`) the live DOM is the materialized
     * template: every slot is written (raw `{expr}` text and attributes become
     * their evaluated values) and the neutralized own `<script>` element is
     * removed, exactly as the first morph would have done.
     */
    /**
     * Whether this render may try the body-plan commit BEFORE evaluating the
     * template, committing the mount straight from values. Gated to shapes whose
     * render pipeline touches nothing the skipped string would have fed: no
     * capture helpers (their tokens mint during template evaluation), no loops
     * or boundary-content calls (their emission bookkeeping lives in the
     * compiled template), and no owned children (resolved on the string). Plan
     * eligibility already excludes managed inputs, refs, providers, and nested
     * boundaries from the body, so the sentinel's constant probe results are
     * exact for these shapes.
     */
    private canAttemptStringlessMount;
    private tryBodyPlanCommit;
    private applyLoopPatches;
    /**
     * The key → row-node index of one keyed-loop container, built lazily and
     * cached on the container; the keyed morph pass invalidates it whenever it
     * restructures the container.
     */
    private ensureLoopKeyIndex;
    /**
     * The owning side of the fused value lane: resolve one loop's live container
     * and key index so the cache can verify and write patch targets during
     * template evaluation, record boundary-carrying rows for the targeted child
     * refresh after the evaluation, and report an abandoned patch pass with this
     * component's identity.
     */
    private createLoopValuePatchSink;
    /**
     * The live parent element of one keyed loop's rows, resolved from the first
     * patch's key and cached per loop id. The candidate row must belong to this
     * component's own surface — the walk to the component root must not cross a
     * nested boundary — and ambiguity or a foreign (SVG) namespace falls back to
     * the full render path.
     */
    private resolveLoopContainer;
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
/**
 * The shared per-shape runtime behind flyweight rows: everything a mounted
 * direct-built row needs that is identical across clones of one prototype,
 * resolved once at admission. Immutable shape knowledge — nothing here is
 * per-row state, so sharing it across lifecycles is not pooling.
 */
type FlyweightShape = {
    derivation: DirectChildDerivation;
    blueprint: PipelineBlueprint;
    schema: DirectPropsSchemaEntry[];
    childrenHtml: string;
    scriptPath: number[] | null;
    scopeKeys: string[];
    plan: PreparedBodyPlan;
    valuesFn: Function;
    renderFunction: Function;
};
/**
 * A mounted direct-built row behind one shared per-shape runtime. The row
 * record answers every per-id registry contract a Component would (instance
 * surface, parent link, truthy state entry, saved scope) while owning no
 * managers, hooks, or event machinery — its shape admission proves none can
 * ever be needed. Any row that leaves the envelope materializes into a real
 * Component with no observable difference: hookless rows lose no state, the
 * live DOM is current, and props recompute.
 */
export declare class FlyweightRow {
    el: HTMLElement;
    readonly id: string;
    parentId: string | null;
    props: Record<string, any>;
    private readonly shape;
    latestScope: Record<string, any> | null;
    bodyPlanValues: any[] | null;
    renderCount: number;
    /**
     * True once this row was replaced by a real Component. The replacement's
     * registerInstance destroys this record while its element is normally still
     * connected, but a handed-over row must never park even when it is not —
     * the element now belongs to the Component's render, not the row's plan.
     */
    handedOver: boolean;
    /** Shared-blueprint identity, mirroring Component.pipelineBlueprint. */
    readonly pipelineBlueprint: PipelineBlueprint;
    constructor(el: HTMLElement, id: string, parentId: string | null, props: Record<string, any>, shape: FlyweightShape);
    /** No HooksSystem, so no error boundary — errors keep walking up. */
    captureComponentError(): boolean;
    refreshPropsFromParent(forceRender?: boolean, parentBundle?: ScopeBundle): void;
    /**
     * Hand this row over to a real Component; its registerInstance replaces —
     * and thereby destroys — this row, then rewrites exactly the registry
     * entries the row maintained.
     */
    private materialize;
    destroy(): void;
}
export {};
