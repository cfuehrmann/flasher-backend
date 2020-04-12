import * as fs from "fs";

import { Card, Repository } from "./types";

export const createFileRepositoryTools = (fileName: string) => {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  return { connect, createEmptyRepository };

  function connect(): Repository {
    const json = fs.readFileSync(fileName).toString();
    let data = JSON.parse(json, reviver) as Card[]; // Todo: runtime check if the type assertion is correct?

    return {
      createCard: async card => {
        const cardsWithSameId = data.filter(t => t.id === card.id);
        if (cardsWithSameId.length > 0) {
          throw new Error("Key already exists!");
        }
        data.push({ ...card });
        await writeJsonToFile(data);
      },

      readCard: async id => {
        const hits = data.filter(card => card.id === id);
        if (hits.length > 0) {
          return { ...hits[0] };
        }
      },

      updateCard: async ({
        id,
        prompt,
        solution,
        state,
        changeTime,
        nextTime,
        disabled,
      }) => {
        for (const card of data) {
          if (card.id !== id) {
            continue;
          }

          if (typeof prompt !== "undefined") {
            card.prompt = prompt;
          }
          if (typeof solution !== "undefined") {
            card.solution = solution;
          }
          if (typeof state !== "undefined") {
            card.state = state;
          }
          if (typeof changeTime !== "undefined") {
            card.changeTime = changeTime;
          }
          if (typeof nextTime !== "undefined") {
            card.nextTime = nextTime;
          }
          if (typeof disabled !== "undefined") {
            card.disabled = disabled;
          }

          await writeJsonToFile(data);

          return { ...card };
        }
      },

      deleteCard: async id => {
        data = data.filter(card => card.id !== id);
        await writeJsonToFile(data);
        return true; // leave open for later if we want to return false when the record does not exist
      },

      findCards: async substring =>
        data
          .filter(
            card =>
              card.prompt.toLowerCase().includes(substring.toLowerCase()) ||
              card.solution.toLowerCase().includes(substring.toLowerCase()),
          )
          .map(card => ({ ...card })),

      findNextCard: async time =>
        data
          // tslint:disable-next-line: strict-comparisons
          .filter(card => card.nextTime <= time && !card.disabled)
          .sort(
            (card1, card2) =>
              card1.nextTime.getTime() - card2.nextTime.getTime(),
          )[0],
    };
  }

  async function createEmptyRepository() {
    await writeJsonToFile([]);
  }

  async function writeJsonToFile(data: unknown) {
    await fs.promises.writeFile(fileName, JSON.stringify(data, undefined, 4));
  }

  function reviver(key: unknown, value: unknown) {
    return typeof value === "string" && dateFormat.test(value)
      ? new Date(value)
      : value;
  }
};
