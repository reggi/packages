import type {Options} from '../utils/options.ts'

export const patterns = {
  root: ({src}) => `${src}/*`,
  src: ({src}) => `${src}/**`,
  module: ({src}) => `${src}/*/*`,
  moduleIndex: ({src, index, utils}, ext) => `${src}/!(${utils})/${index}${ext}`,
  moduleUtil: ({src, index, utils}, ext) => `${src}/!(${utils})/!(${index})${ext}`,
  utils: ({src, utils}) => `${src}/${utils}/**`,

  test: ({test}) => `${test}/**`,
  testRoot: ({test}) => `${test}/*`,
  testModule: ({test}) => `${test}/*/*`,
  testSpecial: ({test}) => `${test}/__*__/*`,

  json: ({}) => `**/*.json`,
} satisfies {[key: string]: (options: Options, ext: string) => string}
