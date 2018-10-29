import { buildSchema } from "graphql";

export const schema = buildSchema(`
    type Query {
      card(id: ID!): Card
      cards(substring: String!): [Card]
      findNextCard: Card
    },
    type Mutation {
      createCard(prompt: String!, solution: String!): Boolean
      updateCard(id: ID!, prompt: String, solution: String, isMinor: Boolean): Card
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
