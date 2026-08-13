export type RefBinding = {
    element: HTMLElement;
    value: any;
    cleanup?: (() => void) | undefined;
};
export type RefBindingKind = "captured" | "plain";
export type RefBindingElementState = HTMLElement & {
    __ppCapturedRefBindingId?: string;
    __ppPlainRefBindingId?: string;
};
export declare class RefBindingManager {
    private readonly componentId;
    private bindingSeq;
    private activeBindings;
    constructor(componentId: string);
    hasActiveBindings(): boolean;
    ensureBindingId(elementState: RefBindingElementState, kind: RefBindingKind): string;
    commit(nextBindings: Map<string, RefBinding>): void;
    clearAll(): void;
    private attachValue;
    private detachValue;
    private updateValue;
}
