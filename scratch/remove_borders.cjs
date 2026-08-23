const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/className="relative rounded-xl mb-8 bg-\[#0B101B\] border border-slate-800\/60 shadow-lg"/g, 
    'className="relative mb-8"');
  
  content = content.replace(/className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"/g, 
    'className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
}
