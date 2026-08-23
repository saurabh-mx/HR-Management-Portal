const fs = require('fs');
const path = require('path');
const file = 'c:/me/Projects/HR-Management-Portal/hr-portal/src/pages/DocumentsDashboard.tsx';
const content = fs.readFileSync(file, 'utf8');

const match = content.match(/  const documents = \[\s+([\s\S]*?)  \];/);
if (!match) {
  console.log('Array not found');
  process.exit(1);
}

let documentsContent = match[0].replace('const documents =', 'export const documents =');

const dataFile = 'c:/me/Projects/HR-Management-Portal/hr-portal/src/data/documentsData.tsx';
const dataContent = `import React from 'react';
import { Book, FileSpreadsheet, ShieldAlert, FileText, Zap } from 'lucide-react';

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length !== 7) return \`rgba(255, 255, 255, \${alpha})\`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
};

${documentsContent}
`;

fs.mkdirSync(path.dirname(dataFile), { recursive: true });
fs.writeFileSync(dataFile, dataContent);
console.log('Created documentsData.tsx');

const newDashboardContent = content.replace(
  match[0], 
  ''
).replace(
  'import { BookOpen, FileText, FileSpreadsheet, ShieldAlert, ChevronRight, Book, Search, Info, AlertTriangle, Zap } from "lucide-react";',
  `import { BookOpen, ChevronRight, Search, Info, AlertTriangle } from "lucide-react";\nimport { documents, hexToRgba } from "@/data/documentsData";`
).replace(
  /const hexToRgba = \([\s\S]*?\};\n\n/,
  ''
);

fs.writeFileSync(file, newDashboardContent);
console.log('Updated DocumentsDashboard.tsx');
