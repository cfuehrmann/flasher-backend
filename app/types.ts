export type Repository = {
  createCard(card: Readonly<Card>): void;
  readCard(id: string): Card | undefined;
  updateCard(update: Readonly<CardUpdate>): Card | undefined;
  deleteCard(id: string): boolean;
  findCards(substring: string): Card[];
  findNextCard(time: Date): Card | undefined;
};

export type CredentialsRepository = {
  getPasswordHash(userName: string): string | undefined;
};

export type AutoSaveRepository = {
  saveSnapshot(card: Card): Promise<void>;
  deleteSnapshot(): Promise<void>;
};

export type Card = { id: string } & CardUpdatables;
export type CardUpdate = { id: string } & Partial<CardUpdatables>;

type CardUpdatables = {
  prompt: string;
  solution: string;
  state: State;
  changeTime: Date;
  nextTime: Date;
  disabled: boolean;
};

export type State = "New" | "Ok" | "Failed";
