const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const allFiles = walkSync(srcDir);
let modifiedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace exact match `import { useAuth } from '@/auth/context';`
  content = content.replace(/import\s*\{\s*useAuth\s*\}\s*from\s*['"]@\/auth\/context['"];?/g, "import { useAuth } from '@/auth/hooks/useAuth';");
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated imports in ${path.relative(srcDir, file)}`);
  }
}

console.log(`Updated ${modifiedCount} files.`);
