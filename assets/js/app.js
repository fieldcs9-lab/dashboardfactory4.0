
let currentZone = 'ALL';
let currentTrendMachineId = null;
let lastReceivedData = null;
let currentShiftMode = document.body.dataset.shiftMode || 'night';
const APP_CONFIG = window.APP_CONFIG || {};

const VIEW_CONFIG = {
    ALL: {
        title: 'Factory Overview',
        subtitle: 'Unified monitoring for throughput, machine health, and production exceptions.'
    },
    'ZONE A': {
        title: 'Zone A Production Line',
        subtitle: 'Track active assets, utilization, and process stability on the main production floor.'
    },
    'ZONE B': {
        title: 'Zone B Machining Cell',
        subtitle: 'Monitor spindle load, vibration trends, and machine availability for precision work.'
    },
    'ZONE C': {
        title: 'Zone C QC and Packaging',
        subtitle: 'Watch final-stage flow, robot status, and packaging exceptions before shipment.'
    }
};

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
const closeBtn = document.getElementById('sidebar-close');
const titleEl = document.getElementById('view-title');
const subtitleEl = document.getElementById('view-subtitle');
const statusTextEl = document.getElementById('system-status-text');
const lastUpdateEl = document.getElementById('last-update-time');
const shiftModeToggle = document.getElementById('shift-mode-toggle');
const shiftModeLabel = document.getElementById('shift-mode-label');

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
}

function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

function setShiftMode(mode) {
    currentShiftMode = mode === 'day' ? 'day' : 'night';
    document.body.dataset.shiftMode = currentShiftMode;
    if (shiftModeLabel) {
        shiftModeLabel.textContent = currentShiftMode === 'day' ? 'Day Shift' : 'Night Shift';
    }
}

if (shiftModeToggle) {
    shiftModeToggle.addEventListener('click', () => {
        setShiftMode(currentShiftMode === 'day' ? 'night' : 'day');
        if (lastReceivedData) {
            renderDashboard(lastReceivedData);
        }
    });
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleSidebar();
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        closeSidebar();
    });
}

document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('sidebar-open')) {
        return;
    }

    if (window.innerWidth > 1024) {
        return;
    }

    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
        closeSidebar();
    }
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
        document.querySelectorAll('.nav-btn').forEach((item) => item.classList.remove('active'));
        const target = event.currentTarget;
        target.classList.add('active');
        currentZone = target.getAttribute('data-zone');
        updateViewCopy();
        if (lastReceivedData) {
            renderDashboard(lastReceivedData);
        }
        if (window.innerWidth <= 1024) {
            closeSidebar();
        }
    });
});

function updateViewCopy() {
    const view = VIEW_CONFIG[currentZone] || VIEW_CONFIG.ALL;
    titleEl.textContent = view.title;
    subtitleEl.textContent = view.subtitle;
}

