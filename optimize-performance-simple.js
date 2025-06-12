const fs = require('fs').promises;
const path = require('path');

async function optimizePerformance() {
    try {
        console.log('Starting performance optimization...');
        
        // 1. Optimize HTML files
        await optimizeHtmlFiles();
        
        // 2. Create optimized critical CSS
        await createCriticalCss();
        
        // 3. Optimize image loading
        await optimizeImages();
        
        console.log('Performance optimization complete!');
        console.log('Next steps:');
        console.log('1. Manually minify your CSS files using an online tool if needed');
        console.log('2. Optimize your images using an online image compressor');
        console.log('3. Test the website using PageSpeed Insights');
        
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
        
        // 1. Add preconnect and preload hints
        content = addResourceHints(content);
        
        // 2. Inline critical CSS
        content = await inlineCriticalCss(content, file);
        
        // 3. Defer non-critical CSS and JS
        content = deferNonCriticalResources(content);
        
        // 4. Optimize images
        content = optimizeImageTags(content);
        
        // 5. Add font-display: swap
        content = addFontDisplaySwap(content);
        
        // 6. Add service worker registration if not present
        if (!content.includes('register-sw.js')) {
            content = addServiceWorkerRegistration(content);
        }
        
        await fs.writeFile(path.join(__dirname, file), content, 'utf8');
        console.log(`✅ Optimized ${file}`);
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
    
    const preloadHints = `
    <link rel="preload" href="assets/css/critical.css" as="style">
    <link rel="preload" href="assets/js/main.js" as="script">
    `;
    
    // Insert after <head>
    if (!content.includes('preconnect')) {
        content = content.replace(
            /<head[^>]*>/i, 
            `$&\n    ${preconnectHints}\n    ${preloadHints}`
        );
    }
    
    return content;
}

async function createCriticalCss() {
    const criticalCss = `
    /* Critical CSS */
    :root { --primary-color: #253b2f; --text-color: #333; }
    body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.6; color: var(--text-color); }
    h1, h2, h3, h4, h5, h6 { margin-top: 0; line-height: 1.2; }
    img { max-width: 100%; height: auto; display: block; }
    .header-preloader { position: fixed; top: 0; left: 0; width: 100%; height: 80px; background: #fff; z-index: 9999; }
    /* Add more critical styles as needed */
    `;
    
    try {
        await fs.writeFile(path.join(__dirname, 'assets', 'css', 'critical.css'), criticalCss, 'utf8');
        console.log('✅ Created critical.css');
    } catch (error) {
        console.warn('Could not create critical.css. Make sure the assets/css directory exists.');
    }
    
    return criticalCss;
}

async function inlineCriticalCss(content, filename) {
    const criticalCss = await createCriticalCss();
    
    // Add critical CSS inline in the head
    const criticalStyle = `
    <style>${criticalCss}</style>
    <link rel="preload" href="assets/css/style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="assets/css/style.css"></noscript>
    `;
    
    if (!content.includes('critical.css')) {
        return content.replace('</head>', `    ${criticalStyle}\n    </head>`);
    }
    
    return content;
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
            if (match.includes('onload') || match.includes('critical') || 
                match.includes('preload') || match.includes('prefetch')) {
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

function addServiceWorkerRegistration(content) {
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
    
    return content.replace('</body>', `    ${swScript}\n    </body>`);
}

async function optimizeImages() {
    console.log('\n📝 Image Optimization Instructions:');
    console.log('1. Use an online tool like TinyPNG (https://tinypng.com/) to compress your images');
    console.log('2. Convert images to WebP format for better compression');
    console.log('3. Ensure all images have appropriate dimensions (width and height attributes)');
    console.log('4. Consider using a CDN for image delivery');
    console.log('5. Implement responsive images with srcset for different screen sizes\n');
}

// Run the optimization
optimizePerformance().catch(console.error);
