import { buildSchema } from "graphql";

export const schema = buildSchema(`
    type Query {
      test(id: ID!): Test
      tests(substring: String!): [Test]
      findNextTest: Test
    },
    type Mutation {
      createTest(prompt: String!, solution: String!) : Boolean
      updateTest(id: ID!, prompt: String, solution: String, isMinor: Boolean): Test
    },
    type Test {
      id: ID!
      prompt: String!
      solution: String!
      state: String!
      changeTime: String!
      nextTime: String!
    }
  `);
