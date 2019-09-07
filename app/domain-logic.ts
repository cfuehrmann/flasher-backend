import { addMinutes, addSeconds, differenceInSeconds } from "date-fns";

import { Repository, State } from "./types";

export type Dependencies = {
  repository: Repository;
  getTime: () => Date;
  createUuid: () => string;
};

export const create = ({ repository, getTime, createUuid }: Dependencies) => {
  return {
    createCard: ({
      prompt,
      solution,
    }: {
      prompt: string;
      solution: string;
    }) => {
      const now = getTime();

      repository.createCard({
        id: createUuid(),
        prompt,
        solution,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
        disabled: true,
      });
    },

    readCard: ({ id }: { id: string }) => repository.readCard(id),

    updateCard: ({
      id,
      prompt,
      solution,
      isMinor,
    }: {
      id: string;
      prompt: string;
      solution: string;
      isMinor: boolean;
    }) => {
      if (isMinor) {
        return repository.updateCard({
          id,
          prompt,
          solution,
        });
      }

      const now = getTime();

      return repository.updateCard({
        id,
        prompt,
        solution,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 30),
      });
    },

    deleteCard: ({ id }: { id: string }) => repository.deleteCard(id),

    cards: ({ substring }: { substring: string }) =>
      repository.findCards(substring),

    findNextCard: () => repository.findNextCard(getTime()),

    setOk: ({ id }: { id: string }) => {
      setState(id, "Ok", passedTime => passedTime * 2);
    },

    setFailed: ({ id }: { id: string }) => {
      setState(id, "Failed", passedTime => Math.floor(passedTime / 2));
    },

    enable: ({ id }: { id: string }) => {
      repository.updateCard({
        id,
        disabled: false,
      });
    },

    disable: ({ id }: { id: string }) => {
      repository.updateCard({
        id,
        disabled: true,
      });
    },
  };

  function setState(
    id: string,
    state: State,
    getTimeToWait: (passedTime: number) => number,
  ) {
    const card = repository.readCard(id);

    if (typeof card === "undefined") {
      return;
    }

    const now = getTime();
    const passedTime = differenceInSeconds(now, card.changeTime);

    repository.updateCard({
      id,
      state,
      changeTime: now,
      nextTime: addSeconds(now, getTimeToWait(passedTime)),
    });
  }
};
