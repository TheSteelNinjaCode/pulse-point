import type { ContextToken } from "./ComponentRuntime.js";
export declare class ComponentRegistry {
    private static states;
    private static scopes;
    private static scopeVersions;
    private static scopeVersionCounter;
    private static topologyVersion;
    private static mergedScopeCache;
    private static instances;
    private static parents;
    private static childrenByParent;
    private static templates;
    private static ownedTemplateData;
    private static contextValues;
    private static consumerContexts;
    private static contextConsumers;
    static saveState(componentId: string, hooks: any[]): void;
    static getState(componentId: string): any[] | undefined;
    static removeState(componentId: string): void;
    static saveScope(componentId: string, scope: Record<string, any>): void;
    static getScope(componentId: string): Record<string, any> | undefined;
    static getRootAncestor(componentId: string | null): string | null;
    static resolveComponentId(componentId: string | null, relativeToId?: string | null): string | null;
    static getResolvedScope(componentId: string | null, relativeToId?: string | null): Record<string, any> | undefined;
    /**
     * Live (unmemoized) ancestor merge. Event dispatch must observe in-place
     * mutations of a saved scope object, which the render-path memo below
     * deliberately snapshots away; dispatch frequency makes the merge cost
     * irrelevant there.
     */
    static getLiveResolvedScopeWithAncestors(componentId: string | null, relativeToId?: string | null): Record<string, any> | undefined;
    static getResolvedScopeWithAncestors(componentId: string | null, relativeToId?: string | null): Record<string, any> | undefined;
    static removeScope(componentId: string): void;
    static registerInstance(id: string, instance: any): void;
    static getInstance(componentId: string): any | undefined;
    static removeInstance(componentId: string): void;
    static saveParent(componentId: string, parentId: string | null): void;
    static getParent(componentId: string): string | null | undefined;
    static removeParent(componentId: string): void;
    static getDescendantIds(componentId: string): string[];
    static saveContextValues(componentId: string, values: Map<ContextToken<any>, any>): ContextToken<any>[];
    static resolveContext<T>(startComponentId: string | null, context: ContextToken<T>): {
        providerId: string | null;
        value: T;
    };
    static updateContextDependencies(componentId: string, contexts: Iterable<ContextToken<any>>): void;
    static getConsumersForContextsInSubtree(componentId: string, contexts: Iterable<ContextToken<any>>): Set<string>;
    static removeContextTracking(componentId: string): Set<string>;
    static saveTemplate(componentId: string, template: string): void;
    static getTemplate(componentId: string): string | undefined;
    static removeTemplate(componentId: string): void;
    static saveOwnedTemplates(componentId: string, data: Map<string, {
        ownerId: string;
        content: string;
        contextTag: string | null;
    }>): void;
    static getOwnedTemplates(componentId: string): Map<string, {
        ownerId: string;
        content: string;
        contextTag: string | null;
    }> | undefined;
    static removeOwnedTemplates(componentId: string): void;
    static clear(): void;
    static destroyAll(): void;
    static getStats(): {
        states: number;
        scopes: number;
        instances: number;
        parents: number;
        templates: number;
        ownedData: number;
        contextValues: number;
        contextConsumers: number;
    };
    private static addContextConsumer;
    private static removeContextConsumer;
    private static isAncestor;
}
