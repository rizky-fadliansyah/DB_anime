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
    // Supaya aman dari crash global, kita bungkus semua proses di dalam try-catch paling luar
    try {
        const { karakter1, karakter2 } = req.body;

        if (!karakter1 || !karakter2) {
            return res.status(400).json({ error: "Kedua nama karakter harus diisi, Ky!" });
        }

        if (!GROQ_API_KEY) {
            console.error("❌ ERROR: GROQ_API_KEY tidak terbaca di Environment!");
            return res.status(500).json({ error: "API Key Groq belum dikonfigurasi di server Railway!" });
        }

       const systemPrompt = `Kamu adalah juri Death Battle Anime profesional. 
        Tugasmu adalah menganalisis pertarungan antara Karakter 1 dan Karakter 2. 
        PENTING: Pastikan kamu mengenali asal anime/manga/webtoon karakter dengan akurat. Jika tidak yakin, tuliskan asal yang paling dikenal luas.

        Berikan nilai (10-100) untuk: str, spd, dur, iq, pwr, stam.
        Kembalikan JSON MURNI dengan format:
        {
        "f1": { "name": "Nama", "origin": "Asal Judul Manga/Webtoon/anime", "str": 0, "spd": 0, "dur": 0, "iq": 0, "pwr": 0, "stam": 0 },
        "f2": { "name": "Nama", "origin": "Asal Judul Manga/Webtoon/anime", "str": 0, "spd": 0, "dur": 0, "iq": 0, "pwr": 0, "stam": 0 },
        "winner": "...",
        "reason": "Analisis mendalam. Jelaskan keunggulan utama, faktor penentu, dan skenario kemenangan."
        }`;
        console.log(`🤖 Memulai request ke Groq AI untuk: ${karakter1} VS ${karakter2}`);

        // Kirim request ke Groq menggunakan Axios dengan timeout keamanan 15 detik
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
                    "Authorization": `Bearer ${GROQ_API_KEY.trim()}`, // Otomatis bersihkan spasi gaib jika ada
                    "Content-Type": "application/json"
                },
                timeout: 15000 // Jika 15 detik groq ga respon, batalkan biar server ga hang
            }
        );

        const aiContent = response.data.choices[0].message.content;
        console.log("✅ Respon Groq AI berhasil diterima.");
        
        const aiResult = JSON.parse(aiContent);
        return res.json(aiResult);

    } catch (error) {
        // Blok ini menangkap semua error (baik error axios, typo kode, atau JSON parse gagal)
        console.error("💥 TERJADI ERROR PADA BACKEND:", error.message);
        
        let pesanError = "Gagal menganalisis lewat Groq AI.";
        if (error.response && error.response.data && error.response.data.error) {
            pesanError = error.response.data.error.message;
        }

        // SERVER TIDAK BOLEH MATI! Kita kirim status 500 berupa JSON agar frontend tahu
        return res.status(500).json({ error: pesanError });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Arena aktif di port ${PORT}`));