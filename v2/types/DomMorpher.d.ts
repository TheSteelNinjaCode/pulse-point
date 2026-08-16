export type DomMorpherOptions = {
    root: Element;
    /**
     * Called once per `<pp-keep>` placeholder the keyed pass resolves against a
     * live node. The owning component compares this against the number of
     * placeholders its loops emitted; a shortfall means the cache and the DOM
     * disagreed, and reuse is abandoned.
     */
    onKeepResolved?: () => void;
    /**
     * Called once per boundary whose body the owner elided and which was matched
     * to a live nested boundary. The owner compares this against the number of
     * stubs it emitted; a shortfall means a child's subtree is not on the page.
     */
    onBoundaryKeepResolved?: () => void;
    /**
     * Whether the render being morphed emitted any `<... pp-keep>` placeholders.
     * Checked once per keyed pass so the common placeholder-free render never pays
     * for a per-node attribute lookup.
     */
    hasKeepPlaceholders?: () => boolean;
    collectEventElements: (element: Element) => void;
    hasEventAttributes: (element: Element) => boolean;
    syncAttributes: (target: Element, source: Element) => void;
    syncNestedBoundaryAttributes: (target: Element, source: Element) => boolean;
    /**
     * Whether this render is the owner's recovery from a failed content reuse.
     * Only then may the morph hand full markup to a live-but-empty boundary; see
     * the boundary branch of `morphCompatibleElement`.
     */
    shouldForceChildRefresh?: () => boolean;
    /**
     * Whether byte-equal element subtrees may be skipped wholesale this pass.
     * Only true when the live DOM is the COMMITTED output of a previous render:
     * bound event handlers have their attributes stripped from live elements, so
     * after a commit a byte-equal subtree is provably handler-free and needs no
     * event collection. On the first morph after mount (or a forced re-render
     * from scratch) the live DOM is the materialized template, where an unbound
     * `onclick="{...}"` is byte-identical to the render output and skipping it
     * would leave the handler unbound forever.
     */
    canSkipEqualSubtrees?: () => boolean;
    /**
     * Consume detached rows for a verified first-render loop marker. Null means
     * this is an ordinary keep-run marker from a later render.
     */
    takeDirectBuild?: (marker: Element) => Element[] | null;
};
/**
 * A keyed-loop container carrying its lazily built key → row-node index, used
 * by the direct row-patch path to find a patch target without walking the
 * whole child list. The keyed morph pass invalidates it whenever it
 * restructures the container.
 */
export type LoopContainerElement = Element & {
    __ppLoopKeyIndex?: Map<string, Element>;
};
export declare class DomMorpher {
    private readonly options;
    constructor(options: DomMorpherOptions);
    /**
     * Morph one patched loop row in place. Returns the node that now carries the
     * row: the target itself in the common case, or its replacement when the row
     * root's tag changed.
     */
    morphPatchedRow(container: Element, target: Element, source: Element): Element;
    morphChildren(target: Element, source: DocumentFragment | Element): void;
    private morphCompatibleElement;
    private hasKeyedDirectChildren;
    private getNodeKey;
    private getElementKey;
    /**
     * Reads the text of a node already known to have no element children.
     *
     * `textContent` walks the subtree and builds a fresh concatenated string on
     * every access. The dominant list-row shape is a single text child, where the
     * value can be read directly with no walk and no allocation.
     */
    private readLeafText;
    /**
     * Compatibility check for a candidate pulled from the bucket of its own key.
     * The key equality is already established by that lookup, so this skips the
     * two `getAttribute("key")` reads `areNodesCompatible` would repeat.
     */
    private areKeyedNodesCompatible;
    private areNodesCompatible;
    private morphKeyedChildren;
    private getUnkeyedNodeSignature;
    private morphNode;
}
