// const fs = require('fs/promises');
// const path = require('path');
// const mapWorkspaces = require('@npmcli/map-workspaces')

// type MappingContext = {
//   [key: string]: any;
// };

// type Mapping<C, S> = {
//   [key: string]: 
//     | ((data: {context: C, path: string, slugContext: S}) => Promise<string> | string)
//     | Mapping<C, S>;
// };

// type SlugFactory<T extends string, E> = {
//   [key: T]: { [key: T]: string } & E
// }

// async function template<C, S>(
//   mapping: Mapping<C, S>, 
//   createContext: () => Promise<C> | C,
//   createFileContext: (path: string) => Promise<S> | S
// ) {
//   const context = await createContext();
//   const result: { [key: string]: string } = {};

//   const processMapping = async (mapping: Mapping<C>, path: string = '') => {
//     for (const key in mapping) {
//       const value = mapping[key];
//       const newPath = path ? `${path}/${key}` : key;

//       if (typeof value === 'function') {

//         const fileContext = await createFileContext(newPath);
//         const slugMatch = newPath.match(/\[([^\]]+)\]/);
//         const slug = slugMatch ? slugMatch[1] : null;
//         if (slug) {
//           if (!Array.isArray(context.slugs)) {
//             context.slugs = [];
//           }
//           context.slugs.push(slug);
//         }
        


//         result[newPath] = await value(context, fileContext);
//       } else {
//         await processMapping(value, newPath);
//       }
//     }
//   };

//   await processMapping(mapping);
//   return result;
// }

// const output = await template({
//   "eslint.config.js": (context) => "xxx",
//   'mcr.config.js': (context) => "xxx",
//   'tsconfig.json': (context) => "xxx",
//   '.prettierignore': (context) => "xxx",
//   '.gitignore': (context) => "xxx",
//   'posts/example-[workspace].md': ({context, slugContext}) => "xxx",
//   'articles': {
//     '[workspace].md': (context) => "xxx",
//   }
// }, 
// async () => {
//   const cwd = process.cwd();
//   const pkgPath = path.resolve(cwd, 'package.json');
//   const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
//   const workspaces = await mapWorkspaces({ cwd, pkg })

//   const slugs = {
//     workspace: workspaces.map((workspace) => workspace.name),
//   }
// },
// (path) => {
//   return {
//     'fullPath': path,
//   };
// });

// console.log(output);

import { promises as fs } from 'fs';
import path, { basename, join } from 'path';
import mapWorkspaces from '@npmcli/map-workspaces';
import jsonpath from 'jsonpath';
import { expandJsonPath, expandPath } from './template/expand-paths.ts';
import { applyPatch, Operation } from 'fast-json-patch';
import { readFile } from './utils/read-file.ts';

const copyRoot = (ctx) => {
  return fs.writeFile(join(ctx.cwd, ctx.path), ctx.root[ctx.basename]);
}

// const plugin = (files) => template(({workspaces}) => {
//   return Object.fromEntries(
//     workspaces.flatMap(workspace => 
//       files.map(file => [
//         join(workspace.path, file), 
//         (ctx) => fs.writeFile(join(ctx.cwd, ctx.path), ctx.root[ctx.basename])
//       ])
//     )
//   );
// }, async ({ cwd }) => {
//     const rootPkgPath = path.resolve(cwd, 'package.json');
//     const rootPkg = JSON.parse(await fs.readFile(rootPkgPath, 'utf-8'));
//     const workspaceMap = await mapWorkspaces({ cwd, pkg: rootPkg })
//     const workspaces = Object.entries(
//       Object.fromEntries(workspaceMap)).map(([name, path]) => ({name, path, basename: basename(path)})
//     )
//     return { workspaces }
// })

//   return {
//     mapping: ({ workspaces }) => {
      
//     },
//     createContext: async (...args) => {
//       const rest = workspacesPlugin.createContext(...args);
//       return rest
//     }
//   }
// }
// , 'package.json'


// {
//   'workspaces/{workspaces[*].basename}/eslint.config.js': copyRoot,
//   'workspaces/{workspaces[*].basename}/mcr.config.js': copyRoot,
//   'workspaces/{workspaces[*].basename}/tsconfig.json': copyRoot,
//   'workspaces/{workspaces[*].basename}/.prettierignore': copyRoot,
//   'workspaces/{workspaces[*].basename}/.gitignore': copyRoot,
//   'workspaces/{workspaces[*].basename}/package.json': workspacePackages,
// }

const v = await template(({workspaces, files}) => {
  const copyFiles =  Object.fromEntries(
    workspaces.flatMap(workspace => 
      copyFiles.map(file => [
        join(workspace.path, file), 
        (ctx) => fs.writeFile(join(ctx.cwd, ctx.path), ctx.root[ctx.basename])
      ])
    )
  );
  return {
    ...copyFiles,
    'workspaces/{workspaces[*].basename}/package.json': workspacePackages,
  };
}, async ({ cwd }) => {
  
  const rootPkgPath = path.resolve(cwd, 'package.json');
  const rootPkg = JSON.parse(await fs.readFile(rootPkgPath, 'utf-8'));
  const workspaceMap = await mapWorkspaces({ cwd, pkg: rootPkg })
  const workspaces = Object.entries(
    Object.fromEntries(workspaceMap)).map(([name, path]) => ({name, path, basename: basename(path)})
  )
  const copyFiles = ['eslint.config.js', 'mcr.config.js', 'tsconfig.json', '.prettierignore', '.gitignore'];
  const rootFiles = [...copyFiles, 'package.json'];
  const root = Object.fromEntries(await Promise.all(copyFiles.map(async file => {
    const content = await readFile(join(cwd, file));
    const isJSON = file.endsWith('.json');
    return [file, content]
  })))

  return {cwd, rootPkg, rootPkgPath, workspaces, root, copyFiles}
})

await v.run()
