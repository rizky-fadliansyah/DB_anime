// --- ELEMEN DOM ---
const gridContainer = document.getElementById("grid-container");
const detailZone = document.getElementById("detail-zone");
const formOptionsContainer = document.getElementById("form-options-container");
const loadingArea = document.getElementById("loading");

const researchResult = document.getElementById("research-result");
const charFormImg = document.getElementById("char-form-img");
const resFormName = document.getElementById("res-form-name");
const resFormTier = document.getElementById("res-form-tier");
const resFormAbility = document.getElementById("res-form-ability");
const resFormDesc = document.getElementById("res-form-desc");

// Container utama grafik chart bar stat
const resStatsContainer = document.getElementById("res-stats");
// Elemen input pencarian baru
const searchInput = document.getElementById("search-char");

let characterMap = {};

// --- HELPER: KONVERSI ANGKA KE ISTILAH VS BATTLES WIKI ---
function dapatkanLabelStat(tipe, nilai) {
    if (tipe === "Speed") {
        if (nilai >= 95) return "⚡ Immeasurable";
        if (nilai >= 85) return "🚀 MFTL+ (Massively FTL+)";
        if (nilai >= 75) return "✨ FTL (Faster Than Light)";
        if (nilai >= 60) return "🔥 Relativistic";
        if (nilai >= 45) return "🌪️ Massively Hypersonic";
        if (nilai >= 30) return "💨 Supersonic / Hypersonic";
        return "🚶 Human to Subsonic";
    }
    if (tipe === "Strength" || tipe === "Durability") {
        if (nilai >= 95) return "🌌 Outerversal / Boundless";
        if (nilai >= 85) return "🪐 Multiverse to Universal";
        if (nilai >= 70) return "🌟 Star to Solar System";
        if (nilai >= 55) return "🌍 Planet to Continental";
        if (nilai >= 40) return "🏔️ Mountain to Island level";
        if (nilai >= 25) return "🏢 City to Town level";
        return "🚗 Street to Wall level";
    }
    if (tipe === "Intelligence") {
        if (nilai >= 90) return "🧠 Omniscient / Nigh-Omniscient";
        if (nilai >= 75) return "🎖️ Supergenius / Extraordinary Gen";
        if (nilai >= 55) return "📚 Genius / Gifted";
        return "👤 Above Average / Normal";
    }
    if (tipe === "Stamina") {
        if (nilai >= 90) return "🔋 Infinite / Infinite Self-Sustaining";
        if (nilai >= 75) return "🏃 Extremely High (Days of fight)";
        if (nilai >= 50) return "💪 Very High (Hours of fight)";
        return "👤 Athletic to Normal";
    }
    // Default untuk Powers/Hax
    if (nilai >= 85) return "🔮 Godly / Reality Warping Hax";
    if (nilai >= 65) return "✨ High Tier Hax (Time/Space/Concept)";
    if (nilai >= 45) return "⚔️ Mid Tier (Elemental/Energy Manipulation)";
    return "👊 Low Tier / Basic Combat Abilities";
}

// --- HELPER: TEMPLATE GENERATOR UNTUK STAT BAR CHART ---
function buatStatBar(label, nilai, tipeStat) {
    const labelVsWiki = dapatkanLabelStat(tipeStat, nilai);
    let warnaBar = "linear-gradient(90deg, #00ff55, #00aaff)";
    if (tipeStat === "Speed") warnaBar = "linear-gradient(90deg, #ffcc00, #ff6600)";
    if (tipeStat === "Strength") warnaBar = "linear-gradient(90deg, #ff0055, #990022)";

    return `
        <div style="background: #111; padding: 10px; border-radius: 6px; border-left: 4px solid #333; margin-bottom: 5px; text-align: left;">
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; color:#fff; margin-bottom: 4px;">
                <span>${label}</span>
                <span style="color: #00ffcc;">${labelVsWiki}</span>
            </div>
            <div style="background: #222; height: 10px; width: 100%; border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
                <div style="height: 100%; width: ${nilai}%; background: ${warnaBar}; transition: width 1s cubic-bezier(0.1, 0.8, 0.3, 1);"></div>
            </div>
        </div>
    `;
}

