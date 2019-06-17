import { createFileRepositoryTools } from "./file-repository-tools";

// Configuration of the repository to avoid the "constrained construction" antipattern
export const repositoryTools = createFileRepositoryTools(
  __dirname + "/../production-file-repository.json",
);
