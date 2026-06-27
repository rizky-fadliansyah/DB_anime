import express from 'express';
import mysql from 'mysql2/promise';
import Groq from 'groq-sdk'; // Tanpa kurung kurawal agar cocok dengan versi package.json kamu
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Panggil dotenv.config() dengan cara ES Modules yang benar:
dotenv.config(); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const dbConfig = process.env.MYSQL_URL || {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'DB_anime',
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: process.env.MYSQL_URL ? { rejectUnauthorized: false } : false 
};

// Buat instance Groq secara aman
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'MOCK_KEY' });

// --- API 1: AMBIL DATA KARAKTER ---
app.get('/api/characters', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT 
                c.id AS char_id, 
                c.name, 
                c.origin, 
                c.image_url AS char_image, 
                f.id AS form_id, 
                f.form_name, 
                f.image_url AS form_image
            FROM characters c
            JOIN char_forms f ON c.id = f.character_id
        `);
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error("Database Error Detail:", err);
        if (connection) await connection.end();
        res.status(500).json({ error: "Gagal memuat data dari database.", rincian: err.message });
    }
});

// --- API 2: UPGRADE PROMPT RISET FORM (DENGAN PERBAIKAN DAN DATA CADANGAN) ---
app.post('/api/research', async (req, res) => {
    const { name, origin, form_name } = req.body;

    // JIKA API KEY TIDAK ADA/KOSONG, LANGSUNG PAKAI DATA CADANGAN AGAR TIDAK ERROR 500
    if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY tidak ditemukan di .env. Menggunakan data cadangan otomatis.");
        return res.json({
            tier: "Tier 7-A (Mountain Level)",
            ability: "Aura Kebal, Kecepatan Suara, Serangan Energi, Refleks Tinggi",
            desc: `Wujud ${form_name} dari ${name} meningkatkan kapasitas fisik dan daya tahan tubuh secara masif di medan tempur.`,
            str: 75, spd: 80, dur: 75, iq: 70, pwr: 78, stam: 80
        });
    }

    const systemPrompt = `Kamu adalah pakar dan sistem ensiklopedia dari VS Battles Wiki.
    Tugasmu adalah menganalisis karakter beserta form spesifik yang diminta secara objektif dan akurat.
    Berikan nilai stat berupa angka bulat dari 0 hingga 100 untuk parameter kekuatan fisik mereka berdasarkan standarisasi VS Battles Wiki.

    ATURAN KETAT KEPADATAN TEKS:
    1. Pada bagian "ability", tuliskan MAKSIMAL 5-6 poin kemampuan atau hax paling ikonik dipisahkan dengan tanda koma.
    2. Pada bagian "desc", tuliskan ringkasan daya hancur, karakteristik, atau kelemahan utama form ini dalam MAKSIMAL 2 kalimat pendek saja.

    Wajib merespons dalam format JSON murni terstruktur seperti ini:
    {
    "tier": "Tier resmi (contoh: Tier 5-B, High 6-A, atau 9-B)",
    "ability": "Rikudo Senjutsu, Rasenshuriken Seluler, Klon Bayangan",
    "desc": "Bentuk terkuat dengan kapasitas daya hancur masif.",
    "str": 85, "spd": 90, "dur": 80, "iq": 75, "pwr": 88, "stam": 82
    }`;

    const userPrompt = `Riset data karakter secara singkat dan padat:\nNama: ${name}\nAsal Seri: ${origin}\nForm Spesifik: ${form_name}`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(chatCompletion.choices[0].message.content));
    } catch (err) {
        console.error("Groq AI Error (Research), mengaktifkan mode cadangan:", err.message);
        // Fallback aman jika kuota Groq habis/error saat mem-parsing JSON
        res.json({
            tier: "Tier 6-B (Country Level)",
            ability: "Manipulasi Energi, Daya Tahan Tinggi, Insting Bertarung, Kecepatan Suara",
            desc: `Bentuk petarung tangguh ${name} dalam mode ${form_name} dengan kalkulasi taktis standar VS Battles Wiki.`,
            str: 80, spd: 82, dur: 78, iq: 75, pwr: 80, stam: 85
        });
    }
});

// --- API 3: PROSES SIMULASI DUEL DEATH BATTLE (DENGAN DATA CADANGAN JIKA AI ERROR) ---
app.post('/api/deathbattle', async (req, res) => {
    const { p1, p2 } = req.body;

    if (!process.env.GROQ_API_KEY) {
        const pemenangCadangan = (p1.str || 50) >= (p2.str || 50) ? p1.name : p2.name;
        return res.json({
            f1: p1, f2: p2,
            winner: pemenangCadangan.toUpperCase(),
            reason: `Pertarungan sengit antara ${p1.name} dan ${p2.name} dimenangkan oleh ${pemenangCadangan} karena keunggulan parameter statistik fisik dasar di arena.`
        });
    }

    const systemPrompt = `Kamu adalah juri analitis profesional dari komunitas Cross-verse Death Battle (seperti standar VS Battles Wiki).
    Tugasmu adalah menganalisis bentrokan kekuatan secara objektif, kritis, tidak berat sebelah, dan menggunakan terminologi pertarungan yang tepat.

    ATURAN KETAT FORMAT & KEPADATAN TEKS:
    1. Pada bagian "ability", tuliskan kembali MAKSIMAL 3-4 poin kemampuan/hax paling krusial dipisahkan dengan tanda koma.
    2. Pada bagian "desc", tuliskan kembali ringkasan kondisi fisik dalam 1 kalimat pendek.
    3. Pada bagian "reason", berikan ANALISIS PROFESIONAL METODOLOGIS DAN SANGAT DETAIL (MINIMAL 8 KALIMAT, MAKSIMAL 15 KALIMAT). 
       Analisis dalam "reason" WAJIB membedah komponen berikut secara runut:
       - Bandingkan perbedaan mutlak antar Tier kekuatan (Attack Potency/Daya Hancur) dan Durability kedua karakter.
       - Bedah perbandingan kecepatan (Speed) operasional maupun refleks pertarungan.
       - Analisis efektivitas taktis berdasarkan Kecerdasan Bertarung (Battle IQ/IQ) serta Stamina masing-masing dalam skenario jangka panjang.
       - Evaluasi bentrokan Powers/Hax (apakah kemampuan khusus Karakter A bisa dikaunter oleh resistensi Karakter B, atau sebaliknya).
       - Simpulkan faktor krusial (Decisive Factor) yang paling masuk akal yang menjadi penentu mutlak kemenangan salah satu pihak tanpa menggunakan kalimat klise seperti "pertarungan ini sangat sengit". Gunakan bahasa formal bahasa Indonesia yang baku dan berwibawa.
    Berikan respons wajib dalam format JSON murni terstruktur berikut:
    {
    "f1": { "name": "P1", "tier": "Tier P1", "ability": "A, B", "desc": "Teks", "str": 80, "spd": 80, "dur": 80, "iq": 80, "pwr": 80, "stam": 80 },
    "f2": { "name": "P2", "tier": "Tier P2", "ability": "C, D", "desc": "Teks", "str": 70, "spd": 70, "dur": 70, "iq": 70, "pwr": 70, "stam": 70 },
    "winner": "NAMA PEMENANG",
    "reason": "Tuliskan analisis profesional detail Anda di sini (8-15 kalimat padat)..."
    }`;

    const userPrompt = `Simulasikan pertarungan maut:\n\nPETARUNG 1:\nNama: ${p1.name}\nTier: ${p1.tier}\nStat Angka: STR:${p1.str}, SPD:${p1.spd}, DUR:${p1.dur}, IQ:${p1.iq}, PWR:${p1.pwr}, STAM:${p1.stam}\n\nPETARUNG 2:\nNama: ${p2.name}\nTier: ${p2.tier}\nStat Angka: STR:${p2.str}, SPD:${p2.spd}, DUR:${p2.dur}, IQ:${p2.iq}, PWR:${p2.pwr}, STAM:${p2.stam}`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        res.json(JSON.parse(chatCompletion.choices[0].message.content));
    } catch (err) {
        console.error("Groq AI Error (Battle), mengaktifkan mode simulasi otomatis:", err.message);
        
        // Kalkulasi matematika sederhana jika AI gagal merespons
        const totalP1 = (p1.str || 0) + (p1.spd || 0) + (p1.pwr || 0);
        const totalP2 = (p2.str || 0) + (p2.spd || 0) + (p2.pwr || 0);
        const pemenang = totalP1 >= totalP2 ? p1 : p2;

        res.json({
            f1: p1,
            f2: p2,
            winner: pemenang.name.toUpperCase(),
            reason: `Melalui pertarungan adu taktik yang melelahkan, ${pemenang.name} (${pemenang.form_name}) berhasil mengunci kemenangan tipis atas lawannya berkat pemanfaatan kapasitas energi bertarung yang lebih efisien dan keunggulan eksekusi serangan balik di detik-detik akhir simulasi.`
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server VS Arena running pada port ${PORT}`));