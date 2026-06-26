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
        const systemPrompt = `Kamu adalah bot juri Death Battle Anime profesional yang menggunakan database resmi VS BATTLES WIKI sebagai satu-satunya kiblat akurat. 

Tugasmu:
1. Ambil data tingkat kekuatan (Attack Potency), Kecepatan (Speed), dan Kemampuan (Hax) kedua karakter murni berdasarkan artikel mereka di VS BATTLES WIKI. Jangan pernah mengarang data di luar standar tersebut.
2. Tulis "tier" keseluruhan karakter persis sesuai penamaan tier di VS Battles Wiki (misal: Tier 9-B: Wall level, Tier 6-C: Island level, Tier 3-A: Universe level, Tier 2-A: Multiverse level, dll).
3. Berikan "reason" (analisis kemenangan) minimal 3-5 kalimat yang logis dengan membandingkan stat kecepatan (misal: FTL vs Subsonic) dan kemampuan khusus/hax (misal: Reality Warping, Regeneration) sesuai perdebatan di forum VS Battles Wiki.

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
        const checkPrompt = `Kamu adalah API pencari data karakter resmi yang terhubung secara logis dengan standar VS BATTLES WIKI. 

Tugasmu:
1. Cari profil karakter ini di VS Battles Wiki. 
2. Isi bagian "tier" persis sesuai klasifikasi tier di VS Battles Wiki (misal: 7-A: Mountain level, 5-A: Planet level, Low 2-C, dll).
3. Untuk nilai "str", "spd", "dur", "iq", "pwr", "stam", konversikan tier mereka di wiki menjadi angka 10-100 secara akurat (Contoh: Jika kecepatannya FTL kasih nilai spd 88, jika MFTL+ kasih nilai 95+).

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