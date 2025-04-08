import { supabase } from '../lib/supabase';

/**
 * This script sets up the necessary database tables for the Todo app
 * You can run it with: npx ts-node scripts/setupDatabase.ts
 */
async function setupDatabase() {
  console.log('Setting up database tables...');

  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('create_profiles_table');
    if (profilesError) {
      console.error('Error creating profiles table:', profilesError);
    } else {
      console.log('Profiles table created or already exists');
    }

    // Create tasks table
    const { error: tasksError } = await supabase.rpc('create_tasks_table');
    if (tasksError) {
      console.error('Error creating tasks table:', tasksError);
    } else {
      console.log('Tasks table created or already exists');
    }

    // Create projects table
    const { error: projectsError } = await supabase.rpc('create_projects_table');
    if (projectsError) {
      console.error('Error creating projects table:', projectsError);
    } else {
      console.log('Projects table created or already exists');
    }

    console.log('Database setup completed!');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

// If this file is run directly, execute the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup complete, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase }; 