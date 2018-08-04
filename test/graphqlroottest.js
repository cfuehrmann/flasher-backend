"use strict";

const assert = require("assert");
const getGraphQLRoot = require("../app/graphqlroot");
const addMinutes = require("date-fns/add_minutes");

describe("getGraphQLRoot", () => {
  it("should return an object", () => {
    const root = getGraphQLRoot({});

    assert.strictEqual(typeof root, "object");
    assert.strictEqual(typeof root.createTest, "function");
    assert.strictEqual(typeof root.test, "function");
    assert.strictEqual(typeof root.tests, "function");
    assert.strictEqual(typeof root.updateTest, "function");
    assert.strictEqual(typeof root.findNextTest, "function");
  });

  it("should return frozen object", () => {
    const root = getGraphQLRoot({});

    // @ts-ignore
    assert.throws(() => (root.test = "whatever"));
  });

  describe("createTest", () => {
    it("should create database record with all fields initialized properly", () => {
      //Arrange
      const now = new Date("2018-07-21T01:02:04.567");
      const uuid = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const arg = { prompt: "prompt", solution: "solution" };
      const root = getGraphQLRoot(
        {
          createTest: dbArg =>
            assert.deepStrictEqual(dbArg, {
              id: uuid,
              ...arg,
              state: "New",
              changeTime: now,
              lastTicks: 0,
              nextTime: addMinutes(now, 10)
            })
        },
        () => now,
        () => uuid
      );

      // Act/Assert
      root.createTest(arg);
    });
  });

  describe("test", () => {
    it("should return database result when found", () => {
      const dbResult = {};
      const root = getGraphQLRoot({
        getTest: id => (id === "42" ? dbResult : undefined)
      });

      const result = root.test({ id: "42" });

      assert.strictEqual(result, dbResult);
    });

    it("should return undefined when not found", () => {
      const root = getGraphQLRoot({ getTest: () => undefined });

      const result = root.test({ id: "42" });

      assert.strictEqual(result, undefined);
    });
  });

  describe("tests", () => {
    it("should return database result when found", () => {
      const dbResult = {};
      const root = getGraphQLRoot({
        findTests: substring =>
          substring === "ohn smit" ? dbResult : undefined
      });

      const result = root.tests({ substring: "ohn smit" });

      assert.strictEqual(result, dbResult);
    });

    it("should return undefined when not found", () => {
      const root = getGraphQLRoot({ findTests: () => undefined });

      const result = root.tests({ substring: "ohn  smit" });

      assert.strictEqual(result, undefined);
    });
  });

  describe("updateTest", () => {
    it("should update prompt and solution when isMinor is true", () => {
      // Arrange
      const args = {
        id: 42,
        prompt: "prompt",
        solution: "solution",
        isMinor: true
      };
      const dbResult = {};
      const root = getGraphQLRoot({
        updateTest: dbArgs => {
          assert.deepStrictEqual(dbArgs, {
            id: args.id,
            prompt: args.prompt,
            solution: args.solution
          });
          return dbResult;
        }
      });

      // Act/Assert
      const result = root.updateTest(args);

      // Assert
      assert.strictEqual(result, dbResult);
    });

    it("should update everything when isMinor is false", () => {
      // Arrange
      const args = {
        id: 42,
        prompt: "prompt",
        solution: "solution",
        isMinor: false
      };
      const now = new Date();
      const dbResult = {};
      const root = getGraphQLRoot(
        {
          updateTest: dbArgs => {
            assert.deepStrictEqual(dbArgs, {
              id: args.id,
              prompt: args.prompt,
              solution: args.solution,
              state: "New",
              changeTime: now,
              lastTicks: 0,
              nextTime: addMinutes(now, 30)
            });
            return dbResult;
          }
        },
        () => now
      );

      // Act/Assert
      const result = root.updateTest(args);

      // Assert
      assert.strictEqual(result, dbResult);
    });
  });

  describe("findNextTest", () => {
    it("should return database result when found", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const dbResult = {};
      const root = getGraphQLRoot(
        { findNextTest: time => (time === now ? dbResult : undefined) },
        () => now
      );

      const result = root.findNextTest();

      assert.strictEqual(result, dbResult);
    });

    it("should return undefined when not found", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const root = getGraphQLRoot({ findNextTest: () => undefined }, () => now);

      const result = root.findNextTest();

      assert.strictEqual(result, undefined);
    });
  });
});
