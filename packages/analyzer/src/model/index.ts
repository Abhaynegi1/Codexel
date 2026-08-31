import {
  type RepositoryModel,
  RepositoryModelSchema,
  CURRENT_SCHEMA_VERSION,
  ANALYZER_ENGINE_VERSION,
} from "@codexel/shared";

export function validateRepositoryModel(data: unknown): RepositoryModel {
  return RepositoryModelSchema.parse(data) as RepositoryModel;
}

export { CURRENT_SCHEMA_VERSION, ANALYZER_ENGINE_VERSION };
