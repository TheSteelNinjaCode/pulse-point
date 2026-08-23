export type FormControlMode = "controlled" | "uncontrolled";
export declare function isDateLikeInput(input: HTMLInputElement): boolean;
export declare function supportsTextSelection(element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement;
export declare function isValueEditingControl(element: HTMLElement): boolean;
export declare function trackValueControlMode(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, nextMode: FormControlMode): void;
export declare function trackCheckedControlMode(input: HTMLInputElement, nextMode: FormControlMode): void;
/**
 * Drive a controlled checkbox or radio from state, property included.
 *
 * The `checked` content attribute is only a *seed*: it initializes
 * `defaultChecked`, and after parse the `checked` IDL property moves
 * independently of it — a user's click changes the property and leaves the
 * attribute untouched. So a render that writes the attribute alone leaves the
 * box painted however the user last left it, whatever the state says. The
 * property is what the browser paints, and this is the only place that decides
 * it.
 *
 * Call it from every lane that writes the attribute, in *both* directions. An
 * add-only property write is the shape this used to have, and it made ticking
 * from state work while unticking silently did not.
 *
 * Tracking is unconditional on purpose: reaching here at all is what makes the
 * element controlled, and it is `trackCheckedControlMode` that warns when an
 * author has mixed a `checked` binding with an uncontrolled `defaultChecked`.
 * Guarding the whole function on `__ppHasUncontrolledDefaultChecked` would
 * silence that warning. Callers that must not disturb an uncontrolled box skip
 * this function instead — see the removal branch in `AttributeSyncManager`.
 */
export declare function applyControlledChecked(input: HTMLInputElement, nextChecked: boolean): void;
