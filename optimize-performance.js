const fs = require('fs').promises;
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

async function optimizePerformance() {
    try {
        // 1. Optimize HTML files
        await optimizeHtmlFiles();
        
        // 2. Optimize CSS files
        await optimizeCssFiles();
        
        // 3. Optimize JavaScript files
        await optimizeJsFiles();
        
        // 4. Create optimized versions of images
        console.log('Creating optimized image versions...');
        // Note: Image optimization would be handled by a build process in production
        
        console.log('Performance optimization complete!');
        
    } catch (error) {
        console.error('Error during optimization:', error);
    }
}

async function optimizeHtmlFiles() {
    const files = await fs.readdir(__dirname);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    for (const file of htmlFiles) {
        console.log(`Optimizing ${file}...`);
        let content = await fs.readFile(path.join(__dirname, file), 'utf8');
        
        // 1. Add preload for critical resources
        content = addResourceHints(content);
        
        // 2. Inline critical CSS
        content = await inlineCriticalCss(content, file);
        
        // 3. Defer non-critical CSS and JS
        content = deferNonCriticalResources(content);
        
        // 4. Optimize images
        content = optimizeImageTags(content);
        
        // 5. Add font-display: swap
        content = addFontDisplaySwap(content);
        
        // 6. Remove render-blocking resources
        content = removeRenderBlocking(content);
        
        // 7. Add service worker registration
        content = addServiceWorkerRegistration(content);
        
        await fs.writeFile(path.join(__dirname, file), content, 'utf8');
    }
}

function addResourceHints(content) {
    // Add preconnect for external domains
    const preconnectHints = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
    `;
    
    // Add preload for critical resources
    const preloadHints = `
    <link rel="preload" href="assets/css/critical.css" as="style">
    <link rel="preload" href="assets/js/main.js" as="script">
    <link rel="preload" href="assets/fonts/your-font.woff2" as="font" type="font/woff2" crossorigin>
    `;
    
    // Insert after <head>
    return content.replace(
        /<head[^>]*>/i, 
        `$&\n    ${preconnectHints}\n    ${preloadHints}`
    );
}

async function inlineCriticalCss(content, filename) {
    // In a real implementation, we would:
    // 1. Extract critical CSS for the page
    // 2. Inline it in the <head>
    // 3. Load the rest asynchronously
    
    // This is a simplified version that just demonstrates the concept
    const criticalCss = `
    <style>
    /* Critical CSS for ${filename} */
    :root { --primary-color: #253b2f; --text-color: #333; }
    body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.6; color: var(--text-color); }
    h1, h2, h3, h4, h5, h6 { margin-top: 0; line-height: 1.2; }
    img { max-width: 100%; height: auto; display: block; }
    .header-preloader { position: fixed; top: 0; left: 0; width: 100%; height: 80px; background: #fff; z-index: 9999; }
    /* Add more critical styles as needed */
    </style>
    <link rel="preload" href="assets/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="assets/css/main.css"></noscript>
    `;
    
    return content.replace('</head>', `    ${criticalCss}\n    </head>`);
}

function deferNonCriticalResources(content) {
    // Defer non-critical JS
    content = content.replace(
        /<script(?!.*defer)(?=.*<\/script>)([^>]*)>/gi,
        (match) => {
            // Skip if already has defer or is a module
            if (match.includes('defer') || match.includes('module') || match.includes('nomodule') || 
                match.includes('application/ld+json')) {
                return match;
            }
            return match.replace('>', ' defer>');
        }
    );
    
    // Async load non-critical CSS
    content = content.replace(
        /<link[^>]*rel=['"]stylesheet['"][^>]*>/gi,
        (match) => {
            // Skip if already has onload or is critical
            if (match.includes('onload') || match.includes('critical')) {
                return match;
            }
            return match.replace('>', ' media="print" onload="this.media=\'all\'">');
        }
    );
    
    return content;
}

function optimizeImageTags(content) {
    // Add loading="lazy" to non-critical images
    content = content.replace(
        /<img((?![^>]*(loading=|srcset=))[^>]*)>/gi,
        (match, group1) => {
            // Skip if it's above the fold or critical image
            if (match.includes('class="') && match.includes('hero')) {
                return match;
            }
            return `<img loading="lazy" decoding="async" ${group1}>`;
        }
    );
    
    // Add width and height to prevent layout shifts
    content = content.replace(
        /<img((?![^>]*(width=|height=))[^>]*)>/gi,
        (match, group1) => {
            // Skip if it's an icon or logo
            if (match.includes('icon') || match.includes('logo')) {
                return match;
            }
            return `<img width="800" height="600" ${group1}>`;
        }
    );
    
    return content;
}

function addFontDisplaySwap(content) {
    // Add font-display: swap to Google Fonts
    return content.replace(
        /<link[^>]*href=["']https:\/\/fonts\.googleapis\.com[^>]*>/gi,
        (match) => {
            if (match.includes('display=')) {
                return match;
            }
            return match.replace('>', '&display=swap>');
        }
    );
}

function removeRenderBlocking(content) {
    // Remove render-blocking resources from head
    // This is a simplified example - in a real implementation, you'd be more specific
    content = content.replace(
        /<link[^>]*rel=['"]stylesheet['"][^>]*>(?!(<noscript>|<\/head>|\s*<link[^>]*rel=['"]preload['"]))/gi,
        (match) => {
            return match.replace('stylesheet', 'preload') + 
                   ' onload="this.rel=\'stylesheet\'"';
        }
    );
    
    return content;
}

function addServiceWorkerRegistration(content) {
    // Add service worker registration if not present
    if (!content.includes('register-sw.js')) {
        const swScript = `
        <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
        </script>`;
        
        content = content.replace('</body>', `    ${swScript}\n    </body>`);
    }
    return content;
}

async function optimizeCssFiles() {
    const cssDir = path.join(__dirname, 'assets', 'css');
    const files = await fs.readdir(cssDir);
    
    for (const file of files.filter(f => f.endsWith('.css'))) {
        const filePath = path.join(cssDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Minify CSS
        const minified = new CleanCSS({
            level: 2
        }).minify(content).styles;
        
        await fs.writeFile(filePath, minified, 'utf8');
        console.log(`Minified ${file}`);
    }
}

async function optimizeJsFiles() {
    const jsDir = path.join(__dirname, 'assets', 'js');
    const files = await fs.readdir(jsDir);
    
    for (const file of files.filter(f => f.endsWith('.js'))) {
        const filePath = path.join(jsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Minify JS
        const minified = (await minify(content, {
            compress: true,
            mangle: true
        })).code;
        
        await fs.writeFile(filePath, minified, 'utf8');
        console.log(`Minified ${file}`);
    }
}

// Run the optimization
optimizePerformance().catch(console.error);
