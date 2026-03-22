// FootLogic V2 - Admin Charts (Chart.js)
// Loaded on analytics.html after ANALYTICS data object is defined

document.addEventListener('DOMContentLoaded', () => {
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const labelColor = isDark ? '#94a3b8' : '#64748b';

    const defaults = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: labelColor, font: { size: 12 } } } }
    };

    // ─── 1. Member Growth Line Chart ───────────────────────────────
    const growthCtx = document.getElementById('memberGrowthChart');
    if (growthCtx && ANALYTICS.memberGrowth.labels.length) {
        new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: ANALYTICS.memberGrowth.labels,
                datasets: [{
                    label: 'Nouveaux membres',
                    data: ANALYTICS.memberGrowth.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.12)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                ...defaults,
                scales: {
                    x: { ticks: { color: labelColor, maxRotation: 45 }, grid: { color: gridColor } },
                    y: { ticks: { color: labelColor, precision: 0 }, grid: { color: gridColor }, beginAtZero: true }
                },
                plugins: { ...defaults.plugins, legend: { display: false } }
            }
        });
    } else if (growthCtx) {
        growthCtx.closest('div').innerHTML +=
            '<p class="text-center text-sm text-slate-400 mt-4">Aucune donnée de croissance sur 90 jours</p>';
    }

    // ─── 2. Members by Role Donut ───────────────────────────────────
    const roleCtx = document.getElementById('membersByRoleChart');
    if (roleCtx) {
        const roleColors = ['#1e40af','#059669','#0ea5e9','#f59e0b','#ef4444'];
        new Chart(roleCtx, {
            type: 'doughnut',
            data: {
                labels: ANALYTICS.membersByRole.labels.map(l => capitalize(l)),
                datasets: [{
                    data: ANALYTICS.membersByRole.data,
                    backgroundColor: roleColors,
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                ...defaults,
                cutout: '65%',
                plugins: {
                    ...defaults.plugins,
                    legend: { position: 'right', labels: { color: labelColor, font: { size: 12 }, padding: 12 } }
                }
            }
        });
    }

    // ─── 3. Team Stats Bar Chart ────────────────────────────────────
    const teamCtx = document.getElementById('teamStatsChart');
    if (teamCtx && ANALYTICS.teamStats.labels.length) {
        new Chart(teamCtx, {
            type: 'bar',
            data: {
                labels: ANALYTICS.teamStats.labels,
                datasets: [
                    {
                        label: 'Joueurs',
                        data: ANALYTICS.teamStats.playerData,
                        backgroundColor: 'rgba(59,130,246,0.7)',
                        borderRadius: 4
                    },
                    {
                        label: 'Entraîneurs',
                        data: ANALYTICS.teamStats.coachData,
                        backgroundColor: 'rgba(16,185,129,0.7)',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                ...defaults,
                scales: {
                    x: { ticks: { color: labelColor }, grid: { display: false } },
                    y: { ticks: { color: labelColor, precision: 0 }, grid: { color: gridColor }, beginAtZero: true }
                }
            }
        });
    }

    // ─── 4. Engagement Donut ────────────────────────────────────────
    const engCtx = document.getElementById('engagementChart');
    if (engCtx) {
        new Chart(engCtx, {
            type: 'doughnut',
            data: {
                labels: ['Actifs (30j)', 'Inactifs'],
                datasets: [{
                    data: [ANALYTICS.engagement.active, ANALYTICS.engagement.inactive],
                    backgroundColor: ['#10b981', '#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                ...defaults,
                cutout: '70%',
                plugins: {
                    ...defaults.plugins,
                    legend: { position: 'bottom', labels: { color: labelColor, font: { size: 12 } } }
                }
            }
        });
    }

    function capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
    }
});
