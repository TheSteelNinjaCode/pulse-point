type DefaultValueElement = (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) & {
    __ppDefaultValueCaptureId?: string;
    __ppResolvedDefaultValue?: any;
    __ppValueControlMode?: "controlled" | "uncontrolled";
    __ppWarnedValueControlModeSwitch?: boolean;
};
type DefaultCheckedElement = HTMLInputElement & {
    __ppDefaultCheckedCaptureId?: string;
    __ppResolvedDefaultChecked?: any;
    __ppCheckedControlMode?: "controlled" | "uncontrolled";
    __ppWarnedCheckedControlModeSwitch?: boolean;
};
export declare class FormControlManager {
    private registeredResetForms;
    applyControlledSelectValue(select: HTMLSelectElement, value: any): void;
    applyControlledInputValue(input: HTMLInputElement, value: any): void;
    bindControlledSelectValues(inputs: HTMLElement[], selectValueStore: Map<string, any>): void;
    bindControlledInputValues(inputs: HTMLElement[], inputValueStore: Map<string, any>): void;
    bindControlledCheckedValues(inputs: HTMLElement[], checkedValueStore: Map<string, any>): void;
    applyUncontrolledDefaultValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: any): void;
    applyUncontrolledDefaultChecked(input: HTMLInputElement, value: any): void;
    restoreUncontrolledSelectState(select: HTMLSelectElement): void;
    isUncontrolledResetManagedElement(element: HTMLElement): boolean;
    syncUncontrolledFormResets(componentId: string, inputs: HTMLElement[], getCurrentInputs: () => HTMLElement[]): void;
    clearResetHandlers(componentId: string): void;
    restoreUncontrolledFormDefaults(form: HTMLFormElement, inputs: HTMLElement[]): void;
    resolveDefaultValueBinding(element: DefaultValueElement, defaultValueStore: Map<string, any>): any;
    resolveDefaultCheckedBinding(input: DefaultCheckedElement, defaultCheckedStore: Map<string, any>): any;
    materializeNestedBoundaryFormDefaults(element: HTMLElement, stores: {
        inputValueStore: Map<string, any>;
        checkedValueStore: Map<string, any>;
        defaultValueStore: Map<string, any>;
        defaultCheckedStore: Map<string, any>;
    }): void;
    normalizeControlledSelectValues(value: any): string[];
    private applyUncontrolledDefaultSelectValue;
    private resolveControlledSelectCaptureId;
    private resolveControlledInputValue;
    private resolveControlledCheckedValue;
    private registerResetHandler;
    private unregisterResetHandler;
    private normalizeDefaultCheckedValue;
    private shouldDeferFocusedDateLikeInputValue;
    private shouldDeferActiveNativeTextInputValue;
    private deferFocusedControlledInputValue;
}
export {};
