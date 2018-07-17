"use strict";

const assert = require("assert");
const createDb = require("../arraydb"); // todo: how to deal with plugged-in databases here?

const test0 = Object.freeze({
  id: "0",
  prompt: "promptA0",
  solution: "solutionA0",
  state: "state0",
  changeTime: new Date("2018-01-01T18:25:24.000"),
  lastTicks: 10000,
  nextTime: new Date("2018-02-01T18:25:24.000")
});

const test1 = Object.freeze({
  id: "1",
  prompt: "promptA1",
  solution: "solutionB1",
  state: "state1",
  changeTime: new Date("2018-01-01T18:25:24.001"),
  lastTicks: 10001,
  nextTime: new Date("2018-02-01T18:25:24.001")
});

const test2 = Object.freeze({
  id: "2",
  prompt: "promptB2",
  solution: "solutionB2",
  state: "state2",
  changeTime: new Date("2018-01-01T18:25:24.002"),
  lastTicks: 10002,
  nextTime: new Date("2018-02-01T18:25:24.002")
});

const test1Changed = Object.freeze({
  id: "1",
  prompt: test1.prompt + "_changed",
  solution: test1.solution + "_changed",
  state: test1.state + "_changed",
  changeTime: new Date("2018-01-01T18:25:24.003"),
  lastTicks: test1.lastTicks + 1,
  nextTime: new Date("2018-02-01T18:25:24.003")
});

let db;

beforeEach(() => {
  db = createDb();
});

