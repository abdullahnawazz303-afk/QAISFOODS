const fs = require('fs');

function repair(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<h2 font-bold/g, '<h2 className="text-3xl md:text-4xl font-bold');
  content = content.replace(/<h3 font-semibold/g, '<h3 className="font-semibold');
  fs.writeFileSync(file, content);
  console.log('Repaired ' + file);
}

repair('src/pages/Home.tsx');
repair('src/pages/About.tsx');
