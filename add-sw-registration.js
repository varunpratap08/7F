const fs = require('fs').promises;
const path = require('path');

// Process all HTML files
async function addServiceWorkerRegistration() {
    try {
        // Get all HTML files
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} HTML files to process`);
        
        for (const file of htmlFiles) {
            await processHtmlFile(file);
        }
        
        console.log('Service worker registration added to all HTML files!');
    } catch (error) {
        console.error('Error adding service worker registration:', error);
    }
}

// Process a single HTML file
async function processHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Skip if already has service worker registration
        if (content.includes('register-sw.js') || content.includes('navigator.serviceWorker')) {
            console.log(`Skipping already processed file: ${filename}`);
            return;
        }
        
        // Add service worker registration script before closing </body> tag
        const swScript = '\n    <script src="/register-sw.js"></script>\n';
        
        if (content.includes('</body>')) {
            content = content.replace('</body>', `${swScript}</body>`);
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Added service worker registration to ${filename}`);
        } else {
            console.log(`No </body> tag found in ${filename}, appending to end`);
            await fs.appendFile(filePath, swScript, 'utf8');
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

// Run the script
addServiceWorkerRegistration();
