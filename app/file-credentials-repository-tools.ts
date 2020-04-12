import * as fs from "fs";

import { CredentialsRepository } from "./types";

export const createFileCredentialsRepositoryTools = (fileName: string) => {
  return { connect };

  function connect(): CredentialsRepository {
    const buffer = fs.readFileSync(fileName);
    const passwordHashes = JSON.parse(buffer.toString());

    return {
      getPasswordHash: userName => passwordHashes[userName],
    };
  }
};
