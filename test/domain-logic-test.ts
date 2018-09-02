import * as assert from "assert";
import { addMinutes, addSeconds, subSeconds } from "date-fns";
import { domainLogic } from "../app/domain-logic";
import { Repository, Test, TestUpdate } from "../app/types";

describe("domainLogic", () => {
  const skeletelRepo = Object.freeze<Repository>({
    createTest: test => undefined,
    getTest: id => undefined,
    findTests: substring => [],
    updateTest: test => undefined,
    findNextTest: time => undefined,
  });

  const skeletalTest = Object.freeze<Test>({
    id: "",
    prompt: "",
    solution: "",
    changeTime: new Date(),
    nextTime: new Date(),
    state: "Ok",
  });

  it("creation should not crash", () => {
    domainLogic(skeletelRepo, () => new Date(), () => "someId");
  });

  describe("createTest", () => {
    it("should use repository create with all fields initialized properly", () => {
      // Arrange
      const now = new Date("2018-07-21T01:02:04.567");
      const uuid = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const arg = { prompt: "prompt", solution: "solution" };
      const logic = domainLogic(
        {
          ...skeletelRepo,
          createTest: (repositoryArg: Test) => {
            const expected: Test = {
              id: uuid,
              ...arg,
              state: "New",
              changeTime: now,
              nextTime: addMinutes(now, 10),
            };
            assert.deepStrictEqual(repositoryArg, expected);
          },
        },
        () => now,
        () => uuid,
      );

      // Act/Assert
      logic.createTest(arg);
    });
  });

  describe("test", () => {
    it("should return repository result", () => {
      const logic = domainLogic(
        {
          ...skeletelRepo,
          getTest: id => (id === "42" ? skeletalTest : undefined),
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.test({ id: "42" });

      assert.strictEqual(result, skeletalTest);
    });
  });

  describe("tests", () => {
    it("should return repository result", () => {
      const repositoryResult = [skeletalTest];

      const logic = domainLogic(
        {
          ...skeletelRepo,
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
    it("should use repository update with prompt and solution when isMinor is true", () => {
      // Arrange
      const args = {
        id: "42",
        prompt: "prompt",
        solution: "solution",
        isMinor: true,
      };
      const expectedArgs: TestUpdate = {
        id: args.id,
        prompt: args.prompt,
        solution: args.solution,
      };
      const logic = domainLogic(
        {
          ...skeletelRepo,
          updateTest: repositoryArgs => {
            assert.deepStrictEqual(repositoryArgs, expectedArgs);
            return skeletalTest;
          },
        },
        () => new Date(),
        () => "someId",
      );

      // Act/Assert
      const result = logic.updateTest(args);

      // Assert
      assert.strictEqual(result, skeletalTest);
    });

    it("should use repository update with all fields set when isMinor is false", () => {
      // Arrange
      const args = {
        id: "42",
        prompt: "prompt",
        solution: "solution",
        isMinor: false,
      };
      const now = new Date();
      const logic = domainLogic(
        {
          ...skeletelRepo,
          updateTest: repositoryArgs => {
            const expected: TestUpdate = {
              id: args.id,
              prompt: args.prompt,
              solution: args.solution,
              state: "New",
              changeTime: now,
              nextTime: addMinutes(now, 30),
            };
            assert.deepStrictEqual(repositoryArgs, expected);
            return skeletalTest;
          },
        },
        () => now,
        () => "someId",
      );

      // Act/Assert
      const result = logic.updateTest(args);

      // Assert
      assert.strictEqual(result, skeletalTest);
    });
  });

  describe("findNextTest", () => {
    it("should return repository result", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic(
        {
          ...skeletelRepo,
          findNextTest: time => (time === now ? skeletalTest : undefined),
        },
        () => now,
        () => "someId",
      );

      const result = logic.findNextTest();

      assert.strictEqual(result, skeletalTest);
    });
  });

  describe("setOk/setFailed", () => {
    const now = new Date("2018-07-29T17:01:02.345Z");
    const passedTime = 41;

    const test = Object.freeze<Test>({
      id: "someId",
      prompt: "prompt",
      solution: "solution",
      state: "New",
      changeTime: subSeconds(now, passedTime),
      nextTime: subSeconds(now, 100),
    });

    type RepoArgs = { updateArg: TestUpdate | "uncalled" };

    let args: RepoArgs;

    const getLogic = () =>
      domainLogic(
        {
          ...skeletelRepo,
          getTest: id => (id === test.id ? test : undefined),
          updateTest: update => {
            args.updateArg = update;
            return skeletalTest;
          },
        },
        () => now,
        () => "newUuid",
      );

    beforeEach(() => {
      args = { updateArg: "uncalled" };
    });

    it("setOk should work correctly when test found", () => {
      const result = getLogic().setOk({ id: test.id });

      assert.deepStrictEqual(args.updateArg, {
        id: test.id,
        state: "Ok",
        changeTime: now,
        nextTime: addSeconds(now, passedTime * 2),
      });
      assert.strictEqual(result, skeletalTest);
    });

    it("setFailed should work correctly when test found", () => {
      const result = getLogic().setFailed({ id: test.id });

      assert.deepStrictEqual(args.updateArg, {
        id: test.id,
        state: "Failed",
        changeTime: now,
        nextTime: addSeconds(now, Math.floor(passedTime / 2)),
      });
      assert.strictEqual(result, skeletalTest);
    });

    it("setOk should return undefined when test not found", () => {
      const result = getLogic().setOk({ id: "newUuid" });

      assert.strictEqual(args.updateArg, "uncalled");
      assert.strictEqual(result, undefined);
    });

    it("setFailed should return undefined when test not found", () => {
      const result = getLogic().setFailed({ id: "newUuid" });

      assert.strictEqual(args.updateArg, "uncalled");
      assert.strictEqual(result, undefined);
    });
  });
});
