<?php
header('Content-Type: application/json');

date_default_timezone_set('Asia/Bangkok');

$departments = [
    [
        'name' => 'ZONE A',
        'label' => 'Production Department',
        'machines' => [
            ['id' => 'M01', 'name' => 'Hydraulic Press 01', 'status' => 'RUNNING', 'base' => ['current' => 15.2, 'vibration' => 1.2, 'amp_load' => 85]],
            ['id' => 'M02', 'name' => 'Hydraulic Press 02', 'status' => 'RUNNING', 'base' => ['current' => 14.8, 'vibration' => 1.1, 'amp_load' => 82]],
            ['id' => 'M03', 'name' => 'Conveyor Line A1', 'status' => 'RUNNING', 'base' => ['current' => 12.5, 'vibration' => 0.8, 'amp_load' => 75]]
        ]
    ],
    [
        'name' => 'ZONE B',
        'label' => 'Machining Department',
        'machines' => [
            ['id' => 'M04', 'name' => 'CNC Milling 01', 'status' => 'IDLE', 'base' => ['current' => 2.1, 'vibration' => 0.2, 'amp_load' => 15]],
            ['id' => 'M05', 'name' => 'CNC Milling 02', 'status' => 'RUNNING', 'base' => ['current' => 18.5, 'vibration' => 2.1, 'amp_load' => 92]],
            ['id' => 'M06', 'name' => 'Lathe Machine 01', 'status' => 'RUNNING', 'base' => ['current' => 16.2, 'vibration' => 1.5, 'amp_load' => 88]]
        ]
    ],
    [
        'name' => 'ZONE C',
        'label' => 'QC and Packaging',
        'machines' => [
            ['id' => 'M07', 'name' => 'Auto Sorter 01', 'status' => 'RUNNING', 'base' => ['current' => 11.2, 'vibration' => 0.9, 'amp_load' => 70]],
            ['id' => 'M08', 'name' => 'Packing Robot 01', 'status' => 'RUNNING', 'base' => ['current' => 13.4, 'vibration' => 1.2, 'amp_load' => 78]],
            ['id' => 'M09', 'name' => 'Labeling Unit 01', 'status' => 'STOP', 'base' => ['current' => 0.0, 'vibration' => 0.0, 'amp_load' => 0]]
        ]
    ]
];

function get_default_thresholds() {
    return [
        'current' => ['warning' => 16.5, 'critical' => 18.0],
        'vibration' => ['warning' => 1.8, 'critical' => 2.4],
        'amp_load' => ['warning' => 82, 'critical' => 92]
    ];
}

function load_thresholds_from_config() {
    $configPath = __DIR__ . '/config/thresholds.json';
    $fallback = get_default_thresholds();

    if (!file_exists($configPath)) {
        return $fallback;
    }

    $json = file_get_contents($configPath);
    if ($json === false) {
        return $fallback;
    }

    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        return $fallback;
    }

    foreach ($fallback as $metric => $limits) {
        if (!isset($decoded[$metric]['warning']) || !isset($decoded[$metric]['critical'])) {
            return $fallback;
        }
    }

    return $decoded;
}

function clamp_value($value, $min, $max) {
    return max($min, min($max, $value));
}

function derive_severity($status, $metrics, $thresholds) {
    if ($status === 'STOP') {
        return 'CRITICAL';
    }

    $severity = 'NORMAL';
    foreach ($thresholds as $metric => $limits) {
        $value = $metrics[$metric];
        if ($value >= $limits['critical']) {
            return 'CRITICAL';
        }
        if ($value >= $limits['warning']) {
            $severity = 'WARNING';
        }
    }

    if ($status === 'IDLE' && $severity === 'NORMAL') {
        return 'STANDBY';
    }

    return $severity;
}

function generate_hourly_history($machine, $thresholds) {
    $history = [];
    $hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
    $base = $machine['base'];

    foreach ($hours as $index => $hour) {
        if ($machine['status'] === 'STOP') {
            $load = max(0, 18 - ($index * 3));
            $current = $index < 5 ? max(0, 6 - $index) : 0;
            $vibration = $index < 5 ? max(0, 0.5 - ($index * 0.08)) : 0;
        } elseif ($machine['status'] === 'IDLE') {
            $load = clamp_value($base['amp_load'] + (($index % 2 === 0) ? 4 : -3), 8, 28);
            $current = clamp_value($base['current'] + (($index % 3) * 0.3), 0.8, 4.5);
            $vibration = clamp_value($base['vibration'] + (($index % 2) * 0.1), 0.1, 0.6);
        } else {
            $wave = sin(($index + 1) * 0.85);
            $load = clamp_value($base['amp_load'] + ($wave * 7) + (($machine['id'] === 'M05') ? 5 : 0), 55, 99);
            $current = clamp_value($base['current'] + ($wave * 1.2), 8, 20);
            $vibration = clamp_value($base['vibration'] + (($wave + 1) * 0.28), 0.5, 3.1);
        }

        $pointMetrics = [
            'current' => round($current, 1),
            'vibration' => round($vibration, 1),
            'amp_load' => (int) round($load)
        ];

        $history[] = [
            'hour' => $hour,
            'metrics' => $pointMetrics,
            'severity' => derive_severity($machine['status'], $pointMetrics, $thresholds)
        ];
    }

    return $history;
}

$thresholds = load_thresholds_from_config();
$responseDepartments = [];

foreach ($departments as $department) {
    $departmentData = [
        'department' => $department['name'],
        'label' => $department['label'],
        'data' => []
    ];

    foreach ($department['machines'] as $machine) {
        $history = generate_hourly_history($machine, $thresholds);
        $latestMetrics = end($history)['metrics'];
        $severity = derive_severity($machine['status'], $latestMetrics, $thresholds);
        $departmentData['data'][] = [
            'id' => $machine['id'],
            'name' => $machine['name'],
            'status' => $machine['status'],
            'severity' => $severity,
            'metrics' => [
                'current' => number_format($latestMetrics['current'], 1),
                'vibration' => number_format($latestMetrics['vibration'], 1),
                'amp_load' => $latestMetrics['amp_load']
            ],
            'thresholds' => $thresholds,
            'history' => $history
        ];
    }

    $responseDepartments[] = $departmentData;
}

$response = [
    'timestamp' => date(DATE_ATOM),
    'shift_mode' => ((int) date('G') >= 6 && (int) date('G') < 18) ? 'day' : 'night',
    'thresholds' => $thresholds,
    'departments' => $responseDepartments
];

echo json_encode($response);
?>
