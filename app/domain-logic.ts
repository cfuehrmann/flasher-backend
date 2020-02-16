import { addMinutes, addSeconds, differenceInSeconds } from "date-fns";

import { AutoSaveRepository, Card, Repository, State } from "./types";

export type Dependencies = {
  repository: Repository;
  autoSaveRepository: AutoSaveRepository;
  getTimeAsDate: () => Date;
  createUuid: () => string;
};

export const create = ({
  repository,
  autoSaveRepository,
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
        ? updateMinor(repository, autoSaveRepository, id, prompt, solution)
        : updateMajor(
            repository,
            autoSaveRepository,
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

    saveSnapshot: async (card: Card, user: string) => {
      await autoSaveRepository.saveSnapshot(card);
    },

    deleteSnapshot: async ({  }: {}, user: string) => {
      await autoSaveRepository.deleteSnapshot();
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
  autoSaveRepository: AutoSaveRepository,
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
  await autoSaveRepository.deleteSnapshot();
  return result;
}

async function updateMinor(
  repository: Repository,
  autoSaveRepository: AutoSaveRepository,
  id: string,
  prompt: string,
  solution: string,
) {
  const result = repository.updateCard({
    id,
    prompt,
    solution,
  });
  await autoSaveRepository.deleteSnapshot();
  return result;
}
