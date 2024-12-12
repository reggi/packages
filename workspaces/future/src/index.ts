const CACHE_NOT_SET = Symbol('CACHE_NOT_SET')

export type UnwrapFuture<T> = T extends any ? (T extends Future<infer U, any> ? U : T) : never

export type ResolvedDeps<D extends readonly any[]> = {
  [K in keyof D]: UnwrapFuture<D[K]>
}

export type Operation<T, D extends readonly any[] = readonly any[]> = (...args: ResolvedDeps<D>) => T | Promise<T>

export class Future<T, const D extends readonly any[] = readonly any[]> {
  private operation: Operation<T, D>
  private dependencies: D
  private optionNoCache: boolean

  private value: T | typeof CACHE_NOT_SET
  private resolving: boolean = false
  private resolvePromise?: Promise<T>
  private clear = false

  constructor(operation: Operation<T, D>, dependencies?: D, optionNoCache: boolean = false) {
    this.operation = operation
    this.dependencies = Object.freeze(dependencies || ([] as unknown as D))
    this.optionNoCache = optionNoCache
    this.value = CACHE_NOT_SET
  }

  static resolve<T>(value: T | Future<T>): Future<T> {
    return value instanceof Future ? value : new Future(() => value)
  }

  static async resolveOperation<T, const D extends readonly any[] = readonly any[]>(
    operation: Operation<T, D>,
    dependencies: D,
  ): Promise<T> {
    const resolvedDependencies = await Promise.all(dependencies)
    return operation(...resolvedDependencies)
  }

  async cachedResolveOperation(operation: Operation<T, D>, dependencies: D): Promise<T> {
    const resolver = async () => {
      if (this.resolving) {
        return this.resolvePromise!
      }
      this.resolving = true
      try {
        if (this.optionNoCache) {
          return Future.resolveOperation(operation, dependencies)
        }
        this.value = await Future.resolveOperation(operation, dependencies)
        return this.value
      } finally {
        this.resolving = false
      }
    }
    if (this.value !== CACHE_NOT_SET && !this.clear) {
      return this.value
    }
    if (this.clear) this.clear = false
    this.resolvePromise = resolver()
    return this.resolvePromise
  }

  resolve({
    /** clears the cache */
    clear = false,
  } = {}): Promise<T> {
    if (clear) this.clear = true
    return this.cachedResolveOperation(this.operation, this.dependencies)
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.resolve().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult> {
    return this.resolve().catch(onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.resolve().finally(onfinally)
  }

  /** clones Future and deps with noCache, depth 0 is current Future */
  noCache(depth: number = 0) {
    const shouldNoCache = depth >= 0
    const shouldNoCacheDeps = depth > 0
    const clonedDependencies = shouldNoCacheDeps
      ? (this.dependencies.map(dep => {
          return dep instanceof Future ? dep.noCache(depth - 1) : dep
        }) as unknown as D)
      : this.dependencies
    return shouldNoCache ? new Future(this.operation, clonedDependencies, true) : this
  }

  /** clones Future and clears cache values, depth 0 is current Future */
  clone(depth: number = 0) {
    const shouldClone = depth >= 0
    const shouldCloneDeps = depth > 0
    const clonedDependencies = shouldCloneDeps
      ? (this.dependencies.map(dep => {
          return dep instanceof Future ? dep.clone(depth - 1) : dep
        }) as unknown as D)
      : this.dependencies
    return shouldClone ? new Future(this.operation, clonedDependencies) : this
  }

  /** creates a new future using this future as a dependency */
  use<TT, const D extends readonly any[] = readonly any[]>(
    operation: Operation<TT, [T, ...D]>,
    dependencies: D = [] as unknown as D,
  ) {
    return new Future<TT, [Future<T, D>, ...D]>(
      async (resolvedValue, ...args) => {
        return operation(resolvedValue as UnwrapFuture<T>, ...args)
      },
      [this as unknown as Future<T, D>, ...(dependencies as D)],
    )
  }

  /** updates future value */
  update<const D extends readonly any[] = readonly any[]>(
    operation: Operation<T, [T, ...D]>,
    dependencies: D = [] as unknown as D,
  ) {
    const originalOperation = this.operation
    this.operation = async () => {
      const currentValue =
        this.value !== CACHE_NOT_SET ? this.value : await Future.resolveOperation(originalOperation, this.dependencies)
      return Future.resolveOperation(operation, [currentValue, ...dependencies])
    }
    this.clear = true
    return this
  }
}
