import { ComponentManager } from "./component-manager.js";
import { DOMBindingManager } from "./dom-binding-manager.js";
import { PP, StateManager } from "./pp-reactive-v1.js";
export interface Portal {
    id: string;
    content: HTMLElement | DocumentFragment | string;
    container: Element;
    component: string;
    cleanup?: () => void;
    renderedContent?: Element;
}
export interface PortalOptions {
    key?: string;
    onMount?: (container: Element) => void;
    onUnmount?: (container: Element) => void;
}
export declare class PortalManager {
    private portals;
    private portalCounter;
    private componentManager?;
    private domBindingManager?;
    private cleanupObserver;
    private stateManager?;
    private pphpInstance?;
    constructor();
    setDependencies(componentManager: ComponentManager, domBindingManager: DOMBindingManager, stateManager: StateManager, pphpInstance?: PP): void;
    createPortal(content: HTMLElement | DocumentFragment | string, container: Element | string, options?: PortalOptions): string;
    private renderPortalWithHydration;
    private renderPortal;
    removePortal(portalId: string): boolean;
    private cleanupPortalElement;
    updatePortal(portalId: string, content: HTMLElement | DocumentFragment | string, options?: PortalOptions): boolean;
    getPortal(portalId: string): Portal | undefined;
    hasPortal(portalId: string): boolean;
    getAllPortals(): Portal[];
    private handleMutations;
    destroy(): void;
}
