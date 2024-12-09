import type {Options} from '../utils/options.ts'
import {filesSync} from './files.ts'
import {Path} from '../path/index.ts'
import {findOne} from './find-one.ts'
import {getImports} from './imports.ts'
import {isLocal} from '../utils/local-import.ts'
import {createDependencyMap} from '../utils/depmap.ts'
import fs from 'node:fs'

const vanityAnd = (v: (string | undefined)[]) => {
  return v
    .filter(Boolean)
    .map(v => `"${v}"`)
    .join(' and ')
}

const vanityOr = (v: (string | undefined)[]) => {
  return v
    .filter(Boolean)
    .map(v => `"${v}"`)
    .join(' or ')
}

export class Paths {
  paths: Path[]
  options: Options
  ext: string
  cwd: string
  parent?: Path
  constructor(opt: {paths: Path[]; options: Options; ext: string; cwd: string; parent?: Path}) {
    this.paths = opt.paths
    this.options = opt.options
    this.ext = opt.ext
    this.cwd = opt.cwd
    this.parent = opt.parent
  }
  addDependencyMapInfo() {
    const {paths} = this
    const keyedImports = Object.fromEntries(
      paths.map(parent => [
        parent.filename,
        getImports(parent.filename)
          .filter(isLocal)
          .map(filename => parent.import(filename).filename),
      ]),
    )
    createDependencyMap(keyedImports).map(({key, dependencies, dependents}) => {
      this.find(key).addImportedBy(dependents).addImports(dependencies)
    })
    return this
  }
  addFileContentInfo() {
    this.paths.forEach(file => {
      const fileContent = fs.readFileSync(file.filename, 'utf8')
      const hasShebang = fileContent.startsWith('#!')
      file.addShebang(hasShebang)
    })
    return this
  }
  find(filename: string | ((path: Path) => boolean)) {
    const callback = typeof filename === 'function' ? filename : (path: Path) => path.filename === filename
    return findOne(this.paths, callback)
  }
  findMany(filename: string | ((path: Path) => boolean)) {
    const callback = typeof filename === 'function' ? filename : (path: Path) => path.filename === filename
    return this.paths.filter(callback)
  }
  static fromFiles(opt: {files: string[]; options: Options; ext: string; cwd: string; parent?: Path}) {
    const paths = opt.files.map(filename => new Path({...opt, filename}))
    return new Paths({...opt, paths})
  }
  static fromSync(opt: {options: Options; ext: string; cwd: string; parent?: Path}) {
    const {cwd, options} = opt
    const files = filesSync(cwd, options)
    return this.fromFiles({...opt, files})
  }
  // returns Path if the is module and doesn't have an index
  isMissingIndex(filename: string) {
    const path = this.find(filename)
    if (!path.isModule()) return
    const hasIndex = this.paths.some(p => p.isModuleIndex() && p.mod() === path.mod())
    if (!hasIndex) {
      return path
    }
  }
  // requires a test path to match a corresponding src path
  isInvalidTest(filename: string) {
    const file = this.find(filename)
    if (file.isTestSpecial()) return
    if (file.isTestRoot()) {
      const match = this.findMany(v => v.isRoot() && v.name === file.name)
      if (match.length) return
      const locations = this.findMany(v => v.isModule() && v.name == file.name).map(v => v.mod())
      const message = locations.length
        ? `Test in the root has no corresponding "${this.options.src}" file possibly ${vanityOr(locations)}`
        : `Test in the root has no corresponding "${this.options.src}" file`

      return file.addData({message})
    } else if (file.isTestModule()) {
      const match = this.findMany(v => v.isModule() && v.mod() === file.mod() && v.name == file.name)
      if (match.length) return
      const inOtherModule = this.findMany(v => v.isModule() && v.name == file.name).map(v => v.mod())
      const message = inOtherModule.length
        ? `Test nested in module has no corresponding "${this.options.src}" file possibly in ${vanityOr(inOtherModule)}`
        : `Test nested in module has no corresponding "${this.options.src}" file`
      return file.addData({message})
    }
  }
  // returns Path if the is util and only has 1 mod importing it
  isInvalidUtil(filename: string) {
    const path = this.find(filename)
    if (!path.isUtils()) return
    const importedMods = new Set(path.importedBy.map(importedBy => importedBy.mod()))
    if (importedMods.size !== 1) return
    return path.addData({mod: [...importedMods][0]})
  }
  unused() {
    return this.paths.filter(path => path.isUnused())
  }
}
