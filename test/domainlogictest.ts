import * as assert from "assert";
import { addMinutes, addSeconds, subSeconds } from "date-fns";
import { domainLogic } from "../app/domainlogic";
import { Repository, Test, TestUpdate } from "../app/types";

describe("domainLogic", () => {
  const repository = Object.freeze<Repository>({
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
    domainLogic(repository, () => new Date(), () => "someId");
  });

  describe("createTest", () => {
    it("should create repository record with all fields initialized properly", () => {
      // Arrange
      const now = new Date("2018-07-21T01:02:04.567");
      const uuid = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const arg = { prompt: "prompt", solution: "solution" };
      const logic = domainLogic(
        {
          ...repository,
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
    it("should return repository result when found", () => {
      const logic = domainLogic(
        {
          ...repository,
          getTest: id => (id === "42" ? skeletalTest : undefined),
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.test({ id: "42" });

      assert.strictEqual(result, skeletalTest);
    });

    it("should return undefined when not found", () => {
      const logic = domainLogic(
        { ...repository, getTest: () => undefined },
        () => new Date(),
        () => "someId",
      );

      const result = logic.test({ id: "42" });

      assert.strictEqual(result, undefined);
    });
  });

  describe("tests", () => {
    it("should return repository result", () => {
      const repositoryResult = [skeletalTest];

      const logic = domainLogic(
        {
          ...repository,
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
    it("should update prompt and solution when isMinor is true", () => {
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
          ...repository,
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

    it("should update everything when isMinor is false", () => {
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
          ...repository,
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
    it("should return repository result when found", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic(
        {
          ...repository,
          findNextTest: time => (time === now ? skeletalTest : undefined),
        },
        () => now,
        () => "someId",
      );

      const result = logic.findNextTest();

      assert.strictEqual(result, skeletalTest);
    });

    it("should return undefined when not found", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic(
        { ...repository, findNextTest: () => undefined },
        () => now,
        () => "someId",
      );

      const result = logic.findNextTest();

      assert.strictEqual(result, undefined);
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

    function getTest(id: string) {
      return id === test.id ? test : undefined;
    }

    it("setOk should work correctly when test found", () => {
      const update: TestUpdate = {
        id: test.id,
        state: "Ok",
        changeTime: now,
        nextTime: addSeconds(now, passedTime * 2),
      };
      const logic = domainLogic(
        {
          ...repository,
          getTest,
          updateTest: u => {
            assert.deepStrictEqual(u, update);
            return undefined;
          },
        },
        () => now,
        () => "someId",
      );

      logic.setOk({ id: test.id });
    });

    it("setFailed should work correctly when test found", () => {
      const update: TestUpdate = {
        id: test.id,
        state: "Failed",
        changeTime: now,
        nextTime: addSeconds(now, Math.floor(passedTime / 2)),
      };
      const logic = domainLogic(
        {
          ...repository,
          getTest,
          updateTest: u => {
            assert.deepStrictEqual(u, update);
            return undefined;
          },
        },
        () => now,
        () => "someId",
      );

      logic.setFailed({ id: test.id });
    });

    const nonExistingId = "nonExistingId";

    const emptyRepository = Object.freeze<Repository>({
      ...repository,
      getTest: id => undefined,
      updateTest: update => {
        throw new Error("updateTest should not be called");
      },
    });

    it("setOk should throw error when id not found", () => {
      const logic = domainLogic(
        { ...repository, ...emptyRepository },
        () => now,
        () => "someId",
      );

      assert.throws(
        () => {
          logic.setOk({ id: nonExistingId });
        },
        (err: unknown) =>
          err instanceof Error && err.message.includes(nonExistingId),
      );
    });

    it("setFailed should throw error when id not found", () => {
      const logic = domainLogic(
        { ...repository, ...emptyRepository },
        () => now,
        () => "someId",
      );

      assert.throws(
        () => {
          logic.setFailed({ id: nonExistingId });
        },
        (err: unknown) =>
          err instanceof Error && err.message.includes(nonExistingId),
      );
    });
  });
});
