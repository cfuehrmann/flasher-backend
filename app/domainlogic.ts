import { addMinutes, addSeconds, differenceInSeconds } from 'date-fns';
import { State, DataBase } from './types';

export const domainLogic = (
  database: DataBase,
  getTime: () => Date,
  createUuid: () => string
) => {
  return {
    createTest({ prompt, solution }: { prompt: string; solution: string }) {
      const now = getTime();

      return database.createTest({
        id: createUuid(),
        prompt,
        solution,
        state: 'New',
        changeTime: now,
        lastTicks: 0,
        nextTime: addMinutes(now, 10),
      });
    },

    test({ id }: { id: string }) {
      return database.getTest(id);
    },

    tests({ substring }: { substring: string }) {
      return database.findTests(substring);
    },

    updateTest({
      id,
      prompt,
      solution,
      isMinor,
    }: {
      id: string;
      prompt: string;
      solution: string;
      isMinor: boolean;
    }) {
      if (isMinor) {
        return database.updateTest({
          id: id,
          prompt: prompt,
          solution: solution,
        });
      }

      const now = getTime();

      return database.updateTest({
        id: id,
        prompt: prompt,
        solution: solution,
        state: 'New',
        changeTime: now,
        lastTicks: 0,
        nextTime: addMinutes(now, 30),
      });
    },

    findNextTest() {
      return database.findNextTest(getTime());
    },

    setOk({ id }: { id: string }) {
      return setResult({
        id,
        state: 'Ok',
        getTimeToWait: (passedTime: number) => passedTime * 2,
      });
    },

    setFailed({ id }: { id: string }) {
      return setResult({
        id,
        state: 'Failed',
        getTimeToWait: (passedTime: number) => Math.floor(passedTime / 2),
      });
    },
  };

  function setResult({
    id,
    state,
    getTimeToWait,
  }: {
    id: string;
    state: State;
    getTimeToWait: (passedTime: number) => number;
  }) {
    const test = database.getTest(id);

    if (!test) throw new Error(`Test with id '${id}' not found!`);

    const now = getTime();

    const passedTime = differenceInSeconds(now, test.changeTime);

    database.updateTest({
      id,
      state,
      changeTime: now,
      nextTime: addSeconds(now, getTimeToWait(passedTime)),
    });
  }
};
