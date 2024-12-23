import path from "node:path";

export function flattenPaths(mapping: any, parentPath: string = ''): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  for (const key in mapping) {
    const value = mapping[key];
    const newPath = parentPath ? path.join(parentPath, key) : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenPaths(value, newPath));
    } else {
      result[newPath] = value;
    }
  }
  return result;
}

