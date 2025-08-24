import { DocumentSchema, VariableDefinitionType } from '@/lib/dslValidator'

export interface ExtractedVariable {
  name: string
  type: VariableDefinitionType['type']
  label?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  helpText?: string
  validation?: any
}

/**
 * Extracts typed variables from a DSL document
 * Returns structured variable information if available, otherwise infers from names
 */
export function extractVariablesTyped(dsl: DocumentSchema | any): ExtractedVariable[] {
  // If variables are defined in the DSL, use them
  if (dsl.variables && dsl.variables.length > 0) {
    return dsl.variables.map((v: any) => ({
      name: v.name,
      type: v.type,
      label: v.label,
      required: v.required !== false, // Default to true
      defaultValue: v.defaultValue,
      placeholder: v.placeholder,
      helpText: v.helpText,
      validation: v.validation
    }))
  }
  
  // Otherwise, extract variable names and return them as TEXT type
  const variableNames = new Set<string>()
  
  const extractFromNode = (node: any) => {
    if (!node || typeof node !== 'object') return
    
    // Extract from text content
    if (node.type === 'text' && typeof node.content === 'string') {
      const re = /\$\{([A-Z0-9_]+)\}/g
      let match
      while ((match = re.exec(node.content))) {
        variableNames.add(match[1])
      }
    }
    
    // Extract from heading content
    if (node.type === 'heading' && typeof node.content === 'string') {
      const re = /\$\{([A-Z0-9_]+)\}/g
      let match
      while ((match = re.exec(node.content))) {
        variableNames.add(match[1])
      }
    }
    
    // Recursively extract from children
    if (Array.isArray(node.children)) {
      node.children.forEach(extractFromNode)
    }
  }
  
  extractFromNode(dsl)
  
  // Return extracted variables as TEXT type with basic settings
  return Array.from(variableNames).map(name => ({
    name,
    type: 'TEXT' as const,
    label: name.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
    required: true,
    validation: { maxLength: 500 }
  }))
}

/**
 * Helper function to get variable by name
 */
export function getVariableDefinition(
  dsl: DocumentSchema | any, 
  variableName: string
): ExtractedVariable | undefined {
  const variables = extractVariablesTyped(dsl)
  return variables.find(v => v.name === variableName)
}

/**
 * Checks if a DSL has typed variables defined
 */
export function hasTypedVariables(dsl: DocumentSchema | any): boolean {
  return !!(dsl && dsl.variables && dsl.variables.length > 0)
}