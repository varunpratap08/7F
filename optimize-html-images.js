const fs = require('fs').promises;
const path = require('path');

// Configuration
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const defaultDimensions = {
    'logo.jpg': { width: 80, height: 24 },
    'blog-image-1.jpg': { width: 800, height: 600 },
    'blog-image-2.jpg': { width: 800, height: 600 },
    'blog-image-3.jpg': { width: 800, height: 600 },
    // Add more default dimensions as needed
};

// Process all HTML files in the directory
async function processHtmlFiles() {
    try {
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} HTML files to process`);
        
        for (const file of htmlFiles) {
            await processHtmlFile(file);
        }
        
        console.log('HTML image optimization complete!');
    } catch (error) {
        console.error('Error processing HTML files:', error);
    }
}

// Process a single HTML file
async function processHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        let updated = false;
        
        // Process image tags
        const imgTagRegex = /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi;
        
        content = content.replace(imgTagRegex, (match, before, src, after) => {
            // Skip if already has all required attributes
            if (match.includes('width=') && match.includes('height=') && match.includes('loading=')) {
                return match;
            }
            
            // Skip external images
            if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) {
                return match;
            }
            
            updated = true;
            const imageName = path.basename(src);
            const ext = path.extname(imageName).toLowerCase();
            
            // Skip non-image files
            if (!imageExtensions.includes(ext)) {
                return match;
            }
            
            // Get dimensions from defaults or use fallback
            const dimensions = defaultDimensions[imageName] || { width: 800, height: 600 };
            
            // Build new attributes
            let newAttrs = before;
            
            // Add or update width and height
            if (!/\bwidth=/.test(newAttrs)) {
                newAttrs += ` width="${dimensions.width}"`;
            }
            if (!/\bheight=/.test(newAttrs)) {
                newAttrs += ` height="${dimensions.height}"`;
            }
            
            // Add loading lazy
            if (!/\bloading=/.test(newAttrs + after)) {
                newAttrs += ' loading="lazy"';
            }
            
            // Add alt if missing
            if (!/\balt=/.test(newAttrs + after)) {
                newAttrs += ' alt=""';
            }
            
            return `<img${newAttrs} src="${src}"${after}>`;
        });
        
        if (updated) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Updated images in ${filename}`);
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

// Run the optimization
processHtmlFiles();
