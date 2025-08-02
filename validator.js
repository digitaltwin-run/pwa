#!/usr/bin/env node

/**
 * SVG Component Validator
 * 
 * This script validates SVG component files against the XSD schema
 * and performs additional checks for common errors in components.
 * 
 * Usage:
 *   node validator.js [options] [files...]
 * 
 * Options:
 *   --help     Show help
 *   --schema   Path to XSD schema (default: ./schema/component-schema.xsd)
 *   --fix      Try to fix common issues automatically
 * 
 * Examples:
 *   node validator.js ./components/*.svg
 *   node validator.js --fix ./components/led.svg
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const { validate } = require('xsd-schema-validator');
const glob = require('glob');

// Configuration
const DEFAULT_SCHEMA_PATH = path.join(__dirname, 'schema', 'component-schema.xsd');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  help: args.includes('--help'),
  schemaPath: DEFAULT_SCHEMA_PATH,
  fix: args.includes('--fix'),
  files: []
};

// Extract options and files
args.forEach((arg, index) => {
  if (arg === '--schema' && args[index + 1] && !args[index + 1].startsWith('--')) {
    options.schemaPath = args[index + 1];
  } else if (!arg.startsWith('--') && (!args[index - 1] || args[index - 1] !== '--schema')) {
    options.files.push(arg);
  }
});

// Show help if requested
if (options.help || options.files.length === 0) {
  console.log(`
SVG Component Validator

Validates SVG component files against the XSD schema and performs additional checks
for common errors in components.

Usage:
  node validator.js [options] [files...]

Options:
  --help     Show this help
  --schema   Path to XSD schema (default: ./schema/component-schema.xsd)
  --fix      Try to fix common issues automatically

Examples:
  node validator.js ./components/*.svg
  node validator.js --fix ./components/led.svg
  node validator.js "components/*.svg"
  `);
  process.exit(0);
}

// Expand file globs
let allFiles = [];
options.files.forEach(filePattern => {
  const matches = glob.sync(filePattern);
  if (matches.length > 0) {
    allFiles = allFiles.concat(matches);
  } else {
    // If no glob matches found, treat as literal path
    allFiles.push(filePattern);
  }
});
options.files = allFiles;

console.log(`Validating ${options.files.length} SVG component files...`);

// Check if schema file exists
if (!fs.existsSync(options.schemaPath)) {
  console.error(`Error: Schema file not found at ${options.schemaPath}`);
  process.exit(1);
}

/**
 * Validates SVG against XSD schema
 * @param {string} svgContent - SVG file content
 * @returns {Promise<Object>} Validation result
 */
