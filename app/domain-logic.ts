import { addMinutes, addSeconds, differenceInSeconds } from "date-fns";
import { Repository, State } from "./types";

export const domainLogic = (
  repository: Repository,
  getTime: () => Date,
  createUuid: () => string,
) => {
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
        prompt: prompt,
        solution: solution,
        state: "New",
        changeTime: now,
        nextTime: addMinutes(now, 10),
      });
    },

    card: ({ id }: { id: string }) => repository.readCard(id),

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
          id: id,
          prompt: prompt,
          solution: solution,
        });
      }

      const now = getTime();

      return repository.updateCard({
        id: id,
        prompt: prompt,
        solution: solution,
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
  };

  function setState(
    id: string,
    state: State,
    getTimeToWait: (passedTime: number) => number,
  ) {
    const card = repository.readCard(id);

    if (card === undefined) {
      return;
    }

    const now = getTime();
    const passedTime = differenceInSeconds(now, card.changeTime);

    repository.updateCard({
      id: id,
      state: state,
      changeTime: now,
      nextTime: addSeconds(now, getTimeToWait(passedTime)),
    });
  }
};
