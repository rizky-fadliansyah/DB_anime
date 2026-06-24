const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Mengizinkan frontend dari mana saja untuk mengakses API ini
app.use(cors());
app.use(express.json());

// Sajikan file statis (HTML, CSS, JS) jika ditaruh di folder yang sama
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
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Lakukan analisis death battle: ${karakter1} VS ${karakter2}` }
                ],
                response_format: { type: "json_object" },
                temperature: 0.5
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API bermasalah: ${response.status}`);
        }

        const rawData = await response.json();
        const aiResult = JSON.parse(rawData.choices[0].message.content);
        
        res.json(aiResult);

    } catch (error) {
        console.error("Error backend:", error);
        res.status(500).json({ error: "Gagal menganalisis lewat Groq AI" });
    }
});

// Menggunakan PORT dinamis dari Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Arena aktif di port ${PORT}`));