const fs = require('fs').promises;
const path = require('path');

async function fixPreloader() {
    try {
        const filePath = path.join(__dirname, 'index.html');
        let content = await fs.readFile(filePath, 'utf8');
        
        // Fix the preloader image tag
        const fixedPreloader = `
        <div class="preloader">
            <img src="assets/images/logo.jpg" width="80" height="24" alt="7F Design Logo" loading="eager">
        </div>`;
        
        // Replace the existing preloader with the fixed version
        content = content.replace(
            /<div class="preloader">[\s\S]*?<\/div>/, 
            fixedPreloader
        );
        
        await fs.writeFile(filePath, content, 'utf8');
        console.log('Preloader fixed in index.html');
        
        // Also update the preloader in other HTML files
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html') && file !== 'index.html');
        
        for (const file of htmlFiles) {
            await processOtherHtmlFile(file);
        }
        
        console.log('Preloader updates complete!');
    } catch (error) {
        console.error('Error fixing preloader:', error);
    }
}

async function processOtherHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Check if the file has a preloader
        if (content.includes('class="preloader"')) {
            const fixedPreloader = `
        <div class="preloader">
            <img src="assets/images/logo.jpg" width="80" height="24" alt="7F Design Logo" loading="eager">
        </div>`;
            
            content = content.replace(
                /<div class="preloader">[\s\S]*?<\/div>/, 
                fixedPreloader
            );
            
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Updated preloader in ${filename}`);
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

// Run the fix
fixPreloader();
