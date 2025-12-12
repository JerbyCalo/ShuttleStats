import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join, dirname } from 'path';

const sourceDir = 'public';
const targetDir = 'dist';

// Load environment variables from .env file if it exists
function loadEnvFile() {
  const envPath = '.env';
  const env = {};

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    console.log('📋 Loaded environment variables from .env file');
  } else {
    console.log('⚠️  No .env file found, using environment variables or defaults');
  }

  return env;
}

// Get Firebase config from environment
function getFirebaseConfig(envFile) {
  // Priority: process.env > .env file > null (will use defaults in code)
  return {
    apiKey: process.env.FIREBASE_API_KEY || envFile.FIREBASE_API_KEY || null,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || envFile.FIREBASE_AUTH_DOMAIN || null,
    projectId: process.env.FIREBASE_PROJECT_ID || envFile.FIREBASE_PROJECT_ID || null,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || envFile.FIREBASE_STORAGE_BUCKET || null,
    messagingSenderId:
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      envFile.FIREBASE_MESSAGING_SENDER_ID ||
      null,
    appId: process.env.FIREBASE_APP_ID || envFile.FIREBASE_APP_ID || null,
  };
}

// Inject environment variables into firebase-config.js
function processFirebaseConfig(content, config) {
  // Only replace if we have environment values
  const hasEnvConfig = Object.values(config).some((v) => v !== null);

  if (!hasEnvConfig) {
    console.log('ℹ️  No environment config found, keeping default Firebase config');
    return content;
  }

  console.log('🔧 Injecting Firebase configuration from environment...');

  // Replace the config object in the file
  const configRegex = /const firebaseConfig = \{[\s\S]*?\};/;
  const newConfig = `const firebaseConfig = {
  apiKey: "${config.apiKey || ''}",
  authDomain: "${config.authDomain || ''}",
  projectId: "${config.projectId || ''}",
  storageBucket: "${config.storageBucket || ''}",
  messagingSenderId: "${config.messagingSenderId || ''}",
  appId: "${config.appId || ''}"
};`;

  return content.replace(configRegex, newConfig);
}

// Clean target directory
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}

// Create target directory
mkdirSync(targetDir, { recursive: true });

// Load environment
const envFile = loadEnvFile();
const firebaseConfig = getFirebaseConfig(envFile);

// Function to copy and process files
function copyDirectory(src, dest) {
  const items = readdirSync(src);

  for (const item of items) {
    const srcPath = join(src, item);
    const destPath = join(dest, item);

    if (statSync(srcPath).isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      // Ensure destination directory exists
      mkdirSync(dirname(destPath), { recursive: true });

      // Special handling for firebase-config.js
      if (srcPath.endsWith('firebase-config.js')) {
        let content = readFileSync(srcPath, 'utf-8');
        content = processFirebaseConfig(content, firebaseConfig);
        writeFileSync(destPath, content, 'utf-8');
        console.log('✨ Processed firebase-config.js');
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }
}

console.log('🏗️  Building ShuttleStats...');
console.log(`📁 Copying files from ${sourceDir} to ${targetDir}...`);

try {
  copyDirectory(sourceDir, targetDir);
  console.log('✅ Build completed successfully!');
  console.log(`📦 Output: ${targetDir}/`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
