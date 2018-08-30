import { addMinutes, addSeconds, differenceInSeconds } from "date-fns";
import { Repository, State } from "./types";

export const domainLogic = (
  repository: Repository,
  getTime: () => Date,
  createUuid: () => string,
) => {
  return {
    createTest({ prompt, solution }: { prompt: string; solution: string }) {
      const now = getTime();

      repository.createTest({
        id: createUuid(),
        prompt,
        solution,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
      });
    },

    test({ id }: { id: string }) {
      return repository.getTest(id);
    },

    tests({ substring }: { substring: string }) {
      return repository.findTests(substring);
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
        return repository.updateTest({ id, prompt, solution });
      }

      const now = getTime();

      return repository.updateTest({
        id,
        prompt,
        solution,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 30),
      });
    },

    findNextTest() {
      return repository.findNextTest(getTime());
    },

    setOk({ id }: { id: string }) {
      setResult({
        id,
        state: "Ok",
        getTimeToWait: (passedTime: number) => passedTime * 2,
      });
    },

    setFailed({ id }: { id: string }) {
      setResult({
        id,
        state: "Failed",
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
    const test = repository.getTest(id);

    if (test === undefined) {
      throw new Error(`Test with id '${id}' not found!`);
    }

    const now = getTime();

    const passedTime = differenceInSeconds(now, test.changeTime);

    repository.updateTest({
      id,
      state,
      changeTime: now,
      nextTime: addSeconds(now, getTimeToWait(passedTime)),
    });
  }
};
