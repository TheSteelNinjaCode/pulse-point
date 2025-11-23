import { ComponentManager } from "./component-manager.js";
import { ExpressionEvaluator, ParsedMustache, StateManager } from "./pp-reactive-v1.js";
interface TextNodeBinding {
    originalContent: string;
    expressions: ParsedMustache[];
    subscriptionIds: string[];
    component: string;
    componentElement?: Element;
}
export declare class TextNodeManager {
    componentManager?: ComponentManager;
    private textNodeBindings;
    private expressionEvaluator;
    private stateManager;
    private cleanupObserver;
    private bindingCount;
    constructor(expressionEvaluator: ExpressionEvaluator, stateManager: StateManager);
    private cleanupDetachedNodes;
    processTextNode(textNode: Text, component: string): void;
    private shouldSkipTextNode;
    private hasValidExpressions;
    private createTextNodeBinding;
    private setupExpressionSubscriptions;
    updateTextNode(textNode: Text): void;
    private resolveBindingComponentElement;
    private buildEvaluationContext;
    private evaluateExpressionsToText;
    private applyTextUpdate;
    private isInsideLoopItem;
    private resolveComponentRootForElement;
    cleanupTextNode(textNode: Text): void;
    getBindingCount(): number;
    getAllBindings(): Map<Text, TextNodeBinding>;
    clearAllBindings(): void;
    destroy(): void;
}
export {};
