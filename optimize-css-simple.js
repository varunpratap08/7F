const fs = require('fs').promises;
const path = require('path');

// Configuration
const cssDir = path.join(__dirname, 'assets', 'css');

// Critical CSS that should be inlined in the head
const criticalCss = `
/* Critical CSS */
html,body{height:100%;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.5;color:#212529;}
.container{width:100%;padding-right:15px;padding-left:15px;margin-right:auto;margin-left:auto;}
@media (min-width:576px){.container{max-width:540px;}}
@media (min-width:768px){.container{max-width:720px;}}
@media (min-width:992px){.container{max-width:960px;}}
@media (min-width:1200px){.container{max-width:1140px;}}
/* Add more critical styles as needed */
`;

// Process all HTML files
async function optimizeCssDelivery() {
    try {
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
        
        // Skip if already processed
        if (content.includes('data-css-optimized="true"')) {
            console.log(`Skipping already processed file: ${filename}`);
            return;
        }
        
        let updated = false;
        
        // Find all CSS links
        const cssLinkRegex = /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
        let cssLinks = [];
        let match;
        
        while ((match = cssLinkRegex.exec(content)) !== null) {
            if (match[1] && !match[1].includes('font-awesome')) {
                cssLinks.push({
                    fullMatch: match[0],
                    href: match[1]
                });
            }
        }
        
        if (cssLinks.length === 0) {
            return; // No CSS links found
        }
        
        // Add critical CSS to head
        if (!content.includes('<style id="critical-css">')) {
            const styleTag = `\n    <style id="critical-css" data-css-optimized="true">${criticalCss}</style>\n`;
            content = content.replace('</head>', `${styleTag}</head>`);
            updated = true;
        }
        
        // Process each CSS file
        for (const { fullMatch, href } of cssLinks) {
            // Replace with preload and noscript pattern
            const preloadLink = `
    <link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="${href}"></noscript>`;
            
            content = content.replace(fullMatch, preloadLink);
            updated = true;
        }
        
        // Add loadCSS polyfill if not already present
        if (updated && !content.includes('loadCSS')) {
            const loadCssScript = `
    <script>
    /*! loadCSS. [c]2017 Filament Group, Inc. MIT License */
    !function(e){"use strict";var n=function(n,t,o){var i=e.document.createElement("link"),a=t||e.document.getElementsByTagName("script")[0],s=e.document.styleSheets;return i.rel="stylesheet",i.href=n,i.media="only x",a.parentNode.insertBefore(i,a),i.onload=o||function(){},i.onloadcsscalled=function(n){n=!0;try{i.sheet.cssRules.length>0&&(o(),i.onloadcssalled=null)}catch(e){e.message.indexOf("cssRules")>-1?e.code=15:e.code=e.code||e.name||"CSSLoadError"}},i.onloadcssalled(),i};e.loadCSS=n;}(this);
    </script>`;
            content = content.replace('</head>', `${loadCssScript}\n</head>`);
        }
        
        if (updated) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Optimized CSS delivery in ${filename}`);
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

// Run the optimization
optimizeCssDelivery();
