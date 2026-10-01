/**
 * Keeps unevaluated `{...}` URL attributes from reaching the browser's
 * resource machinery when an inert server template is materialized.
 *
 * A component's template source is its live `innerHTML`, so materialization
 * must move the raw markup into the document before the component compiles
 * it. The moment an `<img srcset="{a ? '' : b}">` is connected, the browser
 * parses the value as an image candidate list and logs "Failed parsing
 * 'srcset' attribute value since it has an unknown descriptor" / "Dropped
 * srcset candidate" — and a raw `src`/`poster` can start a request for the
 * placeholder text. The template wrapper exists precisely to prevent that.
 *
 * Such attributes are parked under a prefixed name the browser ignores while
 * they sit in the live DOM (the same idea as `neutralizeComponentScripts`).
 * When a component captures its template it renames them back in the
 * captured string (`restoreInertUrlAttributes`) and drops the parked copies
 * from its own elements (`clearParkedUrlAttributes`); its first render then
 * commits the evaluated real attributes.
 */
export declare const INERT_URL_ATTR_PREFIX = "pp-inert-";
export declare function parkInertUrlAttributes(root: DocumentFragment | Element): void;
/** Maps parked attribute names in serialized markup back to the real ones. */
export declare function restoreInertUrlAttributes(html: string): string;
/**
 * Removes parked attributes from the elements a boundary renders itself. The
 * captured template already holds their values, and the render writes the
 * evaluated real attribute. Elements INSIDE a nested boundary keep theirs:
 * that boundary captures its own template from the live DOM when it mounts.
 * (A nested boundary's root attributes belong to this scope and are cleared.)
 */
export declare function clearParkedUrlAttributes(host: Element, isNestedBoundary: (el: Element) => boolean): void;
