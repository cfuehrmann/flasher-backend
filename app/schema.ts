import { buildSchema } from "graphql";

export const schema = buildSchema(`
    type Query {
      readCard(id: ID!): Card
      cards(substring: String!): [Card]
      findNextCard: Card
    },
    type Mutation {
      createCard(prompt: String!, solution: String!): Boolean
      updateCard(id: ID!, prompt: String, solution: String, isMinor: Boolean): Card
      deleteCard(id: ID!): Boolean
      setOk(id: ID!): Boolean
      setFailed(id: ID!): Boolean
    },
    type Card {
      id: ID!
      prompt: String!
      solution: String!
      state: String!
      changeTime: String!
      nextTime: String!
    }
  `);
