const sectors = [
    {
        code: "SEC-01",
        name: "Lembah Cisadane — Pagi",
        zone: "tropis",
        zoneLabel: "KONVEKTIF",
        speed: 10,
        azimuth: 45,
        humidity: 84,
        pressure: 1013,
        coords: "06°23'S 106°45'E",
        summary: "Inversi suhu permukaan rendah dengan kabut tipis bergerak perlahan ke arah timur laut."
    },
    {
        code: "SEC-02",
        name: "Selat Sunda — Monsun Barat",
        zone: "maritim",
        zoneLabel: "MARITIM",
        speed: 26,
        azimuth: 255,
        humidity: 88,
        pressure: 1007,
        coords: "06°02'S 105°51'E",
        summary: "Aliran massa udara lembap dari Samudra Hindia memicu pembentukan awan kumulus berlapis."
    },
    {
        code: "SEC-03",
        name: "Punggung Pangrango — 2.400m",
        zone: "orografis",
        zoneLabel: "OROGRAFIS",
        speed: 19,
        azimuth: 135,
        humidity: 92,
        pressure: 768,
        coords: "06°46'S 106°57'E",
        summary: "Pengangkatan udara paksa di lereng gunung menghasilkan kondensasi cepat dan suhu dingin."
    },
    {
        code: "SEC-04",
        name: "Teluk Jakarta — Angin Laut",
        zone: "maritim",
        zoneLabel: "MARITIM",
        speed: 15,
        azimuth: 15,
        humidity: 74,
        pressure: 1011,
        coords: "06°06'S 106°52'E",
        summary: "Perbedaan kapasitas panas daratan dan perairan mendorong hembusan angin laut siang hari."
    },
    {
        code: "SEC-05",
        name: "Dataran Tinggi Dieng — Fajar",
        zone: "orografis",
        zoneLabel: "OROGRAFIS",
        speed: 7,
        azimuth: 190,
        humidity: 95,
        pressure: 795,
        coords: "07°12'S 109°54'E",
        summary: "Radiasi gelombang panjang malam hari menurunkan suhu mendekati titik beku embun."
    },
    {
        code: "SEC-06",
        name: "Cekungan Bandung — Konvergensi",
        zone: "tropis",
        zoneLabel: "KONVEKTIF",
        speed: 22,
        azimuth: 310,
        humidity: 81,
        pressure: 926,
        coords: "06°55'S 107°36'E",
        summary: "Pertemuan arus angin lokal memicu sel konvektif vertikal pada sore menjelang petang."
    }
];

let activeSector = sectors[0];
let activeZoneFilter = "all";
let gustBoost = 0;

// DOM References
const sectorListEl = document.getElementById("sectorList");
const zoneFilterBtns = document.querySelectorAll("#zoneFilters button");

const activeSectorCode = document.getElementById("activeSectorCode");
const activeSectorName = document.getElementById("activeSectorName");
const activeSectorSummary = document.getElementById("activeSectorSummary");

const windSpeedSlider = document.getElementById("windSpeedSlider");
const azimuthSlider = document.getElementById("azimuthSlider");
const humiditySlider = document.getElementById("humiditySlider");

const windSpeedReadout = document.getElementById("windSpeedReadout");
const azimuthReadout = document.getElementById("azimuthReadout");
const humidityReadout = document.getElementById("humidityReadout");

const pressureVal = document.getElementById("pressureVal");
const dewPointVal = document.getElementById("dewPointVal");
const beaufortVal = document.getElementById("beaufortVal");

const gustTriggerBtn = document.getElementById("gustTriggerBtn");
const resetSectorBtn = document.getElementById("resetSectorBtn");
const sensorDot = document.getElementById("sensorDot");
const sensorStatus = document.getElementById("sensorStatus");
const utcClock = document.getElementById("utcClock");

// Helper: Cardinal Direction & Beaufort Scale
function getCardinal(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const idx = Math.round(deg / 45) % 8;
    return dirs[idx];
}

function getBeaufort(knots) {
    if (knots < 4) return "BF-1";
    if (knots < 7) return "BF-2";
    if (knots < 11) return "BF-3";
    if (knots < 17) return "BF-4";
    if (knots < 22) return "BF-5";
    if (knots < 28) return "BF-6";
    if (knots < 34) return "BF-7";
    return "BF-8";
}

function updateTelemetry() {
    const baseSpeed = Number(windSpeedSlider.value);
    const effectiveSpeed = Math.min(60, baseSpeed + Math.round(gustBoost));
    const deg = Number(azimuthSlider.value);
    const rh = Number(humiditySlider.value);

    windSpeedReadout.textContent = `${effectiveSpeed} kt`;
    azimuthReadout.textContent = `${String(deg).padStart(3, "0")}° ${getCardinal(deg)}`;
    humidityReadout.textContent = `${rh}%`;

    // Approximate dew point (assuming 27°C reference surface temp)
    const tempRef = 27;
    const dewPoint = (tempRef - ((100 - rh) / 5)).toFixed(1);
    dewPointVal.textContent = `${dewPoint} °C`;
    beaufortVal.textContent = getBeaufort(effectiveSpeed);

    // Dynamic barometric shift based on wind speed
    const adjustedPressure = Math.round(activeSector.pressure - (effectiveSpeed - activeSector.speed) * 0.25);
    pressureVal.textContent = `${adjustedPressure} hPa`;

    if (effectiveSpeed >= 28) {
        sensorDot.classList.add("gust");
        sensorStatus.textContent = "BAROGRAPH: GALE ADVISORY";
    } else {
        sensorDot.classList.remove("gust");
        sensorStatus.textContent = "BAROGRAPH: NOMINAL";
    }
}

