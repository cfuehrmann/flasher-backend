import * as assert from "assert";
import { addMinutes, addSeconds, isEqual, subSeconds } from "date-fns";

import * as domainLogic from "../app/domain-logic";
import { Card, CardUpdate, Repository } from "../app/types";

const dependencies: domainLogic.Dependencies = {
  repository: {
    createCard: card => {
      throw new Error();
    },
    readCard: id => {
      throw new Error();
    },
    updateCard: card => {
      throw new Error();
    },
    deleteCard: id => {
      throw new Error();
    },
    findCards: substring => {
      throw new Error();
    },
    findNextCard: time => {
      throw new Error();
    },
  },
  getTimeAsDate: () => {
    throw new Error();
  },
  createUuid: () => {
    throw new Error();
  },
  autoSaveWriter: {
    write: card => {
      throw new Error();
    },
    delete: () => {
      throw new Error();
    },
  },
};

// A card that is only ever checked as an object reference
const cardObjectReference: Card = {
  id: "",
  prompt: "",
  solution: "",
  changeTime: new Date(),
  nextTime: new Date(),
  state: "Ok",
  disabled: false,
};

describe("domainLogic", () => {
  it("create should not crash", () => {
    domainLogic.create(dependencies);
  });

  describe("createCard", () => {
    it("should use repository create with all fields set correctly", async () => {
      // Arrange
      const repoArgs: { createCardArg: Card | "uncalled" } = {
        createCardArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      const id = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const repository: Repository = {
        ...dependencies.repository,
        createCard: async card => {
          repoArgs.createCardArg = card;
          return;
        },
      };
      const autoSaveWriter = dependencies.autoSaveWriter;
      const logic = domainLogic.create({
        repository,
        autoSaveWriter,
        getTimeAsDate: () => now,
        createUuid: () => id,
      });
      const arg = { prompt: "prompt", solution: "solution" };

      // Act
      await logic.createCard(arg, "user");

      // Assert
      assert.deepStrictEqual(repoArgs.createCardArg, {
        id,
        ...arg,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
        disabled: true,
      } as Card);
    });
  });

  describe("readCard", () => {
    it("should return repository result", async () => {
      const logic = domainLogic.create({
        ...dependencies,
        repository: {
          ...dependencies.repository,
          readCard: async id => (id === "42" ? cardObjectReference : undefined),
        },
      });

      const result = await logic.readCard({ id: "42" }, "user");

      assert.strictEqual(result, cardObjectReference);
    });
  });

  type RepositoryAction =
    | { update: CardUpdate }
    | { deleteAutoSave: "called" }
    | { writeAutoSave: Card };

  describe("updateCard", () => {
    const getSetup = () => {
      const trace: RepositoryAction[] = [];
      const now = new Date("2018-07-29T17:01:02.345Z");

      return {
        logic: domainLogic.create({
          ...dependencies,
          repository: {
            ...dependencies.repository,
            updateCard: async update => {
              trace.push({ update });
              return cardObjectReference;
            },
          },
          autoSaveWriter: {
            ...dependencies.autoSaveWriter,
            delete: async () => {
              trace.push({ deleteAutoSave: "called" });
              return;
            },
          },
          getTimeAsDate: () => now,
        }),
        repoArgs: trace,
        now,
      };
    };

    it("should use repository update with prompt and solution when isMinor is true", async () => {
      // Arrange
      const setup = getSetup();
      const args = {
        id: "42",
        prompt: "prompt",
        solution: "solution",
        isMinor: true,
      };

      // Act
      const result = await setup.logic.updateCard(args, "user");

      // Assert
      const expected: RepositoryAction[] = [
        {
          update: {
            id: args.id,
            prompt: args.prompt,
            solution: args.solution,
          },
        },
        { deleteAutoSave: "called" },
      ];
      assert.deepStrictEqual(setup.repoArgs, expected);
      assert.strictEqual(result, cardObjectReference);
    });

    it("should use repository update with all fields set when isMinor is false", async () => {
      // Arrange
      const setup = getSetup();
      const args = {
        id: "42",
        prompt: "prompt",
        solution: "solution",
        isMinor: false,
      };

      // Act
      const result = await setup.logic.updateCard(args, "user");

      // Assert
      const expected: RepositoryAction[] = [
        {
          update: {
            id: args.id,
            prompt: args.prompt,
            solution: args.solution,
            state: "New",
            changeTime: setup.now,
            nextTime: addMinutes(setup.now, 30),
          },
        },
        { deleteAutoSave: "called" },
      ];
      assert.deepStrictEqual(setup.repoArgs, expected);
      assert.strictEqual(result, cardObjectReference);
    });
  });

  describe("deleteCard", () => {
    it("should use repository method, no more, no less", async () => {
      const logic = domainLogic.create({
        ...dependencies,
        repository: {
          ...dependencies.repository,
          deleteCard: async id => id === "42",
        },
      });

      const result = await logic.deleteCard({ id: "42" }, "user");

      assert.strictEqual(true, result);
    });
  });

  describe("cards", () => {
    it("should return repository result", async () => {
      const repositoryResult = [cardObjectReference];
      const logic = domainLogic.create({
        ...dependencies,
        repository: {
          ...dependencies.repository,
          findCards: async substring =>
            substring === "ohn smit" ? repositoryResult : [],
        },
      });

      const result = await logic.cards({ substring: "ohn smit" }, "user");

      assert.strictEqual(result, repositoryResult);
    });
  });

  describe("findNextCard", () => {
    it("should return repository result", async () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic.create({
        ...dependencies,
        repository: {
          ...dependencies.repository,
          findNextCard: async time =>
            isEqual(time, now) ? cardObjectReference : undefined,
        },
        getTimeAsDate: () => now,
      });

      const result = await logic.findNextCard({}, "user");

      assert.strictEqual(result, cardObjectReference);
    });
  });

  describe("setOk/setFailed", () => {
    const passedTime = 41;
    const cardId = "someId";

    const getSetup = () => {
      const repoArgs: { updateArg: CardUpdate | "uncalled" } = {
        updateArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      const card: Card = {
        id: cardId,
        prompt: "prompt",
        solution: "solution",
        state: "New",
        changeTime: subSeconds(now, passedTime),
        nextTime: subSeconds(now, 100),
        disabled: false,
      };

      return {
        logic: domainLogic.create({
          ...dependencies,
          repository: {
            ...dependencies.repository,
            readCard: async id => (id === card.id ? card : undefined),
            updateCard: async update => {
              repoArgs.updateArg = update;
              return cardObjectReference;
            },
          },
          getTimeAsDate: () => now,
        }),
        repoArgs,
        now,
        card,
      };
    };

    it("setOk should work correctly when card found", async () => {
      const setup = getSetup();

      await setup.logic.setOk({ id: cardId }, "user");

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        state: "Ok",
        changeTime: setup.now,
        nextTime: addSeconds(setup.now, passedTime * 2),
      });
    });

    it("setFailed should work correctly when card found", async () => {
      const setup = getSetup();

      await setup.logic.setFailed({ id: setup.card.id }, "user");

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        state: "Failed",
        changeTime: setup.now,
        nextTime: addSeconds(setup.now, Math.floor(passedTime / 2)),
      });
    });

    it("setOk should work correctly when card not found", async () => {
      const setup = getSetup();

      await setup.logic.setOk({ id: "newUuid" }, "user");

      assert.strictEqual(setup.repoArgs.updateArg, "uncalled");
    });

    it("setFailed should work correctly when card not found", async () => {
      const setup = getSetup();

      await setup.logic.setFailed({ id: "newUuid" }, "user");

      assert.strictEqual(setup.repoArgs.updateArg, "uncalled");
    });
  });

  describe("enable/disable", () => {
    const passedTime = 41;
    const cardId = "someId";

    const getSetup = () => {
      const repoArgs: { updateArg: CardUpdate | "uncalled" } = {
        updateArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      const card: Card = {
        id: cardId,
        prompt: "prompt",
        solution: "solution",
        state: "New",
        changeTime: subSeconds(now, passedTime),
        nextTime: subSeconds(now, 100),
        disabled: false,
      };

      return {
        logic: domainLogic.create({
          ...dependencies,
          repository: {
            ...dependencies.repository,
            updateCard: async update => {
              repoArgs.updateArg = update;
              return cardObjectReference;
            },
          },
          getTimeAsDate: () => now,
        }),
        repoArgs,
        now,
        card,
      };
    };

    it("enable should work correctly when card found", async () => {
      const setup = getSetup();

      await setup.logic.enable({ id: cardId }, "user");

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        disabled: false,
      });
    });

    it("disable should work correctly when card found", async () => {
      const setup = getSetup();

      await setup.logic.disable({ id: setup.card.id }, "user");

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        disabled: true,
      });
    });
  });

  describe("writeAutoSave", () => {
    it("repository should be called correctly", async () => {
      // Arrange
      const trace: RepositoryAction[] = [];
      const now = new Date("2018-07-29T17:01:02.345Z");

      const card: Card = {
        id: "id",
        prompt: "prompt",
        solution: "solution",
        state: "New",
        changeTime: subSeconds(now, 42),
        nextTime: subSeconds(now, 100),
        disabled: false,
      };

      const logic = domainLogic.create({
        ...dependencies,
        autoSaveWriter: {
          ...dependencies.autoSaveWriter,
          write: async c => {
            trace.push({ writeAutoSave: c });
            return;
          },
        },
        getTimeAsDate: () => now,
      });

      // Act
      await logic.writeAutoSave(card, "user");

      // Assert
      const expected: RepositoryAction[] = [{ writeAutoSave: card }];
      assert.deepStrictEqual(trace, expected);
    });
  });

  describe("deleteAutoSave", () => {
    it("repository should be called correctly", async () => {
      // Arrange
      const trace: RepositoryAction[] = [];
      const now = new Date("2018-07-29T17:01:02.345Z");

      const logic = domainLogic.create({
        ...dependencies,
        autoSaveWriter: {
          ...dependencies.autoSaveWriter,
          delete: async () => {
            trace.push({ deleteAutoSave: "called" });
            return;
          },
        },
        getTimeAsDate: () => now,
      });

      // Act
      await logic.deleteAutoSave({}, "user");

      // Assert
      const expected: RepositoryAction[] = [{ deleteAutoSave: "called" }];
      assert.deepStrictEqual(trace, expected);
    });
  });
});
