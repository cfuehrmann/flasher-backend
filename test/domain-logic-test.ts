import * as assert from "assert";
import { addMinutes, addSeconds, subSeconds } from "date-fns";
import { domainLogic } from "../app/domain-logic";
import { Repository, Test, TestUpdate } from "../app/types";

describe("domainLogic", () => {
  const unImplementedRepo: Repository = {
    createTest: test => {
      throw new Error();
    },
    getTest: id => {
      throw new Error();
    },
    findTests: substring => {
      throw new Error();
    },
    updateTest: test => {
      throw new Error();
    },
    findNextTest: time => {
      throw new Error();
    },
  };

  // A test that is only ever checked as an object reference
  const testObjectReference: Test = {
    id: "",
    prompt: "",
    solution: "",
    changeTime: new Date(),
    nextTime: new Date(),
    state: "Ok",
  };

  it("creation should not crash", () => {
    domainLogic(unImplementedRepo, () => new Date(), () => "someId");
  });

  describe("createTest", () => {
    it("should use repository create with all fields set correctly", () => {
      // Arrange
      const repoArgs: { createTestArg: Test | "uncalled" } = {
        createTestArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      const id = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          createTest: test => {
            repoArgs.createTestArg = test;
          },
        },
        () => now,
        () => id,
      );
      const arg = { prompt: "prompt", solution: "solution" };

      // Act
      logic.createTest(arg);

      // Assert
      assert.deepStrictEqual(repoArgs.createTestArg, {
        id: id,
        ...arg,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
      } as Test);
    });
  });

  describe("test", () => {
    it("should return repository result", () => {
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          getTest: id => (id === "42" ? testObjectReference : undefined),
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.test({ id: "42" });

      assert.strictEqual(result, testObjectReference);
    });
  });

  describe("tests", () => {
    it("should return repository result", () => {
      const repositoryResult = [testObjectReference];
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          findTests: substring =>
            substring === "ohn smit" ? repositoryResult : [],
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.tests({ substring: "ohn smit" });

      assert.strictEqual(result, repositoryResult);
    });
  });

  describe("updateTest", () => {
    const getSetup = () => {
      const repoArgs: { updateArg: TestUpdate | "uncalled" } = {
        updateArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      return {
        logic: domainLogic(
          {
            ...unImplementedRepo,
            updateTest: update => {
              repoArgs.updateArg = update;
              return testObjectReference;
            },
          },
          () => now,
          () => "newUuid",
        ),
        repoArgs: repoArgs,
        now: now,
      };
    };

    it("should use repository update with prompt and solution when isMinor is true", () => {
      // Arrange
      const setup = getSetup();
      const args = {
        id: "42",
        prompt: "prompt",
        solution: "solution",
        isMinor: true,
      };

      // Act
      const result = setup.logic.updateTest(args);

      // Assert
      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: args.id,
        prompt: args.prompt,
        solution: args.solution,
      } as TestUpdate);
      assert.strictEqual(result, testObjectReference);
    });

    it("should use repository update with all fields set when isMinor is false", () => {
      // Arrange
      const setup = getSetup();
      const args = {
        id: "42",
        prompt: "prompt",
        solution: "solution",
        isMinor: false,
      };

      // Act
      const result = setup.logic.updateTest(args);

      // Assert
      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: args.id,
        prompt: args.prompt,
        solution: args.solution,
        state: "New",
        changeTime: setup.now,
        nextTime: addMinutes(setup.now, 30),
      } as TestUpdate);
      assert.strictEqual(result, testObjectReference);
    });
  });

  describe("findNextTest", () => {
    it("should return repository result", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          findNextTest: time =>
            time === now ? testObjectReference : undefined,
        },
        () => now,
        () => "someId",
      );

      const result = logic.findNextTest();

      assert.strictEqual(result, testObjectReference);
    });
  });

  describe("setOk/setFailed", () => {
    const passedTime = 41;
    const testId = "someId";

    const getSetup = () => {
      const repoArgs: { updateArg: TestUpdate | "uncalled" } = {
        updateArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      const test: Test = {
        id: testId,
        prompt: "prompt",
        solution: "solution",
        state: "New",
        changeTime: subSeconds(now, passedTime),
        nextTime: subSeconds(now, 100),
      };

      return {
        logic: domainLogic(
          {
            ...unImplementedRepo,
            getTest: id => (id === test.id ? test : undefined),
            updateTest: update => {
              repoArgs.updateArg = update;
              return testObjectReference;
            },
          },
          () => now,
          () => "newUuid",
        ),
        repoArgs: repoArgs,
        now: now,
        test: test,
      };
    };

    it("setOk should work correctly when test found", () => {
      const setup = getSetup();

      const result = setup.logic.setOk({ id: testId });

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: testId,
        state: "Ok",
        changeTime: setup.now,
        nextTime: addSeconds(setup.now, passedTime * 2),
      });
      assert.strictEqual(result, testObjectReference);
    });

    it("setFailed should work correctly when test found", () => {
      const setup = getSetup();

      const result = setup.logic.setFailed({ id: setup.test.id });

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: testId,
        state: "Failed",
        changeTime: setup.now,
        nextTime: addSeconds(setup.now, Math.floor(passedTime / 2)),
      });
      assert.strictEqual(result, testObjectReference);
    });

    it("setOk should work correctly when test not found", () => {
      const setup = getSetup();

      const result = setup.logic.setOk({ id: "newUuid" });

      assert.strictEqual(setup.repoArgs.updateArg, "uncalled");
      assert.strictEqual(result, undefined);
    });

    it("setFailed should work correctly when test not found", () => {
      const setup = getSetup();

      const result = setup.logic.setFailed({ id: "newUuid" });

      assert.strictEqual(setup.repoArgs.updateArg, "uncalled");
      assert.strictEqual(result, undefined);
    });
  });
});
