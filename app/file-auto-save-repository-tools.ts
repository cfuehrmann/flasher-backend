import { promises as fs } from "fs";

import { AutoSaveRepository } from "./types";

export const createFileAutoSaveRepositoryTools = (fileName: string) => {
  return { connect };

  function connect(): AutoSaveRepository {
    return {
      saveSnapshot: async data =>
        fs.writeFile(fileName, JSON.stringify(data, undefined, 4)),
      deleteSnapshot: async () => fs.unlink(fileName),
    };
  }
};
