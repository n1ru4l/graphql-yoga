import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { GraphQLExtensionDeclaration, loadConfig } from 'graphql-config'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { GraphQLServer } from 'graphql-yoga'

const terminateEvents = ['SIGINT', 'SIGTERM']

function registerTerminateHandler(callback: (eventName: string) => void) {
  for (const eventName of terminateEvents) {
    process.on(eventName, () => callback(eventName))
  }
}

export const YogaExtensions: GraphQLExtensionDeclaration = (api) => {
  const codeFileLoader = new CodeFileLoader()
  api.loaders.schema.register(codeFileLoader)
  api.loaders.documents.register(codeFileLoader)
  return {
    name: 'Yoga',
  }
}

export function graphqlYoga() {
  return yargs(hideBin(process.argv)).command<{ project: string }>(
    '$0',
    'Serves GraphQL over HTTP using your GraphQL Config',
    (builder) => {
      builder.option('project', {
        type: 'string',
        description: 'Project name',
      })
    },
    async ({ project = 'default' }) => {
      const config = await loadConfig({
        extensions: [YogaExtensions],
      })
      const projectConfig = config?.getProject(project)
      const schema = await projectConfig?.getSchema()
      if (!schema) {
        throw new Error(`Could not find schema for project ${project}`)
      }
      const documents = (await projectConfig?.getDocuments()) || []
      const defaultQuery: string = documents?.reduce(
        (allQueries, source) => `${allQueries}\n${source.rawSDL}`,
        '',
      )
      const graphQLServer = new GraphQLServer({
        schema,
        graphiql: {
          defaultQuery,
        },
      })
      await graphQLServer.start()

      registerTerminateHandler(() => {
        graphQLServer.stop()
      })
    },
  ).argv
}
