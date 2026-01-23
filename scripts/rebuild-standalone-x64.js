const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const electronVersion = require('electron/package.json').version;
const standaloneModulePath = path.join(__dirname, '..', '.next', 'standalone', 'node_modules', 'better-sqlite3');
const mainModulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
const standaloneBinaryPath = path.join(standaloneModulePath, 'build', 'Release', 'better_sqlite3.node');
const mainBinaryPath = path.join(mainModulePath, 'build', 'Release', 'better_sqlite3.node');

// Check if the main module exists (has source files)
if (!fs.existsSync(mainModulePath)) {
  console.error('✗ Error: Main better-sqlite3 module not found. Run npm install first.');
  process.exit(1);
}

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion} (x64 only)...`);
console.log(`Main module: ${mainModulePath}`);
console.log(`Standalone module: ${standaloneModulePath}`);

// Delete existing builds to force clean rebuild
const mainBuildPath = path.join(mainModulePath, 'build');
if (fs.existsSync(mainBuildPath)) {
  console.log('Cleaning main module build...');
  fs.rmSync(mainBuildPath, { recursive: true, force: true });
}

const standaloneBuildPath = path.join(standaloneModulePath, 'build');
if (fs.existsSync(standaloneBuildPath)) {
  console.log('Cleaning standalone module build...');
  fs.rmSync(standaloneBuildPath, { recursive: true, force: true });
}

// Rebuild in main node_modules (has source files)

// Rebuild for x64 only using Rosetta - rebuild directly in the module directory
console.log(`\nRebuilding for x64...`);
try {
  const env = {
    ...process.env,
    npm_config_arch: 'x64',
    npm_config_target_arch: 'x64',
    ARCHFLAGS: '-arch x86_64',
    npm_config_target_platform: 'darwin',
    npm_config_target_cpu: 'x64',
    ELECTRON_VERSION: electronVersion
  };

  // Rebuild in main node_modules (has source files)
  console.log(`\nRebuilding in main module directory: ${mainModulePath}`);
  execSync(
    `arch -x86_64 npx electron-rebuild -f -v ${electronVersion} -a x64`,
    { stdio: 'inherit', env, cwd: mainModulePath }
  );

  // Verify main binary was built
  if (!fs.existsSync(mainBinaryPath)) {
    console.error('✗ Error: Main binary not found after rebuild!');
    process.exit(1);
  }

  // Copy binary to standalone
  console.log(`\nCopying binary to standalone...`);
  const standaloneBuildDir = path.dirname(standaloneBinaryPath);
  if (!fs.existsSync(standaloneBuildDir)) {
    fs.mkdirSync(standaloneBuildDir, { recursive: true });
  }
  fs.copyFileSync(mainBinaryPath, standaloneBinaryPath);
  console.log(`✓ Copied binary to: ${standaloneBinaryPath}`);

  // Verify standalone binary is x64
  if (fs.existsSync(standaloneBinaryPath)) {
    const binaryInfo = execSync(`lipo -info ${standaloneBinaryPath}`, { encoding: 'utf-8' });
    console.log(`✓ Binary info: ${binaryInfo.trim()}`);
    if (binaryInfo.includes('x86_64') && !binaryInfo.includes('arm64')) {
      console.log(`✓ Successfully rebuilt for x64`);
    } else {
      console.error('✗ Error: Binary is not pure x64!');
      console.error(`  Expected: x86_64 only`);
      console.error(`  Got: ${binaryInfo.trim()}`);
      process.exit(1);
    }
  } else {
    console.error('✗ Error: Standalone binary not found after copy!');
    process.exit(1);
  }
} catch (error) {
  console.error(`✗ Failed to rebuild for x64:`, error.message);
  process.exit(1);
}

console.log('\n✓ Native module rebuild complete!');
