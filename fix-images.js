const fs = require('fs').promises;
const path = require('path');

async function fixImagePaths() {
    try {
        // Get all HTML files
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} HTML files to process`);
        
        for (const file of htmlFiles) {
            await processHtmlFile(file);
        }
        
        console.log('Image paths fixed successfully!');
    } catch (error) {
        console.error('Error fixing image paths:', error);
    }
}

async function processHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Fix image tags with duplicate attributes and incorrect srcset
        content = content.replace(
            /<img([^>]*)srcset=["'][^"']*["']([^>]*)src=["']([^"']*)["']([^>]*)>/gi,
            (match, before, middle, src, after) => {
                // Extract the original image path
                const imgName = path.basename(src);
                const imgDir = path.dirname(src);
                const imgExt = path.extname(imgName);
                const imgBase = imgName.replace(imgExt, '');
                
                // Check if it's a logo or favicon
                const isLogo = imgName.includes('logo') || imgName.includes('favicon');
                
                // Create optimized image tag with proper attributes
                return `<img${before} src="${src}"${middle}${after}
                    width="${isLogo ? '80' : '800'}" 
                    height="${isLogo ? '24' : '600'}" 
                    loading="lazy" 
                    decoding="async"
                    alt="${getAltText(before + middle + after) || '7F Design Image'}">`;
            }
        );
        
        // Remove any remaining srcset attributes that might be incorrect
        content = content.replace(/\s+srcset=["'][^"']*["']/gi, '');
        
        // Fix any duplicate attributes
        content = content.replace(/(\w+)=["'][^"']*["']\s+\w+=["']/g, (match) => {
            // Keep only the first occurrence of each attribute
            const attrs = new Map();
            const parts = match.split(/\s+/);
            const result = [];
            
            for (const part of parts) {
                if (part.includes('=')) {
                    const [key] = part.split('=');
                    if (!attrs.has(key.toLowerCase())) {
                        attrs.set(key.toLowerCase(), true);
                        result.push(part);
                    }
                } else {
                    result.push(part);
                }
            }
            
            return result.join(' ');
        });
        
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Fixed image paths in ${filename}`);
        
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

function getAltText(attrs) {
    const altMatch = /alt=["']([^"']*)["']/i.exec(attrs);
    return altMatch ? altMatch[1] : '';
}

// Run the script
fixImagePaths();
