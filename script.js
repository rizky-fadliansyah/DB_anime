const battleBtn = document.getElementById("battle-btn");
const checkF1Btn = document.getElementById("check-f1-btn");
const checkF2Btn = document.getElementById("check-f2-btn");
const f1Input = document.getElementById("fighter1-input");
const f2Input = document.getElementById("fighter2-input");
const loadingArea = document.getElementById("loading");
const arenaDisplay = document.getElementById("arena-display");
const previewDisplay = document.getElementById("preview-display");

// Elemen Preview Cek Data
const prevName = document.getElementById("prev-name");
const prevOrigin = document.getElementById("prev-origin");

// Elemen Battle Arena
const nameF1 = document.getElementById("name-f1");
const asalF1 = document.getElementById("origin-f1");
const nameF2 = document.getElementById("name-f2");
const asalF2 = document.getElementById("origin-f2");
const battleWinner = document.getElementById("battle-winner");
const battleReason = document.getElementById("battle-reason");

// --- 1. LOGIC TOMBOL MULAI DUEL ---
battleBtn.addEventListener("click", async () => {
    const char1 = f1Input.value.trim();
    const char2 = f2Input.value.trim();

    if (!char1 || !char2) return alert("Masukkan kedua nama karakter anime dulu, Ky!");

    loadingArea.style.display = "block";
    arenaDisplay.style.display = "none";
    previewDisplay.style.display = "none"; 
    
    // Taruh semua tombol ke posisi disable
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
        
        nameF1.innerText = data.f1.name;
        asalF1.innerText = `Asal: ${data.f1.origin}`;
        nameF2.innerText = data.f2.name;
        asalF2.innerText = `Asal: ${data.f2.origin}`;
        battleWinner.innerText = data.winner;
        battleReason.innerText = data.reason;

        // Render Bar Arena Duel
        const stats = ["str", "spd", "dur", "iq", "pwr", "stam"];
        stats.forEach(stat => {
            if(document.getElementById(`bar-${stat}-f1`)) document.getElementById(`bar-${stat}-f1`).style.width = `${data.f1[stat]}%`;
            if(document.getElementById(`bar-${stat}-f2`)) document.getElementById(`bar-${stat}-f2`).style.width = `${data.f2[stat]}%`;
        });

        arenaDisplay.style.display = "flex";
        if (typeof confetti === "function") confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    } catch (error) {
        alert("Gagal memproses duel!");
    } finally {
        loadingArea.style.display = "none";
        battleBtn.disabled = false;
        checkF1Btn.disabled = false;
        checkF2Btn.disabled = false;
    }
});

// --- 2. LOGIC TOMBOL CEK DATA CHAR 1 ---
checkF1Btn.addEventListener("click", () => {
    const charName = f1Input.value.trim();
    if (!charName) return alert("Masukkan nama karakter di kolom Karakter 1 dulu, Ky!");
    checkCharacterData(charName);
});

// --- 3. LOGIC TOMBOL CEK DATA CHAR 2 ---
checkF2Btn.addEventListener("click", () => {
    const charName = f2Input.value.trim();
    if (!charName) return alert("Masukkan nama karakter di kolom Karakter 2 dulu, Ky!");
    checkCharacterData(charName);
});

// FUNGSI UTAMA UNTUK PROFILING SINGLE CHAR
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
        
        prevName.innerText = data.name;
        prevOrigin.innerText = `Asal: ${data.origin}`;
        
        // Render Bar Preview Single Char
        const stats = ["str", "spd", "dur", "iq", "pwr", "stam"];
        stats.forEach(stat => {
            const el = document.getElementById(`bar-${stat}-prev`);
            if (el) el.style.width = `${data[stat]}%`;
        });

        previewDisplay.style.display = "block";

    } catch (error) {
        alert("Gagal mengambil data karakter!");
    } finally {
        loadingArea.style.display = "none";
        battleBtn.disabled = false;
        checkF1Btn.disabled = false;
        checkF2Btn.disabled = false;
    }
}

function resetBars() {
    document.querySelectorAll(".stat-fill").forEach(bar => bar.style.width = "0%");
}