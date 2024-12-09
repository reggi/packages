import type {JSONSchema} from '@typescript-eslint/utils'

export type Options = {
  /** An array of file paths to include. */
  files: string[]
  /** An array of file paths to ignore. */
  ignores: string[]
  /** The name of the "index" file */
  index: string
  /** The name of the shared "utils" directory in "src". */
  utils: string
  /** The name of the "src" directory. */
  src: string
  /** The name of the "test" directory. */
  test: string
  /** The dir nest limit. */
  limit: number
}

export const schema: JSONSchema.JSONSchema4[] = [
  {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      ignores: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      index: {
        type: 'string',
        default: 'index',
      },
      utils: {
        type: 'string',
        default: 'utils',
      },
      src: {
        type: 'string',
        default: 'src',
      },
      test: {
        type: 'string',
        default: 'test',
      },
      limit: {
        type: 'number',
      },
    },
    additionalProperties: false,
  },
]

export const defaultOptions: Options = {
  files: ['src/**/*.ts', 'test/**/*.test.ts'],
  ignores: ['dist/**', 'coverage/**'],
  index: 'index',
  utils: 'utils',
  src: 'src',
  test: 'test',
  limit: 3,
}
