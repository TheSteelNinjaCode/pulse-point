/**
 * Row-level reuse cache for `pp-for` loops.
 *
 * A component render rebuilds its whole template as one HTML string, and
 * `applyDomDiff` then parses that string into a throwaway DOM before morphing.
 * Both passes are proportional to the size of the rendered markup, so changing
 * one row of a 2,000 row list used to cost the same as rebuilding the entire
 * list: ~40% of the time went into re-parsing rows that were byte-identical to
 * the ones already on screen, and another ~35% into re-walking them.
 *
 * This cache remembers the HTML each keyed row produced last render. When a row
 * renders byte-identically again, the loop emits a compact
 * `<pp-keep key="...">` placeholder in its place. The placeholder is what gets
 * parsed (a few bytes instead of the whole row), and `DomMorpher` resolves it by
 * repositioning the live node that already carries that key, skipping attribute
 * sync, child recursion and event rebinding for that subtree entirely.
 *
 * On top of placeholder reuse sit two direct-patch lanes, both available only
 * while the loop's key sequence is unchanged:
 *
 * - The STRING lane still builds every row's markup, but emits a keep
 *   placeholder for every row — changed rows included — and records the changed
 *   rows as patches `{key, html}`. The owning component applies each patch
 *   directly to the live keyed node, so the rendered document string stays
 *   byte-stable across content-only updates and the full parse + keyed morph is
 *   skipped entirely.
 * - The VALUE lane goes further for loops whose body compiled to a row plan
 *   (see `TemplateCompiler.compileLoopRowPlan`): it evaluates the row's
 *   expressions, compares them with the previous render's values, and writes
 *   only the changed attributes and text nodes — fused into the same pass, so
 *   no row markup is built, nothing is parsed, and no patch records are
 *   allocated. The owning component supplies a `LoopValuePatchSink` that
 *   resolves and verifies the live target rows.
 *
 * Reuse is deliberately conservative. A row participates only when it is a
 * single element carrying a non-empty `key`, and only when its markup contains
 * no nested runtime structure whose bindings the morph pass is responsible for
 * refreshing. Anything else renders normally. Patch application verifies each
 * target node's liveness; any mismatch falls back to a full render with
 * patching disabled, mirroring the keep-shortfall recovery.
 */
import type { RowPlanDescriptor, RowPlanSlot } from "./TemplateCompiler.js";
import { DirectChildDerivation } from "./ComponentBoundary.js";
/**
 * Marker attribute identifying a placeholder. A placeholder reuses the tag name
 * of the row it stands in for rather than introducing an element of its own,
 * because HTML parsing is context sensitive: an unknown tag inside `<tbody>`,
 * `<tr>` or `<select>` is foster-parented out of its container, which would tear
 * the row out of the table it belongs to.
 */
export declare const LOOP_KEEP_ATTR = "pp-keep";
/**
 * Marker attribute for a *run* of consecutive unchanged rows, carrying their
 * keys in order as a comma-separated list.
 *
 * One placeholder element per unchanged row already avoids re-diffing them, but
 * the parser still has to materialise one element per row before the morph can
 * look at it — measured in Chrome, that parse was the single largest slice of a
 * sparse update (~39%). Collapsing a run into one element makes the parse cost
 * independent of how many rows were reused, while the morph still resolves each
 * key individually, so ordering and liveness are verified exactly as before.
 */
export declare const LOOP_KEEP_RUN_ATTR = "pp-keep-run";
/**
 * Identifies the one keep-run marker whose first-render rows were constructed
 * as verified DOM clones. The attribute remains in the cached emission so a
 * later value-only render is byte-identical; on ordinary later morphs it is
 * harmless runtime metadata on the throwaway keep marker.
 */
export declare const LOOP_BUILD_ATTR = "pp-loop-build";
/**
 * One row as it was last rendered. Entries are immutable once built and are
 * shared with the next render whenever that row's markup did not change, so an
 * unchanged row costs a string comparison and nothing else -- no key regex, no
 * allocation, no map insert. The one exception is the patch flow: a freshly
 * created changed-row entry is poisoned with `PATCHED_ROW_HTML` while its patch
 * is in flight and rewritten to the real markup once the patch has been applied
 * to the live DOM, so the entry always describes what is actually mounted.
 */
