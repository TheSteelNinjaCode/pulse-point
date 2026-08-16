/**
 * One dynamic surface of a compiled loop-row plan (see `compileLoopRowPlan`).
 *
 * `p` is the element path from the row root as child-element indices. Slot
 * kinds mirror the three serialization branches the string pipeline applies:
 * a full `{expr}` binding on a boolean attribute, a full binding on a normal
 * attribute, and a text/mixed-attribute value interpolated segment-wise with
 * `__pp_render_value` semantics.
 */
export type RowPlanSlot = {
    kind: "attr";
    p: number[];
    name: string;
    bool: boolean;
    v: number;
} | {
    kind: "attrParts";
    p: number[];
    name: string;
    parts: (string | number)[];
} | {
    kind: "text";
    p: number[];
    parts: (string | number)[];
}
/**
 * A bound attribute on a nested component boundary, serialized with the
 * boundary-binding semantics (booleans toggle presence, nullish removes,
 * primitives keep their string value). A change here also refreshes the
 * boundary's component.
 */
 | {
    kind: "battr";
    p: number[];
    name: string;
    v: number;
};
/**
 * Compile-time description of a keyed loop row whose dynamic surfaces are all
 * plain attribute/text bindings. When present, the loop can evaluate the row's
 * expressions directly and patch the live keyed node without rebuilding its
 * HTML string or re-parsing it; see LoopRowCache's value lane.
 */
export type RowPlanDescriptor = {
    /** Index into the values array of the root `key` binding. */
    key: number;
    slots: RowPlanSlot[];
    /** Number of dynamic expressions the values function returns. */
    size: number;
    /**
     * Static row prototype used by the verified direct-construction mount lane.
     * Every dynamic surface in this markup is overwritten from `slots` before
     * the clone can reach live DOM.
     */
    prototypeHtml?: string;
    /** HTML parsing context for table/select-sensitive row roots. */
    contextTag?: string;
    /** Set when any slot targets a nested boundary's attribute. */
    hasBoundary?: 1;
    /** Set only when the row's single root is itself the component boundary. */
    rootBoundary?: 1;
};
/**
 * Compile-time description of a component body whose dynamic surfaces are all
 * plain attribute/text bindings under one element root. `rootTag` is the
 * root's `tagName` (uppercase for HTML), compared against the live body root
 * before any write. See `TemplateCompiler.compileComponentBodyPlan`.
 */
export type ComponentBodyPlan = {
    rootTag: string;
    slots: RowPlanSlot[];
    size: number;
};
/**
 * Chooses the markup emitted for one masked component boundary: its full
 * markup, or the empty stub when the owning component knows the child is
 * already mounted. Supplied per render through the `__pp_boundary_html` scope
 * entry; see BoundaryContentCache.
 */