async function validateAgainstSchema(svgContent) {
  return new Promise((resolve, reject) => {
    validate(svgContent, options.schemaPath, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Validates SVG metadata
 * @param {Document} xmlDoc - Parsed XML document
 * @returns {Object} Validation result
 */
function validateMetadata(xmlDoc) {
  const issues = [];
  
  // Check for metadata script element
  const metadataScript = xmlDoc.querySelector('script[type="application/json"][id="metadata"]');
  if (!metadataScript) {
    issues.push('Missing <script type="application/json" id="metadata"> element for component metadata');
    return { valid: issues.length === 0, issues };
  }

  // Check for valid JSON in metadata script
  let metadataJson;
  try {
    metadataJson = JSON.parse(metadataScript.textContent);
  } catch (e) {
    issues.push(`Invalid JSON in metadata script: ${e.message}`);
    return { valid: issues.length === 0, issues };
  }

  // Check required fields
  if (!metadataJson.id) issues.push('Missing "id" in metadata');
  if (!metadataJson.name) issues.push('Missing "name" in metadata');
  if (!metadataJson.type) issues.push('Missing "type" in metadata');
  
  // Check parameters
  if (!metadataJson.parameters) {
    issues.push('Missing "parameters" object in metadata');
  } else {
    // Common parameter checks based on component type
    if (metadataJson.type === 'led') {
      const params = metadataJson.parameters;
      if (params.color === undefined) issues.push('LED missing "color" parameter');
      if (params.isOn === undefined) issues.push('LED missing "isOn" parameter');
      if (params.isBlinking === undefined) issues.push('LED missing "isBlinking" parameter');
    } else if (metadataJson.type === 'button') {
      const params = metadataJson.parameters;
      if (params.pressed === undefined) issues.push('Button missing "pressed" parameter');
    } else if (metadataJson.type === 'switch' || metadataJson.type === 'toggle') {
      const params = metadataJson.parameters;
      if (params.state === undefined) issues.push(`${metadataJson.type} missing "state" parameter`);
    } else if (metadataJson.type === 'knob' || metadataJson.type === 'slider' || metadataJson.type === 'gauge') {
      const params = metadataJson.parameters;
      if (params.value === undefined) issues.push(`${metadataJson.type} missing "value" parameter`);
      if (params.min === undefined) issues.push(`${metadataJson.type} missing "min" parameter`);
      if (params.max === undefined) issues.push(`${metadataJson.type} missing "max" parameter`);
    }
  }

  return { valid: issues.length === 0, issues, metadata: metadataJson };
}

/**
 * Validates SVG script
 * @param {Document} xmlDoc - Parsed XML document
 * @param {Object} metadata - Parsed metadata
 * @returns {Object} Validation result
 */
function validateScript(xmlDoc, metadata) {
  const issues = [];
  
  // Check for script element (not the metadata script)
  const scripts = Array.from(xmlDoc.getElementsByTagName('script'))
    .filter(s => s.getAttribute('type') !== 'application/json');
    
  if (scripts.length === 0) {
    issues.push('Missing interactive <script> element');
    return { valid: issues.length === 0, issues };
  }
  
  const script = scripts[0];  // Use the first non-metadata script
  
  const scriptContent = script.textContent;

  // Check for empty script
  if (!scriptContent || scriptContent.trim() === '') {
    issues.push('Empty script content');
    return { valid: issues.length === 0, issues };
  }
  
  // Check for required initialization pattern
  if (!scriptContent.includes('(function() {')) {
    issues.push('Missing initialization IIFE pattern: (function() {');
  }
  
  // Check for proper script termination
  if (!scriptContent.trim().endsWith('})();')) {
    issues.push('Script not properly terminated with })();');
  }
  
  // Check for DOM manipulation using currentScript
  if (!scriptContent.includes('document.currentScript.closest(\'svg\')')) {
    issues.push('Script should use document.currentScript.closest(\'svg\') to locate its container');
  }
  
  // Check if script correctly reads metadata from new location
  if (scriptContent.includes('querySelector(\'metadata\')')) {
    issues.push('Script is using outdated metadata selector. Should use: querySelector(\'script[type="application/json"][id="metadata"]\')');
  }
  
  // Check for getMetadata function implementation
  if (!scriptContent.includes('script[type="application/json"][id="metadata"]')) {
    issues.push('Script should access metadata via querySelector(\'script[type="application/json"][id="metadata"]\')');
  }
  
  // Check for event cleanup
  if (scriptContent.includes('setInterval(') && 
      (!scriptContent.includes('clearInterval(') || !scriptContent.includes('beforeunload'))) {
    issues.push('Script uses setInterval but may not properly clean up intervals');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validates SVG element classes and structure
 * @param {Document} xmlDoc - Parsed XML document
 * @param {Object} metadata - Parsed metadata
 * @returns {Object} Validation result
 */
function validateSVGStructure(xmlDoc, metadata) {
  const issues = [];
  const type = metadata?.type;
  
  if (!type) {
    issues.push('Cannot validate structure without component type');
    return { valid: issues.length === 0, issues };
  }
  
  // Common structure checks based on component type
  switch (type) {
    case 'led':
      if (!xmlDoc.querySelector('.led-core')) {
        issues.push('LED component missing .led-core element');
      }
      if (!xmlDoc.querySelector('.led-label')) {
        issues.push('LED component missing .led-label element');
      }
      break;
    case 'button':
      if (!xmlDoc.querySelector('.button-surface')) {
        issues.push('Button component missing .button-surface element');
      }
      if (!xmlDoc.querySelector('.button-shadow') && !xmlDoc.querySelector('.button-base')) {
        issues.push('Button component missing .button-shadow or .button-base element');
      }
      break;
    case 'switch':
      if (!xmlDoc.querySelector('.switch-handle')) {
        issues.push('Switch component missing .switch-handle element');
      }
      if (!xmlDoc.querySelector('.switch-track')) {
        issues.push('Switch component missing .switch-track element');
      }
      break;
    case 'toggle':
      if (!xmlDoc.querySelector('.toggle-handle')) {
        issues.push('Toggle component missing .toggle-handle element');
      }
      if (!xmlDoc.querySelector('.toggle-track')) {
        issues.push('Toggle component missing .toggle-track element');
      }
      break;
    case 'knob':
      if (!xmlDoc.querySelector('.knob-indicator')) {
        issues.push('Knob component missing .knob-indicator element');
      }
      break;
    case 'slider':
      if (!xmlDoc.querySelector('.slider-handle')) {
        issues.push('Slider component missing .slider-handle element');
      }
      if (!xmlDoc.querySelector('.slider-track')) {
        issues.push('Slider component missing .slider-track element');
      }
      break;
    case 'gauge':
      if (!xmlDoc.querySelector('.gauge-needle')) {
        issues.push('Gauge component missing .gauge-needle element');
      }
      break;
    case 'counter':
      if (!xmlDoc.querySelector('.counter-value')) {
        issues.push('Counter component missing .counter-value element');
      }
      if (!xmlDoc.querySelector('.counter-increment-button') || !xmlDoc.querySelector('.counter-decrement-button')) {
        issues.push('Counter component missing increment/decrement buttons');
      }
      break;
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Try to fix common SVG issues
 * @param {string} filePath - Path to SVG file
 * @param {Object} validationResults - Validation results
 * @returns {Promise<boolean>} True if fixes were applied
 */
async function fixCommonIssues(filePath, validationResults) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixesApplied = false;
  
  // Fix metadata JSON format
  if (validationResults.metadataResults && !validationResults.metadataResults.valid) {
    // Try to fix metadata in <script type="application/json">
    const metadataMatch = content.match(/<script[^>]*type="application\/json"[^>]*id="metadata"[^>]*>([\s\S]*?)<\/script>/);
    
    // If not found, also check for old metadata format
    const oldMetadataMatch = !metadataMatch && content.match(/<metadata>([\s\S]*?)<\/metadata>/);
    
    if (metadataMatch || oldMetadataMatch) {
      try {
        const jsonStr = (metadataMatch || oldMetadataMatch)[1].trim();
        const parsedJson = JSON.parse(jsonStr);
        
        // Add missing fields
        if (!parsedJson.id) parsedJson.id = `${parsedJson.type || 'component'}-${Date.now()}`;
        if (!parsedJson.name) parsedJson.name = path.basename(filePath, '.svg');
        if (!parsedJson.type) parsedJson.type = 'generic';
        if (!parsedJson.parameters) parsedJson.parameters = {};
        
        // Add component-specific parameters
        if (parsedJson.type === 'led') {
          if (!parsedJson.parameters.color) parsedJson.parameters.color = '#e74c3c';
          if (parsedJson.parameters.isOn === undefined) parsedJson.parameters.isOn = true;
          if (parsedJson.parameters.isBlinking === undefined) parsedJson.parameters.isBlinking = false;
          if (!parsedJson.parameters.label) parsedJson.parameters.label = 'LED';
        }
        
        const formattedJson = JSON.stringify(parsedJson, null, 4);
        
        // If old metadata format was found, convert it to new format
        if (oldMetadataMatch) {
          content = content.replace(
            /<metadata>[\s\S]*?<\/metadata>/, 
            `<script type="application/json" id="metadata">\n${formattedJson}\n</script>`
          );
          console.log(`Converted <metadata> to <script type="application/json"> in ${filePath}`);
          fixesApplied = true;
        } else {
          // Otherwise just update the existing script content
          content = content.replace(
            /<script[^>]*type="application\/json"[^>]*id="metadata"[^>]*>[\s\S]*?<\/script>/, 
            `<script type="application/json" id="metadata">\n${formattedJson}\n</script>`
          );
          fixesApplied = true;
        }
      } catch (e) {
        console.log(`Could not fix metadata JSON: ${e.message}`);
      }
    }
  }
  
  // Fix script IIFE pattern
  if (validationResults.scriptResults && !validationResults.scriptResults.valid) {
    if (validationResults.scriptResults.issues.includes('Script not properly terminated with })();')) {
      content = content.replace(
        /(<script>(?:<!\[CDATA\[)?\s*)(.*?)(\s*(?:\]\]>)?<\/script>)/s,
        (match, start, script, end) => {
          // Ensure script has proper IIFE termination
          let fixedScript = script.trim();
          if (fixedScript.startsWith('(function() {') && !fixedScript.endsWith('})();')) {
            fixedScript = fixedScript.replace(/\}\s*\)?\s*;?\s*$/, '})();');
            fixesApplied = true;
          }
          return `${start}${fixedScript}${end}`;
        }
      );
    }
    
    // Add currentScript pattern if missing
    if (validationResults.scriptResults.issues.includes('Script should use document.currentScript.closest(\'svg\') to locate its container')) {
      content = content.replace(
        /(<script>(?:<!\[CDATA\[)?\s*\(function\(\) \{)([\s\S]*?)(\}\)\(\);(?:\]\]>)?<\/script>)/,
        (match, start, body, end) => {
          const fixedBody = body.trim() + `\n\n  // Use this specific SVG instance, not a global query
  const svgElement = document.currentScript.closest('svg');\n`;
          fixesApplied = true;
          return `${start}\n${fixedBody}\n${end}`;
        }
      );
    }
  }
  
  // If fixes were applied, write the file
  if (fixesApplied) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Applied fixes to ${filePath}`);
  }
  
  return fixesApplied;
}

/**
 * Main validation function
 * @param {string} filePath - Path to SVG file
 */
async function validateSVGComponent(filePath) {
  console.log(`\nValidating: ${filePath}`);
  
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse SVG as XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Validate metadata
    const metadataResults = validateMetadata(xmlDoc);
    if (!metadataResults.valid) {
      console.log('❌ Metadata issues:');
      metadataResults.issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ Metadata validated successfully');
    }
    
    // Validate script if metadata is valid
    let scriptResults = { valid: false, issues: ['Cannot validate script without valid metadata'] };
    if (metadataResults.metadata) {
      scriptResults = validateScript(xmlDoc, metadataResults.metadata);
      if (!scriptResults.valid) {
        console.log('❌ Script issues:');
        scriptResults.issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log('✅ Script validated successfully');
      }
    }
    
    // Validate SVG structure if metadata is valid
    let structureResults = { valid: false, issues: ['Cannot validate structure without valid metadata'] };
    if (metadataResults.metadata) {
      structureResults = validateSVGStructure(xmlDoc, metadataResults.metadata);
      if (!structureResults.valid) {
        console.log('❌ Structure issues:');
        structureResults.issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log('✅ Structure validated successfully');
      }
    }
    
    // Try to fix issues if requested
    if (options.fix) {
      await fixCommonIssues(filePath, {
        metadataResults,
        scriptResults,
        structureResults
      });
    }
    
    // Check for more complex issues like syntax errors
    console.log('Checking for JavaScript syntax errors...');
    const scriptNodes = xmlDoc.getElementsByTagName('script');
    if (scriptNodes.length > 0) {
      const scriptContent = scriptNodes[0].textContent;
      try {
        // Use Function constructor to check for syntax errors (doesn't execute the code)
        new Function(scriptContent);
        console.log('✅ Script syntax is valid');
      } catch (e) {
        console.log(`❌ Script syntax error: ${e.message}`);
      }
    }
    
    // Validate against XSD schema
    try {
      const result = await validateAgainstSchema(content);
      if (result.valid) {
        console.log('✅ XSD schema validation passed');
      } else {
        console.log('❌ XSD schema validation failed:');
        result.messages.forEach(msg => console.log(`   - ${msg}`));
      }
    } catch (err) {
      console.error(`❌ XSD validation error: ${err.message}`);
    }
    
  } catch (err) {
    console.error(`Error validating ${filePath}: ${err.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  // Process each file
  for (const file of options.files) {
    await validateSVGComponent(file);
  }
  
  console.log('\nValidation complete');
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
