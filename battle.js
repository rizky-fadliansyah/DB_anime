// 1. Ambil data petarung dasar dari localStorage (dikirim dari index.html)
const selectedP1 = JSON.parse(localStorage.getItem("p1_battle"));
const selectedP2 = JSON.parse(localStorage.getItem("p2_battle"));

const statusP1 = document.getElementById("status-p1");
const statusP2 = document.getElementById("status-p2");
const btnAction = document.getElementById("btn-action");
const loadEl = document.getElementById("loading");
const arenaEl = document.getElementById("arena-result");

// VARIABEL GLOBAL: Menampung data gabungan identitas + hasil /api/research
let petarung1Data = null;
let petarung2Data = null;

// Validasi jika data di localStorage kosong
if (!selectedP1 || !selectedP2) {
    alert("Petarung belum lengkap! Kembali ke halaman utama.");
    window.location.href = "index.html";
} else {
    if (statusP1) statusP1.innerText = `${selectedP1.name} (${selectedP1.form_name})`;
    if (statusP2) statusP2.innerText = `${selectedP2.name} (${selectedP2.form_name})`;
    
    // LANGKAH OTOMATIS: Begitu halaman dibuka, langsung riset detail karakteristik ke AI
    siapkanDataPertarungan();
}

// Fungsi otomatis untuk melakukan riset data karakteristik karakter via API /api/research
async function siapkanDataPertarungan() {
    try {
        if (loadEl) loadEl.style.display = 'block';
        if (btnAction) btnAction.disabled = true; // Kunci tombol duel sebelum riset selesai

        const [resP1, resP2] = await Promise.all([
            fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: selectedP1.name, origin: selectedP1.origin, form_name: selectedP1.form_name })
            }),
            fetch('/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: selectedP2.name, origin: selectedP2.origin, form_name: selectedP2.form_name })
            })
        ]);

        const detailP1 = await resP1.json();
        const detailP2 = await resP2.json();

        // Gabungkan info dasar identitas dari database dengan hasil riset AI
        petarung1Data = { ...selectedP1, ...detailP1 };
        petarung2Data = { ...selectedP2, ...detailP2 };

        console.log("Riset Karakter Selesai! Siap Diadu:", { petarung1Data, petarung2Data });

        // Tampilkan info profil karakter ke UI kolom samping kiri-kanan
        renderProfilAwal();

        if (btnAction) btnAction.disabled = false; // Buka kunci tombol duel
    } catch (error) {
        console.error("Gagal menyiapkan data riset karakter:", error);
    } finally {
        if (loadEl) loadEl.style.display = 'none';
    }
}

// Fungsi pembantu untuk mencetak komponen HTML Bar Statistik Game secara dinamis
function createBattleStatBar(label, value, color) {
    const safeValue = value !== undefined && value !== null ? value : 50; 
    return `
        <div style="background: #1a1a1a; padding: 6px; border-radius: 4px; margin-bottom: 8px; text-align: left;">
            <div style="display:flex; justify-content:space-between; font-size:11px; color: #ccc;">
                <span>${label}</span>
                <strong>${safeValue}/100</strong>
            </div>
            <div style="background: #333; height: 8px; width: 100%; border-radius: 4px; margin-top: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${safeValue}%; background: ${color}; transition: width 0.8s ease-in-out;"></div>
            </div>
        </div>
    `;
}

