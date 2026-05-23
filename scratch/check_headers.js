import fs from 'fs';
import path from 'path';

const pagesDir = 'd:\\web_develop_project\\QAISFOODS\\src\\pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

const results = [];

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('<h1') || line.includes('font-bold">')) {
      const isHeader = line.includes('text-2xl') || line.includes('text-3xl') || line.includes('text-4xl') || line.includes('<h1');
      if (isHeader) {
        // Look for the next few lines for any <p> tag with text-muted-foreground
        let foundP = null;
        for (let i = idx + 1; i < Math.min(lines.length, idx + 6); i++) {
          if (lines[i].includes('<p') && (lines[i].includes('text-muted-foreground') || lines[i].includes('text-sm'))) {
            foundP = { lineNum: i + 1, content: lines[i].trim() };
            break;
          }
        }
        results.push({
          file,
          headerLine: idx + 1,
          headerContent: line.trim(),
          description: foundP
        });
      }
    }
  });
});

console.log(JSON.stringify(results, null, 2));
