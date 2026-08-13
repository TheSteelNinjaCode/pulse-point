interface FunctionDeclaration {
    name: string;
    type: "function" | "arrow";
    params: string[];
    line: number;
}
interface StateDeclaration {
    variableName: string;
    setterName: string;
    stateKey: string;
    initialValue: any;
    line: number;
    column: number;
}
interface PropTransformOptions {
    propNames: string[];
    skipEffectDeps?: boolean;
    skipFunctionParams?: boolean;
    wrapperFunction?: string;
}
interface TransformResult {
    code: string;
    transformations: number;
    skipped: {
        locals: number;
        effectDeps: number;
        properties: number;
    };
}
export declare class ASTProcessor {
    private static instance;
    private stateVariables;
    private static readonly FUNCTIONS_NEEDING_VALUE_TRANSFORM;
    transformPropsToGetters(code: string, options: PropTransformOptions): TransformResult;
    private identifySpecialContexts;
    private shouldSkipPropTransform;
    private isInEffectDependencyArray;
    private isLocalVariable;
    private isFunctionParameter;
    private findClosestScope;
    private extractPatternIdentifiers;
    extractIterableName(expression: string): string;
    private extractMemberExpressionPath;
    private extractRootIdentifier;
    transformRefDeclarations(code: string): string;
    private isRefDeclaration;
    private findStatementEnd;
    static getInstance(): ASTProcessor;
    extractFunctionNames(code: string): string[];
    private transformEffectDeclarations;
    private transformEffectCall;
    private extractMemberExpression;
    private isPPEffectCall;
    transformStateDeclarations(code: string, externalStateVars?: Set<string>): string;
    private transformStateDeclarationsOnlyOriginal;
    private transformStateDeclarationsOnly;
    private transformUnsupportedStateUsages;
    private trackFunctionParameters;
    private trackFunctionParametersForProps;
    private extractPatternIdentifiersForProps;
    private extractIdentifiersFromPattern;
    private transformShorthandProperties;
    private transformLogicalExpression;
    private transformConditionalExpression;
    private transformIfStatement;
    private transformWhileStatement;
    private transformForStatement;
    private transformReturnStatement;
    private transformVariableDeclarator;
    private transformAssignmentExpression;
    private transformGeneralCallExpression;
    private isLocalInAncestors;
    private patternHasIdentifier;
    private static isFunctionNeedingValueTransform;
    private transformExpressionNode;
    private isPPCall;
    private isPartOfStateDeclaration;
    private isPropertyName;
    private isMethodCallObject;
    private isPartOfPPCall;
    private isPartOfDestructuring;
    private collectStateVariables;
    private isStateDeclaration;
    private transformSpreadElement;
    private transformUnaryExpression;
    private transformBinaryExpression;
    private transformMultipleCallArguments;
    private transformDestructuringAssignments;
    private alreadyHasValue;
    private transformStateDeclarator;
    private isPPStateCall;
    private createTransformation;
    private looksLikeVariableName;
    extractStateDeclarations(code: string): StateDeclaration[];
    private extractStateFromDeclarator;
    extractFunctionDeclarations(code: string): FunctionDeclaration[];
    private extractLiteralValue;
    private capitalize;
}
export {};
