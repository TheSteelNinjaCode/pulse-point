export declare function kebabToCamelCase(str: string): string;
/**
 * HTML-first event naming contract:
 * - native event attributes are lowercase and non-hyphenated (`onclick`)
 * - kebab-case `on-*` attributes are custom component props (`on-click`)
 */
export declare function isNativeEventAttributeName(name: string, element: Element): boolean;
export type ScopeDescriptor = {
    keys: string[];
    keySig: string;
};
export declare function isCompilableScopeKey(key: string): boolean;
export declare function getScopeDescriptor(scope: Record<string, any>): ScopeDescriptor;
/**
 * A scope together with everything the expression compiler needs to evaluate
 * against it: the compilable key list, its signature (the function-cache key),
 * and the matching argument values.
 *
 * Deriving these is not free -- it filters and joins every key and allocates
 * two arrays -- and the boundary bootstrap pass needs them once per child. One
 * bundle per distinct parent scope is built and shared across that pass instead.
 */
export type ScopeBundle = {
    scope: Record<string, any>;
    keys: string[];
    keySig: string;
    values: any[];
};
export declare function createScopeBundle(scope: Record<string, any>): ScopeBundle;
export declare function getScopeValues(scope: Record<string, any>, keys: readonly string[]): any[];
/**
 * Converts a camelCase string to kebab-case.
 * e.g., "strokeWidth" -> "stroke-width"
 */
export declare function camelToKebabCase(str: string): string;
export declare function normalizeTextareaInitialContent(html: string): string;
export declare function decodeHtmlEntities(html: string): string;
/**
 * Does this text or attribute value still carry an unresolved brace entity?
 *
 * Anything that answers true has to reach `TemplateCompiler`, which is the only
 * thing that turns it back into a literal brace. Skipping compilation leaves the
 * entity on screen verbatim (`&#123;` instead of `{`).
 */
export declare function containsEscapedBraceEntity(value: string): boolean;
export type HtmlFragmentWrapper = {
    wrap: (html: string) => string;
    unwrap: (html: string) => string;
};
export type ParsedHtmlFragment = {
    root: DocumentFragment | Element;
    toHtml: () => string;
};
export declare function findBalancedClosingBrace(value: string, start: number): number;
export declare function isServerTemplateBlockStart(value: string, start: number): boolean;
export declare function findServerTemplateBlockEnd(value: string, start: number): number;
export type BracedExpressionBinding = {
    expression: string;
    start: number;
    end: number;
};
export declare function parseBracedExpressionBinding(value: string): BracedExpressionBinding | null;
export declare function replaceBracedExpressions(value: string, replacer: (expression: string, rawExpression: string) => string): string;
export declare function createHtmlFragmentWrapper(contextTag?: string | null): HtmlFragmentWrapper;
export declare function parseHtmlFragment(html: string, contextTag?: string | null): ParsedHtmlFragment;
/**
 * Debounces a function call
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttles a function call
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Shallow comparison of two objects
 */
export declare function shallowEqual(obj1: any, obj2: any): boolean;
