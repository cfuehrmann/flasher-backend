"use strict";

const assert = require("assert");
const domainLogic = require("../app/domainlogic");
const { addMinutes, addSeconds, subSeconds } = require("date-fns");
const { states } = require("../app/dbtypes");

describe("domainLogic", () => {
  it("should return an object", () => {
    const logic = domainLogic({});

    assert.strictEqual(typeof logic, "object");
    assert.strictEqual(typeof logic.createTest, "function");
    assert.strictEqual(typeof logic.test, "function");
    assert.strictEqual(typeof logic.tests, "function");
    assert.strictEqual(typeof logic.updateTest, "function");
    assert.strictEqual(typeof logic.findNextTest, "function");
  });

  it("should return frozen object", () => {
    const logic = domainLogic({});

    // @ts-ignore
    assert.throws(() => (logic.test = "whatever"));
  });

  describe("createTest", () => {
    it("should create database record with all fields initialized properly", () => {
      //Arrange
      const now = new Date("2018-07-21T01:02:04.567");
      const uuid = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const arg = { prompt: "prompt", solution: "solution" };
      const logic = domainLogic(
        {
          createTest: dbArg =>
            assert.deepStrictEqual(dbArg, {
              id: uuid,
              ...arg,
              state: states.New,
              changeTime: now,
              lastTicks: 0,
              nextTime: addMinutes(now, 10)
            })
        },
        () => now,
        () => uuid
      );

      // Act/Assert
      logic.createTest(arg);
    });
  });

  describe("test", () => {
    it("should return database result when found", () => {
      const dbResult = {};
      const logic = domainLogic({
        getTest: id => (id === "42" ? dbResult : undefined)
      });

      const result = logic.test({ id: "42" });

      assert.strictEqual(result, dbResult);
    });

    it("should return undefined when not found", () => {
      const logic = domainLogic({ getTest: () => undefined });

      const result = logic.test({ id: "42" });

      assert.strictEqual(result, undefined);
    });
  });

  describe("tests", () => {
    it("should return database result when found", () => {
      const dbResult = {};
      const logic = domainLogic({
        findTests: substring =>
          substring === "ohn smit" ? dbResult : undefined
      });

      const result = logic.tests({ substring: "ohn smit" });

      assert.strictEqual(result, dbResult);
    });

    it("should return undefined when not found", () => {
      const logic = domainLogic({ findTests: () => undefined });

      const result = logic.tests({ substring: "ohn  smit" });

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
      const logic = domainLogic({
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
      const result = logic.updateTest(args);

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
      const logic = domainLogic(
        {
          updateTest: dbArgs => {
            assert.deepStrictEqual(dbArgs, {
              id: args.id,
              prompt: args.prompt,
              solution: args.solution,
              state: states.New,
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
      const result = logic.updateTest(args);

      // Assert
      assert.strictEqual(result, dbResult);
    });
  });

  describe("findNextTest", () => {
    it("should return database result when found", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const dbResult = {};
      const logic = domainLogic(
        { findNextTest: time => (time === now ? dbResult : undefined) },
        () => now
      );

      const result = logic.findNextTest();

      assert.strictEqual(result, dbResult);
    });

    it("should return undefined when not found", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic({ findNextTest: () => undefined }, () => now);

      const result = logic.findNextTest();

      assert.strictEqual(result, undefined);
    });
  });

  describe("setOk/setFailed", () => {
    const now = new Date("2018-07-29T17:01:02.345Z");
    const passedTime = 41;

    const someTest = Object.freeze({
      id: "someId",
      prompt: "prompt",
      solution: "solution",
      state: states.New,
      changeTime: subSeconds(now, passedTime),
      nextTime: subSeconds(now, 100)
    });

    function getTest({ id }) {
      return id === someTest.id ? someTest : undefined;
    }

    it("setOk should work correctly when test found", () => {
      const database = {
        getTest,
        updateTest: test =>
          assert.deepStrictEqual(test, {
            id: someTest.id,
            state: states.Ok,
            changeTime: now,
            nextTime: addSeconds(now, passedTime * 2)
          })
      };
      const logic = domainLogic(database, () => now);

      logic.setOk({ id: someTest.id });
    });

    it("setFailed should work correctly when test found", () => {
      const database = {
        getTest,
        updateTest: test =>
          assert.deepStrictEqual(test, {
            id: someTest.id,
            state: states.Failed,
            changeTime: now,
            nextTime: addSeconds(now, Math.floor(passedTime / 2))
          })
      };
      const logic = domainLogic(database, () => now);

      logic.setFailed({ id: someTest.id });
    });

    const nonExistingId = "nonExistingId";

    const emptyDb = Object.freeze({
      getTest: () => undefined,
      updateTest: () => {
        throw new Error("updateTest should not be called");
      }
    });

    it("setOk should throw error when id not found", () => {
      const logic = domainLogic(emptyDb);

      assert.throws(
        () => logic.setOk({ id: nonExistingId }),
        err => err.message.includes(nonExistingId)
      );
    });

    it("setFailed should throw error when id not found", () => {
      const logic = domainLogic(emptyDb);

      assert.throws(
        () => logic.setFailed({ id: nonExistingId }),
        err => err.message.includes(nonExistingId)
      );
    });
  });
});
