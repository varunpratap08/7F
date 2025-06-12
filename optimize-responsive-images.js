const fs = require('fs').promises;
const path = require('path');
const { createHash } = require('crypto');

// Configuration
const imageSizes = [
    { suffix: '-320w', width: 320 },
    { suffix: '-480w', width: 480 },
    { suffix: '-768w', width: 768 },
    { suffix: '-1024w', width: 1024 },
    { suffix: '-1366w', width: 1366 },
    { suffix: '-1600w', width: 1600 },
    { suffix: '-1920w', width: 1920 }
];

// Process all HTML files
async function optimizeResponsiveImages() {
    try {
        // Get all HTML files
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} HTML files to process`);
        
        for (const file of htmlFiles) {
            await processHtmlFile(file);
        }
        
        console.log('Responsive images optimization complete!');
    } catch (error) {
        console.error('Error optimizing responsive images:', error);
    }
}

// Process a single HTML file
async function processHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Skip if already processed
        if (content.includes('data-responsive-optimized="true"')) {
            console.log(`Skipping already processed file: ${filename}`);
            return;
        }
        
        let updated = false;
        
        // Find all image tags
        const imgTagRegex = /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi;
        
        content = content.replace(imgTagRegex, (match, before, src, after) => {
            // Skip if already has srcset or is an external image
            if (match.includes('srcset=') || src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) {
                return match;
            }
            
            // Skip small images like icons
            if (src.includes('icon') || src.includes('logo') || src.includes('favicon')) {
                return match;
            }
            
            updated = true;
            
            // Generate srcset and sizes attributes
            const imageName = path.basename(src);
            const imageExt = path.extname(imageName);
            const imageBase = imageName.replace(imageExt, '');
            const imageDir = path.dirname(path.join(__dirname, src));
            
            // Generate srcset values
            const srcset = imageSizes
                .map(size => `assets/images/${imageBase}${size.suffix}${imageExt} ${size.width}w`)
                .join(', ');
            
            // Generate sizes attribute for responsive images
            const sizes = '(max-width: 320px) 280px, ' +
                         '(max-width: 480px) 440px, ' +
                         '(max-width: 768px) 720px, ' +
                         '(max-width: 1024px) 960px, ' +
                         '(max-width: 1366px) 1280px, ' +
                         '(max-width: 1600px) 1440px, ' +
                         '1920px';
            
            // Create new image tag with responsive attributes
            return `<img${before} 
                srcset="${srcset}" 
                sizes="${sizes}" 
                src="${src}" 
                alt="${getAltText(before + after) || 'Image'}" 
                loading="lazy" 
                decoding="async"
                data-responsive-optimized="true"
                ${after}>`;
        });
        
        if (updated) {
            // Add picturefill polyfill if not already present
            if (!content.includes('picturefill.min.js')) {
                const picturefillScript = `
                <script>
                // Picture element HTML5 shiv
                document.createElement( "picture" );
                </script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/picturefill/3.0.3/picturefill.min.js" async></script>`;
                content = content.replace('</head>', `${picturefillScript}\n</head>`);
            }
            
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Optimized responsive images in ${filename}`);
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

// Helper function to extract alt text if it exists
function getAltText(attrs) {
    const altMatch = /alt=["']([^"']*)["']/i.exec(attrs);
    return altMatch ? altMatch[1] : '';
}

// Run the optimization
optimizeResponsiveImages();
