import { createServer } from '@graphql-yoga/node'
import { Readable } from 'stream'
import fastify from 'fastify'

export function buildApp(logging = true) {
  const app = fastify({ logger: logging })

  const graphQLServer = createServer({
    schema: {
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
        type Mutation {
          hello: String
        }
        type Subscription {
          countdown(from: Int!, interval: Int!): Int!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
        },
        Mutation: {
          hello: () => 'world',
        },
        Subscription: {
          countdown: {
            subscribe: async function* (_, { from, interval }) {
              for (let i = from; i >= 0; i--) {
                await new Promise((resolve) =>
                  setTimeout(resolve, interval ?? 1000),
                )
                yield { countdown: i }
              }
            },
          },
        },
      },
    },
    // Integrate Fastify Logger to Yoga
    logging: app.log,
  })

  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await graphQLServer.handleIncomingMessage(req)
      for (const [name, value] of response.headers) {
        reply.header(name, value)
      }

      reply.status(response.status)
      const nodeStream = Readable.from(response.body)
      reply.send(nodeStream)
    },
  })

  return app
}
