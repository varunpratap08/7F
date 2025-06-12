const fs = require('fs').promises;
const path = require('path');

async function integratePreloader() {
    try {
        const filePath = path.join(__dirname, 'index.html');
        let content = await fs.readFile(filePath, 'utf8');
        
        // Add preloader styles
        const preloaderStyles = `
        <style>
            .header-preloader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 80px;
                background: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                transition: opacity 0.5s ease-out, transform 0.5s ease-out;
                transform: translateY(0);
            }
            .header-preloader.hide {
                transform: translateY(-100%);
                opacity: 0;
                pointer-events: none;
            }
            .header-preloader img {
                max-height: 40px;
                width: auto;
            }
        </style>`;

        // Add preloader HTML at the beginning of the header
        const headerPreloader = `
        <div class="header-preloader">
            <img src="assets/images/logo.jpg" alt="7F Design Logo" loading="eager">
        </div>`;

        // Remove the old preloader
        content = content.replace(
            /<div class="preloader"[\s\S]*?<\/div>/,
            ''
        );

        // Add new preloader styles to head
        if (!content.includes('header-preloader')) {
            content = content.replace('</head>', `${preloaderStyles}</head>`);
        }

        // Add new preloader to header
        if (!content.includes('header-preloader')) {
            content = content.replace(
                /<header([^>]*)>/,
                `${headerPreloader}\n        <header$1>`
            );
        }

        // Add JavaScript to hide preloader when page loads
        const preloaderScript = `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const preloader = document.querySelector('.header-preloader');
                if (preloader) {
                    // Hide preloader when page is fully loaded
                    window.addEventListener('load', function() {
                        setTimeout(function() {
                            preloader.classList.add('hide');
                            // Remove from DOM after animation
                            setTimeout(() => preloader.remove(), 500);
                        }, 500);
                    });
                }
            });
        </script>`;

        // Add script before closing body tag
        if (!content.includes('header-preloader')) {
            content = content.replace('</body>', `${preloaderScript}\n    </body>`);
        }

        await fs.writeFile(filePath, content, 'utf8');
        console.log('Integrated preloader into header in index.html');

        // Update other HTML files with the same header structure
        const files = await fs.readdir(__dirname);
        const htmlFiles = files.filter(file => file.endsWith('.html') && file !== 'index.html');
        
        for (const file of htmlFiles) {
            await updateOtherHtmlFile(file, headerPreloader, preloaderStyles, preloaderScript);
        }
        
        console.log('Preloader integration complete!');
    } catch (error) {
        console.error('Error integrating preloader:', error);
    }
}

async function updateOtherHtmlFile(filename, headerPreloader, preloaderStyles, preloaderScript) {
    try {
        const filePath = path.join(__dirname, filename);
        let content = await fs.readFile(filePath, 'utf8');
        
        // Skip if already updated
        if (content.includes('header-preloader')) {
            console.log(`Skipping already updated file: ${filename}`);
            return;
        }
        
        // Remove old preloader if exists
        content = content.replace(
            /<div class="preloader"[\s\S]*?<\/div>/g,
            ''
        );
        
        // Add new preloader styles to head
        content = content.replace('</head>', `${preloaderStyles}</head>`);
        
        // Add new preloader to header
        content = content.replace(
            /<header([^>]*)>/,
            `${headerPreloader}\n        <header$1>`
        );
        
        // Add script before closing body tag
        content = content.replace('</body>', `${preloaderScript}\n    </body>`);
        
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Updated preloader in ${filename}`);
    } catch (error) {
        console.error(`Error updating ${filename}:`, error);
    }
}

// Run the integration
integratePreloader();
