async function fetchStatus() {
    try {
        const response = await fetch('api/status.php');
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Error fetching machine status:', error);
    }
}

function renderDashboard(data) {
    const container = document.getElementById('factory-content');
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

// Initial fetch and interval
fetchStatus();
setInterval(fetchStatus, 3000);
