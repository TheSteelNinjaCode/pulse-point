import type { RefObject, PortalInfo } from "./HooksSystem.js";
export type ComponentHooksAPI = {
    state<T>(initial: T): [T, (updater: T | ((prev: T) => T)) => void];
    effect(cb: () => void | (() => void) | Promise<void>, deps: any[]): void;
    layoutEffect(cb: () => void | (() => void) | Promise<void>, deps: any[]): void;
    ref<T>(initialValue?: T | null): RefObject<T>;
    memo<T>(factory: () => T, deps: any[]): T;
    callback<T extends (...args: any[]) => any>(cb: T, deps: any[]): T;
    reducer<S, A>(reducer: (state: S, action: A) => S, initial: S): [S, (action: A) => void];
    portal<T extends HTMLElement>(ref: RefObject<T>, target?: Element | null): PortalInfo;
    props: any;
};
export type ComponentRuntime = ComponentHooksAPI & Record<string, any>;
