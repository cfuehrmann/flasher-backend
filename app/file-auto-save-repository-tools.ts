import * as fs from "fs";

import { AutoSaveRepository } from "./types";

export const createFileAutoSaveRepositoryTools = (fileName: string) => {
  return { connect };

  function connect(): AutoSaveRepository {
    // const json = fs.readFileSync(fileName);
    // const card = JSON.parse(json.toString());

    return {
      saveSnapshot: card => console.log(card),
      deleteSnapshot: () => console.log("deleting"),
    };
  }
};
