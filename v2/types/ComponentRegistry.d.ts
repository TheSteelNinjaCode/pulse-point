export declare class ComponentRegistry {
    private static states;
    private static scopes;
    private static instances;
    private static templates;
    private static ownedTemplateData;
    static saveState(componentId: string, hooks: any[]): void;
    static getState(componentId: string): any[] | undefined;
    static removeState(componentId: string): void;
    static saveScope(componentId: string, scope: Record<string, any>): void;
    static getScope(componentId: string): Record<string, any> | undefined;
    static removeScope(componentId: string): void;
    static registerInstance(id: string, instance: any): void;
    static getInstance(componentId: string): any | undefined;
    static removeInstance(componentId: string): void;
    static saveTemplate(componentId: string, template: string): void;
    static getTemplate(componentId: string): string | undefined;
    static saveOwnedTemplates(componentId: string, data: Map<string, {
        ownerId: string;
        content: string;
    }>): void;
    static getOwnedTemplates(componentId: string): Map<string, {
        ownerId: string;
        content: string;
    }> | undefined;
    static clear(): void;
    static getStats(): {
        states: number;
        scopes: number;
        instances: number;
        templates: number;
        ownedData: number;
    };
}