function buildApiUrl(path) {
    const baseUrl = String(APP_CONFIG.apiBaseUrl || '').trim().replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

async function fetchStatus() {
    updateSystemMetrics();
    updateClock();

    try {
        const response = await fetch(buildApiUrl('/api/status.php'), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('offline');
        }

        const payload = await response.json();
        statusTextEl.textContent = 'Streaming live telemetry';
        if (!lastReceivedData) {
            setShiftMode(payload.shift_mode || currentShiftMode);
        }
        lastReceivedData = normalizePayload(payload);
        renderDashboard(lastReceivedData);
    } catch (error) {
        statusTextEl.textContent = 'Demo telemetry mode';
        const payload = generateMockPayload();
        if (!lastReceivedData) {
            setShiftMode(payload.shift_mode || currentShiftMode);
        }
        lastReceivedData = normalizePayload(payload);
        renderDashboard(lastReceivedData);
    }
}

function normalizePayload(payload) {
    if (Array.isArray(payload)) {
        return {
            timestamp: new Date().toISOString(),
            shift_mode: currentShiftMode,
            thresholds: getDefaultThresholds(),
            departments: payload
        };
    }

    return {
        timestamp: payload.timestamp || new Date().toISOString(),
        shift_mode: payload.shift_mode || currentShiftMode,
        thresholds: payload.thresholds || getDefaultThresholds(),
        departments: payload.departments || []
    };
}

function updateClock() {
    if (!lastUpdateEl) {
        return;
    }

    lastUpdateEl.textContent = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateSystemMetrics() {
    const temp = (35 + Math.random() * 5).toFixed(1);
    const stable = (99 + Math.random() * 0.9).toFixed(1);
    const tempEl = document.getElementById('core-temp');
    const stableEl = document.getElementById('load-stable');

    if (tempEl) {
        tempEl.textContent = temp;
    }
    if (stableEl) {
        stableEl.textContent = stable;
    }
}

function init3D(containerId, machine) {
    if (typeof THREE === 'undefined') {
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = '';
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const palette = getSeverityPalette(machine.severity);
    const lineMaterial = new THREE.LineBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.95 });
    const innerMaterial = new THREE.MeshBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.08 });

    const machineGroup = new THREE.Group();
    const baseGeom = new THREE.BoxGeometry(1.3, 0.65, 0.9);
    const baseEdges = new THREE.EdgesGeometry(baseGeom);
    machineGroup.add(new THREE.LineSegments(baseEdges, lineMaterial));
    machineGroup.add(new THREE.Mesh(baseGeom, innerMaterial));

    const towerGeom = new THREE.BoxGeometry(0.48, 0.9, 0.48);
    const towerEdges = new THREE.EdgesGeometry(towerGeom);
    const tower = new THREE.LineSegments(towerEdges, lineMaterial);
    tower.position.x = 0.05;
    tower.position.y = 0.62;
    machineGroup.add(tower);
    const conveyorGeom = new THREE.BoxGeometry(1.6, 0.16, 0.42);
    const conveyorEdges = new THREE.EdgesGeometry(conveyorGeom);
    const conveyor = new THREE.LineSegments(conveyorEdges, lineMaterial);
    conveyor.position.y = -0.36;
    machineGroup.add(conveyor);

    const rotorGeom = new THREE.TorusGeometry(0.24, 0.05, 10, 22);
    const rotorEdges = new THREE.EdgesGeometry(rotorGeom);
    const rotorMaterial = new THREE.LineBasicMaterial({ color: palette.secondary, transparent: true, opacity: 1 });
    const rotor = new THREE.LineSegments(rotorEdges, rotorMaterial);
    rotor.position.set(-0.55, 0.08, 0.2);
    rotor.rotation.x = Math.PI / 2;
    machineGroup.add(rotor);

    scene.add(machineGroup);
    machineGroup.rotation.x = -0.2;
    machineGroup.rotation.y = -0.7;
    camera.position.z = 4.4;

    function animate() {
        requestAnimationFrame(animate);
        const time = performance.now() * 0.001;

        if (machine.severity === 'NORMAL') {
            rotor.rotation.z += 0.13;
            machineGroup.position.y = Math.sin(time * 2.4) * 0.02;
        } else if (machine.severity === 'STANDBY') {
            rotor.rotation.z += 0.03;
            machineGroup.rotation.z = Math.sin(time * 0.8) * 0.03;
        } else {
            rotor.rotation.z += 0.05;
            rotor.material.opacity = Math.sin(time * (machine.severity === 'CRITICAL' ? 7 : 4)) > 0 ? 1 : 0.22;
            machineGroup.position.x = machine.severity === 'CRITICAL' ? (Math.random() - 0.5) * 0.03 : Math.sin(time * 1.6) * 0.02;
        }

        machineGroup.rotation.y += 0.004;
        renderer.render(scene, camera);
    }

    animate();
}

