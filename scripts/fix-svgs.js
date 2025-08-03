#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directory containing SVG files
const componentsDir = path.join(__dirname, '../components');

// List of SVG files to process
const svgFiles = [
    'led.svg',
    'button.svg',
    'motor.svg',
    'counter.svg',
    'gauge.svg',
    'knob.svg',
    'slider.svg',
    'switch.svg',
    'display.svg',
    'relay.svg',
    'sensor.svg',
    'toggle.svg'
];

// Function to fix CDATA sections in SVG files
function fixSvgFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if the file contains unclosed CDATA sections
        const hasUnclosedCDATA = /<!\[CDATA\[([^\]]*)$/m.test(content);
        
        if (hasUnclosedCDATA) {
            console.log(`Fixing unclosed CDATA in ${filePath}`);
            
            // Add closing CDATA and script tags if they're missing
            content = content.replace(
                /<script><!\[CDATA\[([^\]]*)$/gm,
                '<script><![CDATA[$1]]></script>'
            );
            
            // Write the fixed content back to the file
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Process all SVG files
console.log('Fixing SVG files...');
let fixedCount = 0;

svgFiles.forEach(file => {
    const filePath = path.join(componentsDir, file);
    if (fs.existsSync(filePath)) {
        if (fixSvgFile(filePath)) {
            fixedCount++;
        }
    } else {
        console.warn(`File not found: ${filePath}`);
    }
});

console.log(`Processed ${svgFiles.length} files. Fixed ${fixedCount} files with unclosed CDATA sections.`);
