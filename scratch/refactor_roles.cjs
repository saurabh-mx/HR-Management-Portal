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

const replacements = [
  {
    regex: /([a-zA-Z]+)(\?)?\.is_admin\s*\|\|\s*\(['"]admin['"],\s*['"]High Command['"],\s*['"]Command['"]\]\.includes\(\1(\?)?\.role(\s*\|\|\s*['"]['"])?\)/g,
    replace: 'isCommandOrHigher($1)',
    importFn: 'isCommandOrHigher'
  },
  {
    // covers `emp.is_admin || ['admin', 'High Command', 'Command'].includes(emp.role || '')`
    regex: /([a-zA-Z]+)(\?)?\.is_admin\s*\|\|\s*\[['"]admin['"],\s*['"]High Command['"],\s*['"]Command['"]\]\.includes\(\1(\?)?\.role(\s*\|\|\s*['"]['"])?\)/g,
    replace: 'isCommandOrHigher($1)',
    importFn: 'isCommandOrHigher'
  },
  {
    // covers `data.is_admin || ['High Command', 'HR'].includes(data.role)` and variations
    regex: /([a-zA-Z]+)(\?)?\.is_admin\s*\|\|\s*\(\1(\?)?\.role\s*&&\s*\[['"]High Command['"],\s*['"]HR['"]\]\.includes\(\1(\?)?\.role\)\)/g,
    replace: 'isHighCommandOrHR($1)',
    importFn: 'isHighCommandOrHR'
  },
  {
    regex: /([a-zA-Z]+)(\?)?\.is_admin\s*\|\|\s*\[['"]High Command['"],\s*['"]HR['"]\]\.includes\(\1(\?)?\.role(\s*\|\|\s*['"]['"])?\)/g,
    replace: 'isHighCommandOrHR($1)',
    importFn: 'isHighCommandOrHR'
  },
  {
    // covers `profile?.is_admin || ['admin'].includes(profile?.role || '')`
    regex: /([a-zA-Z]+)(\?)?\.is_admin\s*\|\|\s*\[['"]admin['"]\]\.includes\(\1(\?)?\.role(\s*\|\|\s*['"]['"])?\)/g,
    replace: 'canToggleAdminSafeMode($1)',
    importFn: 'canToggleAdminSafeMode'
  }
];

let filesModified = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let importsToAdd = new Set();

  for (const { regex, replace, importFn } of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replace);
      importsToAdd.add(importFn);
    }
  }

  if (content !== originalContent) {
    // Add import statement at the top
    const importFns = Array.from(importsToAdd).join(', ');
    const importStatement = `import { ${importFns} } from '@/auth/roles/roleMatrix';\n`;
    
    // insert after last import or at top
    const importMatches = [...content.matchAll(/^import.*$/gm)];
    if (importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;
      content = content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
    } else {
      content = importStatement + content;
    }
    
    // Clean up double empty lines
    content = content.replace(/\n\n\n/g, '\n\n');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated roles in ${path.relative(srcDir, file)}`);
    filesModified++;
  }
}

console.log(`Refactored roles in ${filesModified} files.`);
