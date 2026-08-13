export declare const JS_RESERVED: Set<string>;
export declare const GLOBALS: Set<string>;
/**
 * Marker prefix for a boundary root attribute whose committed value is DATA,
 * not an authored binding. When the parent's compiled template bakes a bound
 * attribute (`label="{item.label}"`) into a plain value that happens to contain
 * braces, it emits `pp-literal-<name>` next to it so the boundary bootstrap
 * never re-reads that value as an expression. The marker is consumed and
 * stripped by `NestedBoundaryManager.collectRawBindings`; it must never reach
 * committed DOM or `pp.props`.
 */
export declare const BOUNDARY_LITERAL_ATTR_PREFIX = "pp-literal-";
export declare const BOOL_ATTRS: Set<string>;
