import type {Options} from '../utils/options.ts'
import path from 'node:path'
import {minimatch} from 'minimatch'
import {patterns} from './patterns.ts'

export class Path {
  dirname: string
  relative: string
  name: string
  split: string[]
  filename: string
  options: Options
  ext: string
  cwd: string
  parent?: Path
  length: number
  indexFile: string
  _imports?: Path[]
  _importedBy?: Path[]
  constructor(opt: {filename: string; options: Options; ext: string; cwd: string; parent?: Path}) {
    const {filename, options, ext, cwd, parent} = opt
    this.filename = filename
    this.options = options
    this.ext = ext
    this.cwd = cwd
    if (!path.isAbsolute(filename)) {
      throw new Error('filename must be an absolute path')
    }
    this.parent = parent
    this.filename = filename
    this.name = path.basename(filename).split('.')[0]
    this.dirname = path.dirname(filename)
    this.relative = path.relative(cwd, filename)
    this.split = this.relative.split(path.sep)
    this.length = this.split.length
    this.indexFile = options.index + (this.parent?.ext || ext)
  }
  // get imports() {
  //   if (!this._imports) {
  //     throw new Error('imports accessed before being set')
  //   }
  //   return this._imports
  // }
  get importedBy() {
    if (!this._importedBy) {
      throw new Error('imports accessed before being set')
    }
    return this._importedBy
  }
  addImports(imports: string[]) {
    this._imports = imports.map(v => this.create(v))
    return this
  }
  addImportedBy(importedBy: string[]) {
    this._importedBy = importedBy.map(v => this.create(v))
    return this
  }
  isModule() {
    return minimatch(this.relative, patterns.module(this.options))
  }
  isModuleIndex() {
    return minimatch(this.relative, patterns.moduleIndex(this.options, this.ext))
  }
  isModuleUtil() {
    return minimatch(this.relative, patterns.moduleUtil(this.options, this.ext))
  }
  isRoot() {
    return minimatch(this.relative, patterns.root(this.options))
  }
  // isSrc() {
  //   return minimatch(this.filename, patterns.src(this.options))
  // }
  isUtils() {
    return minimatch(this.relative, patterns.utils(this.options))
  }
  isJson() {
    return minimatch(this.relative, patterns.json(this.options), {nocase: true})
  }
  isTest() {
    return minimatch(this.relative, patterns.test(this.options))
  }
  isTestModule() {
    return minimatch(this.relative, patterns.testModule(this.options))
  }
  isTestRoot() {
    return minimatch(this.relative, patterns.testRoot(this.options))
  }
  isTestSpecial() {
    return minimatch(this.relative, patterns.testSpecial(this.options))
  }
  isModuleUtilOrUtils() {
    return this.isModuleUtil() || this.isUtils()
  }
  isSibling() {
    const {parent} = this
    if (parent) {
      return this.dirname === parent.dirname
    }
    throw new Error('isSibling called without context')
  }
  isValidModuleIndexImport() {
    return this.isModuleIndex() || this.isUtils() || this.isSibling() || this.isJson()
  }
  isValidModuleUtilImport() {
    return this.isJson()
  }
  modPlaces() {
    return [this.parent?.mod(), this.mod()]
      .filter(Boolean)
      .map(v => `"${v}"`)
      .join(' and ')
  }
  extraData: any = {}
  addData(data: any) {
    this.extraData = {...this.extraData, ...data}
    return this
  }
  data() {
    return {
      ...this.extraData,
      ...this.options,
      depth: this.length,
      depthOver: this.length - this.options.limit,
      modPlaces: this.modPlaces(),
      indexFile: this.parent?.indexFile || this.indexFile,
      modForParent: this.parent?.mod(),
      modForChild: this.mod(),
      relativeParent: this.parent?.relative,
      relativeChild: this.relative,
    }
  }
  create(filename: string) {
    const {options, cwd, ext} = this
    return new Path({filename, options, ext, cwd, parent: this})
  }
  mod() {
    return this.split[1]
  }
  _shebang?: boolean
  addShebang(value: boolean) {
    this._shebang = value
  }
  shebang() {
    if (this._shebang === undefined) {
      throw new Error('shebang accessed before being set')
    }
    return this._shebang
  }
  isUnused() {
    if (this.isRoot()) return
    if (this.isTest()) return
    if (this.isJson()) return
    if (this.shebang()) return
    if (this.importedBy.length === 0) return this
  }
  createPath(filename: string) {
    const {options, cwd, ext} = this
    return new Path({filename, options, ext, cwd, parent: this})
  }
  import(importPath: string) {
    let filename = path.join(this.dirname, importPath)
    if (!path.extname(filename)) {
      filename += this.ext
    }
    return this.createPath(filename)
  }
}
