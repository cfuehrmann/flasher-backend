import { Test, DataBase } from "./types";
import * as fs from "fs";

export const createFileDb = (fileName: string) => {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  return { connect, createEmptyDb };

  function connect(): DataBase {
    const json = fs.readFileSync(fileName).toString();
    const data = JSON.parse(json, reviver) as Test[]; // todo: runtime check if the type assertion is correct?

    return {
      createTest(test) {
        const [result] = data.filter(t => t.id === test.id);
        if (result) throw new Error("Key already exists!");
        data.push({ ...test });
        writeJsonToFile(data);
      },

      getTest(id) {
        const [result] = data.filter(test => test.id === id);
        if (result !== undefined) return { ...result };
      },

      findTests(substring) {
        return data
          .filter(
            test =>
              test.prompt.includes(substring) ||
              test.solution.includes(substring)
          )
          .map(test => ({ ...test }));
      },

      updateTest({ id, prompt, solution, state, changeTime, nextTime }) {
        for (const test of data) {
          if (test.id !== id) continue;

          if (prompt !== undefined) test.prompt = prompt;
          if (solution !== undefined) test.solution = solution;
          if (state !== undefined) test.state = state;
          if (changeTime !== undefined) test.changeTime = changeTime;
          if (nextTime !== undefined) test.nextTime = nextTime;

          writeJsonToFile(data);

          return { ...test };
        }
      },

      findNextTest(time) {
        return data
          .filter(test => test.nextTime <= time)
          .sort(
            (test1, test2) =>
              test1.nextTime.getTime() - test2.nextTime.getTime()
          )[0];
      }
    };
  }

  function createEmptyDb() {
    writeJsonToFile([]);
  }

  function writeJsonToFile(data: any) {
    fs.writeFileSync(fileName, JSON.stringify(data, null, 4));
  }

  function reviver(key: any, value: string) {
    return isDateString(value) ? new Date(value) : value;
  }

  function isDateString(value: string) {
    return typeof value === "string" && dateFormat.test(value);
  }
};
