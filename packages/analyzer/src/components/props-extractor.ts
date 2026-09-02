import ts from "typescript";
import type { ComponentProp } from "@codexel/shared";

/**
 * Extracts component props from AST parameters, type annotations, and local interfaces.
 */
export function extractComponentProps(
  paramNode: ts.ParameterDeclaration | undefined,
  sourceFile: ts.SourceFile,
): ComponentProp[] {
  if (!paramNode) {
    return [];
  }

  const props: ComponentProp[] = [];
  const defaultValues = new Map<string, string>();

  // 1. Check if parameter is destructured: `({ name, variant = "default", onClick }: ButtonProps)`
  if (ts.isObjectBindingPattern(paramNode.name)) {
    for (const element of paramNode.name.elements) {
      if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
        const propName = element.name.text;
        if (element.initializer) {
          defaultValues.set(propName, element.initializer.getText(sourceFile));
        }
      }
    }
  }

  // 2. Check type annotation on the parameter
  if (paramNode.type) {
    // A. Inline type literal: `{ label: string; count?: number }`
    if (ts.isTypeLiteralNode(paramNode.type)) {
      for (const member of paramNode.type.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const name = member.name.getText(sourceFile);
          const typeText = member.type
            ? member.type.getText(sourceFile)
            : "any";
          const isRequired = !member.questionToken && !defaultValues.has(name);
          props.push({
            name,
            type: typeText,
            isRequired,
            defaultValue: defaultValues.get(name),
          });
        }
      }
      return props;
    }

    // B. Type reference: `ButtonProps` -> search in sourceFile for `interface ButtonProps` or `type ButtonProps = ...`
    if (
      ts.isTypeReferenceNode(paramNode.type) &&
      ts.isIdentifier(paramNode.type.typeName)
    ) {
      const typeRefName = paramNode.type.typeName.text;
      const resolvedProps = findPropsInTypeDeclaration(
        typeRefName,
        sourceFile,
        defaultValues,
      );
      if (resolvedProps.length > 0) {
        return resolvedProps;
      }
    }
  }

  // 3. Fallback to destructured names if no interface found
  if (ts.isObjectBindingPattern(paramNode.name)) {
    for (const element of paramNode.name.elements) {
      if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
        const propName = element.name.text;
        const hasDefault = defaultValues.has(propName);
        props.push({
          name: propName,
          type: "any",
          isRequired: !hasDefault,
          defaultValue: defaultValues.get(propName),
        });
      }
    }
  }

  return props;
}

function findPropsInTypeDeclaration(
  typeName: string,
  sourceFile: ts.SourceFile,
  defaultValues: Map<string, string>,
): ComponentProp[] {
  const result: ComponentProp[] = [];

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const name = member.name.getText(sourceFile);
          const typeText = member.type
            ? member.type.getText(sourceFile)
            : "any";
          const isRequired = !member.questionToken && !defaultValues.has(name);
          result.push({
            name,
            type: typeText,
            isRequired,
            defaultValue: defaultValues.get(name),
          });
        }
      }
    } else if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      if (ts.isTypeLiteralNode(node.type)) {
        for (const member of node.type.members) {
          if (ts.isPropertySignature(member) && member.name) {
            const name = member.name.getText(sourceFile);
            const typeText = member.type
              ? member.type.getText(sourceFile)
              : "any";
            const isRequired =
              !member.questionToken && !defaultValues.has(name);
            result.push({
              name,
              type: typeText,
              isRequired,
              defaultValue: defaultValues.get(name),
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return result;
}
