import {Future} from './index.ts'

type FuturifyArgs<Args extends any[]> = {
  [K in keyof Args]: Args[K] | Future<Args[K]>
}

type FuturifyReturn<R> = R extends Promise<infer U> ? Future<U> : Future<R>

type FuturifyOverload<F extends (...args: any[]) => any> = (
  ...args: FuturifyArgs<Parameters<F>>
) => FuturifyReturn<ReturnType<F>>

type Futurified<F> = F extends {
  (...args: infer A1): infer R1
  (...args: infer A2): infer R2
  (...args: infer A3): infer R3
  (...args: infer A4): infer R4
  (...args: infer A5): infer R5
}
  ? FuturifyOverload<(...args: A1) => R1> &
      FuturifyOverload<(...args: A2) => R2> &
      FuturifyOverload<(...args: A3) => R3> &
      FuturifyOverload<(...args: A4) => R4> &
      FuturifyOverload<(...args: A5) => R5>
  : F extends (...args: infer A) => infer R
    ? FuturifyOverload<F>
    : never

export function futurify<F extends (...args: any[]) => any>(fn: F): Futurified<F> {
  return ((...args: any[]) => {
    const resolvedArgsFuture = Promise.all(args)
    return new Future(async () => {
      const resolvedArgs = await resolvedArgsFuture
      return fn(...resolvedArgs)
    })
  }) as unknown as Futurified<F>
}
