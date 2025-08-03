/**
 * Script to inject collaboration-fix.js into HTML files
 * This ensures the CollaborationManager is properly initialized before other scripts
 */

const fs = require('fs');
const path = require('path');

// Configuration
const HTML_FILES = ['index.html', 'test-rpi5b.html', 'test-rpi5b-extended.html'];
const FIX_SCRIPT = '<script src="/static/js/collaboration-fix.js"></script>';
const TARGET_SCRIPT = '<script src="/js/collaboration-manager.js"></script>';

// Process each HTML file
HTML_FILES.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    // Skip if file doesn't exist
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}: File not found`);
        return;
    }
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if fix is already applied
    if (content.includes(FIX_SCRIPT)) {
        console.log(`Skipping ${file}: Fix already applied`);
        return;
    }
    
    // Add the fix script before the collaboration-manager.js script
    if (content.includes(TARGET_SCRIPT)) {
        const newContent = content.replace(
            TARGET_SCRIPT,
            `${FIX_SCRIPT}\n    ${TARGET_SCRIPT}`
        );
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Successfully updated ${file}`);
    } else {
        console.log(`Skipping ${file}: Target script not found`);
    }
});

console.log('\n🎉 Collaboration fix injection complete!');
