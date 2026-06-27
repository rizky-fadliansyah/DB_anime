// 1. Ambil data petarung dari localStorage
const selectedP1 = JSON.parse(localStorage.getItem("p1_battle"));
const selectedP2 = JSON.parse(localStorage.getItem("p2_battle"));

const statusP1 = document.getElementById("status-p1");
const statusP2 = document.getElementById("status-p2");
const btnAction = document.getElementById("btn-action");
const loadEl = document.getElementById("loading");
const arenaEl = document.getElementById("arena-result");

// Validasi jika data di localStorage kosong
if (!selectedP1 || !selectedP2) {
    alert("Petarung belum lengkap! Kembali ke halaman utama.");
    window.location.href = "index.html";
} else {
    if (statusP1) statusP1.innerText = `${selectedP1.name} (${selectedP1.form_name})`;
    if (statusP2) statusP2.innerText = `${selectedP2.name} (${selectedP2.form_name})`;
}

// Fungsi pembantu untuk membuat Bar Statistik Game otomatis
function createBattleStatBar(label, value, color) {
    return `
        <div style="background: #1a1a1a; padding: 6px; border-radius: 4px; margin-bottom: 8px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; color: #ccc;">
                <span>${label}</span>
                <strong>${value}/100</strong>
            </div>
            <div style="background: #333; height: 8px; width: 100%; border-radius: 4px; margin-top: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${value}%; background: ${color}; transition: width 0.8s ease-in-out;"></div>
            </div>
        </div>
    `;
}

// 2. Fungsi proses mengirim data duel ke API Backend
async function prosesDuel() {
    loadEl.style.display = "block";
    arenaEl.style.display = "none";
    if (btnAction) btnAction.disabled = true;

    try {
        const response = await fetch('/api/deathbattle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ p1: selectedP1, p2: selectedP2 })
        });
        
        const data = await response.json();

        // Tampilkan gambar form masing-masing
        document.getElementById("f1-img").src = selectedP1.image_url ? `/images/${selectedP1.image_url}` : 'https://placehold.co/150';
        document.getElementById("f2-img").src = selectedP2.image_url ? `/images/${selectedP2.image_url}` : 'https://placehold.co/150';

        // --- DATA PETARUNG 1 (🔴 MERAH) ---
        document.getElementById("f1-name").innerText = `${data.f1.name} (${selectedP1.form_name})`;
        document.getElementById("f1-tier").innerText = `Tier: ${data.f1.tier}`;
        document.getElementById("f1-desc").innerText = `Hax & Skill:\n${data.f1.ability}\n\nFisik:\n${data.f1.desc}`;
        
        // Render 6 Bar Stat untuk P1
        document.getElementById("f1-stats").innerHTML = `
            ${createBattleStatBar("💪 STR (Strength)", data.f1.str, "linear-gradient(90deg, #ff0055, #ff5500)")}
            ${createBattleStatBar("⚡ SPD (Speed)", data.f1.spd, "linear-gradient(90deg, #ff0055, #ff5500)")}
            ${createBattleStatBar("🛡️ DUR (Durability)", data.f1.dur, "linear-gradient(90deg, #ff0055, #ff5500)")}
            ${createBattleStatBar("🧠 IQ (Intelligence)", data.f1.iq, "linear-gradient(90deg, #ff0055, #ff5500)")}
            ${createBattleStatBar("🔮 PWR (Powers/Hax)", data.f1.pwr, "linear-gradient(90deg, #ff0055, #ff5500)")}
            ${createBattleStatBar("🔋 STAM (Stamina)", data.f1.stam, "linear-gradient(90deg, #ff0055, #ff5500)")}
        `;

        // --- DATA PETARUNG 2 (🟢 HIJAU) ---
        document.getElementById("f2-name").innerText = `${data.f2.name} (${selectedP2.form_name})`;
        document.getElementById("f2-tier").innerText = `Tier: ${data.f2.tier}`;
        document.getElementById("f2-desc").innerText = `Hax & Skill:\n${data.f2.ability}\n\nFisik:\n${data.f2.desc}`;
        
        // Render 6 Bar Stat untuk P2
        document.getElementById("f2-stats").innerHTML = `
            ${createBattleStatBar("💪 STR (Strength)", data.f2.str, "linear-gradient(90deg, #00ff55, #00aaff)")}
            ${createBattleStatBar("⚡ SPD (Speed)", data.f2.spd, "linear-gradient(90deg, #00ff55, #00aaff)")}
            ${createBattleStatBar("🛡️ DUR (Durability)", data.f2.dur, "linear-gradient(90deg, #00ff55, #00aaff)")}
            ${createBattleStatBar("🧠 IQ (Intelligence)", data.f2.iq, "linear-gradient(90deg, #00ff55, #00aaff)")}
            ${createBattleStatBar("🔮 PWR (Powers/Hax)", data.f2.pwr, "linear-gradient(90deg, #00ff55, #00aaff)")}
            ${createBattleStatBar("🔋 STAM (Stamina)", data.f2.stam, "linear-gradient(90deg, #00ff55, #00aaff)")}
        `;

        // Hasil Akhir Penilaian Juri AI
        document.getElementById("battle-winner").innerText = `🏆 WINNER: ${data.winner}`;
        document.getElementById("battle-reason").innerText = data.reason;

        arenaEl.style.display = "flex";
    } catch (err) {
        console.error(err);
        alert("Error saat memproses duel AI!");
    } finally {
        loadEl.style.display = "none";
        if (btnAction) btnAction.disabled = false;
    }
}

// 3. Pasang event listener ke tombol duel
if (btnAction) {
    btnAction.addEventListener("click", prosesDuel);
}