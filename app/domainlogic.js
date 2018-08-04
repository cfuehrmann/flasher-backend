"use strict";

const addMinutes = require("date-fns/add_minutes");
const { states } = require("./dbtypes");

module.exports = (database, getTime, createUuid) =>
  Object.freeze({
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
    }
  });
