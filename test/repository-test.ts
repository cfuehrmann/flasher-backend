import * as assert from "assert";
import { Card, Repository } from "../app/types";
import { repositoryTools } from "./test-config";

const card0 = Object.freeze<Card>({
  id: "0",
  prompt: "promptA0",
  solution: "solutionA0",
  state: "New",
  changeTime: new Date("2018-01-01T18:25:24.000"),
  nextTime: new Date("2018-02-01T18:25:24.000"),
});

const card1 = Object.freeze<Card>({
  id: "1",
  prompt: "promptA1",
  solution: "solutionB1",
  state: "Ok",
  changeTime: new Date("2018-01-01T18:25:24.001"),
  nextTime: new Date("2018-02-01T18:25:24.001"),
});

const card2 = Object.freeze<Card>({
  id: "2",
  prompt: "promptB2",
  solution: "solutionB2",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.002"),
  nextTime: new Date("2018-02-01T18:25:24.002"),
});

const card1Changed = Object.freeze<Card>({
  id: "1",
  prompt: card1.prompt + "_changed",
  solution: card1.solution + "_changed",
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
  describe("createCard", () => {
    it("should create cards that can be retrieved", () => {
      repository.createCard(card0);
      repository.createCard(card1);
      const foundCard0 = repository.readCard("0");
      const foundCard1 = repository.readCard("1");

      assert.deepStrictEqual(foundCard0, card0);
      assert.deepStrictEqual(foundCard1, card1);
    });

    it("should create cards that can be retrieved through new connection", () => {
      repository.createCard(card0);
      repository.createCard(card1);
      const newRepository = repositoryTools.connect();
      const foundCard0 = newRepository.readCard("0");
      const foundCard1 = newRepository.readCard("1");

      assert.deepStrictEqual(foundCard0, card0);
      assert.deepStrictEqual(foundCard1, card1);
    });

    it("should prevent duplicate keys", () => {
      repository.createCard(card0);
      assert.throws(
        () => {
          repository.createCard({ ...card1, id: card0.id });
        },
        (err: unknown) =>
          err instanceof Error && err.message.toLowerCase().includes("key"),
      );
    });
  });

  describe("readCard", () => {
    beforeEach(() => {
      repository.createCard(card0);
      repository.createCard(card1);
      repository.createCard(card2);
    });

    it("should return correct data when id found", () => {
      const result = repository.readCard(card1.id);

      assert.deepStrictEqual(result, card1);
    });

    it("should return undefined when id not found", () => {
      const result = repository.readCard("999");

      assert.strictEqual(result, undefined);
    });

    it("should return copies", () => {
      const result1 = repository.readCard(card1.id);
      const result2 = repository.readCard(card1.id);

      assert.notStrictEqual(result1, result2);
    });
  });

  describe("updateCard", () => {
    beforeEach(() => {
      repository.createCard(card0);
      repository.createCard(card1);
      repository.createCard(card2);
    });

    it("should change the repository", () => {
      repository.updateCard(card1Changed);
      const foundCard = repository.readCard(card1Changed.id);

      assert.deepStrictEqual(foundCard, card1Changed);
    });

    it("should change the repository persistently", () => {
      repository.updateCard(card1Changed);
      const newRepository = repositoryTools.connect();
      const foundCard = newRepository.readCard(card1Changed.id);

      assert.deepStrictEqual(foundCard, card1Changed);
    });

    it("should return changed data when id found", () => {
      const result = repository.updateCard(card1Changed);

      assert.deepStrictEqual(result, card1Changed);
    });

    it("should return undefined when id not found", () => {
      const result = repository.updateCard({ ...card1Changed, id: "999" });

      assert.strictEqual(result, undefined);
    });

    it("should not update when value undefined", () => {
      const result = repository.updateCard({ id: "1" });

      assert.deepStrictEqual(result, card1);
    });

    it("should return copies", () => {
      const result1 = repository.updateCard(card1Changed);
      const result2 = repository.updateCard(card1Changed);

      assert.notStrictEqual(result1, result2);
    });

    // Todo: what if e.g. card from createCard is changed?
  });

  describe("delete", () => {
    beforeEach(() => {
      repository.createCard(card0);
    });

    it("should delete existing cards", () => {
      repository.deleteCard(card0.id);

      const foundCard = repository.readCard(card1Changed.id);
      assert.strictEqual(undefined, foundCard);
    });

    it("should not crash on non-existing cards", () => {
      repository.deleteCard(card1.id);
    });
  });

  describe("findCards", () => {
    beforeEach(() => {
      repository.createCard(card0);
      repository.createCard(card1);
      repository.createCard(card2);
    });

    it("should return cards whose prompts contain substring", () => {
      const result = repository.findCards("rOmptA");

      const lookup: { [key: string]: Card } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["0"], card0);
      assert.deepStrictEqual(lookup["1"], card1);
    });

    it("should return cards whose solution contain substring", () => {
      const result = repository.findCards("tionB");

      const lookup: { [key: string]: Card } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["1"], card1);
      assert.deepStrictEqual(lookup["2"], card2);
    });

    it("should return copies", () => {
      const result1 = repository.findCards("promptB");
      const result2 = repository.findCards("promptB");

      assert.notStrictEqual(result1[0], result2[0]);
    });
  });

  describe("findNextCard", () => {
    const nextCard = Object.freeze({
      ...card0,
      nextTime: new Date("2018-01-01T18:25:24.000"),
    });

    beforeEach(() => {
      repository.createCard({
        ...card0,
        id: "1",
        nextTime: new Date("2018-01-01T18:25:24.001"),
      });
      repository.createCard(nextCard);
      repository.createCard({
        ...card0,
        id: "2",
        nextTime: new Date("2018-01-01T18:25:24.002"),
      });
      repository.createCard({
        ...card0,
        id: "3",
        nextTime: new Date("2018-01-01T18:25:24.003"),
      });
    });

    it("should return next card when found", () => {
      const result = repository.findNextCard(
        new Date("2018-01-01T18:25:24.002"),
      );

      assert.deepStrictEqual(result, nextCard);
    });

    it("should return next card when just found", () => {
      const result = repository.findNextCard(
        new Date("2018-01-01T18:25:24.000"),
      );

      assert.deepStrictEqual(result, nextCard);
    });

    it("should return undefined when just missed", () => {
      const result = repository.findNextCard(
        new Date("2018-01-01T18:25:23.999"),
      );

      assert.strictEqual(result, undefined);
    });
  });
});
