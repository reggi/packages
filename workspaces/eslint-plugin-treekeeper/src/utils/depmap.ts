export type GraphItem<T> = {
  key: string
  dependencies: T[]
  dependents: T[]
}

export function createDependencyMap<T extends string>(dependencies: {[key: string]: T[]}): GraphItem<T>[]
export function createDependencyMap<T>(dependencies: {[key: string]: T[]}, getKey: (item: T) => string): GraphItem<T>[]
export function createDependencyMap<T>(
  dependencies: {[key: string]: T[]},
  getKey: (item: T) => string = (item: T) => (typeof item === 'string' ? (item as string) : ''),
): GraphItem<T>[] {
  // Create a map for dependencies and a separate map for tracking dependents.
  const dependencyMap = new Map<string, T[]>()
  const dependentMap = new Map<string, T[]>()

  // Populate the dependency map and build the dependent map.
  Object.entries(dependencies).forEach(([key, deps]) => {
    dependencyMap.set(key, deps)
    deps.forEach(dep => {
      const depKey = getKey(dep)
      if (!dependentMap.has(depKey)) {
        dependentMap.set(depKey, [])
      }
      dependentMap.get(depKey)!.push(key as unknown as T)
    })
  })

  // Build the final array of GraphItems where dependents are derived from the dependentMap.
  return Array.from(dependencyMap.keys()).map(key => ({
    key: key,
    dependencies: dependencyMap.get(key) || [],
    dependents: dependentMap.get(key) || [],
  }))
}
