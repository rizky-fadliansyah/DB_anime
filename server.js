const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 1. PROMPT UNTUK ARENA DUEL (ANTI-KONSISTENSI EROR)
app.post('/api/deathbattle', async (req, res) => {
    try {
        const { karakter1, karakter2 } = req.body;
        
        const systemPrompt = `Kamu adalah bot juri Death Battle Anime profesional yang menggunakan database resmi VS BATTLES WIKI sebagai satu-satunya kiblat akurat.

Tugasmu:
1. Analisis pertarungan antara Karakter 1 dan Karakter 2 berdasarkan spesifikasi nama dan asal anime/manga/webtoon yang diberikan oleh user. Jangan mengambil data dari versi fan-fiction.
2. Ambil data tingkat kekuatan (Attack Potency), Kecepatan (Speed), dan Kemampuan (Hax) kedua karakter murni berdasarkan artikel resmi mereka di VS BATTLES WIKI. 
3. PENTING & WAJIB KONSISTEN: Evaluasi "tier" keseluruhan karakter dengan sangat teliti sesuai klasifikasi resmi (misal: jika di artikel wiki karakter tersebut adalah Tier 2-A: Multiverse level, jangan pernah menurunkannya menjadi Planet level saat di dalam arena duel ini). Tuliskan penamaan tier secara lengkap (Contoh: "Tier 2-A: Multiverse level" atau "Tier 6-C: Island level").
4. Berikan "reason" (analisis kemenangan) minimal 3-5 kalimat yang logis dan objektif berdasarkan perbandingan stat serta hax yang sah dari VS Battles Wiki. Jika salah satu karakter memiliki tier yang jauh lebih tinggi (misal: Multiverse vs Planet), jelaskan bahwa karakter tier tinggi menang mutlak karena perbedaan dimensi kekuatan yang masif.

Kembalikan JSON MURNI dengan format berikut:
{
  "f1": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 50, "spd": 50, "dur": 50, "iq": 50, "pwr": 50, "stam": 50 },
  "f2": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 50, "spd": 50, "dur": 50, "iq": 50, "pwr": 50, "stam": 50 },
  "winner": "...",
  "reason": "..."
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Duel antara Petarung 1: ${karakter1} VS Petarung 2: ${karakter2}. Cari kecocokan data yang pas di VS Battles Wiki berdasarkan asal mereka!` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) { 
        res.status(500).json({ error: "Gagal memproses AI" }); 
    }
});

// 2. PROMPT UNTUK CEK DATA SINGLE
app.post('/api/checkcharacter', async (req, res) => {
    try {
        const { karakter } = req.body;
        
        const checkPrompt = `Kamu adalah API pencari data karakter resmi yang terhubung secara logis dengan standar VS BATTLES WIKI.

Tugasmu:
1. Cari profil karakter ini di VS Battles Wiki berdasarkan informasi nama dan asal anime/manga/webtoon yang diinput oleh user.
2. Isi bagian "tier" persis sesuai klasifikasi tier di VS Battles Wiki (misal: Tier 7-A: Mountain level, Tier 5-A: Planet level, Tier Low 2-C, Tier 2-A: Multiverse level, dll). Jangan pernah asal menebak atau memotong klasifikasi tier aslinya.
3. Untuk nilai "str", "spd", "dur", "iq", "pwr", "stam", konversikan tier mereka di wiki menjadi angka 10-100 secara akurat.

Kembalikan JSON MURNI dengan format berikut:
{
  "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 70, "spd": 80, "dur": 65, "iq": 85, "pwr": 75, "stam": 70
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: checkPrompt }, { role: "user", content: `Cari data karakter berikut beserta asal animenya: ${karakter}` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) { 
        res.status(500).json({ error: "Gagal cek data AI" }); 
    }
});

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Arena (No-DB) aktif di port ${PORT}`));