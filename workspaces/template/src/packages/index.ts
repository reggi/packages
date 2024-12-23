import path, { join } from "node:path"
import { readDataFile } from "../utils/read-file.ts"
import { applyPatch, Operation } from "fast-json-patch"
import { SecondaryContext } from "../template/index.ts";

export const packages = async (ctx: { cwd: string, path: string }, { dirname }: SecondaryContext) => {
  const directory = path.relative(ctx.cwd, ctx.dirname)
  const { scripts, author, files, repository, license, prettier, devDependencies } = ctx.root['package.json']
  const {content: existingJson} = await readDataFile(join(dirname, 'package.json'))
  const patches: Operation[] = [];

  if (scripts !== undefined) {
    patches.push({ op: 'replace', path: '/scripts', value: scripts });
  }
  if (author !== undefined) {
    patches.push({ op: 'replace', path: '/author', value: author });
  }
  if (files !== undefined) {
    patches.push({ op: 'replace', path: '/files', value: files });
  }
  if (repository !== undefined) {
    patches.push({ op: 'replace', path: '/repository/directory', value: directory });
  }
  if (license !== undefined) {
    patches.push({ op: 'replace', path: '/license', value: license });
  }
  if (prettier !== undefined) {
    patches.push({ op: 'replace', path: '/prettier', value: prettier });
  }

  Object.entries(devDependencies)
    .filter(([key, value]) => value !== undefined)
    .forEach(([key, value]) => {
      patches.push({ op: 'add', path: `/devDependencies/${key}`, value });
    });

  const updatedJson = applyPatch(existingJson, patches).newDocument;
  return updatedJson;
}
