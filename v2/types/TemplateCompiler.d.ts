export declare class TemplateCompiler {
    private static cache;
    private static readonly MAX_CACHE_SIZE;
    static clearCache(): void;
    private static pruneCache;
    private static transformSpreadAttributes;
    private static transformRefAttributes;
    private static transformComponentTags;
    static compile(template: string, stateKeys: string[]): Function;
    private static transformBooleanAttributes;
    private static captureLoopVariablesInEventHandlers;
    private static rewriteLoopEventHandlerCode;
    private static replaceLoopIdentifierUsages;
    private static buildShorthandReplacement;
    private static processStructuralDirectives;
    private static transformInterpolations;
    private static maskComplexComponents;
    private static findClosingBrace;
}
