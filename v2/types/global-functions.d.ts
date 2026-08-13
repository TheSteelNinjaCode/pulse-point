export type GlobalSingletonOptions = {
    cache?: boolean;
    configurable?: boolean;
    resetOnNull?: boolean;
};
export declare function createGlobalSingleton<T>(name: string, SingletonClass: {
    getInstance(): T;
} | T, target?: any, immediateInit?: boolean, options?: GlobalSingletonOptions): void;
