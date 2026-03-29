/**
 * mcDashboard Enterprise v3.1
 * Real-time Machine Monitoring Controller
 * Feature: Smart Fetch with Auto-Fallback Strategy
 */

async function fetchStatus() {
    try {
        // Attempt to fetch from real PHP API
        const response = await fetch('api/status.php');
        
        if (!response.ok) {
            throw new Error('API not available (HTTP ' + response.status + ')');
        }
        
        const data = await response.json();
        console.log('Fetching live data from API...');
        renderDashboard(data);
        
    } catch (error) {
        // Fallback Strategy: Generate mock data if API fails or PHP is not running
        console.warn('Fallback: API Connection failed. Generating mock data...', error.message);
        const mockData = generateMockData();
        renderDashboard(mockData);
    }
}

/**
 * Generates mock data following the structure in FACTORY.md
 * to ensure the dashboard works even without a PHP server.
 */
function generateMockData() {
    const factoryStructure = [
        {
            department: "Production Department (ZONE A)",
            machines: [
                { id: "M01", name: "Hydraulic Press 01", status: "RUNNING" },
                { id: "M02", name: "Hydraulic Press 02", status: "RUNNING" },
                { id: "M03", name: "Conveyor Line A1", status: "RUNNING" }
            ]
        },
        {
            department: "Machining Department (ZONE B)",
            machines: [
                { id: "M04", name: "CNC Milling 01", status: "IDLE" },
                { id: "M05", name: "CNC Milling 02", status: "RUNNING" },
                { id: "M06", name: "Lathe Machine 01", status: "RUNNING" }
            ]
        },
        {
            department: "QC & Packaging (ZONE C)",
            machines: [
                { id: "M07", name: "Auto Sorter 01", status: "RUNNING" },
                { id: "M08", name: "Packing Robot 01", status: "RUNNING" },
                { id: "M09", name: "Labeling Unit 01", status: "STOP" }
            ]
        }
    ];

    return factoryStructure.map(dept => ({
        department: dept.department,
        data: dept.machines.map(m => {
            let current = "0.0", vib = "0.0", amp = 0;
            
            if (m.status === "RUNNING") {
                current = (Math.random() * 6 + 12).toFixed(1);
                vib = (Math.random() * 1.5 + 1.0).toFixed(1);
                amp = Math.floor(Math.random() * 20 + 75);
            } else if (m.status === "IDLE") {
                current = (Math.random() * 2 + 1.0).toFixed(1);
                vib = (Math.random() * 0.4 + 0.1).toFixed(1);
                amp = Math.floor(Math.random() * 10 + 10);
            }

            return {
                id: m.id,
                name: m.name,
                status: m.status,
                metrics: { current, vibration: vib, amp_load: amp }
            };
        })
    }));
}

function renderDashboard(data) {
    const container = document.getElementById('factory-content');
    if (!container) return;
    
    container.innerHTML = '';

    data.forEach(dept => {
        const section = document.createElement('div');
        section.className = 'department-section';
        
        let machinesHtml = '';
        dept.data.forEach(m => {
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

        section.innerHTML = `
            <h2 class="department-title">${dept.department}</h2>
            <div class="machine-grid">${machinesHtml}</div>
        `;
        container.appendChild(section);
    });
}

function getAmpColor(val) {
    if (val > 90) return '#ef4444';
    if (val > 80) return '#f59e0b';
    return '#3b82f6';
}

// Initial fetch and real-time interval (3 seconds)
fetchStatus();
setInterval(fetchStatus, 3000);
