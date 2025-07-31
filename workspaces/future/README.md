# Future

The `Future` class is a utility for managing asynchronous operations and their dependencies. It provides caching, dependency resolution, and various methods to manipulate and chain asynchronous tasks.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Why](#why)
- [Examples](#examples)
- [API](#api)
  - [Constructor](#constructor)
  - [Static Methods](#static-methods)
  - [Instance Methods](#instance-methods)

## Installation

To install the `Future` class, you can use npm:

```sh
npm install @reggi/future
```

## Usage

```typescript
import { Future } from '@reggi/future';

const future = new Future(async () => {
  // Your asynchronous operation here
  return 'Hello, Future!';
});

future.then(result => {
  console.log(result); // Output: Hello, Future!
});
```

## Why

Let's say you want to write async code and use it's future value without actually executing it. You want the ability to pass it around and at the very end call await on the whole chain of (possibly async operations) _once_.

```js
import { Future } from "@reggi/future"

const id = 1

const person = new Future(async () => {
  const response = await fetch(`https://swapi.dev/api/people/${id}`)
  return response.json()
})

const homeworld = new Future(async (person) => {
  // `person` is the resolved promise value from the `person` future.
  const response = await fetch(person.homeworld)
  return response.json()
}, [person])

// Unlike a traditional `new Promise` these callbacks have not run yet.
// Nothing has been executed

// When we call `await` on `homeworld` it will run the both callbacks.
console.log((await homeworld).name) // Tatooine
// When we run await on person we still can access the value but it doesnt run fetch again
console.log((await person).name) // Luke Skywalker
```

## Examples

### Using Dependencies

```typescript
const future1 = new Future(async () => 1);
const future2 = new Future(async () => 2);

const sumFuture = new Future(async (a, b) => a + b, [future1, future2]);

sumFuture.then(result => {
  console.log(result); // Output: 3
});
```

### Cloning and No Caching

```typescript
const future = new Future(async () => 'Hello, Future!');

const clonedFuture = future.clone();
const noCacheFuture = future.noCache();

clonedFuture.then(result => {
  console.log(result); // Output: Hello, Future!
});

noCacheFuture.then(result => {
  console.log(result); // Output: Hello, Future!
});
```

### Updating a Future

```typescript
const future = new Future(async () => 1);

future.update(async value => value + 1);

future.then(result => {
  console.log(result); // Output: 2
});
```

## API

### Constructor

```typescript
new Future<T, D extends readonly any[]>(operation: Operation<T, D>, dependencies?: D, optionNoCache?: boolean)
```

- `operation`: The asynchronous operation to be performed.
- `dependencies`: An array of dependencies that the operation depends on.
- `optionNoCache`: A boolean indicating whether to disable caching.

### Static Methods

#### `Future.resolve`

```typescript
static resolve<T>(value: T | Future<T>): Future<T>
```

Resolves a value or a `Future` instance into a `Future`.

#### `Future.resolveOperation`

```typescript
static async resolveOperation<T, D extends readonly any[]>(operation: Operation<T, D>, dependencies: D): Promise<T>
```

Resolves an operation with its dependencies.

### Instance Methods

#### `resolve`

```typescript
resolve(options?: { clear?: boolean }): Promise<T>
```

Resolves the `Future` instance. If `clear` is set to `true`, it clears the cache.

#### `then`

```typescript
then<TResult1 = T, TResult2 = never>(
  onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
  onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
): Promise<TResult1 | TResult2>
```

Attaches callbacks for the resolution and/or rejection of the `Future`.

#### `catch`

```typescript
catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): Promise<T | TResult>
```

Attaches a callback for only the rejection of the `Future`.

#### `finally`

```typescript
finally(onfinally?: (() => void) | null): Promise<T>
```

Attaches a callback that is invoked when the `Future` is settled (fulfilled or rejected).

#### `noCache`

```typescript
noCache(depth?: number): Future<T, D>
```

Clones the `Future` and its dependencies with no caching. The `depth` parameter controls the depth of cloning.

#### `clone`

```typescript
clone(depth?: number): Future<T, D>
```

Clones the `Future` and clears cache values. The `depth` parameter controls the depth of cloning.

#### `use`

```typescript
use<TT, D extends readonly any[]>(operation: Operation<TT, [T, ...D]>, dependencies?: D): Future<TT, [Future<T, D>, ...D]>
```

Creates a new `Future` using the current `Future` as a dependency.

#### `update`

```typescript
update<D extends readonly any[]>(operation: Operation<T, [T, ...D]>, dependencies?: D): Future<T, D>
```

Updates the `Future` value with a new operation and dependencies.

> Note: First package published with OIDC
