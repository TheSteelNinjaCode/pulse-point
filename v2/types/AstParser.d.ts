export interface VariableLocation {
    start: number;
    end: number;
    isShorthand: boolean;
    isUnwrap: boolean;
}
export declare class AstParser {
    private static expressionCache;
    private static variableCache;
    private static bindingsCache;
    private static loopVariableCache;
    private static readonly MAX_CACHE_SIZE;
    static clearCaches(): void;
    private static addPatternBindings;
    static extractStateBindings(scriptContent: string): string[];
    static extractUsedVariables(expression: string, ignoredGlobals: Set<string>): Set<string>;
    static isValidExpression(code: string): boolean;
    static analyzeLoopVariableUsage(code: string, iteratorName: string): VariableLocation[];
}
