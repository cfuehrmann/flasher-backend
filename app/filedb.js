"use strict";

const fs = require("fs");
const { states } = require("./dbtypes");

module.exports = fileName => {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  return Object.freeze({ connect, createEmptyDb });

  function connect() {
    const json = fs.readFileSync(fileName).toString();
    const data = JSON.parse(json, reviver);

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
          throw new TypeError("'prompt' is not a string!");

        if (typeof solution !== "string")
          throw new TypeError("'solution' is not a string!");

        if (!Object.values(states).includes(state))
          throw new TypeError(`state' is not in ${Object.values(states)}!`);

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

        writeJsonToFile(data);
      },

      getTest(id) {
        const [result] = data.filter(test => test.id === id);
        if (result !== undefined) return Object.freeze({ ...result });
      },

      findTests(substring) {
        return data
          .filter(
            test =>
              test.prompt.includes(substring) ||
              test.solution.includes(substring)
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
            if (Object.values(states).includes(state)) test.state = state;
            else
              throw new TypeError(`state' is not in ${Object.values(states)}!`);

          if (changeTime !== undefined)
            if (changeTime instanceof Date) test.changeTime = changeTime;
            else throw new TypeError("'changeTime' is not a Date!");

          if (lastTicks !== undefined)
            if (typeof lastTicks === "number") test.lastTicks = lastTicks;
            else throw new TypeError("'lastTicks' is not a number!");

          if (nextTime !== undefined)
            if (nextTime instanceof Date) test.nextTime = nextTime;
            else throw new TypeError("'nextTime' is not a Date!");

          writeJsonToFile(data);
          return Object.freeze({ ...test });
        }
      },

      findNextTest(time) {
        return data
          .filter(test => test.nextTime <= time)
          .sort((test1, test2) => test1.nextTime - test2.nextTime)[0];
      }
    });
  }

  function createEmptyDb() {
    writeJsonToFile([]);
  }

  function writeJsonToFile(data) {
    fs.writeFileSync(fileName, JSON.stringify(data, null, 4));
  }

  function reviver(key, value) {
    return isDateString(value) ? new Date(value) : value;
  }

  function isDateString(value) {
    return typeof value === "string" && dateFormat.test(value);
  }
};
