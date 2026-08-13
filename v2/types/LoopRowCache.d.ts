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
 * Reuse is deliberately conservative. A row participates only when it is a
 * single element carrying a non-empty `key`, and only when its markup contains
 * no nested runtime structure whose bindings the morph pass is responsible for
 * refreshing. Anything else renders normally.
 */
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
export declare class LoopRowCache {
    private loops;
    private enabled;
    /** Placeholders emitted during the render currently being built. */
    private emitted;
    /**
     * Permanently stops emitting placeholders for this component. Called when a
     * placeholder failed to resolve against the live DOM, which means the cache's
     * view of what is mounted has diverged from reality.
     */
    disable(): void;
    /** Drops remembered rows without disabling reuse (used when the DOM is replaced). */
    clear(): void;
    beginRender(): void;
    getEmittedCount(): number;
    /**
     * Joins one loop's rendered rows, substituting placeholders for rows that are
     * byte-identical to the ones this loop rendered last time.
     *
     * `loopId` is -1 for loops the compiler decided cannot participate (nested
     * loops, whose ids are shared across every iteration of the outer loop, and
     * loop bodies that do not render exactly one root element per row).
     */
    render(loopId: number, rows: string[]): string;
}
export declare function isLoopKeepPlaceholder(node: Node): boolean;
/** Returns the packed key list of a run marker, or null for anything else. */
export declare function readLoopKeepRun(node: Node): string[] | null;
