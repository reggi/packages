import yaml from 'yaml'
import fs from 'node:fs/promises'

/** reads a file and if it's json or yaml will parse it, if the file doesnt exist returns null */
async function _readDataFile (filepath: string): Promise<Record<string, any>> {
  const isJSON = filepath.endsWith('.json');
  const isYaml = filepath.endsWith('.yml') || filepath.endsWith('.yaml')
  let content
  try {
    content = await fs.readFile(filepath, 'utf-8');
    if (isYaml) {
      return yaml.parse(content);
    }
    if (isJSON) {
      return JSON.parse(content);
    }
    throw new Error(`Unsupported file type: ${filepath}`);
  } catch (err) {
    return {}
  }
}

type File = {
  filepath: string,
  content: Record<string, any>
}

export async function readDataFile (filepath: string): Promise<File> {
  const content = await _readDataFile(filepath)
  return { filepath, content }
}
