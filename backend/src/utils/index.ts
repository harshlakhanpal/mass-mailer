export function parseTemplate(
  template: string,
  variables: Record<string, string> = {}
) {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
    return variables[key] ?? '';
  });
}

export function mapVariables(
  keys: string[],
  values: string[]
): Record<string, string> {
  const obj: Record<string, string> = {};
  keys.forEach((key, idx) => {
    obj[key] = values[idx] ?? '';
  });
  return obj;
}
