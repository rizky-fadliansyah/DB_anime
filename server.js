const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// PROMPT UTAMA UNTUK ARENA DUEL (ANTI-KONSISTENSI EROR)
app.post('/api/deathbattle', async (req, res) => {
    try {
        const { karakter1, karakter2 } = req.body;
        
        const systemPrompt = `Kamu adalah bot juri Death Battle Anime profesional yang menggunakan database resmi VS BATTLES WIKI sebagai satu-satunya kiblat akurat.

Tugasmu:
1. Analisis pertarungan antara Karakter 1 dan Karakter 2 berdasarkan spesifikasi nama dan asal anime/manga/webtoon yang diberikan oleh user. Jangan mengambil data dari versi fan-fiction atau cross-over.
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
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Duel antara Petarung 1: ${karakter1} VS Petarung 2: ${karakter2}.` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) { 
        res.status(500).json({ error: "Gagal memproses AI" }); 
    }
});

// PROMPT UTAMA UNTUK CEK DATA SINGLE
// PROMPT UTAMA UNTUK ARENA DUEL (WAJIB FORM TERKUAT & POTENSI PENUH)
app.post('/api/deathbattle', async (req, res) => {
    try {
        const { karakter1, karakter2 } = req.body;
        
        const systemPrompt = `Kamu adalah bot juri Death Battle Anime profesional yang menggunakan database resmi VS BATTLES WIKI bahasa Indonesia sebagai satu-satunya kiblat akurat.

Tugasmu:
1. Analisis pertarungan antara Karakter 1 dan Karakter 2 berdasarkan spesifikasi nama dan asal anime/manga/webtoon yang diberikan oleh user. Jangan mengambil data dari versi fan-fiction atau cross-over.
2. PENTING & WAJIB: Ambil data versi TERKUAT, bentuk puncak (Peak Form), senjata terbaik, dan potensi penuh (Full Power) dari kedua karakter murni berdasarkan artikel resmi mereka di VS BATTLES WIKI (Contoh: jika karakter memiliki beberapa kunci/keys status, pilih key status yang paling kanan/paling kuat, seperti Goo Kim dengan pedang/Moonlight Style, Goku dalam mode terkuatnya, dll).
3. KONSISTENSI TIER: Tulis isi bidang "tier" secara lengkap dan sangat spesifik mengikuti kondisi puncak tersebut (Contoh: "Setidaknya High 8-C , lebih tinggi dengan senjata, jauh lebih tinggi dengan Moonlight Style"). Jangan pernah menurunkan atau mereduksi tier puncak mereka saat simulasi duel.
4. Berikan "reason" (analisis kemenangan) minimal 3-5 kalimat yang logis dan objektif berdasarkan perbandingan stat serta hax puncak dari VS Battles Wiki. Jika salah satu karakter memiliki tier puncak yang jauh lebih tinggi, jelaskan bahwa karakter tier tinggi menang mutlak karena perbedaan dimensi kekuatan yang masif.

Kembalikan JSON MURNI dengan format berikut:
{
  "f1": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 50, "spd": 50, "dur": 50, "iq": 50, "pwr": 50, "stam": 50 },
  "f2": { "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 50, "spd": 50, "dur": 50, "iq": 50, "pwr": 50, "stam": 50 },
  "winner": "...",
  "reason": "..."
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Duel hidup mati (POTENSI PENUH & FORM TERKUAT): Petarung 1: ${karakter1} VS Petarung 2: ${karakter2}.` }],
            response_format: { type: "json_object" }
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) { 
        res.status(500).json({ error: "Gagal memproses AI" }); 
    }
});

// PROMPT UTAMA UNTUK CEK DATA SINGLE (WAJIB FORM TERKUAT)
app.post('/api/checkcharacter', async (req, res) => {
    try {
        const { karakter } = req.body;
        
        const checkPrompt = `Kamu adalah API pencari data karakter resmi yang terhubung secara logis dengan standar VS BATTLES WIKI bahasa Indonesia.

Tugasmu:
1. Cari profil karakter ini di VS Battles Wiki berdasarkan informasi nama dan asal anime/manga/webtoon yang diinput oleh user.
2. WAJIB: Ambil data bentuk TERKUAT, kondisi puncak (Peak Form), dan potensi penuh karakter tersebut dari wiki (Abaikan versi awal/versi lemah mereka).
3. Isi bagian "tier" persis, lengkap, dan detail sesuai klasifikasi tertinggi di VS Battles Wiki (Contoh: "Setidaknya High 8-C , lebih tinggi dengan senjata, jauh lebih tinggi dengan Moonlight Style").
4. Pada bagian "desc" dan "ability", ekstrak informasi biodata puncak dan semua daftar kekuatan unik (Hax) mereka secara padat seperti format Wiki.
5. Untuk nilai statistik "str", "spd", "dur", "iq", "pwr", "stam", konversikan tingkatan kekuatan puncak mereka di wiki menjadi angka 10-100 secara akurat berdasarkan skala tiering dunia nyata.

Kembalikan JSON MURNI dengan format berikut:
{
  "name": "...", "origin": "...", "tier": "...", "desc": "...", "ability": "...", "str": 70, "spd": 80, "dur": 65, "iq": 85, "pwr": 75, "stam": 70
}`;

        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: checkPrompt }, { role: "user", content: `Cari data versi TERKUAT dan POTENSI PENUH dari karakter berikut beserta asal animenya: ${karakter}` }],
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