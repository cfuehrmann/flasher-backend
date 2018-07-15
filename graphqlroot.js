"use strict";

const addMinutes = require("date-fns/add_minutes");

module.exports = (database, getTime) =>
  Object.freeze({
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
          solution: solution,
          state: undefined,
          changeTime: undefined,
          lastTicks: undefined,
          nextTime: undefined
        });
      }

      const now = getTime();

      return database.updateTest({
        id: id,
        prompt: prompt,
        solution: solution,
        state: "New",
        changeTime: now,
        lastTicks: 0,
        nextTime: addMinutes(now, 30)
      });
    }
  });
