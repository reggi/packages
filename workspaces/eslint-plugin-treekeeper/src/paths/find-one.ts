export function findOne<T>(items: T[], predicate: (item: T) => boolean) {
  const results = items.filter(predicate)
  if (results.length === 0) {
    throw new Error(`No results found`)
  }
  if (results.length !== 1) {
    throw new Error(`Multiple results found`)
  }
  return results[0]
}
