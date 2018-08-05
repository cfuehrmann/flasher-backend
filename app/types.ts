export type DataBase = Readonly<{
  createTest(test: Readonly<Test>): void;
  getTest(id: string): Test | undefined;
  findTests(subString: string): Test[];
  updateTest(test: Readonly<PartialTest>): Test | undefined;
  findNextTest(time: Date): Test | undefined;
}>;

export type Test = {
  id: string;
  prompt: string;
  solution: string;
  state: State;
  changeTime: Date;
  lastTicks: number;
  nextTime: Date;
};

// todo: interface vs. type
// todo: call PartialTest TestChange or something like that?
// todo: default imports vs. the other ones
export type PartialTest = {
  id: string;
  prompt?: string;
  solution?: string;
  state?: State;
  changeTime?: Date;
  lastTicks?: number;
  nextTime?: Date;
};

export type State = 'New' | 'Ok' | 'Failed';
