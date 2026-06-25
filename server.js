const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// PROMPT UTAMA UNTUK FILTERING DUEL
app.post('/api/deathbattle', async (req, res) => {
    try {
        const { karakter1, karakter2 } = req.body;
        const systemPrompt = `Kamu adalah juri Death Battle Anime profesional. Analisis pertarungan dengan akurat.
Tambahkan "tier" kekuatan karakter secara keseluruhan (misal: Street, Building, Island, Planet, Multiverse, dll), "desc" (deskripsi singkat 1 kalimat), dan "ability" (kemampuan utama karakter).
Kembalikan JSON MURNI dengan format berikut:
{
  "f1": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 85, "spd": 90, "dur": 80, "iq": 75, "pwr": 88, "stam": 85 },
  "f2": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 95, "spd": 85, "dur": 90, "iq": 80, "pwr": 92, "stam": 90 },
  "winner": "...",
  "reason": "..."
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Duel: ${karakter1} VS ${karakter2}` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) { 
        res.status(500).json({ error: "Gagal memproses AI" }); 
    }
});

// PROMPT UTAMA UNTUK CEK DATA SINGLE
app.post('/api/checkcharacter', async (req, res) => {
    try {
        const { karakter } = req.body;
        const checkPrompt = `Kamu adalah ensiklopedia anime, manga, dan webtoon resmi yang sangat akurat.
Tambahkan "tier" kekuatan karakter secara keseluruhan (misal: City, Continent, Star, Boundless, dll), "desc" (deskripsi singkat 1 kalimat), dan "ability" (kemampuan utama karakter).
Kembalikan JSON MURNI dengan format berikut:
{
  "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 70, "spd": 80, "dur": 65, "iq": 85, "pwr": 75, "stam": 70
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: checkPrompt }, { role: "user", content: `Data: ${karakter}` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) { 
        res.status(500).json({ error: "Gagal cek data AI" }); 
    }
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Arena aktif di port ${PORT}`));