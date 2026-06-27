// 1. Ambil data petarung dasar dari localStorage (dikirim dari index.html)
const selectedP1 = JSON.parse(localStorage.getItem("p1_battle"));
const selectedP2 = JSON.parse(localStorage.getItem("p2_battle"));

const statusP1 = document.getElementById("status-p1");
const statusP2 = document.getElementById("status-p2");
const btnAction = document.getElementById("btn-action");
const loadEl = document.getElementById("loading");
const arenaEl = document.getElementById("arena-result");

// VARIABEL GLOBAL: Tempat menampung data riset mendalam dari AI /api/research
let petarung1Data = null;
let petarung2Data = null;

// Validasi jika data di localStorage kosong
if (!selectedP1 || !selectedP2) {
    alert("Petarung belum lengkap! Kembali ke halaman utama.");
    window.location.href = "index.html";
} else {
    if (statusP1) statusP1.innerText = `${selectedP1.name} (${selectedP1.form_name})`;
    if (statusP2) statusP2.innerText = `${selectedP2.name} (${selectedP2.form_name})`;
    
    // LANGKAH OTOMATIS: Begitu halaman kebuka, langsung riset data detail kedua karakter ke AI
    siapkanDataPertarungan();
}

// Fungsi otomatis untuk melakukan riset data karakteristik karakter via API /api/research
async function siapkanDataPertarungan() {
    try {
        if (loadEl) loadEl.style.display = 'block';
        if (btnAction) btnAction.disabled = true; // Kunci tombol duel saat riset belum beres

        // Riset karakter 1 dan karakter 2 secara bersamaan (paralel) biar cepat
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

        // Gabungkan info dasar identitas dengan hasil statistik dari AI riset
        petarung1Data = { ...selectedP1, ...detailP1 };
        petarung2Data = { ...selectedP2, ...detailP2 };

        console.log("Riset Beres! Data Siap Diadu:", { petarung1Data, petarung2Data });

        // Tampilkan informasi berkas kemampuan awal di kolom samping jika ada elemennya
        if (document.getElementById('p1-ability')) document.getElementById('p1-ability').textContent = petarung1Data.ability;
        if (document.getElementById('p2-ability')) document.getElementById('p2-ability').textContent = petarung2Data.ability;

        if (btnAction) btnAction.disabled = false; // Buka kunci tombol duel
    } catch (error) {
        console.error("Gagal menyiapkan data riset karakter:", error);
        alert("Gagal meriset karakteristik karakter dari server.");
    } finally {
        if (loadEl) loadEl.style.display = 'none';
    }
}

// Fungsi pembantu untuk membuat Bar Statistik Game otomatis (bisa kamu pakai jika diperlukan)
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

// Fungsi Utama: Memproses Simulasi Duel Juri AI Profesional
async function prosesDuel() {
    try {
        // 1. Validasi pengaman agar data tidak kosong saat dilempar ke backend
        if (!petarung1Data || !petarung2Data) {
            alert("Data karakteristik karakter belum selesai dimuat. Tunggu sebentar!");
            return;
        }

        if (loadEl) loadEl.style.display = 'block';

        // 2. Kirim payload LENGKAP hasil riset ke server.js untuk dinilai objektif oleh juri AI
        const response = await fetch('/api/deathbattle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                p1: petarung1Data, 
                p2: petarung2Data  
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Gagal memproses duel.");
        }

        // 3. Render hasilnya ke dalam layout 3 kolom bagian tengah
        if (document.getElementById('battle-winner')) document.getElementById('battle-winner').textContent = data.winner;
        if (document.getElementById('battle-reason')) document.getElementById('battle-reason').textContent = data.reason;

        // Update Stat Bar P1 secara dinamis mengikuti hasil penilaian juri AI
        if (document.getElementById('p1-str-bar')) document.getElementById('p1-str-bar').style.width = `${data.f1.str}%`;
        if (document.getElementById('p1-spd-bar')) document.getElementById('p1-spd-bar').style.width = `${data.f1.spd}%`;
        if (document.getElementById('p1-dur-bar')) document.getElementById('p1-dur-bar').style.width = `${data.f1.dur}%`;
        if (document.getElementById('p1-iq-bar')) document.getElementById('p1-iq-bar').style.width = `${data.f1.iq}%`;
        if (document.getElementById('p1-pwr-bar')) document.getElementById('p1-pwr-bar').style.width = `${data.f1.pwr}%`;
        if (document.getElementById('p1-stam-bar')) document.getElementById('p1-stam-bar').style.width = `${data.f1.stam}%`;

        // Update Stat Bar P2 secara dinamis
        if (document.getElementById('p2-str-bar')) document.getElementById('p2-str-bar').style.width = `${data.f2.str}%`;
        if (document.getElementById('p2-spd-bar')) document.getElementById('p2-spd-bar').style.width = `${data.f2.spd}%`;
        if (document.getElementById('p2-dur-bar')) document.getElementById('p2-dur-bar').style.width = `${data.f2.dur}%`;
        if (document.getElementById('p2-iq-bar')) document.getElementById('p2-iq-bar').style.width = `${data.f2.iq}%`;
        if (document.getElementById('p2-pwr-bar')) document.getElementById('p2-pwr-bar').style.width = `${data.f2.pwr}%`;
        if (document.getElementById('p2-stam-bar')) document.getElementById('p2-stam-bar').style.width = `${data.f2.stam}%`;

        // Tampilkan area hasil arena pertarungan jika disembunyikan sebelumnya
        if (arenaEl) arenaEl.style.display = 'block';

    } catch (error) {
        console.error("Error saat duel:", error);
        alert("Terjadi kesalahan: " + error.message);
    } finally {
        if (loadEl) loadEl.style.display = 'none';
    }
}

// 3. Pasang event listener ke tombol duel
if (btnAction) {
    btnAction.addEventListener("click", prosesDuel);
}