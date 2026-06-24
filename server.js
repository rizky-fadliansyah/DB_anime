const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Menggunakan axios yang lebih stabil di server cloud
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post('/api/deathbattle', async (req, res) => {
    const { karakter1, karakter2 } = req.body;

    if (!karakter1 || !karakter2) {
        return res.status(400).json({ error: "Kedua nama karakter harus diisi!" });
    }

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: "API Key Groq belum dikonfigurasi di server Railway!" });
    }

    const systemPrompt = `Kamu adalah juri Death Battle Anime dan ahli Power-Scaling profesional. 
Tugasmu adalah menganalisis pertarungan antara Karakter 1 dan Karakter 2 berdasarkan data anime/manga terbaru.
Berikan nilai angka mutlak dari 10 sampai 100 untuk kategori berikut:
- str (Strength)
- spd (Speed)
- dur (Durability)
- iq (Battle IQ)
- pwr (Powers/Hax/Kemampuan Khusus)

Kamu WAJIB mengembalikan jawaban dalam format JSON MURNI tanpa teks basa-basi lain di luar JSON. Formatnya harus persis seperti ini:
{
  "f1": { "name": "Nama Karakter 1", "str": 85, "spd": 90, "dur": 80, "iq": 75, "pwr": 88 },
  "f2": { "name": "Nama Karakter 2", "str": 95, "spd": 85, "dur": 90, "iq": 80, "pwr": 92 },
  "winner": "Nama Karakter Yang Menang",
  "reason": "Penjelasan singkat 1-2 kalimat kenapa dia menang berdasarkan analisis kekuatan mereka."
}`;

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Lakukan analisis death battle: ${karakter1} VS ${karakter2}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.5
            },
            {
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Axios otomatis melakukan parsing JSON data
        const aiContent = response.data.choices[0].message.content;
        const aiResult = JSON.parse(aiContent);
        
        res.json(aiResult);

    } catch (error) {
        console.error("Error backend:", error.response ? error.response.data : error.message);
        
        // Kirim detail error asli dari Groq ke frontend biar gampang di-debug
        const errorMsg = error.response && error.response.data && error.response.data.error 
            ? error.response.data.error.message 
            : "Gagal menganalisis lewat Groq AI";
            
        res.status(500).json({ error: errorMsg });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Arena aktif di port ${PORT}`));