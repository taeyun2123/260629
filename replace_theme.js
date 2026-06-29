const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Colors
  content = content.replace(/text-primary-olive/g, 'text-teal-500');
  content = content.replace(/bg-primary-olive/g, 'bg-teal-500');
  content = content.replace(/border-primary-olive/g, 'border-teal-500');
  content = content.replace(/primary-olive-light/g, 'teal-400');
  
  content = content.replace(/text-point-blue/g, 'text-cyan-500');
  content = content.replace(/bg-point-blue/g, 'bg-cyan-500');
  content = content.replace(/fill-point-blue/g, 'fill-cyan-500');
  content = content.replace(/point-blue-light/g, 'cyan-400');
  
  // Neutral colors and shadows for cards
  content = content.replace(/bg-white/g, 'bg-emerald-50');
  content = content.replace(/border-gray-100/g, 'border-emerald-100');
  content = content.replace(/border-gray-200/g, 'border-emerald-200');
  content = content.replace(/text-gray-800/g, 'text-emerald-950');
  content = content.replace(/text-gray-700/g, 'text-slate-700');
  content = content.replace(/bg-gray-50/g, 'bg-slate-50');
  content = content.replace(/bg-gray-100/g, 'bg-slate-100');
  content = content.replace(/text-gray-500/g, 'text-slate-500');
  content = content.replace(/text-gray-400/g, 'text-slate-400');
  content = content.replace(/text-gray-600/g, 'text-slate-600');
  
  // Shadows
  content = content.replace(/shadow-sm(?! shadow-)/g, 'shadow-sm shadow-emerald-100/50');
  content = content.replace(/shadow-md/g, 'shadow-md shadow-emerald-200/50');
  content = content.replace(/shadow-lg/g, 'shadow-lg shadow-emerald-200/50');
  
  // Specific corner radii adjustments (if missed) - already rounded-xl/2xl but let's ensure
  // Actually user said rounded-xl or rounded-2xl which is already what we used.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

traverseDirectory(directoryPath);