function renderDashboard(payload) {
    const container = document.getElementById('factory-content');
    if (!container) {
        return;
    }

    const allMachines = flattenMachines(payload.departments, payload.thresholds);
    const filteredMachines = allMachines.filter((machine) => currentZone === 'ALL' || machine.department === currentZone);
    const trendMachines = currentZone === 'ALL' ? allMachines : filteredMachines;
    const selectedTrendMachine = resolveTrendMachine(trendMachines);

    container.innerHTML = `
        <div class="dashboard-stack">
            ${renderOverview(filteredMachines)}
            <div class="surface-grid">
                ${renderZoneSummary(currentZone === 'ALL' ? allMachines : filteredMachines)}
                ${renderAlerts(filteredMachines)}
            </div>
            ${renderTrendSection(trendMachines, selectedTrendMachine)}
            ${renderSection('Process Operations', 'Primary machines responsible for forming, machining, and core process flow.', filteredMachines.filter((machine) => machine.category === 'PROCESS'))}
            ${renderSection('Packaging and QC', 'Downstream assets for sortation, inspection, labeling, and shipment readiness.', filteredMachines.filter((machine) => machine.category === 'PACKING'))}
        </div>
    `;

    filteredMachines.forEach((machine) => init3D(`3d-${machine.id}`, machine));
    bindTrendControls();
    bindTrendTooltip();
}

function flattenMachines(departments, defaultThresholds) {
    return departments.flatMap((department) => department.data.map((machine) => {
        const thresholds = machine.thresholds || defaultThresholds || getDefaultThresholds();
        const severity = deriveSeverity(machine, thresholds);
        return {
            ...machine,
            department: department.department,
            departmentLabel: department.label,
            thresholds,
            severity,
            category: machine.id >= 'M07' ? 'PACKING' : 'PROCESS'
        };
    }));
}

function resolveTrendMachine(machines) {
    const selected = machines.find((machine) => machine.id === currentTrendMachineId);
    if (selected) {
        return selected;
    }

    const fallback = [...machines].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0] || null;
    currentTrendMachineId = fallback ? fallback.id : null;
    return fallback;
}

function deriveSeverity(machine, thresholds) {
    if (machine.severity) {
        return machine.severity;
    }

    if (machine.status === 'STOP') {
        return 'CRITICAL';
    }

    const current = toNumber(machine.metrics.current);
    const vibration = toNumber(machine.metrics.vibration);
    const load = toNumber(machine.metrics.amp_load);

    if (current >= thresholds.current.critical || vibration >= thresholds.vibration.critical || load >= thresholds.amp_load.critical) {
        return 'CRITICAL';
    }
    if (current >= thresholds.current.warning || vibration >= thresholds.vibration.warning || load >= thresholds.amp_load.warning) {
        return 'WARNING';
    }
    if (machine.status === 'IDLE') {
        return 'STANDBY';
    }
    return 'NORMAL';
}

function renderOverview(machines) {
    const total = machines.length;
    const normal = machines.filter((machine) => machine.severity === 'NORMAL').length;
    const standby = machines.filter((machine) => machine.severity === 'STANDBY').length;
    const warning = machines.filter((machine) => machine.severity === 'WARNING').length;
    const critical = machines.filter((machine) => machine.severity === 'CRITICAL').length;
    const avgLoad = averageBy(machines, (machine) => toNumber(machine.metrics.amp_load));
    const health = averageBy(machines, (machine) => getHealthScore(machine));

    return `
        <section class="overview-grid">
            ${renderStatCard('Connected assets', total, `${normal} normal state`, 'var(--accent-strong)')}
            ${renderStatCard('Standby and watch', `${standby + warning}`, warning > 0 ? `${warning} warning by KPI` : `${standby} standby`, warning > 0 ? 'var(--warning)' : 'var(--accent-warm)')}
            ${renderStatCard('Critical assets', critical, critical > 0 ? 'Immediate response recommended' : 'No critical issue', critical > 0 ? 'var(--danger)' : 'var(--success)')}
            ${renderStatCard('Health index', `${Math.round(health)}/100`, `Average load ${Math.round(avgLoad)}%`, health >= 80 ? 'var(--success)' : 'var(--accent-warm)')}
        </section>
    `;
}

