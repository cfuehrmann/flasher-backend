import * as fs from "fs";
import { Card, Repository } from "./types";

export const createFileRepositoryTools = (fileName: string) => {
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

  return { connect: connect, createEmptyRepository: createEmptyRepository };

  function connect(): Repository {
    const json = fs.readFileSync(fileName).toString();
    const data = JSON.parse(json, reviver) as Card[]; // Todo: runtime check if the type assertion is correct?

    return {
      createCard: card => {
        const cardsWithSameId = data.filter(t => t.id === card.id);
        if (cardsWithSameId.length > 0) {
          throw new Error("Key already exists!");
        }
        data.push({ ...card });
        writeJsonToFile(data);
      },

      getCard: id => {
        const hits = data.filter(card => card.id === id);
        if (hits.length > 0) {
          return { ...hits[0] };
        }
      },

      findCards: substring =>
        data
          .filter(
            card =>
              card.prompt.includes(substring) ||
              card.solution.includes(substring),
          )
          .map(card => ({ ...card })),

      updateCard: ({ id, prompt, solution, state, changeTime, nextTime }) => {
        for (const card of data) {
          if (card.id !== id) {
            continue;
          }

          if (prompt !== undefined) {
            card.prompt = prompt;
          }
          if (solution !== undefined) {
            card.solution = solution;
          }
          if (state !== undefined) {
            card.state = state;
          }
          if (changeTime !== undefined) {
            card.changeTime = changeTime;
          }
          if (nextTime !== undefined) {
            card.nextTime = nextTime;
          }

          writeJsonToFile(data);

          return { ...card };
        }
      },

      findNextCard: time =>
        data
          .filter(card => card.nextTime <= time)
          .sort(
            (card1, card2) =>
              card1.nextTime.getTime() - card2.nextTime.getTime(),
          )[0],
    };
  }

  function createEmptyRepository() {
    writeJsonToFile([]);
  }

  function writeJsonToFile(data: unknown) {
    fs.writeFileSync(fileName, JSON.stringify(data, undefined, 4));
  }

  function reviver(key: unknown, value: unknown) {
    return typeof value === "string" && dateFormat.test(value)
      ? new Date(value)
      : value;
  }
};
