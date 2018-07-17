"use strict";

module.exports = () => {
  const data = [];

  return Object.freeze({
    createTest({
      id,
      prompt,
      solution,
      state,
      changeTime,
      lastTicks,
      nextTime
    }) {
      if (typeof id !== "string") throw new TypeError("'id' is not string!");

      if (typeof prompt !== "string")
        throw new TypeError("'prompt' is not string!");

      if (typeof solution !== "string")
        throw new TypeError("'solution' is not string!");

      if (typeof state !== "string")
        throw new TypeError("'state' is not string!");

      if (!(changeTime instanceof Date))
        throw new TypeError("'changeTime' is not a Date!");

      if (typeof lastTicks !== "number")
        throw new TypeError("'lastTicks' is not a number!");

      if (!(nextTime instanceof Date))
        throw new TypeError("'nextTime' is not a Date!");

      const [result] = data.filter(test => test.id === id);

      if (result) throw new Error("Key already exists!");

      data.push({
        id,
        prompt,
        solution,
        state,
        changeTime,
        lastTicks,
        nextTime
      });
    },

    getTest(id) {
      const [result] = data.filter(test => test.id === id);
      if (result !== undefined) return Object.freeze({ ...result });
    },

    findTests(substring) {
      return data
        .filter(
          test =>
            test.prompt.includes(substring) || test.solution.includes(substring)
        )
        .map(test => Object.freeze({ ...test }));
    },

    updateTest({
      id,
      prompt,
      solution,
      state,
      changeTime,
      lastTicks,
      nextTime
    }) {
      for (const test of data) {
        if (test.id !== id) continue;

        if (prompt !== undefined)
          if (typeof prompt === "string") test.prompt = prompt;
          else throw new TypeError("'prompt' is not string!");

        if (solution !== undefined)
          if (typeof solution === "string") test.solution = solution;
          else throw new TypeError("'solution' is not string!");

        if (state !== undefined)
          if (typeof state === "string") test.state = state;
          else throw new TypeError("'state' is not string!");

        if (changeTime !== undefined)
          if (changeTime instanceof Date) test.changeTime = changeTime;
          else throw new TypeError("'changeTime' is not a Date!");

        if (lastTicks !== undefined)
          if (typeof lastTicks === "number") test.lastTicks = lastTicks;
          else throw new TypeError("'lastTicks' is not a number!");

        if (nextTime !== undefined)
          if (nextTime instanceof Date) test.nextTime = nextTime;
          else throw new TypeError("'nextTime' is not a Date!");

        return Object.freeze({ ...test });
      }
    }
  });
};
