export type DataBase = {
  createTest(test: Readonly<Test>): void;
  getTest(id: string): Test | undefined;
  findTests(substring: string): Test[];
  updateTest(test: Readonly<TestUpdate>): Test | undefined;
  findNextTest(time: Date): Test | undefined;
};

export type Test = { id: string } & TestUpdatables;
export type TestUpdate = { id: string } & Partial<TestUpdatables>;

type TestUpdatables = {
  prompt: string;
  solution: string;
  state: State;
  changeTime: Date;
  lastTicks: number;
  nextTime: Date;
};

export type State = 'New' | 'Ok' | 'Failed';
