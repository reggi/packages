import { basename, dirname } from "node:path";
import { expandJsonPath } from "./expand-paths.ts";
import { flattenPaths } from "./flatten-paths.ts";

export type SecondaryContext = { filepath: string, slugs: string[], basename: string, dirname: string }

type Handler<T> = ((data: T, i: SecondaryContext) => Promise<void> | void)

type Mapping<C> = {
  [key: string]: 
    | Handler<C>
    | [Handler<C>, string[]]
    | Mapping<C>;
};

type MiniContext = {
  path: string;
  handler: any;
  slugs: string[];
}

type CalcMiniContext = {
  basename: string
  dirname: string
}

export async function template<C>(
  mapping: Mapping<C & MiniContext & CalcMiniContext> | ((v:C) => Mapping<C & MiniContext & CalcMiniContext>),
  createContext: (opt: { cwd: string }) => Promise<C> | C,
) {
  const cwd = process.cwd();
  // this creates the initial context
  const c = await createContext({ cwd });
  // this will call the mapping function if it is a function, with the context as argument
  const unflatMapping = typeof mapping === 'function' ? mapping(c) : mapping;
  // this will flatten the deeply nested directory structure
  const flatMapping = flattenPaths(unflatMapping);
  // this will convert the object to an array with properties
  const map = Object.entries(flatMapping).map(([filepath, maybeHandler]) => {
    if (Array.isArray(maybeHandler)) {
      const [handler, slugs] = maybeHandler
      return { filepath, handler, slugs }
    } else {
      return { filepath, handler: maybeHandler }
    }
  })
  // this will expand json path structure
  const expandedMapping = expandJsonPath(map, c); 
  const data = expandedMapping.map(v => {
    // const childContext = (v) 
    const handlerWithContext = () => v.handler(c, {
      ...v,
      basename: basename(v.filepath),
      dirname: dirname(v.filepath)
    });
    return { ...v, handlerWithContext }
  })
  const run = () => Promise.all(data.map(v => v.handlerWithContext()))
  return { data, run };
}
