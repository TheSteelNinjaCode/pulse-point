export type TraversalCache = {
    ownedElements: HTMLElement[];
    childBoundaries: HTMLElement[];
    managedInputs: HTMLElement[];
    refElements: HTMLElement[];
};
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
    hasEventAttributes(el: Element): boolean;
    isManagedEventElement(element: HTMLElement): boolean;
    private isElementOwnedByTree;
}
