/**
 * The component boundary: what marks a run of DOM as one component.
 *
 * Today a boundary is an element carrying `pp-component="id"`, and every
 * subsystem that needs to recognize one — mount discovery, event ownership,
 * scope resolution, traversal stops, morph guards — asks this module instead
 * of reading the attribute inline. Concentrating recognition here is what
 * lets a second boundary shape (a comment-marker *range* around sibling
 * nodes, the fragment case) plug in without revisiting every call site.
 *
 * The `ComponentBoundary` interface is the instance-side half: the handle a
 * `Component` holds on its own boundary. `ElementBoundary` is the one
 * implementation today; a `RangeBoundary` implements the same surface when
 * range boundaries land. Operations that only make sense on an element
 * boundary — reading the root's own attributes, form-control behavior of the
 * root itself — go through `host`, which a range boundary answers with
 * `null`.
 */
export declare const BOUNDARY_ATTR = "pp-component";
/** A CSS selector matching any element boundary. */
export declare const BOUNDARY_SELECTOR = "[pp-component]";
export type BoundaryElement = HTMLElement | SVGElement;
/** Is this node an element boundary root? */
export declare function isBoundaryElement(node: Node | null): node is BoundaryElement;
/** The boundary id an element carries, or `null` when it is not a boundary. */
export declare function boundaryIdOf(element: Element): string | null;
export declare function setBoundaryIdOf(element: Element, id: string): void;
/**
 * The nearest boundary at or above `element` — the boundary that owns it,
 * counting the element itself when it is one.
 */
export declare function closestBoundary(element: Element): BoundaryElement | null;
/**
 * The nearest boundary strictly above `element`: the owner of a boundary
 * root is its parent boundary, not itself.
 */
export declare function enclosingBoundary(element: Element): BoundaryElement | null;
/**
 * The top-level boundaries under `root`: every boundary whose parent chain
 * holds no other boundary. Mount starts one `Component` per entry; the rest
 * of the tree is reached through nested-boundary handling.
 */
export declare function topLevelBoundaries(root: ParentNode): BoundaryElement[];
/**
 * The comment-marker wire for a fragment boundary.
 *
 * A server frames a run of siblings as one boundary with a comment pair:
 *
 * ```html
 * <!--pp:quick_tally_7efd1e81--><button>…</button><p>0</p><!--/pp-->
 * ```
 *
 * Comments are legal in every content context — `<tbody>`, `<ul>`, `<select>`
 * — so the served markup stays valid where a wrapper element would be
 * foster-parented out by the HTML parser. The id after `pp:` may be empty
 * for a fragment that is grouping only and owns no identity.
 *
 * At mount, [`materializeRangeBoundaries`] converts each pair into a live
 * `<pp-fragment style="display:contents">` element carrying the id, which
 * the rest of the runtime handles as an ordinary element boundary:
 * `display: contents` keeps the wrapper out of layout while identity,
 * scope, events and re-renders anchor to it. A close marker pairs with the
 * nearest unclosed open among its preceding siblings, so fragments nest.
 */
export declare const RANGE_OPEN_PREFIX = "pp:";
export declare const RANGE_CLOSE = "/pp";
/** The element a materialized fragment range renders as. */
export declare const FRAGMENT_TAG = "pp-fragment";
/**
 * Turn every comment-marker fragment pair under `root` into a live
 * [`FRAGMENT_TAG`] boundary element, outermost first — an inner pair moves
 * into its new wrapper and is picked up on the next scan. An open marker
 * with no sibling close is left standing: it is an ordinary comment as far
 * as the page is concerned.
 */
export declare function materializeRangeBoundaries(root: Node): void;
/**
 * The handle a `Component` holds on its own boundary.
 *
 * Everything a component does to "its own DOM" that has to work for both
 * boundary shapes goes through here: identity, content read, and the morph
 * target. What stays out is anything inherently about a root *element* —
 * those callers read `host` and skip when it is `null`.
 */
export interface ComponentBoundary {
    /**
     * The root element, when the boundary is one — and `null` for a range,
     * which has markers and content but no element of its own.
     */
    readonly host: BoundaryElement | null;
    getId(): string | null;
    setId(id: string): void;
    /** The boundary's current content, serialized — the live template. */
    readContent(): string;
    /**
     * The parent node the boundary's content lives in. For an element
     * boundary, the element itself; for a range, the parent the markers sit
     * in. This is where subtree queries and traversals start.
     */
    readonly contentRoot: ParentNode & Node;
    /** The boundary that encloses this one, by DOM position. */
    parentBoundaryElement(): BoundaryElement | null;
}
/** The element-anchored boundary: `<section pp-component="page_x">…</section>`. */
export declare class ElementBoundary implements ComponentBoundary {
    readonly host: BoundaryElement;
    constructor(host: BoundaryElement);
    getId(): string | null;
    setId(id: string): void;
    readContent(): string;
    get contentRoot(): ParentNode & Node;
    parentBoundaryElement(): BoundaryElement | null;
}
