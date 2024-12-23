import path from "node:path";
import mapWorkspaces from '@npmcli/map-workspaces';
import { readDataFile } from "../utils/read-file.ts";

export async function workspace ({ cwd }: { cwd: string }) {
  const pkg = await readDataFile(path.resolve(cwd, 'package.json'))
  const workspaceMap = await mapWorkspaces({ cwd, pkg: pkg.content })
  const workspaces = await Promise.all(Object.entries(Object.fromEntries(workspaceMap))
    .map(([name, dirpath]) => ({ name, dirpath }))
    .map(async workspace => {
      const basename = path.basename(workspace.dirpath)
      const pkg = await readDataFile(path.resolve(workspace.dirpath, 'package.json'));
      return { ...workspace, basename, pkg };
    }))
  return { workspaces, pkg }
}
