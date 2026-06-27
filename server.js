import express from 'express';
import mysql from 'mysql2/promise';
import { Groq } from 'groq-sdk';
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
    ssl: process.env.MYSQL_URL ? { rejectUnauthorized: false } : false // Hanya pakai SSL kalau di cloud
};

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- API 1: AMBIL DATA KARAKTER ---
app.get('/api/characters', async (req, res) => {
    let connection;
    try {
        if (typeof dbConfig === 'string') {
            connection = await mysql.createConnection(dbConfig);
        } else {
            connection = await mysql.createConnection(dbConfig);
        }

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
        res.status(500).json({ error: "Gagal memuat data dari database Railway.", rincian: err.message });
    }
});

// --- API 2: UPGRADE PROMPT RISET FORM (DI-PINGIT SUPAYA RINGKAS & PADAT) ---
app.post('/api/research', async (req, res) => {
    const { name, origin, form_name } = req.body;

    const systemPrompt = `Kamu adalah pakar dan sistem ensiklopedia dari VS Battles Wiki.
    Tugasmu adalah menganalisis karakter beserta form spesifik yang diminta secara objektif dan akurat.
    Berikan nilai stat berupa angka bulat dari 0 hingga 100 untuk parameter kekuatan fisik mereka berdasarkan standarisasi VS Battles Wiki.

    ATURAN KETAT KEPADATAN TEKS:
    1. Pada bagian "ability", tuliskan MAKSIMAL 5-6 poin kemampuan atau hax paling ikonik dipisahkan dengan tanda koma (Jangan buat bullet point ke bawah atau list yang panjang!).
    2. Pada bagian "desc", tuliskan ringkasan daya hancur, karakteristik, atau kelemahan utama form ini dalam MAKSIMAL 2 kalimat pendek saja.

    Wajib merespons dalam format JSON murni terstruktur seperti ini:
    {
    "tier": "Tier resmi (contoh: Tier 5-B, High 6-A, atau 9-B)",
    "ability": "Rikudo Senjutsu, Rasenshuriken Seluler, Klon Bayangan, Indra Sensorik",
    "desc": "Bentuk terkuat Naruto dengan kapasitas chakra masif dan regenerasi instan tingkat tinggi berkat gabungan kekuatan Kurama dan Rikudo Sennin.",
    "str": 85, 
    "spd": 90, 
    "dur": 80, 
    "iq": 75, 
    "pwr": 88, 
    "stam": 82
    }
    Catatan nilai stat (0-100): str=Strength, spd=Speed, dur=Durability, iq=Intelligence, pwr=Powers, stam=Stamina.`;

    const userPrompt = `Riset data karakter secara singkat dan padat:
    Nama: ${name}
    Asal Seri: ${origin}
    Form Spesifik: ${form_name}`;

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
        console.error("Groq Error:", err);
        res.status(500).json({ error: "Gagal melakukan riset otomatis via Groq AI." });
    }
});

