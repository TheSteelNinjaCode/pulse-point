import type { PortalRegistration } from "./HooksSystem.js";
export interface TrackedPortal {
    element: HTMLElement;
    placeholder: Comment;
    target: Element;
}
export declare class PortalManager {
    private readonly componentId;
    private trackedPortals;
    constructor(componentId: string);
    get size(): number;
    has(element: HTMLElement): boolean;
    get(element: HTMLElement): TrackedPortal | undefined;
    getPlaceholderText(element: HTMLElement): string;
    apply(registrations: PortalRegistration[]): boolean;
    replaceElement(previousElement: HTMLElement, nextElement: HTMLElement): void;
    contains(element: Element): boolean;
    elements(): HTMLElement[];
    values(): TrackedPortal[];
    destroyAll(): void;
}
