const fs = require('fs');
const path = require('path');

// Configuration
const pagesDir = path.join(__dirname);
const logoHtml = 'src="assets/images/logo.jpg"';
const optimizedLogoHtml = 'src="assets/images/logo.jpg" width="80" height="24" style="width: 80px; height: auto;" alt="7F Design Logo" loading="lazy"';
const preloaderLogoHtml = 'src="assets/images/logo.jpg" width="200" height="60" alt="7F Design Logo" loading="lazy"';

// Get all HTML files in the directory
const htmlFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Count occurrences before
    const beforeCount = (content.match(/<img[^>]*logo\.jpg[^>]*>/gi) || []).length;
    
    // Replace logo images
    content = content.replace(
        /<img([^>]*)src=["']assets\/images\/logo\.jpg["']([^>]*)>/gi,
        (match, p1, p2) => {
            // Check if it's a preloader (larger size)
            if (match.includes('preloader') || match.includes('Preloader')) {
                return `<img${p1}src="assets/images/logo.jpg"${p2} ${preloaderLogoHtml}>`;
            }
            // Default logo size
            return `<img${p1}src="assets/images/logo.jpg"${p2} ${optimizedLogoHtml}>`;
        }
    );
    
    // Count occurrences after
    const afterCount = (content.match(/<img[^>]*logo\.jpg[^>]*>/gi) || []).length;
    
    // Write changes if any replacements were made
    if (beforeCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${beforeCount} logo(s) in ${file}`);
        
        if (beforeCount !== afterCount) {
            console.warn(`  Warning: Count mismatch in ${file} - before: ${beforeCount}, after: ${afterCount}`);
        }
    }
});

console.log('Logo optimization complete!');