function renderStatCard(label, value, delta, accent) {
    return `
        <article class="stat-card">
            <span class="stat-label">${label}</span>
            <strong class="stat-value">${value}</strong>
            <span class="stat-delta" style="color: ${accent};">${delta}</span>
        </article>
    `;
}
function renderZoneSummary(machines) {
    const zoneMap = groupBy(machines, (machine) => machine.department);
    const cards = Object.keys(zoneMap).sort().map((zone) => {
        const zoneMachines = zoneMap[zone];
        const normalCount = zoneMachines.filter((machine) => machine.severity === 'NORMAL').length;
        const avgLoad = Math.round(averageBy(zoneMachines, (machine) => toNumber(machine.metrics.amp_load)));
        const avgVibration = averageBy(zoneMachines, (machine) => toNumber(machine.metrics.vibration)).toFixed(1);
        const zoneSeverity = getAggregateSeverity(zoneMachines);
        const trendClass = zoneSeverity === 'CRITICAL' ? 'trend-bad' : zoneSeverity === 'WARNING' ? 'trend-warn' : 'trend-good';
        const trendLabel = zoneSeverity === 'CRITICAL' ? 'Escalation' : zoneSeverity === 'WARNING' ? 'Watch closely' : 'On target';

        return `
            <article class="zone-card">
                <div class="zone-head">
                    <div>
                        <span class="zone-label">${zone}</span>
                        <div class="zone-value">${normalCount}/${zoneMachines.length}</div>
                    </div>
                    <span class="machine-status ${severityClass(zoneSeverity)}">${trendLabel}</span>
                </div>
                <div class="zone-stat">
                    <div class="zone-trend">
                        <span class="metric-label">Load utilization</span>
                        <strong class="${trendClass}">${avgLoad}%</strong>
                    </div>
                    <div class="progress-track"><div class="progress-bar" style="width: ${avgLoad}%; background: ${getLoadColor(avgLoad)};"></div></div>
                </div>
                <div class="zone-stat">
                    <div class="zone-trend">
                        <span class="metric-label">Vibration trend</span>
                        <strong class="${trendClass}">${avgVibration} mm/s</strong>
                    </div>
                    <div class="progress-track"><div class="progress-bar" style="width: ${Math.min(100, Math.round((Number(avgVibration) / 3) * 100))}%; background: ${getVibrationColor(Number(avgVibration))};"></div></div>
                </div>
            </article>
        `;
    }).join('');

    return `
        <section class="surface-card">
            <h3>Zone performance snapshot</h3>
            <div class="zone-grid">${cards}</div>
        </section>
    `;
}

function renderAlerts(machines) {
    const alerts = machines
        .filter((machine) => machine.severity === 'CRITICAL' || machine.severity === 'WARNING')
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || getHealthScore(a) - getHealthScore(b))
        .slice(0, 4);

    if (!alerts.length) {
        return `
            <aside class="alert-card">
                <h3>Attention queue</h3>
                <p class="alert-empty">No urgent machine exceptions detected. All KPI values are inside their live thresholds.</p>
            </aside>
        `;
    }

    const content = alerts.map((machine) => `
        <article class="alert-item ${severityClass(machine.severity)}">
            <div class="alert-head">
                <div>
                    <span class="alert-label">${machine.department} · ${machine.id}</span>
                    <div class="alert-title">${machine.name}</div>
                </div>
                <span class="alert-status ${severityClass(machine.severity)}">${machine.severity}</span>
            </div>
            <p class="alert-desc">${getAlertReasons(machine).join(' · ')}</p>
        </article>
    `).join('');

    return `
        <aside class="alert-card">
            <h3>Attention queue</h3>
            ${content}
        </aside>
    `;
}

