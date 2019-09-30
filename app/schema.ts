import { gql } from "apollo-server";

export const schema = gql`
  type Query {
    login(userName: String!, password: String!): Boolean
    readCard(id: ID!): Card
    cards(substring: String!): [Card]
    findNextCard: Card
  }
  type Mutation {
    createCard(prompt: String!, solution: String!): Boolean
    updateCard(
      id: ID!
      prompt: String
      solution: String
      isMinor: Boolean
    ): Card
    deleteCard(id: ID!): Boolean
    setOk(id: ID!): Boolean
    setFailed(id: ID!): Boolean
    enable(id: ID!): Boolean
    disable(id: ID!): Boolean
  }
  type Card {
    id: ID!
    prompt: String!
    solution: String!
    state: String!
    changeTime: String!
    nextTime: String!
    disabled: Boolean!
  }
`;
