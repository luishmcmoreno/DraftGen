export const substituteVariables = (dsl: any, values: Record<string, string>) => {
  const clone = structuredClone(dsl)
  const replace = (text: string) =>
    text.replace(/\$\{([A-Z0-9_]+)\}/g, (_, k) => values[k] ?? '')

  const walk = (node: any) => {
    if (node.type === 'text' && typeof node.content === 'string') {
      node.content = replace(node.content)
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }

  walk(clone)
  return clone
}