type RowEntry = {
    html: string;
    key: string | null;
    tag: string;
    reusable: boolean;
    /** Whether this row's key can be packed into a run marker without escaping. */
    simpleKey: boolean;
    /** Whether a CHANGED version of this row may be applied as a direct patch. */
    patchSafe: boolean;
};
/** A row plan with its per-value slot mapping resolved once. */
export type PreparedRowPlan = {
    key: number;
    slots: RowPlanSlot[];
    size: number;
    /** value index -> bitmask of slots that read it (plans cap at 30 slots) */
    slotBitsByValue: number[];
    /** Bitmask of slots that target a nested boundary's attribute. */
    boundarySlotMask: number;
    /**
     * Value indices feeding boundary attributes, which must stay primitive on
     * EVERY render — an object value keeps the raw capture-based binding on the
     * live attribute, and the value lane never re-mints loop captures.
     */
    boundaryValueIndices: number[];
};
export type LoopPatch = {
    key: string;
    html: string;
    entry: RowEntry;
};
export type LoopPatchGroup = {
    loopId: number;
    patches: LoopPatch[];
};
export type LoopRowValuesFn = (item: any, index: number, out: any[], base: number) => any[];
/**
 * The owning component's half of the fused value lane. `begin` resolves and
 * verifies the live container of one loop's rows (and its key index) exactly
 * once per loop per render; a `null` result means the rows cannot be located
 * unambiguously, which the lane treats the same as a dead patch target.
 */
export type LoopValuePatchSink = {
    begin(loopId: number, sampleKey: string, needsBoundaryParent: boolean): {
        container: Element;
        index: Map<string, Element>;
    } | null;
    /** A patched row's boundary attribute changed; refresh its child after render. */
    onBoundaryRowPatched(row: Element): void;
    /** A patch target failed verification; the owner reports the abandonment. */
    reportPatchAbandoned(): void;
};
/**
 * The instance surface a parked row record must expose. Structurally matches
 * `FlyweightRow` (the only implementation) without importing Component.ts,
 * which imports this module.
 */
type ParkableRowInstance = {
    el: HTMLElement;
    readonly id: string;
    parentId: string | null;
    latestScope: Record<string, any> | null;
    /** True once the row was replaced by a real Component; never parkable. */
    handedOver: boolean;
};
/**
 * Parking follows the flyweight lane's perf gate: while attribution is on the
 * lane mounts nothing, and a set parked before the toggle must not revive
 * into an attributed session — the timers must keep describing the general
 * path. Disabling drops every parked generation.
 */
export declare function setRowParkingEnabled(enabled: boolean): void;
/**
 * A swept flyweight row offers itself for parking as it is destroyed. Parking
 * is unregistration plus retention: the caller's teardown still removes every
 * registry family, and the generation keeps only the record, its detached
 * element, and the captured state entry. Refusal is silent — the row is then
 * simply destroyed, exactly as before parking existed. A row is parkable only
 * when its generation is accepting, it was never handed over to a Component,
 * it committed a mount (truthy state, non-null scope), its element left the
 * DOM intact with its key and sidecar, and its key belongs to the closing set.
 */
export declare function offerParkedFlyweightRow(derivation: DirectChildDerivation, record: ParkableRowInstance, state: any): void;
/** Test-only introspection; unused by the bundle entry, so tree-shaken. */
export declare const __rowParkTestHook: {
    liveParkCount: () => number;
    parkedRowCount: () => number;
    /** Force the next reopen to mount fresh (the pre-revival behavior). */
    dropAll: () => void;
};
/**
 * Loop flag bit: the compiler verified that rows carrying nested component
 * boundaries are safe to reuse and patch (see
 * `TemplateCompiler.isBoundaryRowBodySafe`).
 */
export declare const LOOP_FLAG_BOUNDARY_ROWS_SAFE = 1;
/**
 * Apply one row's changed values to its live root. Returns false when the
 * row's structure no longer matches the plan, which the caller treats exactly
 * like a failed liveness check.
 */