function renderTrendSection(machines, machine) {
    if (!machine || !Array.isArray(machine.history) || !machine.history.length) {
        return '';
    }

    const avgLoad = Math.round(averageBy(machine.history, (point) => toNumber(point.metrics.amp_load)));
    const peakVibration = Math.max(...machine.history.map((point) => toNumber(point.metrics.vibration))).toFixed(1);
    const avgCurrent = averageBy(machine.history, (point) => toNumber(point.metrics.current)).toFixed(1);
    const options = machines.map((item) => `<option value="${item.id}" ${item.id === machine.id ? 'selected' : ''}>${item.department} · ${item.id} · ${item.name}</option>`).join('');

    return `
        <section class="trend-grid">
            <article class="trend-card">
                <div class="trend-header">
                    <div class="trend-header-main">
                        <div>
                            <h3>Hourly trend</h3>
                            <div class="trend-label">${machine.department} · ${machine.id} · ${machine.name}</div>
                        </div>
                        <div class="trend-controls">
                            <label class="trend-label" for="trend-machine-select">Selected asset</label>
                            <select id="trend-machine-select" class="trend-select">${options}</select>
                        </div>
                    </div>
                    <div class="trend-legend">
                        <span class="legend-item"><span class="legend-swatch legend-load"></span>Load</span>
                        <span class="legend-item"><span class="legend-swatch legend-vibration"></span>Vibration</span>
                        <span class="legend-item"><span class="legend-swatch legend-current"></span>Current</span>
                    </div>
                </div>
                <div class="trend-chart-frame">${buildTrendChart(machine.history)}</div>
            </article>
            <article class="trend-card">
                <h3>KPI interpretation</h3>
                <div class="trend-summary">
                    <div class="trend-stat">
                        <span class="trend-label">Average load</span>
                        <strong class="trend-value">${avgLoad}%</strong>
                    </div>
                    <div class="trend-stat">
                        <span class="trend-label">Peak vibration</span>
                        <strong class="trend-value">${peakVibration} mm/s</strong>
                    </div>
                    <div class="trend-stat">
                        <span class="trend-label">Average current</span>
                        <strong class="trend-value">${avgCurrent} A</strong>
                    </div>
                    <p class="trend-note">Severity colors on this dashboard now come from live KPI thresholds in the API. A machine can be marked warning or critical even before the base status changes to stop.</p>
                </div>
            </article>
        </section>
    `;
}

