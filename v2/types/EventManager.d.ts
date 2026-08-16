export declare class EventManager {
    private static readonly MAX_HANDLER_CACHE_SIZE;
    private root;
    private getScope;
    private canBindElement;
    private handlerCache;
    private cachedRootElementCount;
    private static readonly LARGE_INPUT_RENDER_DEFER_THRESHOLD;
    constructor(root: HTMLElement, scopeProvider: () => Record<string, any>, canBindElement: (element: HTMLElement) => boolean);
    clearCache(): void;
    /**
     * Returns true when a normal one-to-one DOM event is already bound with the
     * same handler and owner. Remapped events (for example date input ->
     * change/blur) deliberately fall back to the regular binding path.
     */
    static hasSameDirectBoundHandler(element: Element, attributeName: string, rawCode: string, eventOwner: string | null): boolean;
    private static normalizeHandlerCode;
    private static prepareHandler;
    invalidateElementCountCache(): void;
    private resolveEventOwnerScope;
    bindEvents(eventElements: Set<HTMLElement>): void;
    private bindElementEvents;
    /**
     * Removes listeners that were bound from `on*` attributes which no longer
     * exist on the freshly rendered source element. Without this, an unkeyed
     * morph that reuses a DOM node keeps the previous handler attached forever.
     */
    static unbindRemovedEventHandlers(target: Element, source: Element): void;
    private getNativeEventNames;
    private runWithNativeInputRenderPolicy;
    private shouldDeferNativeInputRender;
    private ensureDeferredNativeInputBlurFlush;
    private shouldPreserveNativeEdit;
    private executeHandler;
    private executeHandlerWithScope;
    private getCompiledHandler;
}
