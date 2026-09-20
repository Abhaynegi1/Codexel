import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import type {
  DatabaseColumn,
  DatabaseTable,
  DatabaseRelation,
  DatabaseSchemaModel,
  FileMetadata,
} from "@codexel/shared";

/**
 * Extracts database schema, tables, columns, and relations from repository files.
 * Supports Drizzle ORM, Prisma schemas, and SQL DDL files.
 */
export async function extractDatabaseSchema(
  workspacePath: string,
  files: FileMetadata[],
): Promise<DatabaseSchemaModel | undefined> {
  const tables: DatabaseTable[] = [];
  const relations: DatabaseRelation[] = [];
  let detectedOrm: DatabaseSchemaModel["orm"] = undefined;

  // 1. Check for Prisma Schema (.prisma)
  const prismaFile = files.find(
    (f) => f.path.endsWith(".prisma") || f.path.endsWith("schema.prisma"),
  );
  if (prismaFile) {
    try {
      const fullPath = path.join(workspacePath, prismaFile.path);
      const content = await fs.readFile(fullPath, "utf-8");
      const prismaParsed = parsePrismaSchema(content, prismaFile.path);
      if (prismaParsed.tables.length > 0) {
        detectedOrm = "prisma";
        tables.push(...prismaParsed.tables);
        relations.push(...prismaParsed.relations);
      }
    } catch (err) {
      console.warn("Failed to parse Prisma schema:", err);
    }
  }

  // 2. Check for Drizzle ORM schemas (pgTable, mysqlTable, sqliteTable)
  const drizzleCandidates = files.filter(
    (f) =>
      (f.path.includes("schema") ||
        f.path.includes("database") ||
        f.path.includes("db") ||
        f.path.includes("models") ||
        f.path.includes("entities")) &&
      (f.path.endsWith(".ts") || f.path.endsWith(".js")),
  );

  for (const candidate of drizzleCandidates) {
    try {
      const fullPath = path.join(workspacePath, candidate.path);
      const content = await fs.readFile(fullPath, "utf-8");
      if (
        content.includes("pgTable") ||
        content.includes("mysqlTable") ||
        content.includes("sqliteTable")
      ) {
        const drizzleParsed = parseDrizzleSchema(content, candidate.path);
        if (drizzleParsed.tables.length > 0) {
          detectedOrm = "drizzle";
          tables.push(...drizzleParsed.tables);
          relations.push(...drizzleParsed.relations);
        }
      }
    } catch (err) {
      console.warn(`Failed reading Drizzle file ${candidate.path}:`, err);
    }
  }

  // 3. Check for SQL files if no tables found yet
  if (tables.length === 0) {
    const sqlFiles = files.filter(
      (f) =>
        f.path.endsWith(".sql") &&
        (f.path.includes("migration") ||
          f.path.includes("schema") ||
          f.path.includes("init")),
    );

    for (const sqlFile of sqlFiles.slice(0, 5)) {
      try {
        const fullPath = path.join(workspacePath, sqlFile.path);
        const content = await fs.readFile(fullPath, "utf-8");
        const sqlParsed = parseSqlSchema(content, sqlFile.path);
        if (sqlParsed.tables.length > 0) {
          detectedOrm = "sql";
          tables.push(...sqlParsed.tables);
          relations.push(...sqlParsed.relations);
        }
      } catch (err) {
        console.warn(`Failed reading SQL file ${sqlFile.path}:`, err);
      }
    }
  }

  // Deduplicate tables by name
  const uniqueTablesMap = new Map<string, DatabaseTable>();
  for (const t of tables) {
    if (!uniqueTablesMap.has(t.name)) {
      uniqueTablesMap.set(t.name, t);
    }
  }
  const uniqueTables = Array.from(uniqueTablesMap.values());

  // Deduplicate relations
  const uniqueRelationsMap = new Map<string, DatabaseRelation>();
  for (const r of relations) {
    const key = `${r.sourceTable}:${r.sourceColumn}->${r.targetTable}:${r.targetColumn}`;
    if (!uniqueRelationsMap.has(key)) {
      uniqueRelationsMap.set(key, r);
    }
  }
  const uniqueRelations = Array.from(uniqueRelationsMap.values());

  if (uniqueTables.length === 0) {
    return undefined;
  }

  const totalColumns = uniqueTables.reduce(
    (acc, t) => acc + t.columns.length,
    0,
  );

  return {
    orm: detectedOrm || "inferred",
    tables: uniqueTables,
    relations: uniqueRelations,
    stats: {
      totalTables: uniqueTables.length,
      totalColumns,
      totalRelations: uniqueRelations.length,
    },
  };
}

