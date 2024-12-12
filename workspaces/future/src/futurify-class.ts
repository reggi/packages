import {Future} from './index.ts'

type UnwrapFuture<T> =
  T extends Future<infer U, any> ? U : T extends readonly any[] ? {[K in keyof T]: UnwrapFuture<T[K]>} : T

type FuturifyArgs<Params extends any[]> = Params extends [infer Head, ...infer Tail]
  ? [Head | Future<UnwrapFuture<Head>>, ...FuturifyArgs<Tail>]
  : []

export type FuturifiedInstance<T> = PromiseLike<T> & {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: {[P in keyof A]: A[P] | Future<A[P]>}) => FuturifiedInstance<UnwrapFuture<R>>
    : Future<UnwrapFuture<T[K]>>
}

type FuturifyFunctionReturn<T extends new (...args: any[]) => any, R> =
  R extends InstanceType<T> ? FuturifiedInstance<UnwrapFuture<R>> : Future<UnwrapFuture<R>>

type FuturifiedStatic<T extends new (...args: any[]) => any> = {
  [K in Exclude<keyof T, 'prototype'>]: T[K] extends (...args: infer A) => infer R
    ? (...args: {[P in keyof A]: A[P] | Future<A[P]>}) => FuturifyFunctionReturn<T, R>
    : Future<UnwrapFuture<T[K]>>
}

export type FuturifiedClass<T extends new (...args: any[]) => any> = FuturifiedStatic<T> &
  (new (...args: FuturifyArgs<ConstructorParameters<T>>) => FuturifiedInstance<InstanceType<T>>)

function getTypeOf(Class, prop) {
  try {
    // Check if the property exists on the class (static members)
    if (Reflect.has(Class, prop)) {
      return typeof Class[prop]
    }
    // Check if the property exists on the prototype (instance members)
    if (Reflect.has(Class.prototype, prop)) {
      return typeof Class.prototype[prop]
    }
    return 'undefined' // If the property does not exist
  } catch (error) {
    return `Error: ${error.message}`
  }
}
// export function futurifyClass<T extends new (...args: any[]) => any>(
//   Class: T,
// ): FuturifiedClass<T> {
//   return new Proxy(Class, {

//     construct(target, args) {
//       const instance = new Future(async () => {
//         const resolvedArgs = await Promise.all(args);
//         return new target(...resolvedArgs);
//       });

//       const getProxy = (instance) => new Proxy({}, {
//         get(_, prop: keyof InstanceType<T>) {
//           if (prop === 'then') {
//             return instance.then.bind(instance)
//           }
//           if (getTypeOf(target, prop) === "function") {
//             return (...args: any[]) => {
//               const future = new Future(async (resolvedInstance) => {
//                 const rargs = await Promise.all(args)
//                 const result = await resolvedInstance[prop](...rargs)
//                 return result
//               }, [instance])
//               return getProxy(future)
//             }
//           }

//           return instance.use(v => v[prop])
//         },
//       });

//       return getProxy(instance)
//     },
//   }) as unknown as FuturifiedClass<T>
// }

export function futurifyClass<T extends new (...args: any[]) => any>(Class: T): FuturifiedClass<T> {
  const getInstanceProxy = instance =>
    new Proxy(
      {},
      {
        get(_, prop: keyof InstanceType<T>) {
          if (prop === 'then') {
            return instance.then.bind(instance)
          }
          if (getTypeOf(Class, prop) === 'function') {
            return (...args: any[]) => {
              const future = new Future(
                async resolvedInstance => {
                  const rargs = await Promise.all(args)
                  const result = await resolvedInstance[prop](...rargs)
                  return result
                },
                [instance],
              )
              return getInstanceProxy(future)
            }
          }
          return instance.use(v => v[prop])
        },
      },
    )

  const getStaticProxy = staticFuture =>
    new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === 'then') {
            return staticFuture.then.bind(staticFuture)
          }
          return staticFuture.use(v => v[prop])
        },
      },
    )

  return new Proxy(Class, {
    get(target, prop) {
      if (getTypeOf(target, prop) === 'function') {
        return (...args: any[]) => {
          const future = new Future(async () => {
            const rargs = await Promise.all(args)
            const result = await target[prop](...rargs)
            return result
          })
          return getStaticProxy(future)
        }
      }
      const future = new Future(async () => target[prop])
      return getStaticProxy(future)
    },
    construct(target, args) {
      const instance = new Future(async () => {
        const resolvedArgs = await Promise.all(args)
        return new target(...resolvedArgs)
      })
      return getInstanceProxy(instance)
    },
  }) as unknown as FuturifiedClass<T>
}
