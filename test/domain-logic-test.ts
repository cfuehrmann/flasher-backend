import * as assert from "assert";
import { addMinutes, addSeconds, subSeconds } from "date-fns";

import { domainLogic } from "../app/domain-logic";
import { Card, CardUpdate, Repository } from "../app/types";

describe("domainLogic", () => {
  const unImplementedRepo: Repository = {
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

  it("constructor should not crash", () => {
    domainLogic(unImplementedRepo, () => new Date(), () => "someId");
  });

  describe("createCard", () => {
    it("should use repository create with all fields set correctly", () => {
      // Arrange
      const repoArgs: { createCardArg: Card | "uncalled" } = {
        createCardArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      const id = "d9f77655-c17e-43a5-a7be-997a01d65c37";
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          createCard: card => {
            repoArgs.createCardArg = card;
          },
        },
        () => now,
        () => id,
      );
      const arg = { prompt: "prompt", solution: "solution" };

      // Act
      logic.createCard(arg);

      // Assert
      assert.deepStrictEqual(repoArgs.createCardArg, {
        id: id,
        ...arg,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
        disabled: true,
      } as Card);
    });
  });

  describe("readCard", () => {
    it("should return repository result", () => {
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          readCard: id => (id === "42" ? cardObjectReference : undefined),
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.readCard({ id: "42" });

      assert.strictEqual(result, cardObjectReference);
    });
  });

  describe("updateCard", () => {
    const getSetup = () => {
      const repoArgs: { updateArg: CardUpdate | "uncalled" } = {
        updateArg: "uncalled",
      };
      const now = new Date("2018-07-29T17:01:02.345Z");
      return {
        logic: domainLogic(
          {
            ...unImplementedRepo,
            updateCard: update => {
              repoArgs.updateArg = update;
              return cardObjectReference;
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
      const result = setup.logic.updateCard(args);

      // Assert
      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: args.id,
        prompt: args.prompt,
        solution: args.solution,
      } as CardUpdate);
      assert.strictEqual(result, cardObjectReference);
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
      const result = setup.logic.updateCard(args);

      // Assert
      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: args.id,
        prompt: args.prompt,
        solution: args.solution,
        state: "New",
        changeTime: setup.now,
        nextTime: addMinutes(setup.now, 30),
      } as CardUpdate);
      assert.strictEqual(result, cardObjectReference);
    });
  });

  describe("deleteCard", () => {
    it("should use repository method, no more, no less", () => {
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          deleteCard: id => id === "42",
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.deleteCard({ id: "42" });

      assert.strictEqual(true, result);
    });
  });

  describe("cards", () => {
    it("should return repository result", () => {
      const repositoryResult = [cardObjectReference];
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          findCards: substring =>
            substring === "ohn smit" ? repositoryResult : [],
        },
        () => new Date(),
        () => "someId",
      );

      const result = logic.cards({ substring: "ohn smit" });

      assert.strictEqual(result, repositoryResult);
    });
  });

  describe("findNextCard", () => {
    it("should return repository result", () => {
      const now = new Date("2018-07-29T17:53:12.345Z");
      const logic = domainLogic(
        {
          ...unImplementedRepo,
          findNextCard: time =>
            time === now ? cardObjectReference : undefined,
        },
        () => now,
        () => "someId",
      );

      const result = logic.findNextCard();

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
        logic: domainLogic(
          {
            ...unImplementedRepo,
            readCard: id => (id === card.id ? card : undefined),
            updateCard: update => {
              repoArgs.updateArg = update;
              return cardObjectReference;
            },
          },
          () => now,
          () => "newUuid",
        ),
        repoArgs: repoArgs,
        now: now,
        card: card,
      };
    };

    it("setOk should work correctly when card found", () => {
      const setup = getSetup();

      setup.logic.setOk({ id: cardId });

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        state: "Ok",
        changeTime: setup.now,
        nextTime: addSeconds(setup.now, passedTime * 2),
      });
    });

    it("setFailed should work correctly when card found", () => {
      const setup = getSetup();

      setup.logic.setFailed({ id: setup.card.id });

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        state: "Failed",
        changeTime: setup.now,
        nextTime: addSeconds(setup.now, Math.floor(passedTime / 2)),
      });
    });

    it("setOk should work correctly when card not found", () => {
      const setup = getSetup();

      setup.logic.setOk({ id: "newUuid" });

      assert.strictEqual(setup.repoArgs.updateArg, "uncalled");
    });

    it("setFailed should work correctly when card not found", () => {
      const setup = getSetup();

      setup.logic.setFailed({ id: "newUuid" });

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
        logic: domainLogic(
          {
            ...unImplementedRepo,
            updateCard: update => {
              repoArgs.updateArg = update;
              return cardObjectReference;
            },
          },
          () => now,
          () => "newUuid",
        ),
        repoArgs: repoArgs,
        now: now,
        card: card,
      };
    };

    it("enable should work correctly when card found", () => {
      const setup = getSetup();

      setup.logic.enable({ id: cardId });

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        disabled: false,
      });
    });

    it("disable should work correctly when card found", () => {
      const setup = getSetup();

      setup.logic.disable({ id: setup.card.id });

      assert.deepStrictEqual(setup.repoArgs.updateArg, {
        id: cardId,
        disabled: true,
      });
    });
  });
});
