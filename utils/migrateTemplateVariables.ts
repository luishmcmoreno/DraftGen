import { DocumentSchema, VariableDefinitionType } from '@/lib/dslValidator';
import { extractVariables } from './extractVariables';

/**
 * Infers variable type from variable name patterns
 */
function inferVariableType(variableName: string): VariableDefinitionType['type'] {
  const name = variableName.toLowerCase();

  // Email patterns
  if (name.includes('email') || name.includes('mail') || name.endsWith('_email')) {
    return 'EMAIL';
  }

  // Date patterns
  if (
    name.includes('date') ||
    name.includes('deadline') ||
    name.includes('due') ||
    name.includes('expires') ||
    name.includes('expiry') ||
    name.includes('birth') ||
    name.includes('start') ||
    name.includes('end') ||
    name.includes('from') ||
    name.includes('to') ||
    name.includes('when')
  ) {
    return 'DATE';
  }

  // Number patterns
  if (
    name.includes('amount') ||
    name.includes('price') ||
    name.includes('cost') ||
    name.includes('quantity') ||
    name.includes('number') ||
    name.includes('count') ||
    name.includes('total') ||
    name.includes('sum') ||
    name.includes('percentage') ||
    name.includes('rate') ||
    name.includes('value') ||
    name.includes('score')
  ) {
    return 'NUMBER';
  }

  // Phone patterns
  if (
    name.includes('phone') ||
    name.includes('mobile') ||
    name.includes('tel') ||
    name.includes('cell') ||
    name.includes('fax') ||
    name.includes('contact_number')
  ) {
    return 'PHONE';
  }

  // Default to TEXT
  return 'TEXT';
}

/**
 * Converts variable name to human-readable label
 */
function generateLabel(variableName: string): string {
  return variableName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generates default validation rules based on variable type
 */
function generateDefaultValidation(type: VariableDefinitionType['type']): any {
  switch (type) {
    case 'TEXT':
      return {
        maxLength: 500,
      };
    case 'EMAIL':
      return {};
    case 'DATE':
      return {
        format: 'medium',
      };
    case 'NUMBER':
      return {
        min: 0,
        decimals: 2,
      };
    case 'PHONE':
      return {
        format: 'INTERNATIONAL',
      };
    default:
      return {};
  }
}

/**
 * Migrates a template DSL to include variable definitions
 * Preserves existing functionality while adding type information
 */
export function migrateTemplateVariables(dsl: DocumentSchema): DocumentSchema {
  // If variables are already defined, return as-is
  if (dsl.variables && dsl.variables.length > 0) {
    return dsl;
  }

  // Extract all variables from the template
  const variableNames = extractVariables(dsl);

  // Generate variable definitions
  const variables: VariableDefinitionType[] = variableNames.map((name) => {
    const type = inferVariableType(name);
    return {
      name,
      type,
      label: generateLabel(name),
      required: true,
      validation: generateDefaultValidation(type),
      placeholder: `Enter ${generateLabel(name).toLowerCase()}`,
      helpText: undefined,
      defaultValue: undefined,
    };
  });

  // Return migrated DSL
  return {
    ...dsl,
    variables,
  };
}

/**
 * Batch migrates multiple templates
 */
export function migrateTemplates(templates: DocumentSchema[]): DocumentSchema[] {
  return templates.map(migrateTemplateVariables);
}

/**
 * Creates a SQL migration for updating templates in the database
 */
export function generateMigrationSQL(): string {
  return `
-- Migration to add variable definitions to existing templates
DO $$
DECLARE
  template_record RECORD;
  migrated_json JSONB;
  variable_names TEXT[];
  variable_defs JSONB;
  var_name TEXT;
BEGIN
  -- Loop through all templates
  FOR template_record IN SELECT id, json FROM templates WHERE json IS NOT NULL
  LOOP
    -- Skip if variables already defined
    IF template_record.json ? 'variables' AND 
       jsonb_array_length(template_record.json->'variables') > 0 THEN
      CONTINUE;
    END IF;
    
    -- Extract variable names from the template
    variable_names := ARRAY(
      SELECT DISTINCT substring(matches[1] FROM '\$\{([A-Z0-9_]+)\}')
      FROM (
        SELECT regexp_matches(template_record.json::text, '\\\$\{([A-Z0-9_]+)\}', 'g') AS matches
      ) AS extracted
      WHERE matches[1] IS NOT NULL
    );
    
    -- Build variable definitions
    variable_defs := '[]'::JSONB;
    FOREACH var_name IN ARRAY variable_names
    LOOP
      variable_defs := variable_defs || jsonb_build_object(
        'name', var_name,
        'type', 'TEXT',
        'label', replace(initcap(replace(var_name, '_', ' ')), ' ', ' '),
        'required', true,
        'validation', '{}'::JSONB
      );
    END LOOP;
    
    -- Update the template with variable definitions
    migrated_json := jsonb_set(
      template_record.json,
      '{variables}',
      variable_defs
    );
    
    -- Update the template
    UPDATE templates 
    SET json = migrated_json,
        updated_at = NOW()
    WHERE id = template_record.id;
  END LOOP;
END $$;
`;
}
