const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '../html-modules/modules');
const TEMPLATE_PATTERN = /<template\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/template>/i;

// Common issues to check for
const ISSUES = {
  MISSING_TEMPLATE_ID: 'Template is missing an ID',
  STYLE_OUTSIDE_TEMPLATE: 'Style tag is outside template',
  SCRIPT_OUTSIDE_TEMPLATE: 'Script tag is outside template',
  MISSING_IMPORT: 'Missing ModuleBase import',
  MISSING_REGISTER: 'Missing registerModule call',
  INVALID_STRUCTURE: 'Invalid template structure'
};

// Check a single file for issues
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for template tag with ID
  const templateMatch = content.match(TEMPLATE_PATTERN);
  if (!templateMatch) {
    issues.push(ISSUES.MISSING_TEMPLATE_ID);
    return { filePath, issues };
  }
  
  const [fullMatch, templateId, templateContent] = templateMatch;
  
  // Check for style/script outside template
  const contentWithoutTemplate = content.replace(fullMatch, '').trim();
  if (contentWithoutTemplate.includes('<style')) {
    issues.push(ISSUES.STYLE_OUTSIDE_TEMPLATE);
  }
  if (contentWithoutTemplate.includes('<script')) {
    issues.push(ISSUES.SCRIPT_OUTSIDE_TEMPLATE);
  }
  
  // Check for required imports and registration
  if (!templateContent.includes('import { ModuleBase')) {
    issues.push(ISSUES.MISSING_IMPORT);
  }
  
  if (!templateContent.includes('registerModule(')) {
    issues.push(ISSUES.MISSING_REGISTER);
  }
  
  // Check template structure (should have HTML, then style, then script)
  const parts = templateContent.split(/<\/(style|script)>/i);
  if (parts.length < 3) {
    issues.push(ISSUES.INVALID_STRUCTURE);
  }
  
  return { filePath, issues };
}

// Fix a single file
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // Ensure template has an ID
  if (!content.match(/<template\s+id="/)) {
    const fileName = path.basename(filePath, '.html');
    const templateId = `${fileName}-template`;
    newContent = content.replace(
      /<template(\s+[^>]*)?>/,
      `<template id="${templateId}"$1>`
    );
  }
  
  // Move style and script tags inside template if needed
  const templateMatch = newContent.match(TEMPLATE_PATTERN);
  if (templateMatch) {
    const [fullMatch, templateId, templateContent] = templateMatch;
    
    // Check for style/script outside template
    const contentWithoutTemplate = newContent.replace(fullMatch, '').trim();
    const styleMatch = contentWithoutTemplate.match(/<style[\s\S]*?<\/style>/i);
    const scriptMatch = contentWithoutTemplate.match(/<script[\s\S]*?<\/script>/i);
    
    if (styleMatch || scriptMatch) {
      // Reconstruct template with all content inside
      let fixedTemplate = `<template id="${templateId}">\n`;
      
      // Add HTML content
      const htmlContent = templateContent.replace(/<style[\s\S]*?<\/style>/gi, '')
                                       .replace(/<script[\s\S]*?<\/script>/gi, '')
                                       .trim();
      
      fixedTemplate += `  ${htmlContent}\n\n`;
      
      // Add style
      const existingStyle = templateContent.match(/<style[\s\S]*?<\/style>/i);
      if (existingStyle) {
        fixedTemplate += `  ${existingStyle[0]}\n\n`;
      } else if (styleMatch) {
        fixedTemplate += `  ${styleMatch[0]}\n\n`;
      }
      
      // Add script
      const existingScript = templateContent.match(/<script[\s\S]*?<\/script>/i);
      if (existingScript) {
        fixedTemplate += `  ${existingScript[0]}\n`;
      } else if (scriptMatch) {
        fixedTemplate += `  ${scriptMatch[0]}\n`;
      }
      
      fixedTemplate += '</template>';
      newContent = newContent.replace(fullMatch, fixedTemplate);
      
      // Remove any remaining style/script tags outside template
      newContent = newContent.replace(/<style[\s\S]*?<\/style>/gi, '')
                           .replace(/<script[\s\S]*?<\/script>/gi, '')
                           .trim() + '\n';
      
      // Add back the fixed template
      newContent += fixedTemplate;
    }
  }
  
  // Ensure proper indentation
  newContent = newContent.replace(/^/gm, '  ');
  
  // Write changes if different
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  return false;
}

// Main function
function main() {
  const files = fs.readdirSync(MODULES_DIR)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(MODULES_DIR, file));
  
  console.log(`🔍 Checking ${files.length} HTML modules...\n`);
  
  let totalIssues = 0;
  const filesToFix = [];
  
  // First pass: check all files
  for (const file of files) {
    const { issues } = checkFile(file);
    if (issues.length > 0) {
      console.log(`❌ ${path.basename(file)} has ${issues.length} issue(s):`);
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
      totalIssues += issues.length;
      filesToFix.push(file);
    }
  }
  
  // Second pass: fix files with issues
  if (filesToFix.length > 0) {
    console.log(`\n🔧 Attempting to fix ${filesToFix.length} files...\n`);
    
    let fixedCount = 0;
    for (const file of filesToFix) {
      const wasFixed = fixFile(file);
      if (wasFixed) {
        console.log(`✅ Fixed: ${path.basename(file)}`);
        fixedCount++;
      } else {
        console.log(`⚠️  Could not auto-fix: ${path.basename(file)}`);
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} out of ${filesToFix.length} files with issues.`);
    
    // Verify fixes
    console.log('\n🔍 Verifying fixes...\n');
    let remainingIssues = 0;
    
    for (const file of filesToFix) {
      const { issues } = checkFile(file);
      if (issues.length > 0) {
        console.log(`❌ Still has issues: ${path.basename(file)}`);
        issues.forEach(issue => console.log(`  - ${issue}`));
        console.log('');
        remainingIssues += issues.length;
      } else {
        console.log(`✅ Successfully fixed: ${path.basename(file)}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total files checked: ${files.length}`);
    console.log(`- Files with issues: ${filesToFix.length}`);
    console.log(`- Files fixed: ${fixedCount}`);
    console.log(`- Remaining issues: ${remainingIssues}`);
    
    if (remainingIssues > 0) {
      console.log('\n⚠️  Some issues could not be fixed automatically. Manual review is required.');
      process.exit(1);
    } else {
      console.log('\n✨ All HTML modules are now properly structured!');
    }
  } else {
    console.log('✨ All HTML modules are properly structured!');
  }
}

// Run the script
main();
