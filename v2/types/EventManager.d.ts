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
    /**
     * A boundary root whose `pp-event-owner` names its own boundary handles its
     * own events (`<form pp-component="f" pp-event-owner="f" onsubmit=…>`): the
     * owner is this element's instance. Servers that name boundaries per
     * component type (Rahti) give same-type siblings one id, and the runtime
     * derives a distinct one for each later sibling, so resolving the bare id
     * would pick whichever instance holds it. Any other owner (slot content's)
     * is left to ancestor resolution.
     */
    private static ownInstanceId;
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
    /**
     * Whether pending deferred input renders are committed before this handler.
     *
     * Not for events that carry their control's own new value (`input`, `change`,
     * the `blur` date-like `oninput` maps to, a checkbox or radio `click`): the
     * browser has already changed the control, and committing a render first
     * would write the stale controlled value back before the handler reads it.
     */
    private static flushesDeferredInputBefore;
    private shouldDeferNativeInputRender;
    private ensureDeferredNativeInputBlurFlush;
    private shouldPreserveNativeEdit;
    private executeHandler;
    private executeHandlerWithScope;
    private getCompiledHandler;
}
