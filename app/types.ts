export type Repository = {
  createCard(card: Readonly<Card>): Promise<void>;
  readCard(id: string): Promise<Card | undefined>;
  updateCard(update: Readonly<CardUpdate>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<boolean>;
  findCards(substring: string): Promise<Card[]>;
  findNextCard(time: Date): Promise<Card | undefined>;
};

export type CredentialsRepository = {
  getPasswordHash(userName: string): string | undefined;
};

export type AutoSaveWriter = {
  write(card: Card): Promise<void>;
  delete(): Promise<void>;
};

export type AutoSaveRepository = AutoSaveWriter & {
  read(): Promise<AutoSave | undefined>;
};

export type AutoSave = { id: string; prompt: string; solution: string };

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
