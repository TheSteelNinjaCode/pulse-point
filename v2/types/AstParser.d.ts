export interface VariableLocation {
    start: number;
    end: number;
    isShorthand: boolean;
    isUnwrap: boolean;
}
export declare class AstParser {
    private static expressionCache;
    private static bindingsCache;
    private static loopVariableCache;
    private static readonly MAX_CACHE_SIZE;
    static clearCaches(): void;
    static extractStateBindings(scriptContent: string): string[];
    private static collectTopLevelBindings;
    /** Skip a `= default` following a pattern element, if present. */
    private static skipDefault;
    /**
     * Skip a declarator initializer: consume until a top-level `,` (the next
     * declarator), a `;`, or a newline followed by a statement keyword —
     * the pragmatic automatic-semicolon boundary for authored component code.
     */
    private static skipInitializer;
    static isValidExpression(code: string): boolean;
    static analyzeLoopVariableUsage(code: string, iteratorName: string): VariableLocation[];
    /** True when the identifier is a `.prop` / `?.prop` member name. */
    private static isMemberProperty;
    /**
     * Classify an identifier's position inside an object literal:
     * - "key": a non-shorthand property key (`{ item: x }`) — not a usage.
     * - "shorthand": a shorthand property (`{ item }` / `{ a, item }`).
     * - null: an ordinary usage.
     */
    private static classifyObjectPosition;
}
