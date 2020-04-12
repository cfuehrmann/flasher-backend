import { createFileAutoSaveRepositoryTools } from "./file-auto-save-repository-tools";
import { createFileCredentialsRepositoryTools } from "./file-credentials-repository-tools";
import { createFileRepositoryTools } from "./file-repository-tools";

// Configuration of the repository to avoid the
// "constrained construction" antipattern

export const repositoryTools = createFileRepositoryTools(
  __dirname + "/../mount/production-file-repository.json",
);

export const credentialsRepositoryTools = createFileCredentialsRepositoryTools(
  __dirname + "/../mount/credentials-repository.json",
);

export const autoSaveRepositoryTools = createFileAutoSaveRepositoryTools(
  __dirname + "/../mount/auto-save-repository.json",
);
