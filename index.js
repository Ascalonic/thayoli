require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const OpenAI = require('openai').default;
const openai = new OpenAI();
const cors = require('cors');
const fs = require('fs');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
    origin: 'http://localhost:5173', // Allow only this origin to access
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Function to read prompt from file
async function getPromptFromFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return data;
    } catch (error) {
        console.error("Error reading prompt file:", error);
        return ""; // Handle error gracefully, potentially exit or provide default prompt
    }
}

app.get('/daily-motivation', async (req, res) => {
    try {
        var response = {};
        let prompt = await getPromptFromFile('motivation.prompt');
            const completionPassage = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant designed to output motivational quotes",
                    },
                    { role: "user", content: prompt },
                ],
                model: "gpt-4-turbo-preview",
            });
            const quote = completionPassage.choices[0].message.content;

            console.log(quote);

            response.quote = quote;

        res.json(response);
    } catch (error) {
        console.error("Error generating motivational quote :", error);
        res.status(500).send("Error generating quote - പോയി ഊമ്പിക്കൊ ഇനി");
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));