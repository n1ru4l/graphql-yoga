import { Injectable, Inject, CONTEXT, Scope } from 'graphql-modules'
import { inspect } from 'util'

@Injectable({
  scope: Scope.Operation,
  global: true,
})
export class BasicProvider {
  constructor(@Inject(CONTEXT) private ctx: { request: Request }) {}

  public getContextKeys(): string[] {
    if (!this.ctx) {
      throw new Error(
        `Expected context to be defined but got: ${inspect(this.ctx)}`,
      )
    }
    return Object.keys(this.ctx)
  }
}