export type BoundaryHtmlResolver = (key: string, full: string, stub: string | null) => string;
export declare class TemplateCompiler {
    private static cache;
    private static readonly MAX_CACHE_SIZE;
    private static readonly CONTEXT_PROVIDER_TAG_PATTERN;
    private static readonly LITERAL_CODE_TAG_PATTERN;
    private static readonly ESCAPED_BRACE_ENTITY_PATTERN;
    /**
     * Every entity form that decodes to `<`. A template with none of them cannot
     * produce a text node containing markup, which is the only thing
     * `maskLiteralHtmlTextNodes` acts on; see its early-out.
     */
    private static readonly LITERAL_TEXT_LT_ENTITY_PATTERN;
    private static readonly INTERNAL_LOOP_NAMES;
    private static readonly SPREAD_BOOLEAN_ATTRS;
    private static readonly DYNAMIC_BOOLEAN_ATTRIBUTE_PATTERN;
    private static escapeTemplateLiteralText;
    /**
     * Content the HTML parser reads as raw text: no comment nodes can exist
     * inside these, so a `<!--` there is literal content and must pass through.
     */
    private static readonly COMMENT_STRIP_RAW_TEXT_TAGS;
    /**
     * Normal elements whose subtree is author-significant verbatim content (code
     * samples, preformatted blocks). Real comment nodes inside them stay.
     */
    private static readonly COMMENT_STRIP_VERBATIM_TAGS;
    /**
     * Comments the runtime itself uses as structure. Everything here must
     * survive stripping: fragment range markers become live `<pp-fragment>`
     * elements at mount, portal/placeholder comments anchor content the manager
     * layers restore by key, and `invalid-loop` stands in for a dropped
     * directive.
     */
    private static isRuntimeCommentMarker;
    /**
     * Remove authored HTML comments from template markup before any other
     * compile pass sees it. Loop bodies and masked boundary markup are embedded
     * verbatim into generated code, where a quote character inside a comment
     * (`<!-- the span's height -->`) derails expression scanning and leaks the
     * whole loop expression into the page as text. Comments carry no runtime
     * meaning, so dropping them up front is safer than escaping them at every
     * embed site — and it must happen before the template is cached or its
     * output compared, so a byte-identical render stays byte-identical.
     */
    static stripAuthoredComments(html: string): string;
    /**
     * Scope-free runtime helpers, built once and passed into every compiled
     * render function as its first argument. Embedding their source in each
     * function body made `new Function` re-parse the same ~2.5KB of helper code
     * for every unique template, so they are shared instead; no compiled render
     * function contains a direct `eval`.
     */
    private static readonly SHARED_RENDER_HELPERS;
    private static readonly SHARED_HELPER_PRELUDE;
    private static escapeTemplateLiteralTextPreservingInterpolations;
    static clearCache(): void;
    private static maskEscapedBraceEntities;
    private static transformSpreadAttributes;
    private static expandSpreadPlaceholders;
    private static transformRefAttributes;
    private static transformContextProviderTags;
    private static findOpeningTagEnd;
    private static findMatchingContextProviderClose;
    private static extractContextProviderValueExpression;
    private static normalizeTextareaValueAttributes;
    private static transformStyleAliasAttributes;
    private static mergeStyleAttributeValues;
    private static transformSelectValueAttributes;
    private static transformInputValueAttributes;
    private static transformCheckedValueAttributes;
    private static transformDefaultValueAttributes;
    private static transformDefaultCheckedAttributes;
    private static transformComponentBoundaryBindings;
    private static maskStaticComponentIds;
    /**
     * Compiled source that serializes one MIXED boundary attribute — a value that
     * interleaves static text with `{expr}` segments — into `name="value"`.
     *
     * Returns null when the value has no evaluable segment, so a purely static
     * attribute keeps its committed form untouched.
     *
     * A segment that is not a valid expression stays verbatim (it is data), and
     * the concatenated result is marked with `pp-literal-<name>` whenever it
     * contains a brace, so the boundary bootstrap treats the parent's output as
     * the literal value it is instead of evaluating it a second time.
     */
    private static buildMixedBoundaryAttributeCode;
    private static transformLoopAttributeEmbeddedBindings;
    private static expandEmbeddedBindingsInStringLiterals;
    private static expandEmbeddedBindingsInStringLiteral;
    private static stringifyEmbeddedBindingExpression;
    static compile(template: string, stateKeys: string[]): Function;
    private static maskLiteralElements;
    private static maskLiteralHtmlTextNodes;
    private static escapeLiteralCodeProcessingInstructionOpeners;
    private static isWithinLiteralTextContainer;
    private static splitLiteralHtmlTextSegments;
    private static serializeNodeHtml;
    private static maskLiteralBraces;
    private static isPureBindingLiteral;
    /**
     * Restores every masked component boundary in a single pass.
     *
     * The generic `restorePlaceholders` runs one `split`/`join` per placeholder,
     * which re-allocates the whole rendered string once per nested component. A
     * shell of 100 children paid that 100 times per render. Boundary keys have a
     * fixed shape, so they can all be substituted in one scan instead.
     *
     * `resolveBoundary` is the owning component's reuse hook: it decides between a
     * boundary's full markup and its empty stub. Absent (a template compiled
     * without an owning component), the full markup is always restored.
     */
    private static restoreComponentPlaceholders;
    private static restorePlaceholders;
    private static transformBooleanAttributes;
    /**
     * HTML boolean attributes use presence/absence semantics, but boolean-valued
     * attributes such as aria-pressed and data flags are string-valued in the
     * DOM. Preserve those expression results as the literal strings "true" and
     * "false" instead of passing them through the template-child serializer.
     */
    private static readonly DYNAMIC_ATTRIBUTE_CANDIDATE_PATTERN;
    private static transformNonBooleanAttributeBooleans;
    /**
     * The next offset from which the sticky candidate pattern could match: the
     * start of an attribute-name run whose `=` is followed by a quoted `{`.
     * Scanning for the cheap `["']{` anchor first, then walking back over the
     * name characters, keeps the search linear in the template size.
     */
    private static findNextAttributeCandidate;
    private static isBooleanAttribute;
    private static isAttributePosition;
    private static isAttributeOnComponentBoundary;
    private static captureLoopVariablesInEventHandlers;
    private static rewriteLoopEventHandlerCode;
    private static applyLoopEventCaptureRewrites;
    private static getLoopIndexToken;
    private static replaceLoopIdentifierUsages;
    private static buildShorthandReplacement;
    private static createLoopBoundaryBindingRewrite;
    private static isIdentifier;
    private static stripBalancedParens;
    private static parseLoopDirective;
    private static findTopLevelInSeparator;
    private static findTopLevelToken;
    private static findMatchingToken;
    private static advanceScannerState;
    private static isEscaped;
    /**
     * Attempt to compile a keyed loop body into a row plan: the list of its
     * dynamic attribute/text surfaces plus the expressions that feed them.
     *
     * Returns null whenever the body carries anything beyond plain elements with
     * expression-driven attributes and text — event handlers, nested runtime
     * structure, managed form controls, refs, compiler placeholders, comments —
     * so everything else keeps the string pipeline untouched. The plan must
     * reproduce the string pipeline's serialization byte-for-byte at the DOM
     * level; every accepted shape maps onto exactly one of the three
     * serialization branches the compiled template would have used.
     */
    private static compileLoopRowPlan;
    /**
     * Embed a row descriptor in generated JavaScript without letting braces from
     * the restored prototype participate in the outer template compiler's brace
     * scanner. JavaScript string escapes reconstruct the exact brace characters
     * when the compiled function is created (including inside component script
     * text, where HTML entities would remain literal).
     */
    private static serializeRowPlanDescriptor;
    /**
     * Shared walker behind the loop row plan and the component body plan: turn
     * one element subtree whose dynamic surfaces are all plain attribute/text
     * bindings into expression + slot lists. `keyed` selects the loop-row
     * contract (a root `key` binding is captured as the key expression);
     * without it, a dynamic root `key` disqualifies the plan instead.
     */
    private static buildElementPlan;
    /**
     * Compile-time plan for a component whose entire body is plain attribute and
     * text bindings under a single element root: the component can then commit a
     * re-render by evaluating the plan's expressions and writing only the
     * changed slots to its live DOM, skipping the parse + morph entirely (and,
     * at mount, skipping the first morph by writing every slot into the
     * materialized template markup). See `Component.tryBodyPlanCommit`.
     *
     * The prefilter rejects — as a superset — everything the compile pipeline
     * handles beyond plain bindings: scripts, styles, templates/loops, slots,
     * managed form controls, literal-content elements, foreign namespaces,
     * `pp-*` markers (boundaries, refs, directives, owned templates), context
     * providers, comments, escaped-brace entities, and `&lt;`-style literal
     * markup text that the string pipeline masks. A false rejection only means
     * the component keeps the normal render path.
     */
    static compileComponentBodyPlan(rawTemplate: string): {
        exprs: string[];
        descriptor: ComponentBodyPlan;
    } | null;
    /**
     * Whether a keyed loop body that contains nested component boundaries may
     * still participate in row reuse and direct patching.
     *
     * A kept row is never visited by the morph or the bootstrap pass, so this is
     * only sound when everything in the row the PARENT is responsible for lives
     * on the boundary's opening tag (its props), which byte-identity covers:
     *
     * - No owned/slot templates anywhere: their content is compiled in the
     *   owner's scope and must be re-baked per render.
     * - No parent-owned ref captures (`pp-ref-owner`).
     * - Outside nested boundaries: no context providers, no managed form
     *   controls, no refs, no remaining templates, no comments (runtime
     *   markers), and no compiler placeholders in text. Everything INSIDE a
     *   nested boundary is the child component's own responsibility.
     */
    private static isBoundaryRowBodySafe;
    private static processStructuralDirectives;
    /**
     * True when a loop body renders exactly one root element per row, so one row
     * maps to exactly one live node and can be stood in for by a single
     * `<pp-keep>` placeholder. Whitespace between/around the root is ignored;
     * anything else (a second element, bare text, a comment, or a compiler
     * placeholder standing in for a masked component) opts the loop out.
     */
    private static loopBodyRendersSingleRoot;
    private static transformInterpolations;
    private static maskComplexComponents;
    /**
     * The opening tag of a masked boundary with an empty body, or null when the
     * boundary's content is not safe to elide.
     *
     * Attributes are kept verbatim: they carry the child's props and are still
     * reconciled on every render. Only the body -- which the morph pass refuses to
     * descend into anyway -- is dropped.
     */
    private static buildBoundaryStub;
    private static findClosingBrace;
    private static isServerTemplateBlockStart;
    private static findServerTemplateBlockEnd;
}
