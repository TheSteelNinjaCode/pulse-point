export declare class EventManager {
    private root;
    private getScope;
    private handlerCache;
    constructor(root: HTMLElement, scopeProvider: () => Record<string, any>);
    clearCache(): void;
    bindEvents(eventElements?: Set<HTMLElement>): void;
    private bindElementEvents;
    private fallbackCollectEventElements;
    private executeHandler;
    private executeHandlerWithScope;
    private getCompiledHandler;
}
