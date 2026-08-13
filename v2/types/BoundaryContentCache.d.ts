/**
 * Content reuse for nested component boundaries.
 *
 * A composition-heavy page is not one component with a lot of markup; it is a
 * shell that assembles many small `x-*` boundaries, each owning its own script,
 * props and hooks. The compiler already masks such a boundary out of the parent
 * template (`maskComplexComponents`) and restores its markup verbatim on every
 * parent render, because a child's internals are the child's scope, not the
 * parent's. That restored markup is therefore a compile-time CONSTANT.
 *
 * The parent still paid for it on every render: the constant was spliced back
 * into the rendered string, parsed into a throwaway DOM, and then discarded --
 * `DomMorpher` stops at a nested boundary and never descends into its children.
 * Measured on a shell of 100 small children, re-parsing markup the morph pass
 * refuses to look at was ~74% of the parent's render time.
 *
 * So once a boundary is mounted, the parent emits its opening tag with an empty
 * body instead: the child's live subtree stays exactly where it is, and the
 * boundary's own attributes -- which carry the props -- are still emitted and
 * still reconciled normally.
 *
 * The reuse is conservative in the same way loop row reuse is:
 *
 * - A stub is emitted only when the previous *committed* render emitted this
 *   same boundary. A boundary appearing for the first time (or reappearing
 *   after a conditional hid it) always renders its full markup, because the
 *   child component bootstraps from the markup the parent emitted.
 * - Boundaries whose content the parent is responsible for refreshing are never
 *   stubbed: owned/slot content, context provider boundaries, and parent-owned
 *   ref captures. That eligibility is decided once, at compile time.
 * - Every stub emitted must be resolved by the morph against a live boundary.
 *   The count is compared after each render, and a mismatch disables reuse for
 *   the component and re-renders it from full markup rather than trusting a
 *   cache that has diverged from the DOM.
 */
/**
 * Marks an opening tag whose body was elided. It is stripped from the source
 * element before attribute syncing, so it never reaches the live DOM or the
 * child's props.
 */
export declare const BOUNDARY_KEEP_CONTENT_ATTR = "pp-keep-content";
export declare function isBoundaryContentStubbable(innerHtml: string): boolean;
export declare class BoundaryContentCache {
    private enabled;
    /** Boundary keys emitted by the last render that reached the DOM. */
    private committedKeys;
    /** Boundary keys emitted by the render currently being built. */
    private renderKeys;
    /** Stubs emitted during the render currently being built. */
    private emitted;
    beginRender(): void;
    getEmittedCount(): number;
    /**
     * Promotes the keys emitted by the render that just committed. Called on both
     * commit paths -- a full DOM diff and the byte-identical skip -- because both
     * leave the live boundaries in place.
     */
    commit(): void;
    /**
     * Permanently stops stubbing for this component. Called when an emitted stub
     * could not be resolved against a live boundary, which means the cache's view
     * of what is mounted no longer matches the DOM.
     */
    disable(): void;
    isEnabled(): boolean;
    /**
     * Returns the markup to emit for one masked boundary: its stub when the
     * boundary is known to be mounted from the previous committed render, and its
     * full markup otherwise.
     */
    resolve(key: string, full: string, stub: string | null): string;
}
