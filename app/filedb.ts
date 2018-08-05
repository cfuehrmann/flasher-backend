import { Test, DataBase } from './types';
import * as fs from 'fs';

export const createFileDb = (fileName: string) => {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  return { connect, createEmptyDb };

  function connect(): DataBase {
    const json = fs.readFileSync(fileName).toString();
    const data = JSON.parse(json, reviver) as Test[]; // todo: runtime check if the type assertion is correct?

    return {
      createTest(test: Test) {
        const [result] = data.filter((t: Test) => t.id === test.id);
        if (result) throw new Error('Key already exists!');
        data.push({ ...test });
        writeJsonToFile(data);
      },

      getTest(id: string) {
        const [result] = data.filter((test: Test) => test.id === id);
        if (result !== undefined) return { ...result };
      },

      findTests(substring: string) {
        return data
          .filter(
            (test: Test) =>
              test.prompt.includes(substring) ||
              test.solution.includes(substring)
          )
          .map((test: Test) => ({ ...test }));
      },

      updateTest({
        id,
        prompt,
        solution,
        state,
        changeTime,
        lastTicks,
        nextTime,
      }: Test) {
        for (const test of data) {
          if (test.id !== id) continue;

          if (prompt !== undefined)
            if (typeof prompt === 'string') test.prompt = prompt;
            else throw new TypeError("'prompt' is not string!");

          if (solution !== undefined)
            if (typeof solution === 'string') test.solution = solution;
            else throw new TypeError("'solution' is not string!");

          if (state !== undefined) test.state = state;

          if (changeTime !== undefined)
            if (changeTime instanceof Date) test.changeTime = changeTime;
            else throw new TypeError("'changeTime' is not a Date!");

          if (lastTicks !== undefined)
            if (typeof lastTicks === 'number') test.lastTicks = lastTicks;
            else throw new TypeError("'lastTicks' is not a number!");

          if (nextTime !== undefined)
            if (nextTime instanceof Date) test.nextTime = nextTime;
            else throw new TypeError("'nextTime' is not a Date!");

          writeJsonToFile(data);
          return { ...test };
        }
      },

      findNextTest(time: Date) {
        return data
          .filter((test: Test) => test.nextTime <= time)
          .sort(
            (test1: Test, test2: Test) =>
              test1.nextTime.getTime() - test2.nextTime.getTime()
          )[0];
      },
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
    return typeof value === 'string' && dateFormat.test(value);
  }
};
