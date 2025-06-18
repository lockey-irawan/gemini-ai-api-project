const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI("AIzaSyBM8wCNecITNwWj9vgH5tDoXF9pFSM8WfA"); // process.env.GEMINI_API_KEY
const model = genAI.getGenerativeModel({ 
    model: 'models/gemini-2.0-flash',
    generationConfig: {
        temperature: 0.5,
    }
});

const upload = multer({ dest: 'uploads/'});

const PORT = 3000

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const imageToGenerativePart = (filePath) => ({
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType: 'image/png',
    },
})

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt;
    const image = imageToGenerativePart(req.file.path);
    
    try {
        const result = await model.generateContent([prompt, image]);
        const response = result.response.text();
        res.json({ output: response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const mimeType = req.file.mimetype;

    try {
        const documentPart = {
            inlineData: {
                data: base64,
                mimeType: mimeType,
            },
        };

        const result = await model.generateContent(['Analyze this document:', documentPart]);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {   
        res.status(500).json({ error: error.message });
    }
});

app.post('/generate-from-audio', upload.single('document'), async (req, res) => {
    const audioPath = req.file.path;
    const buffer = fs.readFileSync(audioPath);
    const base64 = buffer.toString('base64');
    const mimeType = req.file.mimetype;

    try {
        const audioPart = {
            inlineData: {
                data: base64,
                mimeType: mimeType,
            },
        };

        const result = await model.generateContent(['Transcribe or analyze the following audio:', audioPart]);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {   
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
