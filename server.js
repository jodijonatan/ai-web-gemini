
import express from 'express';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use(express.static('.'));


const port = 3000;

// API endpoint to handle generative model requests
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, imageBase64 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not found. Please set a GEMINI_API_KEY environment variable.' });
    }

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const contents = [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      }
    ];

    const result = await model.generateContentStream({ contents });

    res.setHeader('Content-Type', 'text/plain');
    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        res.write(chunkText);
    }
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
