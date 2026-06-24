const battleBtn = document.getElementById("battle-btn");
const f1Input = document.getElementById("fighter1-input");
const f2Input = document.getElementById("fighter2-input");
const loadingArea = document.getElementById("loading");
const arenaDisplay = document.getElementById("arena-display");

const nameF1 = document.getElementById("name-f1");
const nameF2 = document.getElementById("name-f2");
const battleWinner = document.getElementById("battle-winner");
const battleReason = document.getElementById("battle-reason");

battleBtn.addEventListener("click", async () => {
    const char1 = f1Input.value.trim();
    const char2 = f2Input.value.trim();

    if (!char1 || !char2) return alert("Masukkan kedua nama karakter anime dulu, Ky!");

    loadingArea.style.display = "block";
    arenaDisplay.style.display = "none";
    battleBtn.disabled = true;

    resetBars();

    try {
        const response = await fetch('/api/deathbattle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ karakter1: char1, karakter2: char2 })
        });
        
        const textData = await response.text();
        
        if (!response.ok) {
            let serverErrorMessage = "Terjadi kesalahan pada server.";
            try {
                const jsonErr = JSON.parse(textData);
                serverErrorMessage = jsonErr.error || serverErrorMessage;
            } catch(e) {
                serverErrorMessage = `Error ${response.status}: Server crash atau overload.`;
            }
            throw new Error(serverErrorMessage);
        }
        
        const data = JSON.parse(textData);
        renderBattleResult(data);

    } catch (error) {
        console.error("Gagal mengambil data Groq:", error);
        alert(`Waduh! ${error.message}`);
    } finally {
        loadingArea.style.display = "none";
        battleBtn.disabled = false;
    }
});

function resetBars() {
    const bars = document.querySelectorAll(".stat-fill");
    bars.forEach(bar => bar.style.width = "0%");
}

function renderBattleResult(data) {
    nameF1.innerText = data.f1.name;
    nameF2.innerText = data.f2.name;
    battleWinner.innerText = data.winner;
    battleReason.innerText = data.reason;

    arenaDisplay.style.display = "flex";

    setTimeout(() => {
        document.getElementById("bar-str-f1").style.width = `${data.f1.str}%`;
        document.getElementById("bar-spd-f1").style.width = `${data.f1.spd}%`;
        document.getElementById("bar-dur-f1").style.width = `${data.f1.dur}%`;
        document.getElementById("bar-iq-f1").style.width = `${data.f1.iq}%`;
        document.getElementById("bar-pwr-f1").style.width = `${data.f1.pwr}%`;

        document.getElementById("bar-str-f2").style.width = `${data.f2.str}%`;
        document.getElementById("bar-spd-f2").style.width = `${data.f2.spd}%`;
        document.getElementById("bar-dur-f2").style.width = `${data.f2.dur}%`;
        document.getElementById("bar-iq-f2").style.width = `${data.f2.iq}%`;
        document.getElementById("bar-pwr-f2").style.width = `${data.f2.pwr}%`;
    }, 100);

    if (typeof confetti === "function") {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
}