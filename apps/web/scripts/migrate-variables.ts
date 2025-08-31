import { createClient } from '@supabase/supabase-js';
import { migrateTemplateVariables } from '../utils/migrateTemplateVariables';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTemplates() {
  console.log('Starting template migration...');

  // Fetch all templates
  const { data: templates, error } = await supabase
    .from('templates')
    .select('id, json')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return;
  }

  if (!templates || templates.length === 0) {
    console.log('No templates found');
    return;
  }

  console.log(`Found ${templates.length} templates to migrate`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const template of templates) {
    try {
      // Check if already has variables defined
      if (template.json?.variables && template.json.variables.length > 0) {
        console.log(`Template ${template.id} already has variables, skipping`);
        skipped++;
        continue;
      }

      // Migrate the template
      const migratedJson = migrateTemplateVariables(template.json);

      // Update the template in the database
      const { error: updateError } = await supabase
        .from('templates')
        .update({
          json: migratedJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (updateError) {
        console.error(`Failed to update template ${template.id}:`, updateError);
        failed++;
      } else {
        console.log(`✓ Migrated template ${template.id}`);
        if (migratedJson.variables) {
          console.log(
            `  Added ${migratedJson.variables.length} typed variables:`,
            migratedJson.variables.map((v) => `${v.name} (${v.type})`).join(', ')
          );
        }
        migrated++;
      }
    } catch (err) {
      console.error(`Error processing template ${template.id}:`, err);
      failed++;
    }
  }

  console.log('\nMigration complete!');
  console.log(`✓ Migrated: ${migrated}`);
  console.log(`⊘ Skipped: ${skipped}`);
  console.log(`✗ Failed: ${failed}`);
}

// Run the migration
migrateTemplates().catch(console.error);
