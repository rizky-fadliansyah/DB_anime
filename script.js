const battleBtn = document.getElementById("battle-btn");
const checkF1Btn = document.getElementById("check-f1-btn");
const checkF2Btn = document.getElementById("check-f2-btn");
const f1Input = document.getElementById("fighter1-input");
const f2Input = document.getElementById("fighter2-input");
const loadingArea = document.getElementById("loading");
const arenaDisplay = document.getElementById("arena-display");
const previewDisplay = document.getElementById("preview-display");

// Fungsi Konversi Skala Khusus Kecepatan (SPEED)
function getSpeedTier(value) {
    const num = parseInt(value);
    if (num >= 95) return "MFTL+";
    if (num >= 87) return "FTL";
    if (num >= 78) return "Relativistic";
    if (num >= 68) return "M-Hypersonic";
    if (num >= 58) return "Hypersonic";
    if (num >= 48) return "Supersonic";
    if (num >= 38) return "Subsonic";
    if (num >= 23) return "Superhuman";
    return "Normal Human";
}

// Fungsi Konversi Skala Umum (Strength, Durability, Powers, Stamina)
function getGeneralPowerTier(value) {
    const num = parseInt(value);
    if (num >= 95) return "Outerversal";
    if (num >= 88) return "Planet Lvl";
    if (num >= 80) return "Continent Lvl";
    if (num >= 70) return "Island Lvl";
    if (num >= 60) return "Mountain Lvl";
    if (num >= 50) return "City Lvl";
    if (num >= 38) return "Building Lvl";
    if (num >= 23) return "Superhuman";
    return "Street Lvl";
}

// Reset Seluruh Progress Bar & Teks Stat
function resetBars() {
    document.querySelectorAll(".stat-fill").forEach(bar => bar.style.width = "0%");
    document.querySelectorAll(".stat-num").forEach(num => num.innerText = "-");
}

// --- 1. PROSES MULAI BATTLE ARENA ---
battleBtn.addEventListener("click", async () => {
    const char1 = f1Input.value.trim();
    const char2 = f2Input.value.trim();

    if (!char1 || !char2) return alert("Masukkan kedua nama karakter anime dulu, Ky!");

    loadingArea.style.display = "block";
    arenaDisplay.style.display = "none";
    previewDisplay.style.display = "none"; 
    
    battleBtn.disabled = true;
    checkF1Btn.disabled = true;
    checkF2Btn.disabled = true;
    resetBars();

    const finalChar1 = char1.toLowerCase().includes("dari") ? char1 : `${char1} (Karakter Anime/Manga/Webtoon)`;
    const finalChar2 = char2.toLowerCase().includes("dari") ? char2 : `${char2} (Karakter Anime/Manga/Webtoon)`;

    try {
        const response = await fetch('/api/deathbattle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ karakter1: finalChar1, karakter2: finalChar2 })
        });
        
        const data = await response.json();
        
        // Memasukkan Teks Informasi Karakter 1
        document.getElementById("name-f1").innerText = data.f1.name;
        document.getElementById("origin-f1").innerText = `Asal: ${data.f1.origin}`;
        document.getElementById("tier-f1").innerText = data.f1.tier;
        document.getElementById("desc-f1").innerText = data.f1.desc;
        document.getElementById("ability-f1").innerText = data.f1.ability;

        // Memasukkan Teks Informasi Karakter 2
        document.getElementById("name-f2").innerText = data.f2.name;
        document.getElementById("origin-f2").innerText = `Asal: ${data.f2.origin}`;
        document.getElementById("tier-f2").innerText = data.f2.tier;
        document.getElementById("desc-f2").innerText = data.f2.desc;
        document.getElementById("ability-f2").innerText = data.f2.ability;

        // Hasil Kesimpulan Juri AI
        document.getElementById("battle-winner").innerText = data.winner;
        document.getElementById("battle-reason").innerText = data.reason;

        // Render Bar Grafik & Nama Tier per Baris Stat
        const stats = ["str", "spd", "dur", "iq", "pwr", "stam"];
        stats.forEach(stat => {
            const valF1 = data.f1[stat];
            const valF2 = data.f2[stat];

            const tierF1 = (stat === "spd") ? getSpeedTier(valF1) : getGeneralPowerTier(valF1);
            const tierF2 = (stat === "spd") ? getSpeedTier(valF2) : getGeneralPowerTier(valF2);

            if(document.getElementById(`bar-${stat}-f1`)) document.getElementById(`bar-${stat}-f1`).style.width = `${valF1}%`;
            if(document.getElementById(`val-${stat}-f1`)) document.getElementById(`val-${stat}-f1`).innerText = tierF1;
            
            if(document.getElementById(`bar-${stat}-f2`)) document.getElementById(`bar-${stat}-f2`).style.width = `${valF2}%`;
            if(document.getElementById(`val-${stat}-f2`)) document.getElementById(`val-${stat}-f2`).innerText = tierF2;
        });

        arenaDisplay.style.display = "flex";
        if (typeof confetti === "function") confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    } catch (error) {
        alert("Gagal memproses analisis pertarungan!");
    } finally {
        loadingArea.style.display = "none";
        battleBtn.disabled = false;
        checkF1Btn.disabled = false;
        checkF2Btn.disabled = false;
    }
});

// --- 2. PROSES TOMBOL CEK DATA SINGLE CHAR ---
checkF1Btn.addEventListener("click", () => {
    const charName = f1Input.value.trim();
    if (!charName) return alert("Masukkan nama karakter di kolom Karakter 1 terlebih dahulu!");
    checkCharacterData(charName);
});

checkF2Btn.addEventListener("click", () => {
    const charName = f2Input.value.trim();
    if (!charName) return alert("Masukkan nama karakter di kolom Karakter 2 terlebih dahulu!");
    checkCharacterData(charName);
});

async function checkCharacterData(charName) {
    loadingArea.style.display = "block";
    arenaDisplay.style.display = "none"; 
    previewDisplay.style.display = "none";
    
    battleBtn.disabled = true;
    checkF1Btn.disabled = true;
    checkF2Btn.disabled = true;
    resetBars();

    const finalChar = charName.toLowerCase().includes("dari") ? charName : `${charName} (Karakter Anime/Manga/Webtoon)`;

    try {
        const response = await fetch('/api/checkcharacter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ karakter: finalChar })
        });

        const data = await response.json();
        
        document.getElementById("prev-name").innerText = data.name;
        document.getElementById("prev-origin").innerText = `Asal: ${data.origin}`;
        document.getElementById("prev-tier").innerText = data.tier;
        document.getElementById("prev-desc").innerText = data.desc;
        document.getElementById("prev-ability").innerText = data.ability;
        
        const stats = ["str", "spd", "dur", "iq", "pwr", "stam"];
        stats.forEach(stat => {
            const val = data[stat];
            const barEl = document.getElementById(`bar-${stat}-prev`);
            const valEl = document.getElementById(`val-${stat}-prev`);
            
            const tierText = (stat === "spd") ? getSpeedTier(val) : getGeneralPowerTier(val);

            if (barEl) barEl.style.width = `${val}%`;
            if (valEl) valEl.innerText = tierText;
        });

        previewDisplay.style.display = "block";

    } catch (error) {
        alert("Gagal mengecek data karakter!");
    } finally {
        loadingArea.style.display = "none";
        battleBtn.disabled = false;
        checkF1Btn.disabled = false;
        checkF2Btn.disabled = false;
    }
}