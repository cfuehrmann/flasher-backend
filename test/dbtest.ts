import * as assert from "assert";
import { DataBase, Test } from "../app/types";
import { dbConnector } from "./testconfig";

const test0 = Object.freeze<Test>({
  id: "0",
  prompt: "promptA0",
  solution: "solutionA0",
  state: "New",
  changeTime: new Date("2018-01-01T18:25:24.000"),
  nextTime: new Date("2018-02-01T18:25:24.000")
});

const test1 = Object.freeze<Test>({
  id: "1",
  prompt: "promptA1",
  solution: "solutionB1",
  state: "Ok",
  changeTime: new Date("2018-01-01T18:25:24.001"),
  nextTime: new Date("2018-02-01T18:25:24.001")
});

const test2 = Object.freeze<Test>({
  id: "2",
  prompt: "promptB2",
  solution: "solutionB2",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.002"),
  nextTime: new Date("2018-02-01T18:25:24.002")
});

const test1Changed = Object.freeze<Test>({
  id: "1",
  prompt: test1.prompt + "_changed",
  solution: test1.solution + "_changed",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.003"),
  nextTime: new Date("2018-02-01T18:25:24.003")
});

let db: DataBase;

beforeEach(() => {
  dbConnector.createEmptyDb();
  db = dbConnector.connect();
});

describe("database", () => {
  describe("createTest", () => {
    it("should create tests that can be retrieved", () => {
      db.createTest(test0);
      db.createTest(test1);
      const foundTest0 = db.getTest("0");
      const foundTest1 = db.getTest("1");

      assert.deepStrictEqual(foundTest0, test0);
      assert.deepStrictEqual(foundTest1, test1);
    });

    it("should create tests that can be retrieved through new connection", () => {
      db.createTest(test0);
      db.createTest(test1);
      const newDb = dbConnector.connect();
      const foundTest0 = newDb.getTest("0");
      const foundTest1 = newDb.getTest("1");

      assert.deepStrictEqual(foundTest0, test0);
      assert.deepStrictEqual(foundTest1, test1);
    });

    it("should prevent duplicate keys", () => {
      db.createTest(test0);
      assert.throws(
        () => db.createTest({ ...test1, id: test0.id }),
        (err: any) =>
          err instanceof Error && err.message.toLowerCase().includes("key")
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

      const lookup: { [key: string]: Test } = {};
      
      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["0"], test0);
      assert.deepStrictEqual(lookup["1"], test1);
    });

    it("should return tests whose solution contain substring", () => {
      const result = db.findTests("tionB");

      const lookup: { [key: string]: Test } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["1"], test1);
      assert.deepStrictEqual(lookup["2"], test2);
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

    it("should change the database persistently", () => {
      db.updateTest(test1Changed);
      const newDb = dbConnector.connect();
      const foundTest = newDb.getTest(test1Changed.id);

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

    it("should return copies", () => {
      const result1 = db.updateTest(test1Changed);
      const result2 = db.updateTest(test1Changed);

      assert.notStrictEqual(result1, result2);
    });

    // todo: what if e.g. test from createTest is changed?
  });

  describe("findNextTest", () => {
    const nextTest = Object.freeze({
      ...test0,
      nextTime: new Date("2018-01-01T18:25:24.000")
    });

    beforeEach(() => {
      db.createTest({
        ...test0,
        id: "1",
        nextTime: new Date("2018-01-01T18:25:24.001")
      });
      db.createTest(nextTest);
      db.createTest({
        ...test0,
        id: "2",
        nextTime: new Date("2018-01-01T18:25:24.002")
      });
      db.createTest({
        ...test0,
        id: "3",
        nextTime: new Date("2018-01-01T18:25:24.003")
      });
    });

    it("should return next test when found", () => {
      const result = db.findNextTest(new Date("2018-01-01T18:25:24.002"));

      assert.deepStrictEqual(result, nextTest);
    });

    it("should return next test when just found", () => {
      const result = db.findNextTest(new Date("2018-01-01T18:25:24.000"));

      assert.deepStrictEqual(result, nextTest);
    });

    it("should return undefined when just missed", () => {
      const result = db.findNextTest(new Date("2018-01-01T18:25:23.999"));

      assert.strictEqual(result, undefined);
    });
  });
});
