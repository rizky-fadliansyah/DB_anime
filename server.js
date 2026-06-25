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
        const systemPrompt = `Kamu adalah juri Death Battle Anime profesional, objektif, dan sangat detail. 
Analisis pertarungan ini secara mendalam dengan membandingkan aspek kecepatan (Speed scaling), daya hancur (Attack Potency), ketahanan (Durability), serta kemampuan khusus/hax dari kedua karakter.

Berikan penjelasan kesimpulan (reason) yang panjang, berbobot, dan logis (minimal 3-5 kalimat) mengapa karakter tersebut bisa menang atau mengapa pertarungan berjalan sepihak.

Tambahkan "tier" kekuatan karakter secara keseluruhan (misal: Street, Building, Mountain, Island, Planet, Multiverse, dll), "desc" (deskripsi singkat 1 kalimat), dan "ability" (kemampuan utama karakter).

Kembalikan JSON MURNI dengan format berikut:
{
  "f1": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 50, "spd": 50, "dur": 50, "iq": 50, "pwr": 50, "stam": 50 },
  "f2": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 50, "spd": 50, "dur": 50, "iq": 50, "pwr": 50, "stam": 50 },
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