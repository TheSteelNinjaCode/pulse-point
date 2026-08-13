import { type ScopeBundle } from "./utils.js";
export type CachedFunctionResolver = (cache: Map<string, Function>, expr: string, keys: string[], keySig: string, maxSize: number) => Function;
export declare class PropBindingManager {
    private readonly componentId;
    private readonly interpolationCache;
    private readonly scopeEvalCache;
    private readonly propEvalCache;
    private readonly getCachedFunction;
    constructor(componentId: string, interpolationCache: Map<string, Function>, scopeEvalCache: Map<string, Function>, propEvalCache: Map<string, Function>, getCachedFunction: CachedFunctionResolver);
    interpolateAttrString(raw: string, scope: Record<string, any>, bundle?: ScopeBundle): string;
    /**
     * Commit a nested boundary's bound root attributes for one render.
     *
     * Reads each expression from the boundary's captured raw bindings rather than
     * from the live attribute, which is what lets the live attribute hold the
     * EVALUATED value continuously. The previous arrangement had to put the raw
     * `{expr}` text back on the element before every evaluation so this pass could
     * find it again, so each binding was written twice per render (once raw, once
     * evaluated) whether or not its value had changed.
     *
     * Every write is now conditional on the committed value actually differing, so
     * a boundary whose props did not change performs no DOM writes at all.
     */
    applyBoundaryBindings(el: HTMLElement, rawBindings: Record<string, string>, bundle: ScopeBundle, shouldSkipAttr?: (name: string) => boolean): void;
    /**
     * The value one bound boundary attribute should carry after this render, or
     * null when it should be absent.
     *
     * Objects, functions and unparseable expressions keep the raw binding text:
     * they cannot be serialized into an attribute, and `computePropsFromAttributes`
     * re-evaluates them from the same raw text when it builds the child's props.
     */
    private resolveBoundaryAttributeValue;
    computePropsFromAttributes(el: Element, parentId: string | null, parentBundle?: ScopeBundle): Record<string, any>;
}
