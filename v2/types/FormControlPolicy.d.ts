export type FormControlMode = "controlled" | "uncontrolled";
export declare function isDateLikeInput(input: HTMLInputElement): boolean;
export declare function supportsTextSelection(element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement;
export declare function isValueEditingControl(element: HTMLElement): boolean;
export declare function trackValueControlMode(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, nextMode: FormControlMode): void;
export declare function trackCheckedControlMode(input: HTMLInputElement, nextMode: FormControlMode): void;
