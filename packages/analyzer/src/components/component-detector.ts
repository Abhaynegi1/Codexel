import ts from "typescript";
import path from "node:path";
import type { DiscoveredComponent } from "@codexel/shared";
import { extractComponentProps } from "./props-extractor";

export interface RawDetectedComponent {
  name: string;
  node: ts.Node;
  lineStart: number;
  lineEnd: number;
  isDefaultExport: boolean;
  exportName: string;
  category: DiscoveredComponent["category"];
  props: DiscoveredComponent["props"];
  childComponents: string[];
}

const PRIMITIVE_NAMES = new Set([
  "Button",
  "Badge",
  "Avatar",
  "Input",
  "Textarea",
  "Dialog",
  "Card",
  "CardHeader",
  "CardTitle",
  "CardContent",
  "CardFooter",
  "Select",
  "Dropdown",
  "DropdownMenu",
  "Checkbox",
  "RadioGroup",
  "Switch",
  "Tabs",
  "Slider",
  "Tooltip",
  "Popover",
  "Separator",
  "Skeleton",
  "Label",
  "Accordion",
  "Sheet",
  "Alert",
]);

function hasJsx(node: ts.Node): boolean {
  let found = false;

  function visit(n: ts.Node) {
    if (
      ts.isJsxElement(n) ||
      ts.isJsxSelfClosingElement(n) ||
      ts.isJsxFragment(n)
    ) {
      found = true;
      return;
    }
    if (!found) {
      ts.forEachChild(n, visit);
    }
  }

  visit(node);
  return found;
}

function extractJsxChildNames(node: ts.Node): string[] {
  const children = new Set<string>();

  function visit(n: ts.Node) {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tagNode = ts.isJsxElement(n) ? n.openingElement.tagName : n.tagName;
      const tagName = tagNode.getText();

      // Only record PascalCase component tags (e.g. <Button>, <Icons.Check>, <Dialog>)
      // and skip lower-case HTML tags like <div>, <span>
      const baseTag = tagName.split(".")[0] || "";
      if (/^[A-Z]/.test(baseTag)) {
        children.add(tagName);
      }
    }
    ts.forEachChild(n, visit);
  }

  visit(node);
  return Array.from(children).sort();
}

function classifyComponentCategory(
  name: string,
  filePath: string,
): DiscoveredComponent["category"] {
  const lowerPath = filePath.toLowerCase();
  const baseName = path.basename(filePath).toLowerCase();

  if (baseName.startsWith("page.") || lowerPath.includes("/pages/") || lowerPath.includes("/app/")) {
    if (baseName.startsWith("page.")) return "page";
    if (baseName.startsWith("layout.")) return "layout";
  }

  if (name.endsWith("Page")) return "page";
  if (name.endsWith("Layout")) return "layout";

  if (
    lowerPath.includes("/ui/") ||
    lowerPath.includes("/primitives/") ||
    PRIMITIVE_NAMES.has(name)
  ) {
    return "ui-primitive";
  }

  if (name.includes("Modal") || name.includes("Dialog")) return "modal";
  if (name.includes("Form")) return "form";
  if (
    name.includes("Nav") ||
    name.includes("Header") ||
    name.includes("Footer") ||
    name.includes("Sidebar") ||
    name.includes("Menu")
  ) {
    return "navigation";
  }
  if (name.includes("Table")) return "table";
  if (name.includes("Chart")) return "chart";

  if (lowerPath.includes("/components/") || lowerPath.includes("/shared/")) {
    return "shared-component";
  }

  return "feature-component";
}

/**
 * Detects all React components defined in a source file.
 */
export function detectComponentsInFile(
  filePath: string,
  sourceFile: ts.SourceFile,
  defaultExportName?: string,
): RawDetectedComponent[] {
  const components: RawDetectedComponent[] = [];

  function getLine(pos: number): number {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
  }

  const baseFileName = path.basename(filePath, path.extname(filePath));
  const isRouteFile = baseFileName === "page" || baseFileName === "layout";

  function processComponent(
    name: string,
    bodyNode: ts.Node,
    paramNode: ts.ParameterDeclaration | undefined,
    containerNode: ts.Node,
    isDefaultExport: boolean,
    exportName: string,
  ) {
    if (!hasJsx(bodyNode)) {
      return;
    }

    const lineStart = getLine(containerNode.getStart());
    const lineEnd = getLine(containerNode.getEnd());
    const category = classifyComponentCategory(name, filePath);
    const props = extractComponentProps(paramNode, sourceFile);
    const childComponents = extractJsxChildNames(bodyNode);

    components.push({
      name,
      node: containerNode,
      lineStart,
      lineEnd,
      isDefaultExport,
      exportName,
      category,
      props,
      childComponents,
    });
  }

  function visit(node: ts.Node) {
    // 1. Function Declaration: `function Button(props: ButtonProps) { return <button />; }`
    if (ts.isFunctionDeclaration(node)) {
      const isDefault =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) || false;
      const isExported =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) || false;

      let name = node.name?.text || "";
      if (!name && (isDefault || isRouteFile)) {
        name = isRouteFile
          ? baseFileName === "page"
            ? "Page"
            : "Layout"
          : "DefaultComponent";
      }

      if (/^[A-Z]/.test(name) && node.body) {
        processComponent(
          name,
          node.body,
          node.parameters[0],
          node,
          isDefault,
          isDefault ? "default" : isExported ? name : "",
        );
      }
    }

    // 2. Variable Statement with Arrow Function: `export const Button = (props) => <button />`
    else if (ts.isVariableStatement(node)) {
      const isExported =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) || false;

      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          /^[A-Z]/.test(decl.name.text) &&
          decl.initializer
        ) {
          const name = decl.name.text;
          const isDefault = defaultExportName === name;

          if (
            ts.isArrowFunction(decl.initializer) ||
            ts.isFunctionExpression(decl.initializer)
          ) {
            processComponent(
              name,
              decl.initializer.body,
              decl.initializer.parameters[0],
              node,
              isDefault,
              isDefault ? "default" : isExported ? name : "",
            );
          }
        }
      }
    }

    // 3. Class Component: `class Button extends React.Component`
    else if (ts.isClassDeclaration(node)) {
      const name = node.name?.text || "";
      const isDefault =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) || false;
      const isExported =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) || false;

      if (/^[A-Z]/.test(name) && node.heritageClauses) {
        // Find render() method
        for (const member of node.members) {
          if (
            ts.isMethodDeclaration(member) &&
            member.name.getText(sourceFile) === "render" &&
            member.body
          ) {
            processComponent(
              name,
              member.body,
              undefined,
              node,
              isDefault,
              isDefault ? "default" : isExported ? name : "",
            );
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return components;
}
