import express from 'express';
import vision from '@google-cloud/vision';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

const client = new vision.ImageAnnotatorClient();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image uploaded.');
    }
    try {
        const [result] = await client.labelDetection({
            image: { content: req.file.buffer },
        });

        const labels = result.labelAnnotations.map(label => label.description);
        
        const htmlResponse = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Exercise</title>
          </head>
          <body>
            <ul>
              ${labels.map(label => `<li>${label}</li>`).join('')}
            </ul>
            <hr>
            <h2>Analyze Another Image</h2>
            <form action='/upload' method='POST' encType='multipart/form-data'>
              <input type='file' name='image' accept='image/*'>
              <input type='submit' value='Analyze'>
            </form>
          </body>
          </html>
        `;
        
        res.send(htmlResponse);
        
    } catch (error) {
        console.error('Error processing image with Vision API:', error);
        res.status(500).send('Error processing image.');
    }
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
