import { promises as fs } from "fs";

import { AutoSaveRepository } from "./types";

export const createFileAutoSaveRepositoryTools = (fileName: string) => {
  return { connect };

  function connect(): AutoSaveRepository {
    return {
      read: async () => {
        try {
          const buffer = await fs.readFile(fileName);
          return JSON.parse(buffer.toString()).card;
        } catch (e) {
          if (e.code === "ENOENT") {
            return undefined;
          }

          throw e;
        }
      },
      write: async data =>
        fs.writeFile(fileName, JSON.stringify(data, undefined, 4)),
      delete: async () => fs.unlink(fileName),
    };
  }
};
