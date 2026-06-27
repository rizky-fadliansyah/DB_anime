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

// Pastikan variabel data karakter 1 dan 2 yang sudah di-research disimpan secara global/bisa diakses di sini
// Misal namanya: petarung1Data dan petarung2Data (sesuaikan dengan nama variabelmu)

async function prosesDuel() {
    try {
        // 1. Validasi dulu sebelum kirim ke server, biar gak bikin server crash
        if (!petarung1Data || !petarung2Data) {
            alert("Kedua karakter harus disiapkan/diriset terlebih dahulu!");
            return;
        }

        // Tampilkan loading screen/text kamu di sini
        document.getElementById('loading').style.display = 'block';

        // 2. Kirim payload LENGKAP hasil riset ke server.js
        const response = await fetch('/api/deathbattle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                p1: petarung1Data, // Bungkus dalam properti 'p1' sesuai request server.js
                p2: petarung2Data  // Bungkus dalam properti 'p2' sesuai request server.js
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Gagal memproses duel.");
        }

        // 3. Render hasilnya ke dalam layout 3 kolom kamu
        document.getElementById('battle-winner').textContent = data.winner;
        document.getElementById('battle-reason').textContent = data.reason;

        // Update Stat Bar P1 secara dinamis (sesuaikan ID dengan HTML kamu)
        document.getElementById('p1-str-bar').style.width = `${data.f1.str}%`;
        document.getElementById('p1-spd-bar').style.width = `${data.f1.spd}%`;
        document.getElementById('p1-dur-bar').style.width = `${data.f1.dur}%`;
        document.getElementById('p1-iq-bar').style.width = `${data.f1.iq}%`;
        document.getElementById('p1-pwr-bar').style.width = `${data.f1.pwr}%`;
        document.getElementById('p1-stam-bar').style.width = `${data.f1.stam}%`;

        // Update Stat Bar P2 secara dinamis
        document.getElementById('p2-str-bar').style.width = `${data.f2.str}%`;
        document.getElementById('p2-spd-bar').style.width = `${data.f2.spd}%`;
        document.getElementById('p2-dur-bar').style.width = `${data.f2.dur}%`;
        document.getElementById('p2-iq-bar').style.width = `${data.f2.iq}%`;
        document.getElementById('p2-pwr-bar').style.width = `${data.f2.pwr}%`;
        document.getElementById('p2-stam-bar').style.width = `${data.f2.stam}%`;

    } catch (error) {
        console.error("Error saat duel:", error);
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 3. Pasang event listener ke tombol duel
if (btnAction) {
    btnAction.addEventListener("click", prosesDuel);
}