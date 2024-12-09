import {globSync} from 'glob'
import path from 'node:path'

export function filesSync(cwd: string, config: {files: string[]; ignores: string[]}) {
  const {files, ignores} = config
  const ignorePatterns = [...ignores, 'node_modules/**']
  const allFiles = globSync(files, {ignore: ignorePatterns, cwd})
  return allFiles.map(v => path.resolve(cwd, v))
}
