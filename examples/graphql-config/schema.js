const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql')

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      ping: {
        type: GraphQLString,
        resolve: () => 'pong',
      },
    }),
  })
})