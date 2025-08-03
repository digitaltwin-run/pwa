/**
 * Fix SVG Component Properties
 * 
 * This script ensures that SVG component properties are properly displayed in the properties panel
 * by adding the necessary metadata structure that the SVG editor expects.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { DOMParser, XMLSerializer } = require('xmldom');

// Directory containing SVG components
const COMPONENTS_DIR = path.join(__dirname, '../components');

// Function to process a single SVG file
function processSVGFile(filePath) {
  try {
    // Read the SVG file
    const svgContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the SVG using xmldom for better XML handling
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Find the root SVG element
    const svgElement = doc.getElementsByTagName('svg')[0];
    if (!svgElement) return false;
    
    // Find or create metadata element
    let metadata = svgElement.getElementsByTagName('metadata')[0];
    if (!metadata) {
      metadata = doc.createElement('metadata');
      svgElement.insertBefore(metadata, svgElement.firstChild);
    }
    
    // Find or create component element inside metadata
    let component = metadata.getElementsByTagName('component')[0];
    if (!component) {
      component = doc.createElement('component');
      metadata.appendChild(component);
    }
    
    // Find or create parameters element
    let parameters = component.getElementsByTagName('parameters')[0];
    if (!parameters) {
      parameters = doc.createElement('parameters');
      component.appendChild(parameters);
    }
    
    // Get all parameter elements
    const paramElements = parameters.getElementsByTagName('*');
    const paramNames = Array.from(paramElements).map(el => el.tagName.toLowerCase());
    
    // Add missing default parameters if they don't exist
    const defaultParams = {
      'label': 'LED',
      'color': '#e74c3c',
      'ison': 'false',
      'isblinking': 'false',
      'blinkrate': '500',
      'isactive': 'true'
    };
    
    let modified = false;
    
    // Add any missing parameters
    for (const [paramName, defaultValue] of Object.entries(defaultParams)) {
      if (!paramNames.includes(paramName)) {
        const paramElement = doc.createElement(paramName);
        paramElement.textContent = defaultValue;
        parameters.appendChild(paramElement);
        modified = true;
      }
    }
    
    // Add data-* attributes to make parameters discoverable by the properties panel
    if (!svgElement.hasAttribute('data-component-params')) {
      const paramsList = Array.from(parameters.getElementsByTagName('*'))
        .map(el => el.tagName.toLowerCase())
        .join(',');
      
      svgElement.setAttribute('data-component-params', paramsList);
      modified = true;
    }
    
    // If we made changes, save the file
    if (modified) {
      const serializer = new XMLSerializer();
      const newSvgContent = serializer.serializeToString(doc);
      fs.writeFileSync(filePath, newSvgContent);
      console.log(`Updated: ${filePath}`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Process all SVG files in the components directory
function processAllComponents() {
  try {
    const files = fs.readdirSync(COMPONENTS_DIR);
    const svgFiles = files.filter(file => file.endsWith('.svg'));
    
    console.log(`Found ${svgFiles.length} SVG files to process`);
    
    let updatedCount = 0;
    
    for (const file of svgFiles) {
      const filePath = path.join(COMPONENTS_DIR, file);
      if (processSVGFile(filePath)) {
        updatedCount++;
      }
    }
    
    console.log(`\nProcessing complete. Updated ${updatedCount} of ${svgFiles.length} files.`);
    
  } catch (error) {
    console.error('Error processing components:', error);
    process.exit(1);
  }
}

// Run the script
processAllComponents();
