export declare function kebabToCamelCase(str: string): string;
/**
 * Converts a camelCase string to kebab-case.
 * e.g., "strokeWidth" -> "stroke-width"
 */
export declare function camelToKebabCase(str: string): string;
export declare function decodeHtmlEntities(html: string): string;
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
