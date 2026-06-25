const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ROUTE 1: SIMULASI DUEL (BATTLE ARENA)
app.post('/api/deathbattle', async (req, res) => {
    try {
        const { karakter1, karakter2 } = req.body;
        const systemPrompt = `Kamu adalah juri Death Battle Anime dan ensiklopedia pop-kultur profesional.
Tugasmu adalah menganalisis pertarungan antara Karakter 1 dan Karakter 2.
PENTING: Tentukan asal judul anime/manga/webtoon asli untuk masing-masing karakter dengan sangat akurat. Jangan menebak ngasal jika karakter tersebut berasal dari Webtoon spesifik (seperti Lookism, Eleceed, dll).

Berikan nilai angka mutlak (10-100) untuk: str, spd, dur, iq, pwr, stam.
Kamu WAJIB mengembalikan jawaban dalam format JSON MURNI tanpa teks basa-basi lain di luar JSON. Format harus persis seperti ini:
{
  "f1": { "name": "Nama Karakter 1", "origin": "Asal Judul Yang Akurat", "str": 85, "spd": 90, "dur": 80, "iq": 75, "pwr": 88, "stam": 85 },
  "f2": { "name": "Nama Karakter 2", "origin": "Asal Judul Yang Akurat", "str": 95, "spd": 85, "dur": 90, "iq": 80, "pwr": 92, "stam": 90 },
  "winner": "Nama Pemenang",
  "reason": "Analisis mendalam (3-4 kalimat). Jelaskan keunggulan utama pemenang, faktor penentu (pengalaman/stamina/hax), dan skenario bagaimana dia mengalahkan lawan."
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Duel: ${karakter1} VS ${karakter2}` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal memproses analisis AI" });
    }
});

// ROUTE 2: HANYA CEK DATA SATU KARAKTER
app.post('/api/checkcharacter', async (req, res) => {
    try {
        const { karakter } = req.body;
        const checkPrompt = `Kamu adalah ensiklopedia anime, manga, dan webtoon resmi yang sangat akurat.
Tugasmu adalah memberikan profil statis resmi dan asal media yang tepat untuk karakter yang diminta. Jangan menebak-nebak jika tidak tahu. Jika karakternya dari Webtoon (seperti Lookism, Eleceed, dll), pastikan asal medianya ditulis nama Webtoon-nya dengan benar.

Berikan nilai (10-100) untuk kategori berikut berdasarkan skala kekuatannya di universe-nya sendiri.
Kembalikan JSON MURNI dengan format:
{
  "name": "Nama Lengkap Karakter",
  "origin": "Asal Judul Anime/Manga/Webtoon Asli (Sangat Akurat)",
  "str": 0, "spd": 0, "dur": 0, "iq": 0, "pwr": 0, "stam": 0
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: checkPrompt }, { role: "user", content: `Data: ${karakter}` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal cek data AI" });
    }
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Arena aktif di port ${PORT}`));