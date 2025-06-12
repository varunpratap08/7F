const fs = require('fs');
const path = require('path');

// Configuration
const pagesDir = path.join(__dirname);

// Image optimization mapping
const imageMap = {
    'blog-image-1.jpg': {
        alt: 'Interior Design Example 1',
        width: 800,
        height: 600
    },
    'blog-image-2.jpg': {
        alt: 'Interior Design Example 2',
        width: 800,
        height: 600
    },
    'blog-image-3.jpg': {
        alt: 'Interior Design Example 3',
        width: 800,
        height: 600
    }
};

// Get all HTML files in the directory
const htmlFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Process each image in the mapping
    Object.entries(imageMap).forEach(([filename, { alt, width, height }]) => {
        const imgPattern = new RegExp(`<img([^>]*)src=["']assets/images/${filename.replace('.', '\.')}["']([^>]*)>`, 'gi');
        
        content = content.replace(imgPattern, (match, p1, p2) => {
            // Check if already optimized
            if (match.includes('width=') && match.includes('height=') && match.includes('loading=')) {
                return match;
            }
            
            updated = true;
            return `<img${p1}src="assets/images/${filename}" width="${width}" height="${height}" alt="${alt}" loading="lazy"${p2}>`;
        });
    });
    
    // Write changes if any optimizations were made
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Optimized blog images in ${file}`);
    }
});

console.log('Blog image optimization complete!');
