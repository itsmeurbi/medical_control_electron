// scripts/prepare-db.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const templateDbPath = path.join(__dirname, '..', 'prisma', 'template.db');
const configPath = path.join(__dirname, '..', 'prisma.config.ts');
const tempConfigPath = path.join(__dirname, '..', 'prisma.config.temp.ts');

// Remove old template if it exists
if (fs.existsSync(templateDbPath)) {
  fs.unlinkSync(templateDbPath);
}

try {
  // Read the original config
  let config = fs.readFileSync(configPath, 'utf8');

  // Replace the datasource URL with our template path
  config = config.replace(
    /url:\s*['"][^'"]+['"]/,
    `url: 'file:${templateDbPath}'`
  );

  // Write temporary config
  fs.writeFileSync(tempConfigPath, config);

  console.log('Creating template database with schema...');
  console.log('Target path:', templateDbPath);

  // Push the schema to create the database using the temp config
  execSync(`npx prisma db push --accept-data-loss --config=${tempConfigPath}`, {
    stdio: 'inherit'
  });

  // Clean up temp config
  fs.unlinkSync(tempConfigPath);

  console.log('✓ Template database created at:', templateDbPath);

  // Verify it was created
  if (fs.existsSync(templateDbPath)) {
    const stats = fs.statSync(templateDbPath);
    console.log(`✓ Template size: ${stats.size} bytes`);
  } else {
    console.error('❌ Template database was not created!');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to create template database:', error);
  // Clean up temp config if it exists
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
  }
  process.exit(1);
}