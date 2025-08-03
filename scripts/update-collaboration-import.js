/**
 * Script to update the import statement in app.js to use the patched collaboration manager
 */

const fs = require('fs');
const path = require('path');

// Path to app.js
const appJsPath = path.join(process.cwd(), 'js', 'app.js');

// Read the file
console.log(`📝 Updating imports in ${appJsPath}...`);

fs.readFile(appJsPath, 'utf8', (err, data) => {
    if (err) {
        console.error('❌ Error reading app.js:', err);
        process.exit(1);
    }

    // Replace the import statement
    const updatedContent = data.replace(
        /import\s*\{\s*CollaborationManager\s*\}\s*from\s*['"][^'"]*collaboration-manager\.js['"]\s*;/,
        'import { CollaborationManager } from \'./collaboration-manager-patched.js\';'
    );

    // Write the updated content back to the file
    fs.writeFile(appJsPath, updatedContent, 'utf8', (err) => {
        if (err) {
            console.error('❌ Error writing to app.js:', err);
            process.exit(1);
        }
        console.log('✅ Successfully updated app.js to use patched collaboration manager');
    });
});
