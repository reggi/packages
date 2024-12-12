# eslint-plugin-node-specifier

This is an eslint rule to `enforce` or `disallow` the use of `node:` specifier.

```js
import globals from 'globals'
import nodeSpecifier from 'eslint-plugin-node-specifier'

export default [
  {files: ['**/*.js'], languageOptions: {sourceType: 'commonjs'}},
  {languageOptions: {globals: globals.node}},
  {
    plugins: {
      'node-specifier': nodeSpecifier,
    },
    rules: {
      // "node-specifier/disallow-node-specifier": "error",
      'node-specifier/enforce-node-specifier': 'error',
    },
  },
]
```
