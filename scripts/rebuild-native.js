const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const electronVersion = require('electron/package.json').version;
const modulePath = path.join(__dirname, '..', '.next', 'standalone', 'node_modules', 'better-sqlite3');
const binaryPath = path.join(modulePath, 'build', 'Release', 'better_sqlite3.node');

// Check if the standalone directory exists
if (!fs.existsSync(modulePath)) {
  console.log('Standalone directory not found. Skipping native module rebuild.');
  process.exit(0);
}

const currentArch = process.arch === 'arm64' ? 'arm64' : 'x64';

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion}...`);
console.log(`Current architecture: ${currentArch}`);
console.log(`Binary path: ${binaryPath}`);

// Step 1: Rebuild for current architecture
console.log(`\nRebuilding for ${currentArch}...`);
try {
  execSync(
    `npx @electron/rebuild -f -w better-sqlite3 -p .next/standalone/node_modules -v ${electronVersion}`,
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
  console.log(`✓ Rebuilt for ${currentArch}`);
} catch (error) {
  console.error(`✗ Failed to rebuild for ${currentArch}:`, error.message);
  process.exit(1);
}

// Step 2: If on Apple Silicon, also rebuild for x64 and create universal binary
// (On Intel Macs, we only build for x64 since building for arm64 requires cross-compilation)
if (currentArch === 'arm64' && process.platform === 'darwin') {
  console.log(`\nRebuilding for x64 (for Intel Mac compatibility)...`);

  // Backup the arm64 binary
  const arm64Backup = binaryPath + '.arm64';
  if (fs.existsSync(binaryPath)) {
    fs.copyFileSync(binaryPath, arm64Backup);
    console.log('✓ Backed up arm64 binary');
  }

  try {
    // Rebuild for x64 using Rosetta - need to set environment variables
    const env = {
      ...process.env,
      npm_config_arch: 'x64',
      npm_config_target_arch: 'x64',
      ARCHFLAGS: '-arch x86_64'
    };
    execSync(
      `arch -x86_64 npx @electron/rebuild -f -w better-sqlite3 -p .next/standalone/node_modules -v ${electronVersion} --arch=x64`,
      { stdio: 'inherit', cwd: path.join(__dirname, '..'), env }
    );

    // Verify the x64 binary was actually built
    if (fs.existsSync(binaryPath)) {
      try {
        const binaryInfo = execSync(`lipo -info ${binaryPath}`, { encoding: 'utf-8' });
        console.log(`Binary info after x64 rebuild: ${binaryInfo.trim()}`);

        if (binaryInfo.includes('x86_64') && !binaryInfo.includes('arm64')) {
          // Good - we have a pure x64 binary
          const x64Backup = binaryPath + '.x64';
          fs.copyFileSync(binaryPath, x64Backup);
          console.log('✓ Backed up x64 binary');

          // Restore arm64 and combine
          fs.copyFileSync(arm64Backup, binaryPath);

          // Combine both architectures into a universal binary
          execSync(
            `lipo -create ${arm64Backup} ${x64Backup} -output ${binaryPath}`,
            { stdio: 'inherit' }
          );
          console.log('✓ Created universal binary (arm64 + x64)');

          // Verify the universal binary
          try {
            const verifyOutput = execSync(`lipo -info ${binaryPath}`, { encoding: 'utf-8' });
            console.log(`✓ Verification: ${verifyOutput.trim()}`);
            if (!verifyOutput.includes('arm64') || !verifyOutput.includes('x86_64')) {
              console.warn('⚠ Warning: Universal binary might not contain both architectures');
            }
          } catch (error) {
            console.warn('⚠ Could not verify universal binary:', error.message);
          }

          // Clean up backup files
          fs.unlinkSync(arm64Backup);
          fs.unlinkSync(x64Backup);
        } else {
          console.warn('⚠ x64 rebuild did not produce a pure x64 binary. Skipping universal binary creation.');
          // Restore arm64 binary
          fs.copyFileSync(arm64Backup, binaryPath);
          fs.unlinkSync(arm64Backup);
        }
      } catch (error) {
        console.warn('⚠ Could not verify binary architecture:', error.message);
        // Restore arm64 binary
        if (fs.existsSync(arm64Backup)) {
          fs.copyFileSync(arm64Backup, binaryPath);
          fs.unlinkSync(arm64Backup);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠ Failed to create universal binary:`, error.message);
    console.warn(`⚠ Falling back to arm64 only. Intel Mac users will need to build separately.`);
    // Restore arm64 binary if x64 build failed
    if (fs.existsSync(arm64Backup)) {
      fs.copyFileSync(arm64Backup, binaryPath);
      fs.unlinkSync(arm64Backup);
    }
  }
}

console.log('\n✓ Native module rebuild complete!');
