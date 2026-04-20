import { buildSchema } from 'graphql';

export const schema = buildSchema(`
    type Note {
    id: ID!
    userId: String!
    albumId: String!
    trackId: String!
    text: String!
    createdAt: String!
  }
    type Query {
    notes(trackId: String, albumId: String, userId: String): [Note!]!
    updateNote(id: ID!, requesting_user_id: String!, text: String!): Note!
    deleteNote(id: ID!, requesting_user_id: String!): Boolean!
    
    startGenerator: String!
    stopGenerator: String!
    }
    type Mutation {
    createNote(userId: String!, albumId: String!, trackId: String!, text: String!): Note!
    updateNote(id: ID!, requesting_user_id: String!, text: String!): Note!
    deleteNote(id: ID!, requesting_user_id: String!): Boolean!
  }
    `);