// --- 1. AMBIL DATA DARI BACKEND ---
async function loadCharacters() {
    try {
        const res = await fetch('/api/characters');
        if (!res.ok) throw new Error("Gagal ambil data");
        const rawData = await res.json();
        
        characterMap = {};
        rawData.forEach(item => {
            if (!characterMap[item.char_id]) {
                characterMap[item.char_id] = {
                    id: item.char_id,
                    name: item.name,
                    origin: item.origin,
                    char_image: item.char_image, 
                    forms: []
                };
            }
            characterMap[item.char_id].forms.push({
                form_id: item.form_id,
                form_name: item.form_name,
                image_url: item.form_image 
            });
        });
        renderCharacterGrid(""); // Panggil dengan keyword kosong saat awal muat
    } catch (err) {
        console.error("Error loadCharacters:", err);
        alert("Gagal memuat database karakter! Cek terminal server.");
    }
}

// --- 2. RENDER GRID (DENGAN COCOKAN SEARCH FILTER) ---
function renderCharacterGrid(keyword = "") {
    if (!gridContainer) return;
    gridContainer.innerHTML = "";

    const lowerKeyword = keyword.toLowerCase().trim();

    Object.values(characterMap).forEach(char => {
        // Cek apakah nama karakter atau asal seri cocok dengan keyword pencarian
        const namaCocok = char.name.toLowerCase().includes(lowerKeyword);
        const asalCocok = char.origin.toLowerCase().includes(lowerKeyword);

        if (!namaCocok && !asalCocok) return; // Lewati jika tidak cocok

        const card = document.createElement("div");
        card.className = "char-card";
        
        // Memakai fallback jika char_image kosong
        const coverImg = char.char_image ? `/images/${char.char_image}` : (char.forms[0]?.image_url ? `/images/${char.forms[0].image_url}` : 'https://placehold.co/150');

        card.innerHTML = `<img src="${coverImg}" class="char-thumb" alt="${char.name}"><h3>${char.name}</h3><p>${char.origin}</p>`;

        card.addEventListener("click", () => {
            document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active-focus'));
            card.classList.add('active-focus');
            bukaDetailKarakter(char);
        });
        gridContainer.appendChild(card);
    });
}

// --- 3. FITUR EVENT LISTENER UNTUK SEARCH BAR ---
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        renderCharacterGrid(e.target.value);
    });
}

// --- 4. DETAIL & ACTION (Gabungan) ---
function bukaDetailKarakter(char) {
    if (!detailZone) return;
    
    document.getElementById("detail-char-name").innerText = char.name;
    document.getElementById("detail-char-origin").innerText = char.origin;
    formOptionsContainer.innerHTML = "";
    researchResult.style.display = "none";
    detailZone.classList.add("active");

    let actionContainer = document.getElementById("arena-action-group");
    if (!actionContainer) {
        actionContainer = document.createElement("div");
        actionContainer.id = "arena-action-group";
        detailZone.insertBefore(actionContainer, loadingArea);
    }
    actionContainer.innerHTML = "";

    // Fungsi internal untuk menyegarkan info slot mini di dalam detail-zone secara real-time
    function perbaruiIndikatorMini() {
        const p1Skrg = JSON.parse(localStorage.getItem("p1_battle"));
        const p2Skrg = JSON.parse(localStorage.getItem("p2_battle"));
        
        const slotP1 = document.getElementById("status-slot-p1");
        const slotP2 = document.getElementById("status-slot-p2");
        
        if (slotP1) slotP1.innerText = p1Skrg ? `🔴 P1: ${p1Skrg.name} (${p1Skrg.form_name})` : "🔴 P1: Belum Memilih";
        if (slotP2) slotP2.innerText = p2Skrg ? `🟢 P2: ${p2Skrg.name} (${p2Skrg.form_name})` : "🟢 P2: Belum Memilih";
    }

    char.forms.forEach((form, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-form-opt";
        btn.innerText = form.form_name;

        btn.addEventListener("click", () => {
            document.querySelectorAll('.btn-form-opt').forEach(b => b.classList.remove('active-p1'));
            btn.classList.add('active-p1');
            jalankanRisetForm(char, form);

            // Susun ulang struktur tombol aksi & indikator mini
            actionContainer.innerHTML = `
                <div style="display: flex; justify-content: space-around; width: 100%; margin-bottom: 10px; font-size: 13px; font-weight: bold;">
                    <span id="status-slot-p1" style="color: #ff0055; background: #222; padding: 4px 10px; border-radius: 4px; border: 1px solid #ff0055;">🔴 P1: Memuat...</span>
                    <span id="status-slot-p2" style="color: #00ff55; background: #222; padding: 4px 10px; border-radius: 4px; border: 1px solid #00ff55;">🟢 P2: Memuat...</span>
                </div>
                
                <button class="btn-page" style="background:#ff0055;" id="set-p1">Set P1 🔴</button>
                <button class="btn-page" style="background:#00ff55;" id="set-p2">Set P2 🟢</button>
            `;

            // Panggil pengisian teks indikator mini sesaat setelah HTML diinjeksikan
            perbaruiIndikatorMini();

            // Logika Klik Set P1
            document.getElementById("set-p1").onclick = () => {
                localStorage.setItem("p1_battle", JSON.stringify({...char, ...form}));
                perbaruiIndikatorMini();   // Ganti teks indikator mini bawah secara instan
                perbaruiIndikatorGlobal(); // Ganti teks indikator global atas secara instan
                alert(`${char.name} (${form.form_name}) diset sebagai P1!`);
            };

            // Logika Klik Set P2
            document.getElementById("set-p2").onclick = () => {
                localStorage.setItem("p2_battle", JSON.stringify({...char, ...form}));
                perbaruiIndikatorMini();   // Ganti teks indikator mini bawah secara instan
                perbaruiIndikatorGlobal(); // Ganti teks indikator global atas secara instan
                alert(`${char.name} (${form.form_name}) diset sebagai P2!`);
            };
        });

        formOptionsContainer.appendChild(btn);
        if (index === 0) btn.click();
    });
}

