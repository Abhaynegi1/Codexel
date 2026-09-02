import ts from "typescript";
import path from "node:path";
import fs from "node:fs/promises";
import type { FileMetadata } from "@codexel/shared";

export interface ImportEntry {
  specifier: string;
  importedNames: string[];
  isDynamic: boolean;
  line: number;
}

export interface ExportEntry {
  name: string;
  isDefault: boolean;
  line: number;
}

export interface FileAstSummary {
  filePath: string;
  sourceFile: ts.SourceFile;
  imports: ImportEntry[];
  exports: ExportEntry[];
}

function getScriptKind(filePath: string): ts.ScriptKind {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

/**
 * Parses source code into a TypeScript AST and extracts imports, exports, and specifiers.
 */
export function parseSourceFileAst(
  filePath: string,
  content: string,
): FileAstSummary {
  const scriptKind = getScriptKind(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const imports: ImportEntry[] = [];
  const exports: ExportEntry[] = [];

  function getLine(pos: number): number {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
  }

  function visit(node: ts.Node) {
    // 1. Static import declaration: `import { X, Y } from 'specifier'`
    if (ts.isImportDeclaration(node)) {
      if (ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const importedNames: string[] = [];

        if (node.importClause) {
          // Default import
          if (node.importClause.name) {
            importedNames.push(node.importClause.name.text);
          }
          // Named imports or namespace
          if (node.importClause.namedBindings) {
            if (ts.isNamespaceImport(node.importClause.namedBindings)) {
              importedNames.push(
                `* as ${node.importClause.namedBindings.name.text}`,
              );
            } else if (ts.isNamedImports(node.importClause.namedBindings)) {
              for (const element of node.importClause.namedBindings.elements) {
                importedNames.push(element.name.text);
              }
            }
          }
        }

        imports.push({
          specifier,
          importedNames,
          isDynamic: false,
          line: getLine(node.getStart()),
        });
      }
    }

    // 2. Re-export declaration: `export { X } from 'specifier'` or `export * from 'specifier'`
    else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        const importedNames: string[] = [];

        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            importedNames.push(element.name.text);
          }
        } else {
          importedNames.push("*");
        }

        imports.push({
          specifier,
          importedNames,
          isDynamic: false,
          line: getLine(node.getStart()),
        });
      }

      // Record export names
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          exports.push({
            name: element.name.text,
            isDefault: element.name.text === "default",
            line: getLine(element.getStart()),
          });
        }
      }
    }

    // 3. Dynamic import: `import('specifier')`
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        imports.push({
          specifier: firstArg.text,
          importedNames: ["*"],
          isDynamic: true,
          line: getLine(node.getStart()),
        });
      }
    }

    // 4. CommonJS `require('specifier')`
    else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require"
    ) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        imports.push({
          specifier: firstArg.text,
          importedNames: ["*"],
          isDynamic: false,
          line: getLine(node.getStart()),
        });
      }
    }

    // 5. Named export declarations: `export function ...`, `export const ...`
    else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isVariableStatement(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const isDefault = node.modifiers.some(
        (m) => m.kind === ts.SyntaxKind.DefaultKeyword,
      );

      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push({
              name: decl.name.text,
              isDefault,
              line: getLine(decl.getStart()),
            });
          }
        }
      } else if (node.name && ts.isIdentifier(node.name)) {
        exports.push({
          name: node.name.text,
          isDefault,
          line: getLine(node.getStart()),
        });
      } else if (isDefault) {
        exports.push({
          name: "default",
          isDefault: true,
          line: getLine(node.getStart()),
        });
      }
    }

    // 6. Default export assignment: `export default Foo`
    else if (ts.isExportAssignment(node)) {
      let exportName = "default";
      if (ts.isIdentifier(node.expression)) {
        exportName = node.expression.text;
      }
      exports.push({
        name: exportName,
        isDefault: true,
        line: getLine(node.getStart()),
      });
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  return {
    filePath,
    sourceFile,
    imports,
    exports,
  };
}

const PARSABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

/**
 * Parses all parsable source files in the repository and returns a map of AST summaries.
 */
export async function parseAllSourceFiles(
  workspacePath: string,
  files: FileMetadata[],
): Promise<Map<string, FileAstSummary>> {
  const summaries = new Map<string, FileAstSummary>();
  const sourceFiles = files.filter(
    (f) => f.isSource && PARSABLE_EXTENSIONS.has(f.extension.toLowerCase()),
  );

  for (const file of sourceFiles) {
    try {
      const fullPath = path.join(workspacePath, file.path);
      const content = await fs.readFile(fullPath, "utf-8");
      const summary = parseSourceFileAst(file.path, content);
      summaries.set(file.path, summary);
    } catch {
      // Non-fatal if single file has read/syntax errors
    }
  }

  return summaries;
}
