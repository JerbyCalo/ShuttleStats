import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
  rmSync,
} from "fs";
import { join, dirname } from "path";

const sourceDir = "Public";
const targetDir = "dist";

// Clean target directory
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}

// Create target directory
mkdirSync(targetDir, { recursive: true });

// Function to copy directory recursively
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
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log("🏗️  Building ShuttleStats..");
console.log(`📁 Copying files from ${sourceDir} to ${targetDir}...`);

try {
  copyDirectory(sourceDir, targetDir);
  console.log("✅ Build completed successfully!");
  console.log(`📦 Output: ${targetDir}/`);
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
