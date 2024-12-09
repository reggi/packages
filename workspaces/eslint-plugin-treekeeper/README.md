# eslint-plugin-treekeeper

I'm obsessed with how we organize code. I've made many attempts to define "best practices" for organizing JavaScript/TypeScript projects (see links below). Last year, I worked on a project called "Tree Lint," which built a dependency map of all local files and provided opinions about where they should reside relative to one another. The idea was that if I authored code in just the right way, it would be easy to break a "branch" of the directory structure into its own package. However, in practice, this approach led to a deeply nested structure. This project builds on the lessons learned from that experience, introducing a new set of rules and relationships that favor a shallow, flat folder structure.

## How does it work?

At a hight level:

- Modules are self-contained units with their own utilities and main entry point.
- Utility files are simple and independent.
- Index files act as the only points of interaction between modules.
- Shared utilities are centralized in a common folder for reuse across modules.
- Root-level files are isolated from modules and handle top-level functionality.

```
src/
├── foo/
│   ├── index.ts   // Module foo's main file
│   ├── alpha.ts   // Utility file for foo
│   └── beta.ts
├── bar/
│   ├── index.ts   // Module bar's main file
│   ├── gamma.ts   // Utility file for bar
│   └── delta.ts
├── utils/         // Shared utilities which can be imported by any index
│   ├── sigma.ts
│   └── omega.ts
├── index.ts       // Root-level file
└── bin.ts
```

- The `src` folder contains one level of subfolders; each subfolder is a **module**.
- Each module must contain an `index.ts` file.
- Modules must not contain any directories.
- The module's `index.ts` serves as the main entry point of its module.
- A module's `index.ts` can import its own module's utility files.
- A module's `index.ts` can import other modules' `index.ts` files.
- A module's `index.ts` can import files from the shared `utils` folder.
- A module's `index.ts` cannot import utility files from other modules.
- A module's `index.ts` cannot import root-level files.
- Any file in a module that is not `index.ts` is considered a utility file.
- Utility files cannot import any local files.
- Only their own module's `index.ts` can import utility files.
- Files directly under `src` (not inside any module) are called root-level files.
- Root-level files can import other root-level files.
- Root-level files cannot be imported by modules.
- The shared `utils` folder is located at the root of `src`.
- The `utils` folder contains utility files needed by two or more `index.ts` files.
- Files in the shared `utils` folder are accessible to all modules' `index.ts` files.
- Any file within the `test` directory is considered a test file.
- All test files must have a parallel file with the same basename in `src`.

## Plugins

| name                   | description                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| dir-nest-limit         | Enforces a limit on the number of nested directories within a project.                                               |
| enforce-has-index      | Requires every module to include an index file.                                                                      |
| enforce-test-in-src    | Ensures each test file has a corresponding source file in the 'src' directory.                                       |
| no-root-import         | Prevents modules from importing files at the root level.                                                             |
| suggest-move-in-utils  | Checks for files being imported from multiple directories and suggests moving them to an agnostic "utils" directory. |
| suggest-move-out-utils | Requires utils used by only one module to be relocated to that module.                                               |
| unused                 | Lists all unused files in the project.                                                                               |
| utils-no-import-index  | Prevents importing index for utils files.                                                                            |
| utils-no-import        | Prevents local imports for utils files.                                                                              |

## Options

| name    | type     | description                                        | default                               |
| ------- | -------- | -------------------------------------------------- | ------------------------------------- |
| files   | string[] | An array of file paths to include.                 | `["src/**/*.ts","test/**/*.test.ts"]` |
| ignores | string[] | An array of file paths to ignore.                  | `["dist/**","coverage/**"]`           |
| index   | string   | The name of the "index" file                       | index                                 |
| utils   | string   | The name of the shared "utils" directory in "src". | utils                                 |
| src     | string   | The name of the "src" directory.                   | src                                   |
| test    | string   | The name of the "test" directory.                  | test                                  |
| limit   | number   | The dir nest limit.                                | 3                                     |

## A La Carte Plugin Pick

If you prefer to include only specific rules from the `eslint-plugin-treekeeper` plugin, you can do so by configuring them individually in your ESLint configuration file.

Example:

```js
// eslint.config.js
import {reccomended} from 'eslint-plugin-treekeeper'

export default [reccomended({})]
```

```js
// eslint.config.js
import {createRecommended} from 'eslint-plugin-treekeeper'
import plugin from 'eslint-plugin-treekeeper/dir-nest-limit'
const reccomended = createRecommended(plugin)

export default [reccomended()]
```

## Learnings

ESLint doesn’t work well at the project level because it’s designed to lint individual files, not their relationships to other files. Additionally, ESLint plugins have no way to run a handler once ESLint has finished processing, and the plugin system itself is synchronous, which adds further limitations.

I wanted a plugin to handle tasks it wasn’t originally designed for, like the unused plugin. The only way to achieve this was by using the same glob pattern in the eslint.config.js file to count all the files. The plugin would then maintain its own file count, and when both counts matched, it would signal that ESLint was on its last file. This approach, while functional, is a significant hassle.

To work around these limitations, I also perform AST parsing with TypeScript during the first plugin invocation. This allows me to create a structure that individual files can be compared against. While it’s a lot of work, I think it’s a pretty neat hack to get an ESLint plugin to do things it wasn’t originally designed to handle.

## Prior Art:

- [I invented a CLI tool to organize my typescript projects.](https://dev.to/reggi/i-invented-a-cli-tool-to-organize-my-typescript-projects-1j82)
- [In Defense of Having All Code in a Single File.](https://dev.to/reggi/in-defense-of-having-all-code-in-a-single-file-18lb)
- [tree_lint](https://github.com/reggi/tree_lint) / [tree_lint2](https://github.com/reggi/tree_lint2)