// Merender Profil dan Stat Bar Riset awal ke UI sebelum bertarung
function renderProfilAwal() {
    if (!petarung1Data || !petarung2Data) return;

    // --- PLAYER 1 SIDE ---
    if (document.getElementById('f1-name')) document.getElementById('f1-name').innerText = petarung1Data.name;
    if (document.getElementById('f1-tier')) document.getElementById('f1-tier').innerText = `Form: ${petarung1Data.form_name} | ${petarung1Data.tier || 'Tier Unknown'}`;
    
    // PERBAIKAN: Tambahkan prefix folder '/images/' agar jalurnya sesuai dengan penempatan aset di server
    const imgP1 = document.getElementById('f1-img');
    if (imgP1) {
        const fileGambar1 = petarung1Data.image_url || petarung1Data.form_image || petarung1Data.char_image;
        imgP1.src = fileGambar1 ? `/images/${fileGambar1}` : 'https://placehold.co/150';
    }
    
    if (document.getElementById('f1-desc')) {
        document.getElementById('f1-desc').innerHTML = `<strong>Hax:</strong> ${petarung1Data.ability || 'Tidak ada'}<br><br>${petarung1Data.desc || ''}`;
    }
    
    const statsContainer1 = document.getElementById('f1-stats');
    if (statsContainer1) {
        statsContainer1.innerHTML = `
            ${createBattleStatBar("💪 Strength", petarung1Data.str, "#ff0055")}
            ${createBattleStatBar("⚡ Speed", petarung1Data.spd, "#ff0055")}
            ${createBattleStatBar("🛡️ Durability", petarung1Data.dur, "#ff0055")}
            ${createBattleStatBar("🧠 Intelligence", petarung1Data.iq, "#ff0055")}
            ${createBattleStatBar("🔮 Powers / Hax", petarung1Data.pwr, "#ff0055")}
            ${createBattleStatBar("🔋 Stamina", petarung1Data.stam, "#ff0055")}
        `;
    }

    // --- PLAYER 2 SIDE ---
    if (document.getElementById('f2-name')) document.getElementById('f2-name').innerText = petarung2Data.name;
    if (document.getElementById('f2-tier')) document.getElementById('f2-tier').innerText = `Form: ${petarung2Data.form_name} | ${petarung2Data.tier || 'Tier Unknown'}`;
    
    // PERBAIKAN: Tambahkan prefix folder '/images/' agar jalurnya sesuai dengan penempatan aset di server
    const imgP2 = document.getElementById('f2-img');
    if (imgP2) {
        const fileGambar2 = petarung2Data.image_url || petarung2Data.form_image || petarung2Data.char_image;
        imgP2.src = fileGambar2 ? `/images/${fileGambar2}` : 'https://placehold.co/150';
    }
    
    if (document.getElementById('f2-desc')) {
        document.getElementById('f2-desc').innerHTML = `<strong>Hax:</strong> ${petarung2Data.ability || 'Tidak ada'}<br><br>${petarung2Data.desc || ''}`;
    }

    const statsContainer2 = document.getElementById('f2-stats');
    if (statsContainer2) {
        statsContainer2.innerHTML = `
            ${createBattleStatBar("💪 Strength", petarung2Data.str, "#00ff55")}
            ${createBattleStatBar("⚡ Speed", petarung2Data.spd, "#00ff55")}
            ${createBattleStatBar("🛡️ Durability", petarung2Data.dur, "#00ff55")}
            ${createBattleStatBar("🧠 Intelligence", petarung2Data.iq, "#00ff55")}
            ${createBattleStatBar("🔮 Powers / Hax", petarung2Data.pwr, "#00ff55")}
            ${createBattleStatBar("🔋 Stamina", petarung2Data.stam, "#00ff55")}
        `;
    }
}

// Fungsi Utama: Memproses Simulasi Duel Juri AI Profesional
async function prosesDuel() {
    try {
        if (!petarung1Data || !petarung2Data) {
            alert("Data karakteristik karakter sedang dimuat. Tunggu sebentar!");
            return;
        }

        if (loadEl) loadEl.style.display = 'block';

        const response = await fetch('/api/deathbattle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ p1: petarung1Data, p2: petarung2Data })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Gagal memproses duel.");
        }

        if (document.getElementById('battle-winner')) document.getElementById('battle-winner').innerHTML = `<span style='color: #ffc107;'>JUARA:</span> ${data.winner}`;
        if (document.getElementById('battle-reason')) document.getElementById('battle-reason').textContent = data.reason;

        const statsContainer1 = document.getElementById('f1-stats');
        if (statsContainer1 && data.f1) {
            statsContainer1.innerHTML = `
                ${createBattleStatBar("💪 Strength", data.f1.str, "#ff0055")}
                ${createBattleStatBar("⚡ Speed", data.f1.spd, "#ff0055")}
                ${createBattleStatBar("🛡️ Durability", data.f1.dur, "#ff0055")}
                ${createBattleStatBar("🧠 Intelligence", data.f1.iq, "#ff0055")}
                ${createBattleStatBar("🔮 Powers / Hax", data.f1.pwr, "#ff0055")}
                ${createBattleStatBar("🔋 Stamina", data.f1.stam, "#ff0055")}
            `;
        }

        const statsContainer2 = document.getElementById('f2-stats');
        if (statsContainer2 && data.f2) {
            statsContainer2.innerHTML = `
                ${createBattleStatBar("💪 Strength", data.f2.str, "#00ff55")}
                ${createBattleStatBar("⚡ Speed", data.f2.spd, "#00ff55")}
                ${createBattleStatBar("🛡️ Durability", data.f2.dur, "#00ff55")}
                ${createBattleStatBar("🧠 Intelligence", data.f2.iq, "#00ff55")}
                ${createBattleStatBar("🔮 Powers / Hax", data.f2.pwr, "#00ff55")}
                ${createBattleStatBar("🔋 Stamina", data.f2.stam, "#00ff55")}
            `;
        }

        if (arenaEl) arenaEl.style.display = 'flex';

    } catch (error) {
        console.error("Error saat duel:", error);
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        if (loadEl) loadEl.style.display = 'none';
    }
}

if (btnAction) {
    btnAction.addEventListener("click", prosesDuel);
}