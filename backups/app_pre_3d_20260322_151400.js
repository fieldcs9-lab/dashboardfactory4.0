/**
 * J.A.R.V.I.S. HUD Core v5.0.1
 * Feature: Holographic Interface & Tactical Data Analysis
 */

let currentZone = 'ALL';
let lastReceivedData = null;

// === HOLOGRAPHIC SVG ICONS ===
const ICONS = {
    PROCESS: `<svg class="section-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" /></svg>`,
    PACKING: `<svg class="section-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,
    CURRENT: `<svg class="icon-inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
    VIBRATION: `<svg class="icon-inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>`,
    AMP: `<svg class="icon-inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`,
    TOTAL: `<svg class="stat-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`,
    RUNNING: `<svg class="stat-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
    IDLE: `<svg class="stat-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    STOP: `<svg class="stat-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
};

// === INTERFACE CONTROLS ===
const toggleBtn = document.getElementById('sidebar-toggle');
const closeBtn = document.getElementById('sidebar-close');
const sidebar = document.getElementById('sidebar');

function closeSidebar() { document.body.classList.remove('sidebar-open'); }
function toggleSidebar() { document.body.classList.toggle('sidebar-open'); }

if (toggleBtn) toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeSidebar(); });

document.addEventListener('click', (e) => {
    if (document.body.classList.contains('sidebar-open') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeSidebar();
    }
});

// === NAVIGATION ===
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        currentZone = target.getAttribute('data-zone');
        document.getElementById('view-title').innerText = target.querySelector('span').innerText;
        if (lastReceivedData) renderDashboard(lastReceivedData);
    });
});

// === TELEMETRY STREAM ===
async function fetchStatus() {
    updateSystemMetrics();
    try {
        const response = await fetch('api/status.php');
        if (!response.ok) throw new Error('OFFLINE');
        const data = await response.json();
        lastReceivedData = data;
        renderDashboard(data);
    } catch (error) {
        const mockData = generateMockData();
        lastReceivedData = mockData;
        renderDashboard(mockData);
    }
}

function updateSystemMetrics() {
    const temp = (35 + Math.random() * 5).toFixed(1);
    const stable = (99 + Math.random() * 0.9).toFixed(1);
    const tempEl = document.getElementById('core-temp');
    const stableEl = document.getElementById('load-stable');
    if (tempEl) tempEl.innerText = temp;
    if (stableEl) stableEl.innerText = stable;
}

// === HUD RENDERING ===
function renderDashboard(data) {
    const container = document.getElementById('factory-content');
    if (!container) return;
    container.innerHTML = '';

    let filtered = [];
    data.forEach(dept => {
        if (currentZone === 'ALL' || dept.department.toUpperCase().includes(currentZone.toUpperCase())) {
            dept.data.forEach(m => {
                m.category = (m.id >= 'M07') ? 'PACKING' : 'PROCESS';
                filtered.push(m);
            });
        }
    });

    renderOverview(container, filtered);
    renderSection(container, '⚙️ PROCESS_MONITOR', ICONS.PROCESS, filtered.filter(m => m.category === 'PROCESS'));
    renderSection(container, '📦 PACKING_QC_HUB', ICONS.PACKING, filtered.filter(m => m.category === 'PACKING'));
}

function renderOverview(container, machines) {
    const running = machines.filter(m => m.status === 'RUNNING').length;
    const idle = machines.filter(m => m.status === 'IDLE').length;
    const stop = machines.filter(m => m.status === 'STOP').length;

    container.innerHTML += `
        <div class="overview-grid">
            <div class="stat-card"><span class="stat-label">${ICONS.TOTAL} UNITS_TOTAL</span><span class="stat-value">${machines.length}</span></div>
            <div class="stat-card" style="border-color: var(--accent-running)">${ICONS.RUNNING}<span class="stat-label">STATUS_ACTIVE</span><span class="stat-value" style="color: var(--accent-running)">${running}</span></div>
            <div class="stat-card" style="border-color: var(--accent-idle)">${ICONS.IDLE}<span class="stat-label">STATUS_IDLE</span><span class="stat-value" style="color: var(--accent-idle)">${idle}</span></div>
            <div class="stat-card" style="border-color: var(--accent-stop)">${ICONS.STOP}<span class="stat-label">STATUS_OFFLINE</span><span class="stat-value" style="color: var(--accent-stop)">${stop}</span></div>
        </div>
    `;
}

function renderSection(container, title, icon, machines) {
    if (machines.length === 0) return;
    let cards = '';
    machines.forEach(m => {
        const s = m.status.toLowerCase();
        cards += `
            <div class="machine-card status-${s}">
                <div class="machine-header">
                    <div><span class="machine-id">ID: ${m.id}</span><span class="machine-name">${m.name.toUpperCase()}</span></div>
                    <div class="status-badge">${m.status}</div>
                </div>
                <div class="metrics-grid">
                    <div class="metric-item"><span class="metric-label">${ICONS.CURRENT} CURR</span><span class="metric-value">${m.metrics.current}</span><span class="metric-unit">A</span></div>
                    <div class="metric-item"><span class="metric-label">${ICONS.VIBRATION} VIBE</span><span class="metric-value">${m.metrics.vibration}</span><span class="metric-unit">mm/s</span></div>
                </div>
                <div class="amp-section">
                    <div class="amp-header"><span class="metric-label">LOAD_CAPACITY</span><span>${m.metrics.amp_load}%</span></div>
                    <div class="progress-container"><div class="progress-bar" style="width: ${m.metrics.amp_load}%; background: ${getAmpColor(m.metrics.amp_load)}"></div></div>
                </div>
            </div>
        `;
    });
    container.innerHTML += `<h2 class="section-title">${icon} ${title}</h2><div class="machine-grid">${cards}</div>`;
}

function getAmpColor(val) {
    if (val > 90) return 'var(--accent-stop)';
    if (val > 80) return 'var(--accent-idle)';
    return 'var(--accent-jarvis)';
}

function generateMockData() {
    return [
        { department: "ZONE A", data: [{ id: "M01", name: "Hydraulic Press 01", status: "RUNNING", metrics: {current: "15.2", vibration: "1.2", amp_load: 85} }, { id: "M02", name: "Hydraulic Press 02", status: "RUNNING", metrics: {current: "14.8", vibration: "1.1", amp_load: 82} }, { id: "M03", name: "Conveyor Line A1", status: "RUNNING", metrics: {current: "12.5", vibration: "0.8", amp_load: 75} }] },
        { department: "ZONE B", data: [{ id: "M04", name: "CNC Milling 01", status: "IDLE", metrics: {current: "2.1", vibration: "0.2", amp_load: 15} }, { id: "M05", name: "CNC Milling 02", status: "RUNNING", metrics: {current: "18.5", vibration: "2.1", amp_load: 92} }, { id: "M06", name: "Lathe Machine 01", status: "RUNNING", metrics: {current: "16.2", vibration: "1.5", amp_load: 88} }] },
        { department: "ZONE C", data: [{ id: "M07", name: "Auto Sorter 01", status: "RUNNING", metrics: {current: "11.2", vibration: "0.9", amp_load: 70} }, { id: "M08", name: "Packing Robot 01", status: "RUNNING", metrics: {current: "13.4", vibration: "1.2", amp_load: 78} }, { id: "M09", name: "Labeling Unit 01", status: "STOP", metrics: {current: "0.0", vibration: "0.0", amp_load: 0} }] }
    ];
}

fetchStatus();
setInterval(fetchStatus, 3000);
