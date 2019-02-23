export type Repository = {
  createCard(card: Readonly<Card>): void;
  getCard(id: string): Card | undefined;
  updateCard(update: Readonly<CardUpdate>): Card | undefined;
  deleteCard(id: string): boolean;
  findCards(substring: string): Card[];
  findNextCard(time: Date): Card | undefined;
};

export type Card = { id: string } & CardUpdatables;
export type CardUpdate = { id: string } & Partial<CardUpdatables>;

type CardUpdatables = {
  prompt: string;
  solution: string;
  state: State;
  changeTime: Date;
  nextTime: Date;
};

export type State = "New" | "Ok" | "Failed";