// --- API 3: PROSES SIMULASI DUEL DEATH BATTLE (ANALISIS PROFESIONAL & OBJEKTIF) ---
app.post('/api/deathbattle', async (req, res) => {
    const { p1, p2 } = req.body;

    const systemPrompt = `Kamu adalah juri analitis profesional dari komunitas Cross-verse Death Battle (seperti standar VS Battles Wiki).
    Tugasmu adalah menganalisis bentrokan kekuatan secara objektif, kritis, tidak berat sebelah, dan menggunakan terminologi pertarungan yang tepat.
    Pertimbangkan kecocokan hax, perbedaan Attack Potency (AP), kecepatan (Speed), durabilitas, serta kondisi taktis bagaimana salah satu karakter bisa mengamankan kemenangan.

    Kamu WAJIB melakukan analisis berdasarkan data spesifik (Tier, Ability, dan Desc) yang diberikan oleh user di user prompt. Jangan mengarang kemampuan di luar data yang diberikan.

    ATURAN KETAT FORMAT & KEPADATAN TEKS:
    1. Pada bagian "ability", tuliskan MAKSIMAL 3 poin kemampuan/hax paling krusial dipisahkan dengan tanda koma.
    2. Pada bagian "desc", tuliskan ringkasan kondisi fisik dalam 1 kalimat pendek.
    3. Pada bagian "reason", tuliskan ANALISIS PROFESIONAL mendalam (sekitar 4-6 kalimat padat). Analisis harus berimbang dengan membedah keunggulan masing-masing karakter terlebih dahulu berdasarkan data yang ada sebelum menyimpulkan faktor krusial penentu kemenangan (seperti efektivitas hax seluler, keunggulan kecepatan untuk speedblitz, atau stamina). Jangan langsung to-the-point tanpa penjelasan logis.

    Berikan respons wajib dalam format JSON murni terstruktur berikut:
    {
    "f1": {
        "name": "Nama Petarung 1",
        "tier": "Tier P1",
        "ability": "Rikudo Senjutsu, Rasenshuriken Seluler, Klon Bayangan",
        "desc": "Stamina masif dengan regenerasi instan tingkat tinggi berkat chakra Kurama.",
        "str": 85, "spd": 90, "dur": 80, "iq": 75, "pwr": 88, "stam": 82
    },
    "f2": {
        "name": "Nama Petarung 2",
        "tier": "Tier P2",
        "ability": "Bajrang Gun, Gear 5 Reality Warping, Haoshoku Haki",
        "desc": "Tubuh karet elastis dengan kebebasan bertarung penuh namun dibatasi durasi form.",
        "str": 70, "spd": 65, "dur": 75, "iq": 85, "pwr": 72, "stam": 80
    },
    "winner": "NAMA PEMENANG",
    "reason": "Pertarungan ini menyajikan bentrokan yang sangat berimbang di mana [Nama P1] unggul dalam aspek X dan kapasitas stamina, sementara [Nama P2] mendominasi lewat kemampuan Y yang sulit diprediksi. Namun, faktor penentu kemenangan dalam skenario ini bermuara pada kemampuan [Nama Pemenang] untuk mengeksploitasi celah pertahanan lawan lewat [sebutkan faktor/hax/kecepatan]. Dalam kondisi di mana pertempuran berlangsung intens, [Nama Pemenang] mampu mendaratkan serangan fatal yang mengabaikan daya tahan konvensional lawan, sehingga mengunci kemenangan secara logis."
    }`;

    // PERBAIKAN UTAMA: Menyuapi seluruh data berkas riset agar dianalisis secara profesional oleh AI
    const userPrompt = `Simulasikan pertarungan maut secara analitis dan profesional berdasarkan data berkas berikut:

    PETARUNG 1:
    Nama: ${p1.name} (Form: ${p1.form_name})
    Asal: ${p1.origin}
    Tier: ${p1.tier || 'Belum diketahui'}
    Kemampuan/Hax: ${p1.ability || 'Tidak ada data'}
    Deskripsi: ${p1.desc || 'Tidak ada data'}
    Stat Angka: STR:${p1.str}, SPD:${p1.spd}, DUR:${p1.dur}, IQ:${p1.iq}, PWR:${p1.pwr}, STAM:${p1.stam}

    --------------------------------------------------

    PETARUNG 2:
    Nama: ${p2.name} (Form: ${p2.form_name})
    Asal: ${p2.origin}
    Tier: ${p2.tier || 'Belum diketahui'}
    Kemampuan/Hax: ${p2.ability || 'Tidak ada data'}
    Deskripsi: ${p2.desc || 'Tidak ada data'}
    Stat Angka: STR:${p2.str}, SPD:${p2.spd}, DUR:${p2.dur}, IQ:${p2.iq}, PWR:${p2.pwr}, STAM:${p2.stam}`;

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
        console.error("Groq Battle Error:", err);
        res.status(500).json({ error: "Gagal memproses simulasi pertarungan maut via Groq AI." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server VS Arena running pada port ${PORT}`));