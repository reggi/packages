import path from 'node:path'
import fs from 'node:fs/promises'
import {glob} from 'glob'

interface WorkspacePathsOptions {
  cwd: string
  includeRoot?: boolean
}

export const workspacePaths = async ({cwd, includeRoot}: WorkspacePathsOptions): Promise<string[]> => {
  const currentDirectory = cwd || process.cwd()
  const packageJsonPath = path.join(currentDirectory, 'package.json')
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonContent)
  const workspaces: string[] = packageJson.workspaces || []
  const workspacePaths = (
    await Promise.all(workspaces.map(workspace => glob(path.join(currentDirectory, workspace))))
  ).flat()
  if (includeRoot) workspacePaths.push(currentDirectory)
  return workspacePaths
}

export default workspacePaths
