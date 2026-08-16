export type OwnedChild = {
    ownerId: string;
    content: string;
    contextTag: string | null;
};
export declare class OwnedTemplateManager {
    private readonly componentId;
    /**
     * Compiled render state for one owned-content template, keyed by the
     * OwnedChild object itself. Extraction creates a fresh OwnedChild whenever
     * the owner supplies new children, so a stale entry can never be served:
     * new content means a new key, and dropped children are garbage collected
     * together with their cache entry. `keysSig` still guards the one input
     * that can change under a stable OwnedChild -- the owner's scope keys.
     */
    private static readonly ownedRenderCache;
    /**
     * Filtered key view per merged owner-scope object: the scope's keys minus
     * `__pp_boundary_html`, plus the joined signature the compile cache keys
     * on. Owner scope objects are shared across the slots of one render pass,
     * so this is computed once per pass rather than once per slot.
     */
    private static readonly ownerScopeViews;
    /**
     * Ceiling on recursive owned-slot expansion. Legitimate nesting is the
     * depth of slots-within-slots (single digits); the cap only exists so a
     * slot whose content contains its own placeholder degrades to a visible
     * unexpanded marker instead of an infinite loop.
     */
    private static readonly MAX_OWNED_EXPANSION_DEPTH;
    /**
     * Longest placeholder the candidate scan will consider:
     * `__PP_OWNED_<creatorId>_<idx>__` around a component id, which the
     * registry builds from an authored name plus a short instance suffix.
     * Bounding the window keeps the scan linear on marker-shaped text that is
     * data rather than a real placeholder.
     */
    private static readonly MAX_OWNED_PLACEHOLDER_LENGTH;
    /** Capture helpers that must come from the hosting component's scope. */
    private static readonly HOST_HELPER_NAMES;
    /**
     * The (ownerId, relativeTo, merged scope object) triples the last
     * resolveOwnedChildren pass rendered against. Merged owner scopes are
     * memoized by identity in ComponentRegistry and replaced whenever any
     * scope in the owner's chain is re-saved, so "same object" is a proof
     * that re-rendering every slot would reproduce the previous output.
     */
    private ownerScopeRecords;
    constructor(componentId: string);
    /**
     * True when re-resolving any slot owner from the last render would land on
     * a different merged scope object than the one that render used. False
     * means every slot input is untouched, so a props-equal host can skip its
     * render entirely without freezing slot content.
     */
    haveOwnerScopeIdentitiesChanged(): boolean;
    extractOwnedTemplates(root: Element, onOwnerTemplateSeen?: (ownerId: string) => void): Map<string, OwnedChild>;
    resolveOwnedChildren(html: string, ownedChildren: Map<string, OwnedChild>): string;
    private expandOwnedPlaceholders;
    maskNestedOwnedTemplates(content: string, contextTag: string | null): {
        content: string;
        placeholders: Map<string, string>;
    };
    materializeTemplateComponentBoundaries(root: DocumentFragment | Element): void;
    static materializeTemplateComponentBoundaries(root: DocumentFragment | Element): void;
    /**
     * Restores every masked nested `template[pp-owner]` in one scan. The
     * previous per-placeholder `replaceOwnedPlaceholder` loop rescanned and
     * rebuilt the whole string once per placeholder — O(placeholders × size) on
     * a shell-owned slot whose content embeds hundreds of per-card templates
     * inside a megabyte of markup, which dominated live mount profiles. Keys
     * are minted fresh per mask pass and each appears exactly once, so a
     * single left-to-right pass is equivalent.
     */
    private static restoreNestedTemplatePlaceholders;
    private renderOwnedContent;
    private resolveOwnedTemplateOwner;
    private markOwnedBindings;
}
