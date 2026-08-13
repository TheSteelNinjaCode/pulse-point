export declare class AttributeSyncManager {
    private readonly refCaptureIdsByElement;
    private readonly refExprsByElement;
    constructor(refCaptureIdsByElement: WeakMap<HTMLElement, string>, refExprsByElement: WeakMap<HTMLElement, string>);
    isEffectManagedAttr(name: string): boolean;
    isEffectManagedSurfaceElement(target: Element, source?: Element): boolean;
    /**
     * `skipAttrs` names attributes the caller owns and will commit itself. It is
     * used for a nested boundary's bound root attributes, where the live element
     * holds the evaluated value and the incoming source holds the authored
     * expression: syncing those would overwrite the value with its own source
     * text on every render.
     */
    syncAttributes(target: Element, source: Element, skipEffectAttrs?: boolean, preserveComponentId?: boolean, skipAttrs?: Record<string, string>): void;
}