function loadSector(sector) {
    activeSector = sector;
    gustBoost = 0;

    activeSectorCode.textContent = sector.code;
    activeSectorName.textContent = sector.name;
    activeSectorSummary.textContent = sector.summary;

    windSpeedSlider.value = sector.speed;
    azimuthSlider.value = sector.azimuth;
    humiditySlider.value = sector.humidity;

    updateTelemetry();
    renderSectors();
}

function renderSectors() {
    const filtered = activeZoneFilter === "all"
        ? sectors
        : sectors.filter(s => s.zone === activeZoneFilter);

    sectorListEl.innerHTML = filtered.map(sec => {
        const isSelected = sec.code === activeSector.code;
        return `
            <div class="sector-item ${isSelected ? "active" : ""}" data-code="${sec.code}">
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div>
                        <div class="mono small text-clay">${sec.code} // ${sec.coords} • ${sec.pressure} hPa</div>
                        <div class="fw-bold fs-5">${sec.name}</div>
                    </div>
                    <span class="zone-badge mono">${sec.zoneLabel}</span>
                </div>
            </div>
        `;
    }).join("");

    document.querySelectorAll(".sector-item").forEach(el => {
        el.addEventListener("click", () => {
            const found = sectors.find(s => s.code === el.dataset.code);
            if (found) loadSector(found);
        });
    });
}

// Canvas Particle Wind Tunnel
const canvas = document.getElementById("windCanvas");
const ctx = canvas.getContext("2d");

const particles = Array.from({ length: 65 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    len: 10 + Math.random() * 18,
    drift: 0.7 + Math.random() * 0.6
}));

function renderWindTunnel() {
    requestAnimationFrame(renderWindTunnel);

    if (gustBoost > 0.1) {
        gustBoost *= 0.96;
        updateTelemetry();
    } else {
        gustBoost = 0;
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const styles = getComputedStyle(document.documentElement);
    const gridStroke = styles.getPropertyValue("--border-soft").trim();
    const clayStroke = styles.getPropertyValue("--accent-clay").trim();
    const navyStroke = styles.getPropertyValue("--accent-navy").trim();

    // Subtle Radar Crosshair & Grid
    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    for (let gx = 60; gx < w; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
    }
    for (let gy = 47; gy < h; gy += 47) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
    }

    const speed = (Number(windSpeedSlider.value) + gustBoost) * 0.22;
    // Convert meteorological azimuth (0° = from North/top) to flow direction
    const rad = ((Number(azimuthSlider.value) + 90) * Math.PI) / 180;
    const vx = Math.cos(rad) * speed;
    const vy = Math.sin(rad) * speed;

    particles.forEach((p, idx) => {
        p.x += vx * p.drift;
        p.y += vy * p.drift;

        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
        if (p.y > h) p.y = 0;
        if (p.y < 0) p.y = h;

        ctx.strokeStyle = idx % 4 === 0 ? clayStroke : navyStroke;
        ctx.lineWidth = idx % 4 === 0 ? 1.8 : 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * 2.4, p.y - vy * 2.4);
        ctx.stroke();
    });

    // Compass Vector Indicator in Corner
    const cx = w - 42;
    const cy = 42;
    ctx.strokeStyle = clayStroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * 18, cy + Math.sin(rad) * 18);
    ctx.stroke();
}

// Event Listeners
windSpeedSlider.addEventListener("input", updateTelemetry);
azimuthSlider.addEventListener("input", updateTelemetry);
humiditySlider.addEventListener("input", updateTelemetry);

gustTriggerBtn.addEventListener("click", () => {
    gustBoost = 22;
    updateTelemetry();
});

resetSectorBtn.addEventListener("click", () => {
    loadSector(activeSector);
});

zoneFilterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        zoneFilterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeZoneFilter = btn.dataset.zone;
        renderSectors();
    });
});

const surfaceToggle = document.getElementById("surfaceToggle");
surfaceToggle.addEventListener("click", () => {
    const html = document.documentElement;
    const next = html.getAttribute("data-mode") === "paper" ? "radar" : "paper";
    html.setAttribute("data-mode", next);
    surfaceToggle.textContent = next === "radar" ? "PAPER CHART" : "NIGHT RADAR";
});

// Live UTC Clock
function tickClock() {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mm = String(now.getUTCMinutes()).padStart(2, "0");
    const ss = String(now.getUTCSeconds()).padStart(2, "0");
    utcClock.textContent = `UTC ${hh}:${mm}:${ss}`;
}

setInterval(tickClock, 1000);
tickClock();
loadSector(sectors[0]);
renderWindTunnel();