export declare function applyRowValuePatch(root: Element, plan: PreparedRowPlan, values: any[], changedSlots: number, base?: number): boolean;
export declare class LoopRowCache {
    private loops;
    private enabled;
    /** Direct patching can be disabled independently of placeholder reuse. */
    private patchingEnabled;
    /** Owner-provided target resolution for the fused value lane. */
    private valuePatchSink;
    /** Direct row construction can fail closed without disabling row reuse. */
    private directBuildingEnabled;
    /** Detached rows waiting for their verified keep-run marker to be parsed. */
    private pendingDirectBuilds;
    /**
     * Per-loop child derivation shared by direct-built boundary-root rows. The
     * compiled template re-creates its descriptor literal every render, but a
     * loop id names one lexical loop of one component forever, so the record is
     * keyed here and deliberately survives the empty render that deletes the
     * loop's row state — that is exactly the churn cycle it exists to serve.
     */
    private directChildDerivations;
    /**
     * Parsed prototype + prepared plan per direct-build loop, surviving the
     * empty render exactly like the derivations above (same lifetime, same
     * clear/disable sites). Validated against the descriptor's prototype string
     * before reuse, so a stale entry can never build a wrong row.
     */
    private directPrototypes;
    /** Verified loop id -> detached rows, consumed by DomMorpher. */
    private preparedDirectMarkers;
    /**
     * Rows revived by the render being built, re-registered when
     * `takeDirectBuild` hands them to the morph — never earlier, so a render
     * that falls back after the revival pass leaves every parked id
     * unregistered exactly as the park left it.
     */
    private pendingReviveRegistrations;
    /** Plain component scripts temporarily made inert during live insertion. */
    private directScriptsToReactivate;
    /** Placeholders emitted during the render currently being built. */
    private emitted;
    /** Patches recorded by the render currently being built. */
    private pendingPatchGroups;
    /**
     * Set when a boundary-carrying loop's key sequence changed this render
     * (rows added, removed or reordered). The owning component uses it to run a
     * full nested-boundary bootstrap even though the emitted markup — mostly
     * placeholders — no longer reveals the boundaries to the string probes;
     * that pass is what destroys the instances of removed rows.
     */
    private structuralBoundaryChange;
    setValuePatchSink(sink: LoopValuePatchSink): void;
    /**
     * Permanently stops emitting placeholders for this component. Called when a
     * placeholder failed to resolve against the live DOM, which means the cache's
     * view of what is mounted has diverged from reality.
     */
    disable(): void;
    /**
     * Permanently stops the direct-patch lanes for this component, keeping
     * placeholder reuse alive. Called when a patch target could not be verified
     * against the live DOM.
     */
    disablePatching(): void;
    /** Permanently falls back to string-built first renders for this component. */
    disableDirectBuilding(): void;
    /** Drops remembered rows without disabling reuse (used when the DOM is replaced). */
    clear(): void;
    /**
     * Releases every parked generation this cache created. The park registry is
     * keyed by derivation, and both derivation maps may already be nulled by
     * the caller, so the drop walks the (at most a few entries) registry by
     * owner instead.
     */
    private dropParkedGenerations;
    beginRender(): void;
    /**
     * Verify every pending direct-build marker in a parsed render and associate
     * it with the detached rows it represents. The marker stays compact: the
     * keyed morpher consumes it and adopts the rows directly, avoiding a second
     * 1,000-node source indexing/morph pass on mount.
     */
    prepareDirectBuilds(root: DocumentFragment | Element): boolean;
    /** Whether this render produced detached rows that need script-stream alignment. */
    hasPendingDirectBuilds(): boolean;
    /** Consume the detached rows represented by one parsed build marker. */
    takeDirectBuild(marker: Element): Element[] | null;
    /** Every verified marker must have reached the keyed morph. */
    finishDirectBuilds(): boolean;
    /** Consumes the structural-change signal for the current render. */
    takeStructuralBoundaryChange(): boolean;
    getEmittedCount(): number;
    /**
     * Hands the patches recorded by the current render to the owning component
     * and clears them. The affected entries stay poisoned until
     * `commitPatches` confirms the patches reached the live DOM.
     */
    takePendingPatches(): LoopPatchGroup[] | null;
    /**
     * Marks a taken patch set as applied: entries poisoned at record time are
     * rewritten to the markup the live DOM now holds. Value patches keep the
     * poisoned sentinel, because no markup was built for them — the sentinel
     * guarantees the next structural render re-emits those rows in full instead
     * of trusting a string that no longer describes the DOM.
     */
    commitPatches(groups: LoopPatchGroup[]): void;
    /**
     * Joins one loop's rendered rows, substituting placeholders for rows that are
     * byte-identical to the ones this loop rendered last time, and recording
     * direct patches for changed rows when the key sequence is stable.
     *
     * `loopId` is -1 for loops the compiler decided cannot participate (nested
     * loops, whose ids are shared across every iteration of the outer loop, and
     * loop bodies that do not render exactly one root element per row).
     *
     * Callable in two shapes: the compiled-template shape passes the loop items
     * plus a row builder (and optionally a value function + row plan), while the
     * legacy shape passes prebuilt row strings and gets exactly the historical
     * placeholder behavior with no patch lanes.
     */
    render(loopId: number, items: any[], buildRow?: (item: any, index: number) => string, valuesFn?: LoopRowValuesFn, plan?: RowPlanDescriptor, flags?: number): string;
    /**
     * Opens a parked generation for a boundary-safe direct-build loop that is
     * rendering empty. Rows attach afterwards, during the owner's post-morph
     * child sweep: each destroyed flyweight row offers itself through its
     * shape's derivation (see `offerParkedFlyweightRow`), so only rows that
     * really were live flyweights at close can ever be parked. The value basis,
     * key order, and prototype identity are captured here, while the loop state
     * still exists.
     */
    private tryParkClosingLoop;
    /**
     * One-shot consumption of this loop's parked generation. Any non-empty
     * direct-build render takes it — used or not — so a parked set can never
     * outlive the reopen it was parked for.
     */
    private takeParkedGeneration;
    /**
     * Revive one parked row for `key`, or return null to build it fresh. The
     * checks mirror what a fresh mount at the same id would have re-proven: the
     * id must be unoccupied on BOTH the instance and state families (an
     * external registration or seeded state while parked invalidates the row —
     * the reclaim-probe contract, answered at revive time), and the element
     * must still be the detached, keyed, sidecar-carrying row the park
     * captured. Changed slots are patched against the parked value basis, so an
     * equal-props reopen writes nothing. The row's script deliberately does not
     * run here: revival is reuse, not remount — the same shipped semantics as a
     * keep-resolved row or a shallow-equal `refreshPropsFromParent`, which skip
     * the script for a live row with unchanged props. A props change is caught
     * by the owner's bootstrap refresh, which re-runs the script through the
     * normal path.
     */
    private tryReviveRow;
    /**
     * First-render lane for a plan-eligible keyed loop: parse one
     * compile-time prototype, clone it per row, and fill every dynamic slot plus
     * the root key. The rendered document receives one compact keep-run marker;
     * `prepareDirectBuilds` verifies that marker before `DomMorpher` adopts the
     * detached nodes.
     *
     * The lane deliberately admits only three-or-more rows with unique simple
     * primitive keys and primitive values. Any expression throw, unsupported
     * value, or structure mismatch returns null before live DOM is touched, so
     * the caller rebuilds every row through the existing per-expression string
     * pipeline in the same render.
     */
    private tryDirectBuild;
    /**
     * The value lane: evaluate the plan's expressions per row, compare with the
     * previous render's values, and write the changed slots straight to the live
     * keyed nodes in the same pass — every row is stood in for by a placeholder,
     * so the emitted document string stays byte-stable. Returns null whenever
     * anything disqualifies this render — a changed or moved key, a non-primitive
     * value — in which case the caller falls back to building row strings.
     *
     * Failure handling is fused too: a target that fails verification (missing
     * container, dead row, structure mismatch) disables patching and returns
     * null. Rows patched earlier in the pass were poisoned at write time, so the
     * string-lane fallback re-emits them in full and the keyed morph repaints
     * everything from real markup — the same recovery the two-phase path reached
     * through a second render.
     */
    private tryValueLane;
    /**
     * A fused value patch failed verification: stop patching, let the owner
     * report it, and fall back to the string lane within this same render.
     * Already-patched rows are poisoned, so they re-emit as full markup and the
     * keyed morph repaints them.
     */
    private abandonValuePatching;
    private poisonEntryAt;
    /** The all-keep emission for a stable key sequence. */
    private buildKeepEmission;
    private renderRows;
    /**
     * Seed the value-lane compare basis after a quiet (patch-qualified) render.
     * Structural renders skip seeding so a reorder-heavy loop never pays a second
     * expression evaluation per row; the lane simply re-arms on the next quiet
     * render.
     */
    private seedValueLane;
}
export declare function isLoopKeepPlaceholder(node: Node): boolean;
/** Returns the packed key list of a run marker, or null for anything else. */
export declare function readLoopKeepRun(node: Node): string[] | null;
export {};
