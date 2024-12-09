import * as ts from 'typescript'

export function getImports(fileName: string): string[] {
  const imports: string[] = []

  // Read the file content
  const fileContent = ts.sys.readFile(fileName)
  if (!fileContent) {
    throw new Error(`Could not read file: ${fileName}`)
  }

  // Create a SourceFile object
  const sourceFile = ts.createSourceFile(fileName, fileContent, ts.ScriptTarget.Latest, true)

  // Function to traverse the AST
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const importPath = (node.moduleSpecifier as ts.StringLiteral).text
      imports.push(importPath)
    }
    ts.forEachChild(node, visit)
  }

  // Start traversing the AST from the root node
  visit(sourceFile)
  return imports
}

// export function allLocalImports(files: string[]) {
//   const all = new Set<string>()
//   for (const file of files) {
//     const imports = getImports(file)
//     const local = imports.filter(v => v.startsWith('.') || v.startsWith(path.sep))
//     local.map(v => all.add(path.join(path.dirname(file), v)))
//   }
//   return [...all]
// }
