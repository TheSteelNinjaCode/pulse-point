export type FocusSnapshot = {
    element: HTMLElement | null;
    index: number;
    selectionStart: number | null;
    selectionEnd: number | null;
} | null;
export declare class FocusManager {
    private readonly getRoot;
    private readonly containsPortalElement;
    private readonly collectManagedInputs;
    private readonly isDateLikeInput;
    constructor(getRoot: () => HTMLElement | SVGElement, containsPortalElement: (element: Element) => boolean, collectManagedInputs: () => HTMLElement[], isDateLikeInput: (element: HTMLInputElement) => boolean);
    save(managedInputs?: HTMLElement[]): FocusSnapshot;
    restore(snapshot: FocusSnapshot, managedInputs?: HTMLElement[]): void;
    private isTextSelectionControl;
    private getTextSelectionState;
}
