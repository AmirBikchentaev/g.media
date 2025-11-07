export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum TaskStatus {
    pending
    in_progress
    done
  }

  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: String!
    status: TaskStatus!
  }

  type Query {
    getTask(id: ID!): Task
    getTasks(status: TaskStatus): [Task!]!
  }

  type Mutation {
    createTask(
      title: String!
      description: String
      dueDate: String!
      status: TaskStatus
    ): Task!

    updateTask(
      id: ID!
      title: String
      description: String
      status: TaskStatus
    ): Task
  }
`;
