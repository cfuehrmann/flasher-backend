import { addMinutes, addSeconds, differenceInSeconds } from "date-fns";

import { AutoSaveWriter, Card, Repository, State } from "./types";

export type Dependencies = {
  repository: Repository;
  autoSaveWriter: AutoSaveWriter;
  getTimeAsDate: () => Date;
  createUuid: () => string;
};

export const create = ({
  repository,
  autoSaveWriter,
  getTimeAsDate,
  createUuid,
}: Dependencies) => {
  return {
    createCard: async (
      {
        prompt,
        solution,
      }: {
        prompt: string;
        solution: string;
      },
      user: string,
    ) => {
      const now = getTimeAsDate();

      await repository.createCard({
        id: createUuid(),
        prompt,
        solution,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
        disabled: true,
      });
    },

    readCard: async ({ id }: { id: string }, user: string) =>
      repository.readCard(id),

    updateCard: async (
      {
        id,
        prompt,
        solution,
        isMinor,
      }: {
        id: string;
        prompt: string;
        solution: string;
        isMinor: boolean;
      },
      user: string,
    ) =>
      isMinor
        ? updateMinor(repository, autoSaveWriter, id, prompt, solution)
        : updateMajor(
            repository,
            autoSaveWriter,
            id,
            prompt,
            solution,
            getTimeAsDate,
          ),

    deleteCard: async ({ id }: { id: string }, user: string) =>
      repository.deleteCard(id),

    cards: async ({ substring }: { substring: string }, user: string) =>
      repository.findCards(substring),

    findNextCard: async ({  }: {}, user: string) =>
      repository.findNextCard(getTimeAsDate()),

    setOk: async ({ id }: { id: string }, user: string) => {
      await setState(id, "Ok", passedTime => passedTime * 2);
    },

    setFailed: async ({ id }: { id: string }, user: string) => {
      await setState(id, "Failed", passedTime => Math.floor(passedTime / 2));
    },

    enable: async ({ id }: { id: string }, user: string) => {
      await repository.updateCard({
        id,
        disabled: false,
      });
    },

    disable: async ({ id }: { id: string }, user: string) => {
      await repository.updateCard({
        id,
        disabled: true,
      });
    },

    writeAutoSave: async (card: Card, user: string) => {
      await autoSaveWriter.write(card);
    },

    deleteAutoSave: async ({  }: {}, user: string) => {
      await autoSaveWriter.delete();
    },
  };

  async function setState(
    id: string,
    state: State,
    getTimeToWait: (passedTime: number) => number,
  ) {
    const card = await repository.readCard(id);

    if (typeof card === "undefined") {
      return;
    }

    const now = getTimeAsDate();
    const passedTime = differenceInSeconds(now, card.changeTime);

    await repository.updateCard({
      id,
      state,
      changeTime: now,
      nextTime: addSeconds(now, getTimeToWait(passedTime)),
    });
  }
};

async function updateMajor(
  repository: Repository,
  autoSaveWriter: AutoSaveWriter,
  id: string,
  prompt: string,
  solution: string,
  getTimeAsDate: () => Date,
) {
  const now = getTimeAsDate();
  const result = repository.updateCard({
    id,
    prompt,
    solution,
    state: "New",
    changeTime: now,
    nextTime: addMinutes(now, 30),
  });
  await autoSaveWriter.delete();
  return result;
}

async function updateMinor(
  repository: Repository,
  autoSaveWriter: AutoSaveWriter,
  id: string,
  prompt: string,
  solution: string,
) {
  const result = repository.updateCard({
    id,
    prompt,
    solution,
  });
  await autoSaveWriter.delete();
  return result;
}