/**
 * Deterministically parses Drizzle ORM schema definitions using the TypeScript compiler AST.
 * Handles multi-line chained methods, nested object options ({ length: 100 }, { withTimezone: true }),
 * custom pgEnum / enums, and foreign key relations without truncation.
 */
export function parseDrizzleSchema(
  content: string,
  filePath: string,
): { tables: DatabaseTable[]; relations: DatabaseRelation[] } {
  const tables: DatabaseTable[] = [];
  const relations: DatabaseRelation[] = [];

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  // Map of enum definitions if present, e.g. export const attendeeRoleEnum = pgEnum("attendee_role", ...)
  const enumMap = new Map<string, string>();

  function findEnums(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const call = node.initializer;
      const fnName = call.expression.getText(sourceFile);
      if (
        (fnName === "pgEnum" || fnName === "mysqlEnum") &&
        call.arguments.length > 0
      ) {
        const firstArg = call.arguments[0];
        const enumDbName = firstArg
          ? firstArg.getText(sourceFile).replace(/["']/g, "")
          : "";
        const varName = node.name.getText(sourceFile);
        if (enumDbName && varName) {
          enumMap.set(varName, enumDbName);
        }
      }
    }
    ts.forEachChild(node, findEnums);
  }
  findEnums(sourceFile);

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const fnName = node.expression.getText(sourceFile);
      if (
        fnName === "pgTable" ||
        fnName === "mysqlTable" ||
        fnName === "sqliteTable"
      ) {
        if (node.arguments.length >= 2) {
          const tableNameArg = node.arguments[0];
          const columnsArg = node.arguments[1];

          if (
            tableNameArg &&
            columnsArg &&
            ts.isObjectLiteralExpression(columnsArg)
          ) {
            const tableName = tableNameArg
              .getText(sourceFile)
              .replace(/["']/g, "");
            const columns: DatabaseColumn[] = [];
            const primaryKey: string[] = [];
            const foreignKeys: Array<{
              column: string;
              targetTable: string;
              targetColumn: string;
            }> = [];

            for (const prop of columnsArg.properties) {
              if (ts.isPropertyAssignment(prop)) {
                const colPropName = prop.name
                  .getText(sourceFile)
                  .replace(/["']/g, "");
                const initText = prop.initializer.getText(sourceFile);

                let dbColName = colPropName;
                let colType = "text";

                // Traverse to innermost call expression to get helper function name & arguments
                let currentExpr: ts.Expression = prop.initializer;
                let innerCall: ts.CallExpression | null = null;

                while (ts.isCallExpression(currentExpr)) {
                  innerCall = currentExpr;
                  if (ts.isPropertyAccessExpression(currentExpr.expression)) {
                    currentExpr = currentExpr.expression.expression;
                  } else {
                    break;
                  }
                }

                if (innerCall) {
                  const helperName = innerCall.expression.getText(sourceFile);

                  if (enumMap.has(helperName)) {
                    colType = enumMap.get(helperName) || helperName;
                  } else if (helperName.toLowerCase().endsWith("enum")) {
                    colType = helperName
                      .replace(/enum$/i, "")
                      .replace(/([A-Z])/g, "_$1")
                      .toLowerCase()
                      .replace(/^_/, "");
                  } else {
                    colType = helperName;
                  }

                  // If first argument is a string literal, that is the explicit database column name!
                  if (innerCall.arguments.length > 0) {
                    const firstArg = innerCall.arguments[0];
                    if (
                      firstArg &&
                      (ts.isStringLiteral(firstArg) ||
                        ts.isNoSubstitutionTemplateLiteral(firstArg))
                    ) {
                      dbColName = firstArg.text;
                    }
                  }

                  // Check if length/precision option object is supplied (e.g. { length: 100 })
                  for (const arg of innerCall.arguments) {
                    if (ts.isObjectLiteralExpression(arg)) {
                      for (const opt of arg.properties) {
                        if (ts.isPropertyAssignment(opt)) {
                          const optName = opt.name.getText(sourceFile);
                          if (optName === "length" || optName === "precision") {
                            colType = `${colType}(${opt.initializer.getText(sourceFile)})`;
                          }
                        }
                      }
                    }
                  }
                }

                const isPrimaryKey =
                  initText.includes(".primaryKey()") || colPropName === "id";
                const isNullable = !initText.includes(".notNull()");
                const isUnique = initText.includes(".unique()");

                let isForeignKey = false;
                let references: { table: string; column: string } | undefined =
                  undefined;

                // Match .references(() => targetTable.targetColumn, { onDelete: ... })
                const refMatch = initText.match(
                  /\.references\s*\(\s*\(\)\s*=>\s*(\w+)\.(\w+)/,
                );
                if (refMatch && refMatch[1] && refMatch[2]) {
                  const targetRef = refMatch[1];
                  const targetCol = refMatch[2];
                  isForeignKey = true;
                  references = {
                    table: targetRef,
                    column: targetCol,
                  };
                  foreignKeys.push({
                    column: dbColName,
                    targetTable: targetRef,
                    targetColumn: targetCol,
                  });

                  relations.push({
                    id: `rel:${tableName}.${dbColName}->${targetRef}.${targetCol}`,
                    sourceTable: tableName,
                    sourceColumn: dbColName,
                    targetTable: targetRef,
                    targetColumn: targetCol,
                    type: "N:1",
                    onDelete: initText.includes('onDelete: "cascade"')
                      ? "CASCADE"
                      : initText.includes('onDelete: "set null"')
                        ? "SET NULL"
                        : undefined,
                  });
                }

                if (isPrimaryKey) {
                  primaryKey.push(dbColName);
                }

                columns.push({
                  name: dbColName,
                  type: colType,
                  isPrimaryKey,
                  isNullable,
                  isUnique,
                  isForeignKey,
                  references,
                });
              }
            }

            if (columns.length > 0) {
              tables.push({
                id: `table:${tableName}`,
                name: tableName,
                filePath,
                columns,
                primaryKey: primaryKey.length > 0 ? primaryKey : ["id"],
                foreignKeys,
                description: `Drizzle ORM entity (${tableName})`,
              });
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { tables, relations };
}

/**
 * Parses Prisma schema (.prisma) definitions.
 */
export function parsePrismaSchema(
  content: string,
  filePath: string,
): { tables: DatabaseTable[]; relations: DatabaseRelation[] } {
  const tables: DatabaseTable[] = [];
  const relations: DatabaseRelation[] = [];

  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1] ?? "";
    const body = match[2] ?? "";
    if (!modelName || !body) continue;

    const columns: DatabaseColumn[] = [];
    const primaryKey: string[] = [];
    const foreignKeys: Array<{
      column: string;
      targetTable: string;
      targetColumn: string;
    }> = [];

    const lines = body.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;

      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0] ?? "";
        const fieldType = parts[1] ?? "";
        if (!fieldName || !fieldType) continue;

        if (
          [
            "String",
            "Int",
            "Boolean",
            "DateTime",
            "Json",
            "Float",
            "Decimal",
            "BigInt",
            "Bytes",
          ].includes(fieldType.replace("?", "").replace("[]", "")) ||
          line.includes("@relation")
        ) {
          const isPrimaryKey = line.includes("@id");
          const isNullable = fieldType.endsWith("?");
          const isUnique = line.includes("@unique");

          let isForeignKey = false;
          let references: { table: string; column: string } | undefined =
            undefined;

          const relMatch = line.match(
            /@relation\s*\((?:[^)]*fields:\s*\[(\w+)\])?(?:[^)]*references:\s*\[(\w+)\])?/,
          );
          if (relMatch && relMatch[1] && relMatch[2]) {
            const srcCol = relMatch[1];
            const targetCol = relMatch[2];
            const targetTable = fieldType.replace("?", "").replace("[]", "");

            isForeignKey = true;
            references = {
              table: targetTable,
              column: targetCol,
            };
            foreignKeys.push({
              column: srcCol,
              targetTable,
              targetColumn: targetCol,
            });

            relations.push({
              id: `rel:${modelName}.${srcCol}->${targetTable}.${targetCol}`,
              sourceTable: modelName,
              sourceColumn: srcCol,
              targetTable,
              targetColumn: targetCol,
              type: "N:1",
            });
          }

          if (isPrimaryKey) {
            primaryKey.push(fieldName);
          }

          columns.push({
            name: fieldName,
            type: fieldType.toLowerCase().replace("?", ""),
            isPrimaryKey,
            isNullable,
            isUnique,
            isForeignKey,
            references,
          });
        }
      }
    }

    if (columns.length > 0) {
      tables.push({
        id: `table:${modelName}`,
        name: modelName,
        filePath,
        columns,
        primaryKey: primaryKey.length > 0 ? primaryKey : ["id"],
        foreignKeys,
        description: `Prisma Model (${modelName})`,
      });
    }
  }

  return { tables, relations };
}

/**
 * Parses basic SQL DDL CREATE TABLE statements.
 */
export function parseSqlSchema(
  content: string,
  filePath: string,
): { tables: DatabaseTable[]; relations: DatabaseRelation[] } {
  const tables: DatabaseTable[] = [];
  const relations: DatabaseRelation[] = [];

  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|"|')?(\w+)(?:`|"|')?\s*\(([\s\S]*?)\);/gi;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1] ?? "";
    const body = match[2] ?? "";
    if (!tableName || !body) continue;

    const columns: DatabaseColumn[] = [];
    const primaryKey: string[] = [];
    const foreignKeys: Array<{
      column: string;
      targetTable: string;
      targetColumn: string;
    }> = [];

    const lines = body.split(",\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Standalone PRIMARY KEY (col1, col2)
      const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch && pkMatch[1]) {
        const pkCols = pkMatch[1]
          .split(",")
          .map((c) => c.trim().replace(/[`"']/g, ""));
        primaryKey.push(...pkCols);
        continue;
      }

      // FOREIGN KEY (col) REFERENCES target(target_col)
      const fkMatch = line.match(
        /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i,
      );
      if (fkMatch && fkMatch[1] && fkMatch[2] && fkMatch[3]) {
        const srcCol = fkMatch[1].trim().replace(/[`"']/g, "");
        const targetTable = fkMatch[2].trim().replace(/[`"']/g, "");
        const targetCol = fkMatch[3].trim().replace(/[`"']/g, "");

        foreignKeys.push({
          column: srcCol,
          targetTable,
          targetColumn: targetCol,
        });

        relations.push({
          id: `rel:${tableName}.${srcCol}->${targetTable}.${targetCol}`,
          sourceTable: tableName,
          sourceColumn: srcCol,
          targetTable,
          targetColumn: targetCol,
          type: "N:1",
        });
        continue;
      }

      // Column definition: col_name TYPE constraints
      const colMatch = line.match(
        /^(?:`|"|')?(\w+)(?:`|"|')?\s+([A-Z0-9_()]+)(.*)$/i,
      );
      if (colMatch && colMatch[1] && colMatch[2]) {
        const colName = colMatch[1];
        const colType = colMatch[2].toLowerCase();
        const rest = colMatch[3] || "";

        const isPrimaryKey = /PRIMARY\s+KEY/i.test(rest) || colName === "id";
        const isNullable = !/NOT\s+NULL/i.test(rest);
        const isUnique = /UNIQUE/i.test(rest);

        if (isPrimaryKey) {
          primaryKey.push(colName);
        }

        columns.push({
          name: colName,
          type: colType,
          isPrimaryKey,
          isNullable,
          isUnique,
        });
      }
    }

    if (columns.length > 0) {
      tables.push({
        id: `table:${tableName}`,
        name: tableName,
        filePath,
        columns,
        primaryKey: primaryKey.length > 0 ? primaryKey : ["id"],
        foreignKeys,
        description: `SQL Table (${tableName})`,
      });
    }
  }

  return { tables, relations };
}
