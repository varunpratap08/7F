const fs = require('fs').promises;
const path = require('path');
const { minify } = require('csso');

// Configuration
const cssDir = path.join(__dirname, 'assets', 'css');
const outputDir = path.join(__dirname, 'assets', 'css', 'optimized');

// Critical CSS selectors that should be inlined
const criticalSelectors = [
    // Layout
    'body', 'html', '.container', '.row', '.col-', 
    // Typography
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a',
    // Navigation
    '.navbar', '.nav-link', '.navbar-brand',
    // Buttons
    '.btn', '.btn-',
    // Utilities
    '.d-', '.m-', '.p-', '.text-', '.bg-', '.w-', '.h-',
    // Custom critical components
    '.hero', '.header', '.footer', '.section', '.card',
    // Animations
    '.animate__animated', '.fadeIn', '.slideIn'
];

// Process all HTML files
async function optimizeCssDelivery() {
    try {
        // Create optimized directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });
        
        // Get all HTML files
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        console.log(`Found ${htmlFiles.length} HTML files to process`);
        
        for (const file of htmlFiles) {
            await processHtmlFile(file);
        }
        
        console.log('CSS delivery optimization complete!');
    } catch (error) {
        console.error('Error optimizing CSS delivery:', error);
    }
}

// Process a single HTML file
async function processHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        let updated = false;
        
        // Find all CSS links
        const cssLinkRegex = /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
        let cssLinks = [];
        let match;
        
        while ((match = cssLinkRegex.exec(content)) !== null) {
            if (match[1] && !match[1].includes('font-awesome')) {
                cssLinks.push(match[1]);
            }
        }
        
        if (cssLinks.length === 0) {
            return; // No CSS links found
        }
        
        // Process each CSS file
        for (const cssLink of cssLinks) {
            const cssPath = path.join(__dirname, cssLink.startsWith('/') ? cssLink.substring(1) : cssLink);
            
            try {
                // Read and process CSS file
                let cssContent = await fs.readFile(cssPath, 'utf8');
                
                // Minify CSS
                const result = minify(cssContent, {
                    restructure: true,
                    forceMediaMerge: true
                });
                
                // Save minified version
                const minFilename = path.basename(cssPath).replace(/\.css$', '.min.css');
                const outputPath = path.join(outputDir, minFilename);
                await fs.writeFile(outputPath, result.css, 'utf8');
                
                // Update HTML to use preload for non-critical CSS
                const preloadLink = `<link rel="preload" href="${cssLink}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n`;
                const noscriptLink = `<noscript><link rel="stylesheet" href="${cssLink}"></noscript>`;
                
                // Replace original link with optimized version
                const originalLink = new RegExp(`<link[^>]*href=["']${cssLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
                content = content.replace(originalLink, `${preloadLink}${noscriptLink}`);
                
                updated = true;
                
            } catch (error) {
                console.error(`Error processing ${cssLink}:`, error);
            }
        }
        
        if (updated) {
            // Add loadCSS polyfill if not already present
            if (!content.includes('loadCSS')) {
                const loadCssScript = `
                <script>
                /*! loadCSS. [c]2017 Filament Group, Inc. MIT License */
                !function(e){"use strict";var n=function(n,t,o){var i=e.document.createElement("link"),a=t||e.document.getElementsByTagName("script")[0],s=e.document.styleSheets;return i.rel="stylesheet",i.href=n,i.media="only x",a.parentNode.insertBefore(i,a),i.onload=o||function(){},i.onloadcsscalled=function(n){n=!0;try{i.sheet.cssRules.length>0&&(o(),i.onloadcsscalled=null)}catch(e){e.message.indexOf("cssRules")>-1?e.code=15:e.code=e.code||e.name||"CSSLoadError"}},i.onloadcsscalled(),i};"undefined"!=typeof exports?exports.loadCSS=n:e.loadCSS=n}("undefined"!=typeof global?global:this);
                </script>
                <script>
                // Load CSS asynchronously
                document.addEventListener('DOMContentLoaded', function() {
                    var styles = document.querySelectorAll('link[rel="preload"][as="style"]');
                    styles.forEach(function(link) {
                        link.rel = 'stylesheet';
                    });
                });
                </script>`;
                content = content.replace('</head>', `${loadCssScript}\n</head>`);
            }
            
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Optimized CSS delivery in ${filename}`);
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

// Run the optimization
optimizeCssDelivery();
