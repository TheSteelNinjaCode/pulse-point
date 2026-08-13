/**
 * Keep plain component scripts from being executed by the browser when an
 * inert server template is materialized or a rendered boundary is inserted.
 *
 * PulsePoint reads and evaluates the captured source in component scope, then
 * removes the script during the component's first render. Storing the source
 * on the element keeps cloneNode()-based DOM reconciliation safe without
 * requiring a custom script MIME type.
 */
export declare function neutralizeComponentScripts(root: DocumentFragment | Element): void;
export declare function readComponentScriptSource(script: Element): string;
