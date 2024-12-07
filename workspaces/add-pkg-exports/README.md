# add-pkg-exports

This is a command line tool to populate the `exports` field in a package.json from a glob of files.

```bash
npx add-pkg-exports
```

```
Usage: add-pkg-exports <glob-pattern>
Description: Add exports field to package.json based on the files found by the glob pattern
```

## Example

```
➜  dist git:(main) ✗ tree
.
├── bin.cjs
├── bin.d.cts
├── bin.d.ts
└── bin.js

```

```bash
npx add-pkg-exports ./dist/* # unix glob
# npx add-pkg-exports "./dist/*" # uses node's glob
```

Adds `exports` to `package.json`:

```json
{
  "./bin": {
    "require": "./dist/bin.cjs",
    "import": "./dist/bin.js"
  }
}
```
