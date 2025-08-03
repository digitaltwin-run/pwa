#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

// Directory containing SVG files
const componentsDir = path.join(__dirname, '../components');

// Configuration for XML parser
const parserOptions = {
    ignoreAttributes: false,
    preserveOrder: true,
    unpairedTags: [],
    stopNodes: ['*.pre', '*.script'],
    processEntities: false,
    htmlEntities: false
};

// List of SVG files to process
const svgFiles = [
    'led.svg',
    'button.svg',
    'motor.svg',
    'counter.svg',
    'gauge.svg',
    'knob.svg',
    'slider.svg',
    'switch.svg'
];

// Function to fix SVG file
async function fixSvgFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if the file contains unclosed CDATA sections
        const hasUnclosedCDATA = /<!\[CDATA\[[^\]]*$/m.test(content);
        
        if (hasUnclosedCDATA) {
            console.log(`Fixing unclosed CDATA in ${filePath}`);
            
            // Add closing CDATA and script tags if they're missing
            content = content.replace(
                /<script>\s*<!\[CDATA\[([\s\S]*?)(?=\s*<\/script>|$)/g,
                (match, cdataContent) => {
                    // Properly close the CDATA section
                    return `<script><![CDATA[${cdataContent}]]></script>`;
                }
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

// Function to validate SVG file
function validateSvg(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parser = new XMLParser(parserOptions);
        
        // This will throw an error if the XML is invalid
        parser.parse(content);
        
        // Check for unclosed CDATA sections
        if (content.includes('<![CDATA[') && !content.includes(']]>')) {
            throw new Error('Unclosed CDATA section');
        }
        
        return { valid: true };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message,
            file: filePath
        };
    }
}

// Process all SVG files
async function processSvgs() {
    console.log('Validating and fixing SVG files...');
    let fixedCount = 0;
    let invalidFiles = [];

    for (const file of svgFiles) {
        const filePath = path.join(componentsDir, file);
        
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        // First, try to fix common issues
        const wasFixed = await fixSvgFile(filePath);
        if (wasFixed) {
            fixedCount++;
        }

        // Then validate
        const validation = validateSvg(filePath);
        if (!validation.valid) {
            console.error(`Validation failed for ${file}:`, validation.error);
            invalidFiles.push(validation);
        }
    }

    console.log(`\nProcessed ${svgFiles.length} files.`);
    console.log(`Fixed ${fixedCount} files.`);
    
    if (invalidFiles.length > 0) {
        console.log('\nValidation errors:');
        invalidFiles.forEach(err => {
            console.error(`- ${path.basename(err.file)}: ${err.error}`);
        });
        process.exit(1);
    } else {
        console.log('All SVG files are valid.');
    }
}

// Run the script
processSvgs().catch(console.error);
