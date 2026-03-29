/**
 * mcDashboard Enterprise v3.5
 * Feature: Persistent Toggle Sidebar & Responsive Layout
 */

let currentZone = 'ALL';
let lastReceivedData = null;

// === persistent SIDEBAR LOGIC ===
const toggleBtn = document.getElementById('sidebar-toggle');

function toggleSidebar() {
    // Toggle class on body to trigger CSS transitions for both sidebar and content
    document.body.classList.toggle('sidebar-open');
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
}

// === NAVIGATION LOGIC ===
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        
        // Update Active UI
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        
        // Update Data Filter
        currentZone = target.getAttribute('data-zone');
        const zoneName = target.querySelector('span').innerText;
        document.getElementById('view-title').innerText = zoneName;
        
        // Note: We NO LONGER close the sidebar here to allow persistent view
        
        // Re-render dashboard with filtered view
        if (lastReceivedData) renderDashboard(lastReceivedData);
    });
});

// === DATA FETCHING ===
async function fetchStatus() {
    try {
        const response = await fetch('api/status.php');
        if (!response.ok) throw new Error('API Offline');
        const data = await response.json();
        lastReceivedData = data;
        renderDashboard(data);
    } catch (error) {
        console.warn('Using Fallback Data:', error.message);
        const mockData = generateMockData();
        lastReceivedData = mockData;
        renderDashboard(mockData);
    }
}

// === RENDERING LOGIC ===
function renderDashboard(data) {
    const container = document.getElementById('factory-content');
    if (!container) return;
    container.innerHTML = '';

    let filteredMachines = [];
    data.forEach(dept => {
        const deptName = dept.department.toUpperCase();
        const filterName = currentZone.toUpperCase();
        
        if (filterName === 'ALL' || deptName.includes(filterName)) {
            dept.data.forEach(m => {
                m.category = (m.id >= 'M07') ? 'PACKING' : 'PROCESS';
                filteredMachines.push(m);
            });
        }
    });

    renderOverview(container, filteredMachines);
    
    const processMachines = filteredMachines.filter(m => m.category === 'PROCESS');
    renderSection(container, '⚙️ Process Monitoring', processMachines);

    const packingMachines = filteredMachines.filter(m => m.category === 'PACKING');
    renderSection(container, '📦 Packing & QC Control', packingMachines);
}

function renderOverview(container, machines) {
    const running = machines.filter(m => m.status === 'RUNNING').length;
    const idle = machines.filter(m => m.status === 'IDLE').length;
    const stop = machines.filter(m => m.status === 'STOP').length;

    container.innerHTML += `
        <div class="overview-grid">
            <div class="stat-card">
                <span class="stat-label">Total Units</span>
                <span class="stat-value">${machines.length}</span>
            </div>
            <div class="stat-card" style="border-bottom: 4px solid var(--accent-running)">
                <span class="stat-label">Running</span>
                <span class="stat-value" style="color: var(--accent-running)">${running}</span>
            </div>
            <div class="stat-card" style="border-bottom: 4px solid var(--accent-idle)">
                <span class="stat-label">Idle</span>
                <span class="stat-value" style="color: var(--accent-idle)">${idle}</span>
            </div>
            <div class="stat-card" style="border-bottom: 4px solid var(--accent-stop)">
                <span class="stat-label">Stop</span>
                <span class="stat-value" style="color: var(--accent-stop)">${stop}</span>
            </div>
        </div>
    `;
}

function renderSection(container, title, machines) {
    if (machines.length === 0) return;

    let cards = '';
    machines.forEach(m => {
        const s = m.status.toLowerCase();
        cards += `
            <div class="machine-card status-${s}">
                <div class="machine-header">
                    <div>
                        <span class="machine-id">${m.id}</span>
                        <span class="machine-name">${m.name}</span>
                    </div>
                    <div class="status-badge">
                        <span class="status-dot ${m.status !== 'STOP' ? 'pulse' : ''}"></span>
                        ${m.status}
                    </div>
                </div>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-label">Current</span>
                        <span class="metric-value">${m.metrics.current}</span><span class="metric-unit">A</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Vibration</span>
                        <span class="metric-value">${m.metrics.vibration}</span><span class="metric-unit">mm/s</span>
                    </div>
                </div>
                <div class="amp-section">
                    <div class="amp-header">
                        <span class="metric-label">Amp Load</span>
                        <span class="metric-value" style="font-size: 0.9rem;">${m.metrics.amp_load}%</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${m.metrics.amp_load}%; background: ${getAmpColor(m.metrics.amp_load)}"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML += `<h2 class="section-title">${title}</h2><div class="machine-grid">${cards}</div>`;
}

function getAmpColor(val) {
    if (val > 90) return '#ef4444';
    if (val > 80) return '#f59e0b';
    return '#3b82f6';
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
