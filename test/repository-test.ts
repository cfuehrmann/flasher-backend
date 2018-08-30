import * as assert from "assert";
import { Repository, Test } from "../app/types";
import { repositoryTools } from "./testconfig";

const test0 = Object.freeze<Test>({
  id: "0",
  prompt: "promptA0",
  solution: "solutionA0",
  state: "New",
  changeTime: new Date("2018-01-01T18:25:24.000"),
  nextTime: new Date("2018-02-01T18:25:24.000"),
});

const test1 = Object.freeze<Test>({
  id: "1",
  prompt: "promptA1",
  solution: "solutionB1",
  state: "Ok",
  changeTime: new Date("2018-01-01T18:25:24.001"),
  nextTime: new Date("2018-02-01T18:25:24.001"),
});

const test2 = Object.freeze<Test>({
  id: "2",
  prompt: "promptB2",
  solution: "solutionB2",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.002"),
  nextTime: new Date("2018-02-01T18:25:24.002"),
});

const test1Changed = Object.freeze<Test>({
  id: "1",
  prompt: test1.prompt + "_changed",
  solution: test1.solution + "_changed",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.003"),
  nextTime: new Date("2018-02-01T18:25:24.003"),
});

let repository: Repository;

beforeEach(() => {
  repositoryTools.createEmptyRepository();
  repository = repositoryTools.connect();
});

describe("repository", () => {
  describe("createTest", () => {
    it("should create tests that can be retrieved", () => {
      repository.createTest(test0);
      repository.createTest(test1);
      const foundTest0 = repository.getTest("0");
      const foundTest1 = repository.getTest("1");

      assert.deepStrictEqual(foundTest0, test0);
      assert.deepStrictEqual(foundTest1, test1);
    });

    it("should create tests that can be retrieved through new connection", () => {
      repository.createTest(test0);
      repository.createTest(test1);
      const newRepository = repositoryTools.connect();
      const foundTest0 = newRepository.getTest("0");
      const foundTest1 = newRepository.getTest("1");

      assert.deepStrictEqual(foundTest0, test0);
      assert.deepStrictEqual(foundTest1, test1);
    });

    it("should prevent duplicate keys", () => {
      repository.createTest(test0);
      assert.throws(
        () => {
          repository.createTest({ ...test1, id: test0.id });
        },
        (err: unknown) =>
          err instanceof Error && err.message.toLowerCase().includes("key"),
      );
    });
  });

  describe("getTest", () => {
    beforeEach(() => {
      repository.createTest(test0);
      repository.createTest(test1);
      repository.createTest(test2);
    });

    it("should return correct data when id found", () => {
      const result = repository.getTest(test1.id);

      assert.deepStrictEqual(result, test1);
    });

    it("should return undefined when id not found", () => {
      const result = repository.getTest("999");

      assert.strictEqual(result, undefined);
    });

    it("should return copies", () => {
      const result1 = repository.getTest(test1.id);
      const result2 = repository.getTest(test1.id);

      assert.notStrictEqual(result1, result2);
    });
  });

  describe("findTests", () => {
    beforeEach(() => {
      repository.createTest(test0);
      repository.createTest(test1);
      repository.createTest(test2);
    });

    it("should return tests whose prompts contain substring", () => {
      const result = repository.findTests("romptA");

      const lookup: { [key: string]: Test } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["0"], test0);
      assert.deepStrictEqual(lookup["1"], test1);
    });

    it("should return tests whose solution contain substring", () => {
      const result = repository.findTests("tionB");

      const lookup: { [key: string]: Test } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["1"], test1);
      assert.deepStrictEqual(lookup["2"], test2);
    });

    it("should return copies", () => {
      const result1 = repository.findTests("promptB");
      const result2 = repository.findTests("promptB");

      assert.notStrictEqual(result1[0], result2[0]);
    });
  });

  describe("updateTest", () => {
    beforeEach(() => {
      repository.createTest(test0);
      repository.createTest(test1);
      repository.createTest(test2);
    });

    it("should change the repository", () => {
      repository.updateTest(test1Changed);
      const foundTest = repository.getTest(test1Changed.id);

      assert.deepStrictEqual(foundTest, test1Changed);
    });

    it("should change the repository persistently", () => {
      repository.updateTest(test1Changed);
      const newRepository = repositoryTools.connect();
      const foundTest = newRepository.getTest(test1Changed.id);

      assert.deepStrictEqual(foundTest, test1Changed);
    });

    it("should return changed data when id found", () => {
      const result = repository.updateTest(test1Changed);

      assert.deepStrictEqual(result, test1Changed);
    });

    it("should return undefined when id not found", () => {
      const result = repository.updateTest({ ...test1Changed, id: "999" });

      assert.strictEqual(result, undefined);
    });

    it("should not update when value undefined", () => {
      const result = repository.updateTest({ id: "1" });

      assert.deepStrictEqual(result, test1);
    });

    it("should return copies", () => {
      const result1 = repository.updateTest(test1Changed);
      const result2 = repository.updateTest(test1Changed);

      assert.notStrictEqual(result1, result2);
    });

    // Todo: what if e.g. test from createTest is changed?
  });

  describe("findNextTest", () => {
    const nextTest = Object.freeze({
      ...test0,
      nextTime: new Date("2018-01-01T18:25:24.000"),
    });

    beforeEach(() => {
      repository.createTest({
        ...test0,
        id: "1",
        nextTime: new Date("2018-01-01T18:25:24.001"),
      });
      repository.createTest(nextTest);
      repository.createTest({
        ...test0,
        id: "2",
        nextTime: new Date("2018-01-01T18:25:24.002"),
      });
      repository.createTest({
        ...test0,
        id: "3",
        nextTime: new Date("2018-01-01T18:25:24.003"),
      });
    });

    it("should return next test when found", () => {
      const result = repository.findNextTest(
        new Date("2018-01-01T18:25:24.002"),
      );

      assert.deepStrictEqual(result, nextTest);
    });

    it("should return next test when just found", () => {
      const result = repository.findNextTest(
        new Date("2018-01-01T18:25:24.000"),
      );

      assert.deepStrictEqual(result, nextTest);
    });

    it("should return undefined when just missed", () => {
      const result = repository.findNextTest(
        new Date("2018-01-01T18:25:23.999"),
      );

      assert.strictEqual(result, undefined);
    });
  });
});
