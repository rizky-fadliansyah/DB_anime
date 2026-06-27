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

    const dbConfig = {
        host: process.env.MYSQLHOST || process.env.DB_HOST,
        user: process.env.MYSQLUSER || process.env.DB_USER,
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
        database: process.env.MYSQLDATABASE || process.env.DB_NAME,
        port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT),
        ssl: { rejectUnauthorized: false }
    };

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // --- API 1: AMBIL DATA KARAKTER + FORM (JOIN DENGAN FOTO UTAMA KARAKTER) ---
    app.get('/api/characters', async (req, res) => {
        try {
            const connection = await mysql.createConnection(dbConfig);
            // Memperbarui query untuk menarik c.image_url dari tabel characters
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
            console.error("Database Error:", err);
            res.status(500).json({ error: "Gagal memuat data dari database Railway." });
        }
    });

    // --- API 2: UPGRADE PROMPT RISET FORM (DENGAN SKALA STAT 0-100) ---
    app.post('/api/research', async (req, res) => {
        const { name, origin, form_name } = req.body;

        const systemPrompt = `Kamu adalah pakar dan sistem ensiklopedia dari VS Battles Wiki.
    Tugasmu adalah menganalisis karakter beserta form spesifik yang diminta secara objektif dan akurat.
    Berikan nilai stat berupa angka bulat dari 0 hingga 100 untuk parameter kekuatan fisik mereka berdasarkan standarisasi VS Battles Wiki.

    Wajib merespons dalam format JSON murni terstruktur seperti ini:
    {
    "tier": "Tier resmi (contoh: 2-C, High 6-A, atau 9-B)",
    "ability": "Daftar kemampuan khusus, hax, imunitas, dan taktik tempur utama form ini secara padat.",
    "desc": "Rangkuman daya hancur, kelemahan, dan karakteristik form ini.",
    "str": 85, 
    "spd": 90, 
    "dur": 80, 
    "iq": 75, 
    "pwr": 88, 
    "stam": 82
    }
    Catatan nilai stat (0-100): str=Strength, spd=Speed, dur=Durability, iq=Intelligence, pwr=Powers, stam=Stamina.`;

        const userPrompt = `Riset data karakter berikut:
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

    // --- API 3: PROSES SIMULASI DUEL DEATH BATTLE (1 VS 1) ---
    app.post('/api/deathbattle', async (req, res) => {
        const { p1, p2 } = req.body;

        const systemPrompt = `Kamu adalah juri simulasi pertarungan silang (Cross-verse Death Battle) yang adil, kritis, dan objektif.
    Analisis bentrokan kekuatan, kecocokan hax, dan pertahanan antara Petarung 1 dan Petarung 2 berdasarkan data VS Battles Wiki.
    Tentukan pemenang yang paling logis beserta alasan taktisnya (pertimbangkan speedblitz, hax yang tidak bisa ditangkal, atau keunggulan tier).

    Berikan respons dalam format JSON murni terstruktur berikut:
    {
    "f1": {
        "name": "Nama Petarung 1",
        "tier": "Tier P1",
        "ability": "Hax krusial dalam duel ini",
        "desc": "Kondisi fisik P1",
        "str": 85, "spd": 90, "dur": 80, "iq": 75, "pwr": 88, "stam": 82
    },
    "f2": {
        "name": "Nama Petarung 2",
        "tier": "Tier P2",
        "ability": "Hax krusial dalam duel ini",
        "desc": "Kondisi fisik P2",
        "str": 70, "spd": 65, "dur": 75, "iq": 85, "pwr": 72, "stam": 80
    },
    "winner": "NAMA PEMENANG (Hanya tulis namanya saja atau Seri)",
    "reason": "Penjelasan detail kenapa karakter tersebut bisa menang atau duel berakhir seri secara taktis dan logis."
    }`;

        const userPrompt = `Simulasikan pertarungan maut antara dua karakter ini:
    Petarung 1: ${p1.name} (Form: ${p1.form_name}) dari seri ${p1.origin}
    Petarung 2: ${p2.name} (Form: ${p2.form_name}) dari seri ${p2.origin}`;

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