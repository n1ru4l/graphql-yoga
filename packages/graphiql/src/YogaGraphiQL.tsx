import React from 'react'
import copyToClipboard from 'copy-to-clipboard'
import { GraphiQL, Fetcher } from 'graphiql'
import {
  LoadFromUrlOptions,
  SubscriptionProtocol,
  UrlLoader,
} from '@graphql-tools/url-loader'
import { DocumentNode, GraphQLSchema, Kind, parse } from 'graphql'
import GraphiQLExplorer from 'graphiql-explorer'
import 'graphiql/graphiql.css'
import './styles.css'
import { YogaLogo } from './YogaLogo'

const getOperationWithFragments = (
  document: DocumentNode,
  operationName: string,
): DocumentNode => {
  const definitions = document.definitions.filter((definition) => {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      if (operationName) {
        if (definition.name?.value !== operationName) {
          return false
        }
      }
    }
    return true
  })

  return {
    kind: Kind.DOCUMENT,
    definitions,
  }
}

export type YogaGraphiQLProps = {
  [key: string]: any
  endpoint?: string
}

export function YogaGraphiQL(props: YogaGraphiQLProps): React.ReactElement {
  const endpoint = props.endpoint ?? '/graphql'
  const graphiqlRef = React.useRef<GraphiQL | null>(null)

  const [urlLoader] = React.useState(() => new UrlLoader())

  const fetcher: Fetcher = React.useMemo(() => {
    const options: LoadFromUrlOptions = {
      subscriptionsProtocol: SubscriptionProtocol.SSE,
      specifiedByUrl: true,
      directiveIsRepeatable: true,
      schemaDescription: true,
    }

    const executor$ = urlLoader.getExecutorAsync(endpoint, options)
    return async (graphQLParams, opts) => {
      const document = getOperationWithFragments(
        parse(graphQLParams.query),
        graphQLParams.operationName,
      )

      const executor = await executor$

      return executor({
        document,
        operationName: graphQLParams.operationName,
        variables: graphQLParams.variables,
        extensions: {
          headers: opts?.headers,
        },
      }) as ReturnType<Fetcher>
    }
  }, [])

  const [showExplorer, setShowExplorer] = React.useState(false)
  const [schema, setSchema] = React.useState<GraphQLSchema | null>(null)
  const [query, setQuery] = React.useState<string>('')

  return (
    <div className="graphiql-container">
      {schema ? (
        <GraphiQLExplorer
          schema={schema}
          query={query}
          onEdit={(query: string) => setQuery(query)}
          explorerIsOpen={showExplorer}
          onToggleExplorer={() => setShowExplorer((isOpen) => !isOpen)}
        />
      ) : null}
      <GraphiQL
        {...props}
        ref={graphiqlRef}
        fetcher={fetcher}
        headerEditorEnabled={true}
        defaultVariableEditorOpen={true}
        toolbar={{
          additionalContent: (
            <>
              <button
                className="toolbar-button"
                onClick={() => {
                  const state = graphiqlRef.current?.state

                  copyToClipboard(
                    urlLoader.prepareGETUrl({
                      baseUrl: window.location.href,
                      query: state?.query || '',
                      variables: state?.variables,
                      operationName: state?.operationName,
                    }),
                  )
                }}
              >
                Copy Link
              </button>
            </>
          ),
        }}
        onSchemaChange={(schema) => {
          setSchema(schema)
        }}
        query={query}
        onEditQuery={(query) => typeof query === 'string' && setQuery(query)}
        leftDocExplorerContent={
          schema ? (
            showExplorer ? null : (
              <button
                className="docExplorerShow docExplorerShowReverse"
                onClick={() => setShowExplorer((isOpen) => !isOpen)}
              >
                Explorer
              </button>
            )
          ) : null
        }
      >
        <GraphiQL.Logo>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, display: 'flex' }}>
              <YogaLogo />
            </div>
            <span>
              {'Yoga Graph'}
              <em>{'i'}</em>
              {'QL'}
            </span>
          </div>
        </GraphiQL.Logo>
      </GraphiQL>
    </div>
  )
}
