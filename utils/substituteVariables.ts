export const substituteVariables = (dsl: any, values: Record<string, string>) => {
  const clone = structuredClone(dsl);

  // Replace variables in text, handling extended syntax
  const replace = (text: string) => {
    // Match both simple ${NAME} and extended ${NAME:TYPE:...} syntax
    return text.replace(/\$\{([A-Z0-9_]+)(?::[^}]*)?\}/g, (match, variableName) => {
      // Return the value for the variable name, or empty string if not found
      return values[variableName] ?? '';
    });
  };

  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;

    // Handle 'content' field in any node type (paragraph, heading, text, etc.)
    if (typeof node.content === 'string') {
      node.content = replace(node.content);
    }

    // Also handle 'text' field for backwards compatibility
    if (typeof node.text === 'string') {
      node.text = replace(node.text);
    }

    // Recursively process children
    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  };

  walk(clone);
  return clone;
};
