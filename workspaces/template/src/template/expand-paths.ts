import jp from 'jsonpath'; // Ensure you have the 'jsonpath' library installed: `npm install jsonpath`

/**
 * Parses and replaces JSONPath placeholders in a template string.
 * @param {string} template - The template string, e.g., "{workspaces[*].basename}.md".
 * @param {object} data - The data object to resolve the JSONPath expressions against.
 * @returns {string[]} - An array of resolved file names.
 */
function expandPath(template, data) {
  const placeholderRegex = /\{([^}]+)\}/g; // Matches `{JSONPath}` placeholders
  const matches = [...template.matchAll(placeholderRegex)]; // Find all placeholders

  if (matches.length === 0) {
    return []; // No placeholders, return an empty array
  }

  // Resolve each placeholder
  const results = matches.map(([fullMatch, jsonPath]) => {
    // Use the JSONPath to extract values from the data
    const resolvedValues = jp.query(data, jsonPath); // Returns an array of values
    if (resolvedValues.length === 0) {
      throw new Error(`No matches found for JSONPath: ${jsonPath}`);
    }
    resolvedValues.forEach(value => {
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(`Resolved value must be a string or number, but got: ${typeof value}`);
      }
    });
    return { fullMatch, resolvedValues };
  });

  // Generate combinations of resolved placeholders and track values
  const combinations = results.reduce(
    (acc, { fullMatch, resolvedValues }) =>
      acc.flatMap(({ path, values }) =>
        resolvedValues.map((value) => ({
          path: path.replace(fullMatch, value),
          values: [...values, value],
        }))
      ),
    [{ path: template, values: [] }]
  );

  // Map to final output format
  return combinations.map(({ path, values }) => [path, ...values]);
}

export function expandJsonPath (_data: ({filepath, handler, slugs?: string[]})[], c) {
  const data = [..._data]

  for (let i = 0; i < data.length; i++) {
    const { filepath, handler } = data[i];
    const expandedPaths = expandPath(filepath, c);
    if (expandedPaths.length !== 0) {
      data.splice(i, 1);
      i--; // Adjust index after removal
    }
    for (const [filepath, ...slugs] of expandedPaths) {
      data.push({ filepath, handler, slugs });
    }
  }

  return data
}
