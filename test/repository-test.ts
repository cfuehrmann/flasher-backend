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
  disabled: false,
});

const card1 = Object.freeze<Card>({
  id: "1",
  prompt: "promptA1",
  solution: "solutionB1",
  state: "Ok",
  changeTime: new Date("2018-01-01T18:25:24.001"),
  nextTime: new Date("2018-02-01T18:25:24.001"),
  disabled: true,
});

const card2 = Object.freeze<Card>({
  id: "2",
  prompt: "promptB2",
  solution: "solutionB2",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.002"),
  nextTime: new Date("2018-02-01T18:25:24.002"),
  disabled: true,
});

const card1Changed = Object.freeze<Card>({
  id: "1",
  prompt: card1.prompt + "_changed",
  solution: card1.solution + "_changed",
  state: "Failed",
  changeTime: new Date("2018-01-01T18:25:24.003"),
  nextTime: new Date("2018-02-01T18:25:24.003"),
  disabled: false,
});

let repository: Repository;

beforeEach(async () => {
  await repositoryTools.createEmptyRepository();
  repository = repositoryTools.connect();
});

describe("repository", () => {
  describe("createCard", () => {
    it("should create cards that can be retrieved", async () => {
      await repository.createCard(card0);
      await repository.createCard(card1);
      const foundCard0 = await repository.readCard("0");
      const foundCard1 = await repository.readCard("1");

      assert.deepStrictEqual(foundCard0, card0);
      assert.deepStrictEqual(foundCard1, card1);
    });

    it("should create cards that can be retrieved through new connection", async () => {
      await repository.createCard(card0);
      await repository.createCard(card1);
      const newRepository = repositoryTools.connect();
      const foundCard0 = await newRepository.readCard("0");
      const foundCard1 = await newRepository.readCard("1");

      assert.deepStrictEqual(foundCard0, card0);
      assert.deepStrictEqual(foundCard1, card1);
    });

    it("should prevent duplicate keys", async () => {
      await repository.createCard(card0);
      await assert.rejects(
        async () => {
          await repository.createCard({ ...card1, id: card0.id });
        },
        (err: unknown) =>
          err instanceof Error && err.message.toLowerCase().includes("key"),
      );
    });
  });

  describe("readCard", () => {
    beforeEach(async () => {
      await repository.createCard(card0);
      await repository.createCard(card1);
      await repository.createCard(card2);
    });

    it("should return correct data when id found", async () => {
      const result = await repository.readCard(card1.id);

      assert.deepStrictEqual(result, card1);
    });

    it("should return undefined when id not found", async () => {
      const result = await repository.readCard("999");

      assert.strictEqual(result, undefined);
    });

    it("should return copies", async () => {
      const result1 = await repository.readCard(card1.id);
      const result2 = await repository.readCard(card1.id);

      assert.notStrictEqual(result1, result2);
    });
  });

  describe("updateCard", () => {
    beforeEach(async () => {
      await repository.createCard(card0);
      await repository.createCard(card1);
      await repository.createCard(card2);
    });

    it("should change the repository", async () => {
      await repository.updateCard(card1Changed);
      const foundCard = await repository.readCard(card1Changed.id);

      assert.deepStrictEqual(foundCard, card1Changed);
    });

    it("should change the repository persistently", async () => {
      await repository.updateCard(card1Changed);
      const newRepository = repositoryTools.connect();
      const foundCard = await newRepository.readCard(card1Changed.id);

      assert.deepStrictEqual(foundCard, card1Changed);
    });

    it("should return changed data when id found", async () => {
      const result = await repository.updateCard(card1Changed);

      assert.deepStrictEqual(result, card1Changed);
    });

    it("should return undefined when id not found", async () => {
      const result = await repository.updateCard({
        ...card1Changed,
        id: "999",
      });

      assert.strictEqual(result, undefined);
    });

    it("should not update when value undefined", async () => {
      const result = await repository.updateCard({ id: "1" });

      assert.deepStrictEqual(result, card1);
    });

    it("should return copies", async () => {
      const result1 = await repository.updateCard(card1Changed);
      const result2 = await repository.updateCard(card1Changed);

      assert.notStrictEqual(result1, result2);
    });

    // Todo: what if e.g. card from createCard is changed?
  });

  describe("delete", () => {
    beforeEach(async () => {
      await repository.createCard(card0);
    });

    it("should change the repository", async () => {
      await repository.deleteCard(card0.id);

      const foundCard = await repository.readCard(card0.id);
      assert.strictEqual(undefined, foundCard);
    });

    it("should change the repository persistently", async () => {
      await repository.deleteCard(card0.id);

      const newRepository = repositoryTools.connect();
      const foundCard = await newRepository.readCard(card0.id);
      assert.strictEqual(undefined, foundCard);
    });

    it("should not crash on non-existing cards", async () => {
      await repository.deleteCard(card1.id);
    });
  });

  describe("findCards", () => {
    beforeEach(async () => {
      await repository.createCard(card0);
      await repository.createCard(card1);
      await repository.createCard(card2);
    });

    it("should return cards whose prompts contain substring", async () => {
      const result = await repository.findCards("rOmptA");

      const lookup: { [key: string]: Card } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["0"], card0);
      assert.deepStrictEqual(lookup["1"], card1);
    });

    it("should return cards whose solution contain substring", async () => {
      const result = await repository.findCards("tionB");

      const lookup: { [key: string]: Card } = {};

      for (const record of result) {
        lookup[record.id] = record;
      }

      assert.strictEqual(Object.keys(lookup).length, 2);
      assert.deepStrictEqual(lookup["1"], card1);
      assert.deepStrictEqual(lookup["2"], card2);
    });

    it("should return copies", async () => {
      const result1 = await repository.findCards("promptB");
      const result2 = await repository.findCards("promptB");

      assert.notStrictEqual(result1[0], result2[0]);
    });
  });

  describe("findNextCard", () => {
    const nextCard = Object.freeze({
      ...card0,
      nextTime: new Date("2018-01-01T18:25:24.000"),
    });

    beforeEach(async () => {
      await repository.createCard({
        ...card0,
        id: "9",
        nextTime: new Date("2018-01-01T18:25:23.999"),
        disabled: true,
      });
      await repository.createCard({
        ...card0,
        id: "1",
        nextTime: new Date("2018-01-01T18:25:24.001"),
      });
      await repository.createCard(nextCard);
      await repository.createCard({
        ...card0,
        id: "2",
        nextTime: new Date("2018-01-01T18:25:24.002"),
      });
      await repository.createCard({
        ...card0,
        id: "3",
        nextTime: new Date("2018-01-01T18:25:24.003"),
      });
    });

    it("should return next enabled card when found", async () => {
      const result = await repository.findNextCard(
        new Date("2018-01-01T18:25:24.002"),
      );

      assert.deepStrictEqual(result, nextCard);
    });

    it("should return next enabled card when just found", async () => {
      const result = await repository.findNextCard(
        new Date("2018-01-01T18:25:24.000"),
      );

      assert.deepStrictEqual(result, nextCard);
    });

    it("should return undefined when just missed", async () => {
      const result = await repository.findNextCard(
        new Date("2018-01-01T18:25:23.999"),
      );

      assert.strictEqual(result, undefined);
    });
  });
});
