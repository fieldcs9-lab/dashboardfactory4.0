/**
 * mcDashboard Enterprise v3.2
 * Feature: Zone Navigation & Unified Section Rendering
 */

let currentZone = 'ALL';
let lastReceivedData = null;

// Initialize Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Toggle Active Class
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Set Filter
        currentZone = e.target.getAttribute('data-zone');
        document.getElementById('view-title').innerText = e.target.innerText;
        
        // Re-render if data exists
        if (lastReceivedData) renderDashboard(lastReceivedData);
    });
});

async function fetchStatus() {
    try {
        const response = await fetch('api/status.php');
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        lastReceivedData = data;
        renderDashboard(data);
    } catch (error) {
        console.warn('Fallback to Mock Data:', error.message);
        const mockData = generateMockData();
        lastReceivedData = mockData;
        renderDashboard(mockData);
    }
}

function renderDashboard(data) {
    const container = document.getElementById('factory-content');
    if (!container) return;
    container.innerHTML = '';

    // 1. Filter Data based on currentZone
    let filteredMachines = [];
    data.forEach(dept => {
        if (currentZone === 'ALL' || dept.department.includes(currentZone)) {
            dept.data.forEach(m => {
                // Attach Category based on FACTORY.MD logic
                m.category = (m.id >= 'M07') ? 'PACKING' : 'PROCESS';
                filteredMachines.push(m);
            });
        }
    });

    // 2. Render Overview Section
    renderOverview(container, filteredMachines);

    // 3. Render Process Section
    const processMachines = filteredMachines.filter(m => m.category === 'PROCESS');
    renderSection(container, '⚙️ Process Monitoring', processMachines);

    // 4. Render Packing Section
    const packingMachines = filteredMachines.filter(m => m.category === 'PACKING');
    renderSection(container, '📦 Packing & QC Control', packingMachines);
}

function renderOverview(container, machines) {
    const total = machines.length;
    const running = machines.filter(m => m.status === 'RUNNING').length;
    const idle = machines.filter(m => m.status === 'IDLE').length;
    const stop = machines.filter(m => m.status === 'STOP').length;

    const html = `
        <div class="overview-grid">
            <div class="stat-card">
                <span class="stat-label">Total Machines</span>
                <span class="stat-value">${total}</span>
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
                <span class="stat-label">Stop / Down</span>
                <span class="stat-value" style="color: var(--accent-stop)">${stop}</span>
            </div>
        </div>
    `;
    container.innerHTML += html;
}

function renderSection(container, title, machines) {
    if (machines.length === 0) return;

    let machinesHtml = '';
    machines.forEach(m => {
        const statusLower = m.status.toLowerCase();
        const pulseClass = m.status !== 'STOP' ? 'pulse' : '';
        
        machinesHtml += `
            <div class="machine-card status-${statusLower}">
                <div class="machine-header">
                    <div>
                        <span class="machine-id">${m.id}</span>
                        <span class="machine-name">${m.name}</span>
                    </div>
                    <div class="status-badge">
                        <span class="status-dot ${pulseClass}"></span>
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

    const html = `
        <h2 class="section-title">${title}</h2>
        <div class="machine-grid">${machinesHtml}</div>
    `;
    container.innerHTML += html;
}

function getAmpColor(val) {
    if (val > 90) return '#ef4444';
    if (val > 80) return '#f59e0b';
    return '#3b82f6';
}

function generateMockData() {
    const factoryStructure = [
        { department: "ZONE A", machines: [{ id: "M01", name: "Hydraulic Press 01", status: "RUNNING" }, { id: "M02", name: "Hydraulic Press 02", status: "RUNNING" }, { id: "M03", name: "Conveyor Line A1", status: "RUNNING" }] },
        { department: "ZONE B", machines: [{ id: "M04", name: "CNC Milling 01", status: "IDLE" }, { id: "M05", name: "CNC Milling 02", status: "RUNNING" }, { id: "M06", name: "Lathe Machine 01", status: "RUNNING" }] },
        { department: "ZONE C", machines: [{ id: "M07", name: "Auto Sorter 01", status: "RUNNING" }, { id: "M08", name: "Packing Robot 01", status: "RUNNING" }, { id: "M09", name: "Labeling Unit 01", status: "STOP" }] }
    ];

    return factoryStructure.map(dept => ({
        department: dept.department,
        data: dept.machines.map(m => {
            let current = (m.status === "RUNNING") ? (Math.random() * 6 + 12).toFixed(1) : (m.status === "IDLE" ? (Math.random() * 2 + 1).toFixed(1) : "0.0");
            let vib = (m.status === "RUNNING") ? (Math.random() * 1.5 + 1.0).toFixed(1) : (m.status === "IDLE" ? (Math.random() * 0.4 + 0.1).toFixed(1) : "0.0");
            let amp = (m.status === "RUNNING") ? Math.floor(Math.random() * 20 + 75) : (m.status === "IDLE" ? Math.floor(Math.random() * 10 + 10) : 0);
            return { id: m.id, name: m.name, status: m.status, metrics: { current, vibration: vib, amp_load: amp } };
        })
    }));
}

fetchStatus();
setInterval(fetchStatus, 3000);
