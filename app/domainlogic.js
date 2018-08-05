"use strict";

const { addMinutes, addSeconds, differenceInSeconds } = require("date-fns");
const { states } = require("./dbtypes");

module.exports = (database, getTime, createUuid) => {
  return Object.freeze({
    createTest({ prompt, solution }) {
      const now = getTime();

      return database.createTest({
        id: createUuid(),
        prompt,
        solution,
        state: states.New,
        changeTime: now,
        lastTicks: 0,
        nextTime: addMinutes(now, 10)
      });
    },

    test({ id }) {
      return database.getTest(id);
    },

    tests({ substring }) {
      return database.findTests(substring);
    },

    updateTest({ id, prompt, solution, isMinor }) {
      if (isMinor) {
        return database.updateTest({
          id: id,
          prompt: prompt,
          solution: solution
        });
      }

      const now = getTime();

      return database.updateTest({
        id: id,
        prompt: prompt,
        solution: solution,
        state: states.New,
        changeTime: now,
        lastTicks: 0,
        nextTime: addMinutes(now, 30)
      });
    },

    findNextTest() {
      return database.findNextTest(getTime());
    },

    setOk({ id }) {
      return setResult({
        id,
        state: states.Ok,
        getTimeToWait: passedTime => passedTime * 2
      });
    },

    setFailed({ id }) {
      return setResult({
        id,
        state: states.Failed,
        getTimeToWait: passedTime => Math.floor(passedTime / 2)
      });
    }
  });

  function setResult({ id, state, getTimeToWait }) {
    const test = database.getTest({ id });

    if (!test) throw new Error(`Test with id '${id}' not found!`);

    const now = getTime();

    const passedTime = differenceInSeconds(now, test.changeTime);

    database.updateTest({
      id,
      state,
      changeTime: now,
      nextTime: addSeconds(now, getTimeToWait(passedTime))
    });
  }
};
