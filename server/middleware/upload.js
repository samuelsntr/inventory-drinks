const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage (memory storage for processing with sharp)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

const compressImage = async (req, res, next) => {
    if (!req.file) return next();

    const filename = `item-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(uploadDir, filename);

    try {
        await sharp(req.file.buffer)
            .resize(800, 800, { // Resize to max 800x800
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFormat('webp', { quality: 80 }) // Compress to WebP with 80% quality
            .toFile(filepath);

        // Add file URL to request object
        req.file.filename = filename;
        req.file.path = filepath;
        // Assuming your server is running on localhost:5000 or based on env
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        req.body.image = `${baseUrl}/uploads/${filename}`;
        
        next();
    } catch (error) {
        console.error('Error compressing image:', error);
        return res.status(500).json({ message: 'Error processing image' });
    }
};

module.exports = { upload, compressImage };
