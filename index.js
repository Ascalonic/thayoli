require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const OpenAI = require('openai').default;
const openai = new OpenAI();
const multer = require('multer');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files from the "static" directory
app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json({ limit: '10mb' }));

app.listen(port, () => {
    console.log(`App is running at http://localhost:${port}`);
});
app.post('/upload-image', async (req, res) => {
    const { image } = req.body;

    if (!image) {
        return res.status(400).send('No image uploaded.');
    }

    const buffer = Buffer.from(image, 'base64');

    console.log('Received Base64 Image:', image);

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Talk to a baby as a teddy bear as if this picture is what the bear sees at the moment.keep response under 30 words. don't return any emojis. only text" },
                    {
                        type: "image_url",
                        image_url: {
                            "url": "data:image/jpeg;base64," + image
                        },
                    },
                ],
            },
        ],
    });

    console.log(response.choices[0]);

    res.json({ message: response.choices[0] });

    /*
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `images/${Date.now()}.jpg`, // Unique file name
        Body: buffer,
        ContentType: 'image/jpeg'
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading to S3:', err);
            return res.status(500).send('Error uploading to S3');
        }

        res.json({ message: 'File uploaded successfully', data: data });
    });
    */
});

app.get('/stream-audio', async (req, res) => {
    try {
        const { text } = req.query;

        if (!text) {
            return res.status(400).send('Text input is required');
        }

        // Generate speech using OpenAI
        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Stream the audio back
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length,
        });
        res.end(buffer);

    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).send('Error generating speech');
    }
});