describe("database", () => {
  it("created database should be an object", () => {
    assert.strictEqual(typeof db, "object");
    assert.strictEqual(typeof db.createTest, "function");
    assert.strictEqual(typeof db.getTest, "function");
    assert.strictEqual(typeof db.findTests, "function");
    assert.strictEqual(typeof db.updateTest, "function");
  });

  it("created database should be a frozen object", () => {
    // @ts-ignore
    assert.throws(() => (db.createTest = "whatever"));
  });

  describe("createTest", () => {
    it("should create tests that can then be retrieved", () => {
      db.createTest(test0);
      db.createTest(test1);
      const foundTest0 = db.getTest("0");
      const foundTest1 = db.getTest("1");

      assert.deepStrictEqual(foundTest0, test0);
      assert.deepStrictEqual(foundTest1, test1);
    });

    it("should prevent duplicate keys", () => {
      db.createTest(test0);
      assert.throws(
        () => db.createTest({ ...test1, id: test0.id }),
        err => err instanceof Error && err.message.toLowerCase().includes("key")
      );
    });

    it("should throw type error if 'id' is no string", () => {
      assert.throws(
        () => db.createTest({ ...test1, id: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("id") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'prompt' is string", () => {
      assert.throws(
        () => db.createTest({ ...test1, prompt: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("prompt") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'solution' is string", () => {
      assert.throws(
        () => db.createTest({ ...test1, solution: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("solution") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'state' no string", () => {
      assert.throws(
        () => db.createTest({ ...test1, state: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("state") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'changeTime' is no Date", () => {
      assert.throws(
        () => db.createTest({ ...test1, changeTime: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("changeTime") &&
          err.message.includes("Date")
      );
    });

    it("should throw type error if 'lastTicks' is no number", () => {
      assert.throws(
        () => db.createTest({ ...test1, lastTicks: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("lastTicks") &&
          err.message.includes("number")
      );
    });

    it("should throw type error if 'nextTime' is no Date", () => {
      assert.throws(
        () => db.createTest({ ...test1, nextTime: undefined }),
        err =>
          err instanceof TypeError &&
          err.message.includes("nextTime") &&
          err.message.includes("Date")
      );
    });
  });

  describe("getTest", () => {
    beforeEach(() => {
      db.createTest(test0);
      db.createTest(test1);
      db.createTest(test2);
    });

    it("should return correct data when id found", () => {
      const result = db.getTest(test1.id);

      assert.deepStrictEqual(result, test1);
    });

    it("should return undefined when id not found", () => {
      const result = db.getTest("999");

      assert.strictEqual(result, undefined);
    });

    it("should return frozen object", () => {
      const result = db.getTest(test1.id);

      assert.throws(() => (result.prompt = "whatever"));
    });

    it("should return copies", () => {
      const result1 = db.getTest(test1.id);
      const result2 = db.getTest(test1.id);

      assert.notStrictEqual(result1, result2);
    });
  });

  describe("findTests", () => {
    beforeEach(() => {
      db.createTest(test0);
      db.createTest(test1);
      db.createTest(test2);
    });

    it("should return tests whose prompts contain substring", () => {
      const result = db.findTests("romptA");

      const lookup = {};
      for (const record of result) lookup[record.id] = record;

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["0"], test0);
      assert.deepStrictEqual(lookup["1"], test1);
    });

    it("should return tests whose solution contain substring", () => {
      const result = db.findTests("tionB");

      const lookup = {};
      for (const record of result) lookup[record.id] = record;

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["1"], test1);
      assert.deepStrictEqual(lookup["2"], test2);
    });

    it("should return frozen objects", () => {
      const result = db.findTests("promptB");

      assert.throws(() => (result[0].prompt = "whatever"));
    });

    it("should return copies", () => {
      const result1 = db.findTests("promptB");
      const result2 = db.findTests("promptB");

      assert.notStrictEqual(result1[0], result2[0]);
    });
  });

  describe("updateTest", () => {
    beforeEach(() => {
      db.createTest(test0);
      db.createTest(test1);
      db.createTest(test2);
    });

    it("should change the database", () => {
      db.updateTest(test1Changed);
      const foundTest = db.getTest(test1Changed.id);

      assert.deepStrictEqual(foundTest, test1Changed);
    });

    it("should return changed data when id found", () => {
      const result = db.updateTest(test1Changed);

      assert.deepStrictEqual(result, test1Changed);
    });

    it("should return undefined when id not found", () => {
      const result = db.updateTest({ ...test1Changed, id: "999" });

      assert.strictEqual(result, undefined);
    });

    it("should not update when value undefined", () => {
      const result = db.updateTest({ id: "1" });

      assert.deepStrictEqual(result, test1);
    });

    it("should return frozen object", () => {
      const result = db.updateTest(test1Changed);

      assert.throws(() => (result.prompt = "whatever"));
    });

    it("should return copies", () => {
      const result1 = db.updateTest(test1Changed);
      const result2 = db.updateTest(test1Changed);

      assert.notStrictEqual(result1, result2);
    });

    it("should throw type error if 'prompt' is defined but no string", () => {
      assert.throws(
        () => db.updateTest({ ...test1, prompt: 42 }),
        err =>
          err instanceof TypeError &&
          err.message.includes("prompt") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'solution' is defined but no string", () => {
      assert.throws(
        () => db.updateTest({ ...test1, solution: 42 }),
        err =>
          err instanceof TypeError &&
          err.message.includes("solution") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'state' is defined but no string", () => {
      assert.throws(
        () => db.updateTest({ ...test1, state: 42 }),
        err =>
          err instanceof TypeError &&
          err.message.includes("state") &&
          err.message.includes("string")
      );
    });

    it("should throw type error if 'changeTime' is defined but no Date", () => {
      assert.throws(
        () => db.updateTest({ ...test1, changeTime: 42 }),
        err =>
          err instanceof TypeError &&
          err.message.includes("changeTime") &&
          err.message.includes("Date")
      );
    });

    it("should throw type error if 'lastTicks' is defined but no number", () => {
      assert.throws(
        () => db.updateTest({ ...test1, lastTicks: "42" }),
        err =>
          err instanceof TypeError &&
          err.message.includes("lastTicks") &&
          err.message.includes("number")
      );
    });

    it("should throw type error if 'nextTime' is defined but no Date", () => {
      assert.throws(
        () => db.updateTest({ ...test1, nextTime: 42 }),
        err =>
          err instanceof TypeError &&
          err.message.includes("nextTime") &&
          err.message.includes("Date")
      );
    });
  });
});