// --- 5. RISET AI ---
async function jalankanRisetForm(char, form) {
    loadingArea.style.display = "block";
    researchResult.style.display = "none";

    try {
        const res = await fetch('/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: char.name, origin: char.origin, form_name: form.form_name })
        });
        const data = await res.json();

        // Update Gambar & Info Utama
        charFormImg.src = form.image_url ? `/images/${form.image_url}` : 'https://placehold.co/150';
        resFormName.innerText = `${char.name} (${form.form_name})`;
        resFormTier.innerText = `Tier: ${data.tier}`;
        resFormAbility.innerText = `Ability: ${data.ability}`;
        resFormDesc.innerText = data.desc;

        // --- GENERATE GRAPHIC BAR CHART DENGAN KLASIFIKASI TEXT ---
        if (resStatsContainer) {
            resStatsContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin: 15px 0;">
                    ${buatStatBar("💪 Strength", data.str, "Strength")}
                    ${buatStatBar("⚡ Speed", data.spd, "Speed")}
                    ${buatStatBar("🛡️ Durability", data.dur, "Durability")}
                    ${buatStatBar("🧠 Intelligence", data.iq, "Intelligence")}
                    ${buatStatBar("🔮 Powers / Hax", data.pwr, "Powers")}
                    ${buatStatBar("🔋 Stamina", data.stam, "Stamina")}
                </div>
            `;
        } else {
            console.warn("Elemen #res-stats tidak ditemukan di HTML!");
        }

        researchResult.style.display = "flex";
    } catch (err) {
        console.error(err);
        alert("Gagal meriset data!");
    } finally {
        loadingArea.style.display = "none";
    }
}

// --- JALANKAN INI UNTUK MEMPERBARUI INDIKATOR GLOBAL SAAT HALAMAN DIBUKA ---
function perbaruiIndikatorGlobal() {
    const p1 = JSON.parse(localStorage.getItem("p1_battle"));
    const p2 = JSON.parse(localStorage.getItem("p2_battle"));

    const elP1 = document.getElementById("global-status-p1");
    const elP2 = document.getElementById("global-status-p2");

    if (elP1) {
        elP1.innerText = p1 ? `🔴 P1: ${p1.name} (${p1.form_name})` : "🔴 P1: Kosong";
    }
    if (elP2) {
        elP2.innerText = p2 ? `🟢 P2: ${p2.name} (${p2.form_name})` : "🟢 P2: Kosong";
    }
}

// Inisialisasi awal saat halaman dibuka
loadCharacters();
perbaruiIndikatorGlobal();