function buildTrendChart(history) {
    const width = 760;
    const height = 260;
    const padding = { top: 18, right: 24, bottom: 42, left: 32 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const getX = (index) => padding.left + (history.length === 1 ? innerWidth / 2 : (index / (history.length - 1)) * innerWidth);
    const getY = (value, max) => padding.top + innerHeight - ((value / max) * innerHeight);
    const buildPath = (values, max) => values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${getX(index).toFixed(1)} ${getY(value, max).toFixed(1)}`).join(' ');

    const loadValues = history.map((point) => toNumber(point.metrics.amp_load));
    const vibrationValues = history.map((point) => (toNumber(point.metrics.vibration) / 3) * 100);
    const currentValues = history.map((point) => (toNumber(point.metrics.current) / 20) * 100);

    const gridLines = [0, 25, 50, 75, 100].map((tick) => {
        const y = getY(tick, 100).toFixed(1);
        return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
    }).join('');

    const xLabels = history.map((point, index) => `<text class="chart-axis-label" x="${getX(index).toFixed(1)}" y="${height - 12}" text-anchor="middle">${point.hour}</text>`).join('');
    const points = (series, values, max, pointClass) => values.map((value, index) => {
        const cx = getX(index).toFixed(1);
        const cy = getY(value, max).toFixed(1);
        return `<g><circle class="${pointClass} chart-point" cx="${cx}" cy="${cy}" r="4"></circle><circle class="chart-point-hit" cx="${cx}" cy="${cy}" r="12" data-hour="${history[index].hour}" data-series="${series}" data-value="${series === 'Load' ? history[index].metrics.amp_load + '%' : series === 'Vibration' ? history[index].metrics.vibration + ' mm/s' : history[index].metrics.current + ' A'}"></circle></g>`;
    }).join('');

    return `
        <svg class="trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Hourly KPI trend chart">
            ${gridLines}
            <path class="chart-path-load" d="${buildPath(loadValues, 100)}"></path>
            <path class="chart-path-vibration" d="${buildPath(vibrationValues, 100)}"></path>
            <path class="chart-path-current" d="${buildPath(currentValues, 100)}"></path>
            ${points('Load', loadValues, 100, 'chart-point-load')}
            ${points('Vibration', vibrationValues, 100, 'chart-point-vibration')}
            ${points('Current', currentValues, 100, 'chart-point-current')}
            ${xLabels}
        </svg>
        <div class="chart-tooltip" id="chart-tooltip"></div>
    `;
}

function bindTrendControls() {
    const trendSelect = document.getElementById('trend-machine-select');
    if (!trendSelect) {
        return;
    }

    trendSelect.addEventListener('change', (event) => {
        currentTrendMachineId = event.target.value;
        if (lastReceivedData) {
            renderDashboard(lastReceivedData);
        }
    });
}
function bindTrendTooltip() {
    const frame = document.querySelector('.trend-chart-frame');
    const tooltip = document.getElementById('chart-tooltip');
    if (!frame || !tooltip) {
        return;
    }

    frame.querySelectorAll('.chart-point-hit').forEach((point) => {
        point.addEventListener('mousemove', (event) => {
            const frameRect = frame.getBoundingClientRect();
            const left = Math.min(frame.clientWidth - 160, Math.max(12, event.clientX - frameRect.left + 12));
            const top = Math.max(12, event.clientY - frameRect.top - 54);
            tooltip.innerHTML = `<strong>${point.dataset.series}</strong><span>${point.dataset.hour}</span><span>${point.dataset.value}</span>`;
            tooltip.style.display = 'block';
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });

        point.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}

function renderSection(title, caption, machines) {
    if (!machines.length) {
        return '';
    }

    const cards = machines.map((machine) => renderMachineCard(machine)).join('');
    return `
        <section class="section-block">
            <div class="section-title">
                <span>${title}</span>
                <span class="section-caption">${caption}</span>
            </div>
            <div class="machine-grid">${cards}</div>
        </section>
    `;
}

function renderMachineCard(machine) {
    const load = toNumber(machine.metrics.amp_load);
    const health = getHealthScore(machine);
    const healthClass = health >= 80 ? 'health-good' : health >= 60 ? 'health-watch' : 'health-risk';
    const healthLabel = health >= 80 ? 'Stable' : health >= 60 ? 'Observe' : 'At risk';
    const isCritical = machine.id === 'M09' && machine.severity === 'CRITICAL';

    return `
        <article class="machine-card ${severityClass(machine.severity)} ${statusClass(machine.status)}">
            <div class="machine-header">
                <div>
                    <span class="machine-id">${machine.department} · ${machine.id}</span>
                    <h3 class="machine-name">${machine.name}</h3>
                    <div class="machine-meta">${machine.category === 'PROCESS' ? 'Process asset' : 'Packaging asset'} · ${machine.departmentLabel || 'Digital twin monitoring'}</div>
                </div>
                <span class="machine-status ${severityClass(machine.severity)}">${machine.severity}</span>
            </div>

            <div class="machine-chips">
                <span class="machine-chip">Current ${machine.metrics.current} A</span>
                <span class="machine-chip">Vibration ${machine.metrics.vibration} mm/s</span>
                <span class="machine-chip">Load ${machine.metrics.amp_load}%</span>
            </div>

            <div id="3d-${machine.id}" class="machine-3d-viewport">
                ${isCritical ? '<div class="alarm-overlay">Critical KPI breach detected on shaft-bearing module</div>' : ''}
            </div>

            <div class="machine-kpis">
                <div class="machine-kpi">
                    <span class="metric-label">Energy draw</span>
                    <strong class="metric-value">${machine.metrics.current}</strong>
                    <span class="metric-label">Warning ${machine.thresholds.current.warning} A · Critical ${machine.thresholds.current.critical} A</span>
                </div>
                <div class="machine-kpi">
                    <span class="metric-label">Condition signal</span>
                    <strong class="metric-value">${machine.metrics.vibration}</strong>
                    <span class="metric-label">Warning ${machine.thresholds.vibration.warning} · Critical ${machine.thresholds.vibration.critical}</span>
                </div>
            </div>

            <div class="machine-footer">
                <div>
                    <div class="metric-inline">
                        <span class="metric-label">Utilization</span>
                        <strong>${load}%</strong>
                    </div>
                    <div class="progress-track"><div class="progress-bar" style="width: ${load}%; background: ${getLoadColor(load)};"></div></div>
                </div>
                <div class="health-row">
                    <div>
                        <span class="metric-label">Health score</span>
                        <div class="health-score">${Math.round(health)}/100</div>
                    </div>
                    <span class="health-tag ${healthClass}">${healthLabel}</span>
                </div>
            </div>
        </article>
    `;
}

function getSeverityPalette(severity) {
    if (severity === 'CRITICAL') {
        return { primary: 0xef4444, secondary: 0xfca5a5 };
    }
    if (severity === 'WARNING') {
        return { primary: 0xf59e0b, secondary: 0xfcd34d };
    }
    if (severity === 'STANDBY') {
        return { primary: 0xeab308, secondary: 0xfef08a };
    }
    return { primary: 0x22c55e, secondary: 0x86efac };
}

function getHealthScore(machine) {
    const load = toNumber(machine.metrics.amp_load);
    const vibration = toNumber(machine.metrics.vibration);
    const current = toNumber(machine.metrics.current);
    let score = 100;

    if (machine.severity === 'CRITICAL') {
        score -= 40;
    } else if (machine.severity === 'WARNING') {
        score -= 20;
    } else if (machine.severity === 'STANDBY') {
        score -= 10;
    }

    if (load > machine.thresholds.amp_load.critical) {
        score -= 18;
    } else if (load > machine.thresholds.amp_load.warning) {
        score -= 10;
    }

    if (vibration > machine.thresholds.vibration.critical) {
        score -= 22;
    } else if (vibration > machine.thresholds.vibration.warning) {
        score -= 10;
    }

    if (current > machine.thresholds.current.critical) {
        score -= 15;
    } else if (current > machine.thresholds.current.warning) {
        score -= 8;
    }

    return Math.max(18, score);
}

function getLoadColor(load) {
    if (load > 92) {
        return 'linear-gradient(90deg, #fb7185, #ef4444)';
    }
    if (load > 82) {
        return 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    }
    return 'linear-gradient(90deg, #2dd4bf, #60a5fa)';
}

function getVibrationColor(vibration) {
    if (vibration > 2.4) {
        return 'linear-gradient(90deg, #fb7185, #ef4444)';
    }
    if (vibration > 1.8) {
        return 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    }
    return 'linear-gradient(90deg, #22c55e, #2dd4bf)';
}
function getAggregateSeverity(machines) {
    if (machines.some((machine) => machine.severity === 'CRITICAL')) {
        return 'CRITICAL';
    }
    if (machines.some((machine) => machine.severity === 'WARNING')) {
        return 'WARNING';
    }
    if (machines.some((machine) => machine.severity === 'STANDBY')) {
        return 'STANDBY';
    }
    return 'NORMAL';
}

function getAlertReasons(machine) {
    const reasons = [];
    if (machine.status === 'STOP') {
        reasons.push('Machine stopped unexpectedly');
    }
    if (toNumber(machine.metrics.current) >= machine.thresholds.current.warning) {
        reasons.push(`Current ${machine.metrics.current} A`);
    }
    if (toNumber(machine.metrics.vibration) >= machine.thresholds.vibration.warning) {
        reasons.push(`Vibration ${machine.metrics.vibration} mm/s`);
    }
    if (toNumber(machine.metrics.amp_load) >= machine.thresholds.amp_load.warning) {
        reasons.push(`Load ${machine.metrics.amp_load}%`);
    }
    return reasons;
}

function statusClass(status) {
    return `status-${status.toLowerCase()}`;
}

function severityClass(severity) {
    return `severity-${severity.toLowerCase()}`;
}

function severityRank(severity) {
    const order = { NORMAL: 0, STANDBY: 1, WARNING: 2, CRITICAL: 3 };
    return order[severity] || 0;
}

function toNumber(value) {
    return Number.parseFloat(value) || 0;
}

function averageBy(items, selector) {
    if (!items.length) {
        return 0;
    }
    return items.reduce((sum, item) => sum + selector(item), 0) / items.length;
}

function groupBy(items, selector) {
    return items.reduce((acc, item) => {
        const key = selector(item);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});
}

function getDefaultThresholds() {
    return {
        current: { warning: 16.5, critical: 18.0 },
        vibration: { warning: 1.8, critical: 2.4 },
        amp_load: { warning: 82, critical: 92 }
    };
}

function buildHistory(base, status) {
    const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
    return hours.map((hour, index) => {
        if (status === 'STOP') {
            return {
                hour,
                metrics: {
                    current: Math.max(0, +(5 - index).toFixed(1)),
                    vibration: Math.max(0, +(0.5 - index * 0.06).toFixed(1)),
                    amp_load: Math.max(0, 18 - index * 3)
                }
            };
        }

        if (status === 'IDLE') {
            return {
                hour,
                metrics: {
                    current: +(base.current + ((index % 3) * 0.3)).toFixed(1),
                    vibration: +(base.vibration + ((index % 2) * 0.1)).toFixed(1),
                    amp_load: Math.min(28, base.amp_load + (index % 2 === 0 ? 4 : -2))
                }
            };
        }

        const wave = Math.sin((index + 1) * 0.85);
        return {
            hour,
            metrics: {
                current: +(base.current + wave * 1.2).toFixed(1),
                vibration: +(base.vibration + ((wave + 1) * 0.28)).toFixed(1),
                amp_load: Math.round(Math.max(55, Math.min(99, base.amp_load + wave * 7)))
            }
        };
    });
}

function generateMockPayload() {
    const thresholds = getDefaultThresholds();
    const departments = [
        {
            department: 'ZONE A',
            label: 'Production Department',
            data: [
                { id: 'M01', name: 'Hydraulic Press 01', status: 'RUNNING', base: { current: 15.2, vibration: 1.2, amp_load: 85 } },
                { id: 'M02', name: 'Hydraulic Press 02', status: 'RUNNING', base: { current: 14.8, vibration: 1.1, amp_load: 82 } },
                { id: 'M03', name: 'Conveyor Line A1', status: 'RUNNING', base: { current: 12.5, vibration: 0.8, amp_load: 75 } }
            ]
        },
        {
            department: 'ZONE B',
            label: 'Machining Department',
            data: [
                { id: 'M04', name: 'CNC Milling 01', status: 'IDLE', base: { current: 2.1, vibration: 0.2, amp_load: 15 } },
                { id: 'M05', name: 'CNC Milling 02', status: 'RUNNING', base: { current: 18.5, vibration: 2.1, amp_load: 92 } },
                { id: 'M06', name: 'Lathe Machine 01', status: 'RUNNING', base: { current: 16.2, vibration: 1.5, amp_load: 88 } }
            ]
        },
        {
            department: 'ZONE C',
            label: 'QC and Packaging',
            data: [
                { id: 'M07', name: 'Auto Sorter 01', status: 'RUNNING', base: { current: 11.2, vibration: 0.9, amp_load: 70 } },
                { id: 'M08', name: 'Packing Robot 01', status: 'RUNNING', base: { current: 13.4, vibration: 1.2, amp_load: 78 } },
                { id: 'M09', name: 'Labeling Unit 01', status: 'STOP', base: { current: 0.0, vibration: 0.0, amp_load: 0 } }
            ]
        }
    ];

    return {
        timestamp: new Date().toISOString(),
        shift_mode: currentShiftMode,
        thresholds,
        departments: departments.map((department) => ({
            department: department.department,
            label: department.label,
            data: department.data.map((machine) => {
                const history = buildHistory(machine.base, machine.status);
                const latest = history[history.length - 1].metrics;
                return {
                    id: machine.id,
                    name: machine.name,
                    status: machine.status,
                    metrics: {
                        current: latest.current.toFixed(1),
                        vibration: latest.vibration.toFixed(1),
                        amp_load: latest.amp_load
                    },
                    thresholds,
                    history
                };
            })
        }))
    };
}

updateViewCopy();
setShiftMode(currentShiftMode);
fetchStatus();
setInterval(fetchStatus, 3000);
