const fs = require('fs');
const path = require('path');

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`${file}: ${err.message}`);
  }
}

function exists(file) {
  return fs.existsSync(file);
}

function findJsFiles(dir) {
  const results = [];
  for (const fileName of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, fileName.name);
    if (fileName.isDirectory()) {
      results.push(...findJsFiles(fullPath));
    } else if (fileName.isFile() && fullPath.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkManifest(packPath) {
  const manifestPath = path.join(packPath, 'manifest.json');
  console.log(`Checking ${manifestPath}`);
  const manifest = readJson(manifestPath);
  if (!manifest.format_version) throw new Error(`${manifestPath}: missing format_version`);
  if (!manifest.header || !manifest.modules) throw new Error(`${manifestPath}: missing required manifest fields`);
  console.log('  ✓ manifest JSON is valid');
}

function checkLoadTag() {
  const tagPath = path.join('voiceauth_bp', 'data', 'voiceauth', 'tags', 'functions', 'load.json');
  console.log(`Checking ${tagPath}`);
  const tag = readJson(tagPath);
  if (!tag.format_version) throw new Error(`${tagPath}: missing format_version`);
  if (!Array.isArray(tag.values) || tag.values.length === 0) throw new Error(`${tagPath}: values must be a non-empty array`);
  if (!tag.values.some((v) => v.startsWith('voiceauth:'))) throw new Error(`${tagPath}: values should reference voiceauth functions`);
  console.log('  ✓ load tag is valid');
}

function checkLoadFunction() {
  const loadFile = path.join('voiceauth_bp', 'data', 'voiceauth', 'functions', 'load', 'init.mcfunction');
  console.log(`Checking ${loadFile}`);
  if (!exists(loadFile)) throw new Error(`${loadFile}: file does not exist`);
  const content = fs.readFileSync(loadFile, 'utf8');
  if (!content.includes('function voiceauth:init')) throw new Error(`${loadFile}: missing 'function voiceauth:init' call`);
  console.log('  ✓ load function is valid');
}

function checkInitFunction() {
  const initFile = path.join('voiceauth_bp', 'data', 'voiceauth', 'functions', 'init.mcfunction');
  console.log(`Checking ${initFile}`);
  if (!exists(initFile)) throw new Error(`${initFile}: file does not exist`);
  const content = fs.readFileSync(initFile, 'utf8');
  if (!content.trim()) throw new Error(`${initFile}: file is empty`);
  console.log('  ✓ init function exists');
}

function checkJsSyntax() {
  const jsFiles = findJsFiles(path.join('voiceauth_bp', 'scripts'));
  if (jsFiles.length === 0) return console.log('No JS files found in voiceauth_bp/scripts');
  jsFiles.forEach((file) => {
    process.stdout.write(`Checking ${file}... `);
    try {
      require('child_process').execSync(`node -c ${JSON.stringify(file)}`, { stdio: 'ignore' });
      console.log('✓');
    } catch (err) {
      throw new Error(`${file}: JavaScript syntax error`);
    }
  });
}

function run() {
  try {
    checkManifest('voiceauth_bp');
    checkManifest('voiceauth_rp');
    checkLoadTag();
    checkLoadFunction();
    checkInitFunction();
    checkJsSyntax();
    console.log('\nAll Bedrock pack checks passed.');
  } catch (err) {
    console.error('\nERROR:', err.message);
    process.exit(1);
  }
}

run();
