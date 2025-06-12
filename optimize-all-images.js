const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const imageDir = path.join(__dirname, 'assets', 'images');
const outputDir = path.join(__dirname, 'assets', 'images', 'optimized');
const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];
const quality = 80; // Image quality (0-100)

// Create optimized directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Process a single image
async function processImage(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath, ext);
        const outputPath = path.join(outputDir, `${filename}.webp`);
        
        // Skip if already processed
        if (fs.existsSync(outputPath)) {
            return { input: filePath, output: outputPath, success: true, cached: true };
        }
        
        // Process with sharp
        await sharp(filePath)
            .resize(2000, 1500, { // Max dimensions
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality })
            .toFile(outputPath);
            
        return { input: filePath, output: outputPath, success: true };
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return { input: filePath, success: false, error };
    }
}

// Update HTML with optimized images
async function updateHtmlWithOptimizedImages() {
    const htmlFiles = (await readdir(__dirname))
        .filter(file => file.endsWith('.html'))
        .map(file => path.join(__dirname, file));
    
    for (const filePath of htmlFiles) {
        let content = await fs.promises.readFile(filePath, 'utf8');
        let updated = false;
        
        // Find all image tags
        const imgTagRegex = /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi;
        
        content = content.replace(imgTagRegex, (match, before, src, after) => {
            // Skip if already has width, height, and loading attributes
            if (match.includes('width=') && match.includes('height=') && match.includes('loading=')) {
                return match;
            }
            
            // Skip external images
            if (src.startsWith('http') || src.startsWith('//') || !src.includes('assets/images/')) {
                return match;
            }
            
            updated = true;
            const filename = path.basename(src);
            const optimizedSrc = src.replace('assets/images/', 'assets/images/optimized/').replace(/\.(jpg|jpeg|png)$/i, '.webp');
            
            // Add/update attributes
            let newAttrs = before;
            
            // Add or update width and height
            if (!/\bwidth=/.test(newAttrs)) {
                newAttrs += ' width="800"';
            }
            if (!/\bheight=/.test(newAttrs)) {
                newAttrs += ' height="600"';
            }
            
            // Add loading lazy
            if (!/\bloading=/.test(newAttrs + after)) {
                newAttrs += ' loading="lazy"';
            }
            
            // Add alt if missing
            if (!/\balt=/.test(newAttrs + after)) {
                newAttrs += ' alt=""';
            }
            
            return `<img${newAttrs} src="${optimizedSrc}"${after}>`;
        });
        
        if (updated) {
            await fs.promises.writeFile(filePath, content, 'utf8');
            console.log(`Updated image references in ${path.basename(filePath)}`);
        }
    }
}

// Main function
async function main() {
    try {
        console.log('Starting image optimization...');
        
        // Process all images in the images directory
        const files = await readdir(imageDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return supportedFormats.includes(ext) && !file.includes('optimized');
        });
        
        console.log(`Found ${imageFiles.length} images to optimize`);
        
        // Process images in parallel with concurrency limit
        const concurrency = 4;
        const batchSize = Math.ceil(imageFiles.length / concurrency);
        
        for (let i = 0; i < imageFiles.length; i += batchSize) {
            const batch = imageFiles.slice(i, i + batchSize);
            await Promise.all(
                batch.map(file => processImage(path.join(imageDir, file)))
            );
            console.log(`Processed batch ${i / batchSize + 1}/${concurrency}`);
        }
        
        // Update HTML files with optimized image references
        console.log('Updating HTML files...');
        await updateHtmlWithOptimizedImages();
        
        console.log('Image optimization complete!');
    } catch (error) {
        console.error('Error during optimization:', error);
        process.exit(1);
    }
}

// Run the main function
main();
