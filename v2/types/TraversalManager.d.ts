export type TraversalCache = {
    childBoundaries: HTMLElement[];
    managedInputs: HTMLElement[];
    refElements: HTMLElement[];
};
/** Stateless root/element probe; does not require a traversal cache manager. */
export declare function hasNativeEventAttributes(el: Element): boolean;
export declare class TraversalManager {
    private readonly getRoot;
    private readonly getPortalElements;
    private readonly refCaptureIdsByElement;
    private readonly refExprsByElement;
    private cache;
    constructor(getRoot: () => HTMLElement | SVGElement, getPortalElements: () => Iterable<HTMLElement>, refCaptureIdsByElement: WeakMap<HTMLElement, string>, refExprsByElement: WeakMap<HTMLElement, string>);
    invalidate(): void;
    getCache(): TraversalCache;
    collectManagedInputs(): HTMLElement[];
    collectEventElements(root: Element, target: Set<HTMLElement>): void;
    isManagedEventElement(element: HTMLElement): boolean;
    private isElementOwnedByTree;
}
