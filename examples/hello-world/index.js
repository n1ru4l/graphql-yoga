const { GraphQLServer } = require('graphql-yoga')

const typeDefs = /* GraphQL */`
  type Query {
    hello(name: String): String!
  }
  type Subscription {
    count(to: Int!): Int!
  }
`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
  },
  Subscription: {
    count: {
      subscribe: async function* (_, { to }) {
        for (let i = 0; i <= to; i++) {
          yield { count: i };
          console.log({ count: i })
          sleep(1000);
        }
      }
    },
  }
}

const server = new GraphQLServer({ typeDefs, resolvers })

server.start()
