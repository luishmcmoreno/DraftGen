export const extractVariables = (dsl: unknown): string[] => {
  const result = new Set<string>()
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'text' && typeof node.content === 'string') {
      const re = /\$\{([A-Z0-9_]+)\}/g
      let m
      while ((m = re.exec(node.content))) result.add(m[1])
    }
    // Skip page-break nodes as they don't contain variables
    if (node.type === 'page-break') return
    
    if (Array.isArray(node.children)) node.children.forEach(visit)
  }
  visit(dsl)
  return Array.from(result)
}