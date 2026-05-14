/**
 * Afrischool Early Warning System
 * Risk Detection Engine - Research Demo Version
 * 
 * WARNING: This is a research prototype. Not validated for production use.
 * All student data is synthetic. Do not use with real student data.
 */

// ============================================
// RISK CONFIGURATION
// ============================================

const RISK_WEIGHTS = {
    ATTENDANCE: 35,
    ACADEMIC_PERFORMANCE: 40,
    FEE_BALANCE: 15,
    DECLINING_TREND: 10
};

let THRESHOLDS = {
    DROPOUT_HIGH_RISK: 70,
    DROPOUT_MEDIUM_RISK: 45,
    ACADEMIC_WEAKNESS: 60,
    ATTENDANCE_CRITICAL: 50,
    ATTENDANCE_WARNING: 70,
    FEE_BALANCE_CRITICAL: 80,
    DECLINING_GRADES: 10
};

// ============================================
// ML API CONFIGURATION
// ============================================

let ML_API_URL = '';
let mlCache = new Map();

// ============================================
// SYNTHETIC STUDENT DATA (No real identifiers)
// ============================================

const syntheticStudents = [
    {
        id: 'SYN001',
        name: 'Learner A',
        className: 'Class A',
        attendanceRate: 45,
        academicAverage: 38,
        feePaymentRate: 25,
        subjectsOfConcern: ['Mathematics', 'Language Arts', 'Science'],
        previousAverage: 52
    },
    {
        id: 'SYN002',
        name: 'Learner B',
        className: 'Class A',
        attendanceRate: 68,
        academicAverage: 55,
        feePaymentRate: 70,
        subjectsOfConcern: ['Mathematics'],
        previousAverage: 58
    },
    {
        id: 'SYN003',
        name: 'Learner C',
        className: 'Class A',
        attendanceRate: 92,
        academicAverage: 78,
        feePaymentRate: 95,
        subjectsOfConcern: [],
        previousAverage: 75
    },
    {
        id: 'SYN004',
        name: 'Learner D',
        className: 'Class B',
        attendanceRate: 35,
        academicAverage: 42,
        feePaymentRate: 15,
        subjectsOfConcern: ['Mathematics', 'Language Arts', 'Science', 'Social Studies'],
        previousAverage: 48
    },
    {
        id: 'SYN005',
        name: 'Learner E',
        className: 'Class B',
        attendanceRate: 72,
        academicAverage: 61,
        feePaymentRate: 50,
        subjectsOfConcern: ['Science'],
        previousAverage: 59
    },
    {
        id: 'SYN006',
        name: 'Learner F',
        className: 'Class C',
        attendanceRate: 55,
        academicAverage: 48,
        feePaymentRate: 30,
        subjectsOfConcern: ['Mathematics', 'Physics'],
        previousAverage: 54
    },
    {
        id: 'SYN007',
        name: 'Learner G',
        className: 'Class C',
        attendanceRate: 88,
        academicAverage: 71,
        feePaymentRate: 85,
        subjectsOfConcern: [],
        previousAverage: 68
    },
    {
        id: 'SYN008',
        name: 'Learner H',
        className: 'Class D',
        attendanceRate: 42,
        academicAverage: 39,
        feePaymentRate: 20,
        subjectsOfConcern: ['Mathematics', 'Physics', 'Chemistry'],
        previousAverage: 46
    },
    {
        id: 'SYN009',
        name: 'Learner I',
        className: 'Class D',
        attendanceRate: 78,
        academicAverage: 65,
        feePaymentRate: 60,
        subjectsOfConcern: ['Chemistry'],
        previousAverage: 63
    },
    {
        id: 'SYN010',
        name: 'Learner J',
        className: 'Class D',
        attendanceRate: 60,
        academicAverage: 52,
        feePaymentRate: 45,
        subjectsOfConcern: ['Mathematics', 'Language Arts'],
        previousAverage: 56
    },
    {
        id: 'SYN011',
        name: 'Learner K',
        className: 'Class D',
        attendanceRate: 85,
        academicAverage: 74,
        feePaymentRate: 90,
        subjectsOfConcern: [],
        previousAverage: 71
    },
    {
        id: 'SYN012',
        name: 'Learner L',
        className: 'Class D',
        attendanceRate: 48,
        academicAverage: 44,
        feePaymentRate: 10,
        subjectsOfConcern: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
        previousAverage: 50
    }
];

let allStudents = [...syntheticStudents];
let currentRiskAssessments = [];

// ============================================
// RISK ANALYSIS FUNCTIONS
// ============================================

function calculateDeclineTrend(student) {
    if (student.previousAverage && student.academicAverage) {
        const decline = student.previousAverage - student.academicAverage;
        const declinePercent = (decline / student.previousAverage) * 100;
        return Math.min(RISK_WEIGHTS.DECLINING_TREND, declinePercent);
    }
    return 0;
}

function analyzeStudent(student) {
    let riskScore = 0;
    let riskBreakdown = {};
    let interventions = [];
    let subjectsOfConcern = [];
    
    // 1. Attendance Risk (35%)
    let attendanceScore = 0;
    if (student.attendanceRate <= THRESHOLDS.ATTENDANCE_CRITICAL) {
        attendanceScore = RISK_WEIGHTS.ATTENDANCE;
        interventions.push({
            type: 'attendance',
            severity: 'critical',
            message: `Attendance is ${student.attendanceRate}% (critical threshold: ${THRESHOLDS.ATTENDANCE_CRITICAL}%). Schedule parent meeting.`
        });
    } else if (student.attendanceRate <= THRESHOLDS.ATTENDANCE_WARNING) {
        attendanceScore = RISK_WEIGHTS.ATTENDANCE * 0.6;
        interventions.push({
            type: 'attendance',
            severity: 'warning',
            message: `Attendance is ${student.attendanceRate}% (warning threshold: ${THRESHOLDS.ATTENDANCE_WARNING}%). Send notification.`
        });
    }
    riskScore += attendanceScore;
    riskBreakdown.attendance = attendanceScore;
    
    // 2. Academic Performance Risk (40%)
    let academicScore = 0;
    if (student.academicAverage <= 30) {
        academicScore = RISK_WEIGHTS.ACADEMIC_PERFORMANCE;
        interventions.push({
            type: 'academic',
            severity: 'critical',
            message: `Academic average is ${student.academicAverage}%. Immediate tutoring recommended.`
        });
    } else if (student.academicAverage <= 50) {
        academicScore = RISK_WEIGHTS.ACADEMIC_PERFORMANCE * 0.75;
        interventions.push({
            type: 'academic',
            severity: 'warning',
            message: `Academic average is ${student.academicAverage}%. Consider remedial support.`
        });
    } else if (student.academicAverage <= 65) {
        academicScore = RISK_WEIGHTS.ACADEMIC_PERFORMANCE * 0.35;
    }
    riskScore += academicScore;
    riskBreakdown.academic = academicScore;
    
    // Track subject concerns
    if (student.subjectsOfConcern && student.subjectsOfConcern.length > 0) {
        student.subjectsOfConcern.forEach(subject => {
            subjectsOfConcern.push({
                subject: subject,
                severity: student.academicAverage <= 40 ? 'critical' : 'moderate'
            });
        });
    }
    
    // 3. Fee Payment Risk (15%)
    let feeScore = 0;
    if (student.feePaymentRate <= 20) {
        feeScore = RISK_WEIGHTS.FEE_BALANCE;
        interventions.push({
            type: 'financial',
            severity: 'critical',
            message: `Fee payment is ${student.feePaymentRate}%. Financial counseling may be needed.`
        });
    } else if (student.feePaymentRate <= 50) {
        feeScore = RISK_WEIGHTS.FEE_BALANCE * 0.7;
        interventions.push({
            type: 'financial',
            severity: 'warning',
            message: `Fee payment is ${student.feePaymentRate}%. Send payment reminder.`
        });
    }
    riskScore += feeScore;
    riskBreakdown.fees = feeScore;
    
    // 4. Declining Trend (10%)
    const trendScore = calculateDeclineTrend(student);
    riskScore += trendScore;
    riskBreakdown.trend = trendScore;
    
    if (trendScore > 0) {
        interventions.push({
            type: 'academic',
            severity: 'warning',
            message: `Performance declined from ${student.previousAverage}% to ${student.academicAverage}%. Investigate causes.`
        });
    }
    
    // Calculate risk level
    let riskLevel = 'Low';
    if (riskScore >= THRESHOLDS.DROPOUT_HIGH_RISK) {
        riskLevel = 'High';
    } else if (riskScore >= THRESHOLDS.DROPOUT_MEDIUM_RISK) {
        riskLevel = 'Medium';
    }
    
    return {
        ...student,
        riskScore: Math.round(riskScore),
        riskLevel,
        riskBreakdown,
        subjectsOfConcern,
        interventions,
        lastUpdated: new Date().toISOString(),
        disclaimer: "Algorithmic suggestion - requires human review"
    };
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

let currentCharts = {};

function destroyChart(chartName) {
    if (currentCharts[chartName] && typeof currentCharts[chartName].destroy === 'function') {
        currentCharts[chartName].destroy();
        currentCharts[chartName] = null;
    }
}

function updateSummaryCards(assessments) {
    const highRisk = assessments.filter(a => a.riskLevel === 'High');
    const mediumRisk = assessments.filter(a => a.riskLevel === 'Medium');
    const studentsWithWeaknesses = assessments.filter(a => a.subjectsOfConcern && a.subjectsOfConcern.length > 0);
    const attendanceIssues = assessments.filter(a => 
        a.attendanceRate <= THRESHOLDS.ATTENDANCE_WARNING
    );
    
    const highRiskEl = document.getElementById('highRiskCount');
    const mediumRiskEl = document.getElementById('mediumRiskCount');
    const academicEl = document.getElementById('academicConcernCount');
    const attendanceEl = document.getElementById('attendanceAlertCount');
    
    if (highRiskEl) highRiskEl.textContent = highRisk.length;
    if (mediumRiskEl) mediumRiskEl.textContent = mediumRisk.length;
    if (academicEl) academicEl.textContent = studentsWithWeaknesses.length;
    if (attendanceEl) attendanceEl.textContent = attendanceIssues.length;
}

function updateRiskDistributionChart(assessments) {
    const canvas = document.getElementById('riskDistributionChart');
    if (!canvas) return;
    
    destroyChart('riskChart');
    
    const riskCounts = {
        'High': assessments.filter(a => a.riskLevel === 'High').length,
        'Medium': assessments.filter(a => a.riskLevel === 'Medium').length,
        'Low': assessments.filter(a => a.riskLevel === 'Low').length
    };
    
    const ctx = canvas.getContext('2d');
    
    currentCharts.riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [riskCounts.High, riskCounts.Medium, riskCounts.Low],
                backgroundColor: ['#e74c3c', '#f39c12', '#27ae60'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Risk Distribution' },
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateSubjectWeaknessChart(assessments) {
    const canvas = document.getElementById('subjectWeaknessChart');
    if (!canvas) return;
    
    destroyChart('subjectChart');
    
    const subjectWeaknesses = {};
    
    assessments.forEach(assessment => {
        if (assessment.subjectsOfConcern) {
            assessment.subjectsOfConcern.forEach(subject => {
                const subjectName = typeof subject === 'string' ? subject : subject.subject;
                subjectWeaknesses[subjectName] = (subjectWeaknesses[subjectName] || 0) + 1;
            });
        }
    });
    
    const subjects = Object.keys(subjectWeaknesses);
    
    if (subjects.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No subject weaknesses identified', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const counts = subjects.map(s => subjectWeaknesses[s]);
    const colors = subjects.map((_, i) => `hsl(${(i * 360 / subjects.length) % 360}, 70%, 55%)`);
    
    const ctx = canvas.getContext('2d');
    
    currentCharts.subjectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [{
                label: 'Students with Weakness',
                data: counts,
                backgroundColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Subject Weakness Distribution' } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function updateRiskTable(assessments) {
    const tbody = document.getElementById('riskTableBody');
    if (!tbody) return;
    
    if (assessments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No data available</td></tr>`;
        return;
    }
    
    let html = '';
    assessments.forEach((assessment, index) => {
        const riskColor = assessment.riskLevel === 'High' ? '#e74c3c' : 
                         assessment.riskLevel === 'Medium' ? '#f39c12' : '#27ae60';
        
        const attendanceColor = assessment.attendanceRate <= THRESHOLDS.ATTENDANCE_CRITICAL ? '#e74c3c' :
                                assessment.attendanceRate <= THRESHOLDS.ATTENDANCE_WARNING ? '#f39c12' : '#27ae60';
        
        const academicColor = assessment.academicAverage <= 50 ? '#e74c3c' :
                              assessment.academicAverage <= 65 ? '#f39c12' : '#27ae60';
        
        const subjectsHtml = assessment.subjectsOfConcern && assessment.subjectsOfConcern.length > 0
            ? assessment.subjectsOfConcern.map(s => {
                const subjectName = typeof s === 'string' ? s : s.subject;
                const severity = (typeof s === 'object' && s.severity) || 
                    (assessment.academicAverage <= 40 ? 'critical' : 'moderate');
                return `<span class="subject-badge severity-${severity}">${subjectName}</span>`;
              }).join(' ')
            : '<span class="text-success">✓ None</span>';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${assessment.name}</strong><br><small>${assessment.id}</small></td>
                <td>${assessment.className}</td>
                <td><span class="risk-score-badge" style="background:${riskColor}">${assessment.riskScore}</span></td>
                <td><span class="risk-badge risk-${assessment.riskLevel.toLowerCase()}">${assessment.riskLevel}</span></td>
                <td>
                    <div>📚 Acad: <span style="color:${academicColor}">${assessment.academicAverage}%</span></div>
                    <div>📅 Att: <span style="color:${attendanceColor}">${assessment.attendanceRate}%</span></div>
                    <div>💰 Fees: ${assessment.feePaymentRate}%</div>
                </td>
                <td>${subjectsHtml}</td>
                <td><button class="btn-sm btn-primary" onclick="viewStudentInterventions('${assessment.id}')">View</button></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function updateInterventionPanel(assessments, studentId = null) {
    const container = document.getElementById('interventionList');
    if (!container) return;
    
    let target = studentId ? assessments.find(a => a.id === studentId) : assessments.find(a => a.riskLevel === 'High');
    if (!target && assessments.length) target = assessments[0];
    if (!target) {
        container.innerHTML = '<p class="text-muted">Select a student to view suggestions</p>';
        return;
    }
    
    let html = `
        <div class="intervention-item">
            <h4>${target.name} (${target.className})</h4>
            <p><strong>Risk Level:</strong> ${target.riskLevel} (Score: ${target.riskScore})</p>
    `;
    
    if (target.interventions && target.interventions.length) {
        html += '<h5>Suggested Actions:</h5><ul>';
        target.interventions.forEach(i => {
            html += `<li class="intervention-${i.severity}"><strong>${i.type.toUpperCase()}:</strong> ${i.message}</li>`;
        });
        html += '</ul>';
    }
    
    html += `<div class="human-review-note"><i class="fas fa-users"></i> These are algorithmic suggestions. Please review with professional judgment.</div>`;
    html += `</div>`;
    container.innerHTML = html;
}

// ============================================
// DASHBOARD LOADER
// ============================================

async function loadDashboard() {
    showLoading(true, "Analyzing synthetic student data...");
    
    const selectedClass = document.getElementById('classFilter')?.value;
    let studentsToAnalyze = allStudents;
    if (selectedClass) {
        studentsToAnalyze = allStudents.filter(s => s.className === selectedClass);
    }
    
    if (studentsToAnalyze.length === 0) {
        const tbody = document.getElementById('riskTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center">No students in this class</td></tr>`;
        updateSummaryCards([]);
        showLoading(false);
        return;
    }
    
    const assessments = studentsToAnalyze.map(s => analyzeStudent(s));
    assessments.sort((a, b) => b.riskScore - a.riskScore);
    currentRiskAssessments = assessments;
    
    updateSummaryCards(assessments);
    updateRiskDistributionChart(assessments);
    updateSubjectWeaknessChart(assessments);
    updateRiskTable(assessments);
    updateInterventionPanel(assessments);
    
    showLoading(false);
    console.log(`Analyzed ${assessments.length} synthetic students`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showLoading(show, message = "Loading...") {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
        const msgEl = overlay.querySelector('p');
        if (msgEl) msgEl.textContent = message;
    }
}

function showToast(message, isError = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function exportRiskReport() {
    if (!currentRiskAssessments?.length) {
        showToast("No data to export", true);
        return;
    }
    
    let csv = "Student ID,Student Name,Class,Risk Level,Risk Score,Attendance %,Academic Avg %,Fee Payment %,Subjects\n";
    currentRiskAssessments.forEach(a => {
        const subjects = a.subjectsOfConcern?.map(s => typeof s === 'string' ? s : s.subject).join('; ') || '';
        csv += `${a.id},${a.name},${a.className},${a.riskLevel},${a.riskScore},${a.attendanceRate},${a.academicAverage},${a.feePaymentRate},"${subjects}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `early_warning_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report exported");
}

function saveRiskThresholds() {
    THRESHOLDS.DROPOUT_HIGH_RISK = parseInt(document.getElementById('dropoutHighRiskThreshold')?.value) || 70;
    THRESHOLDS.DROPOUT_MEDIUM_RISK = parseInt(document.getElementById('dropoutMediumRiskThreshold')?.value) || 45;
    THRESHOLDS.ACADEMIC_WEAKNESS = parseInt(document.getElementById('academicWeaknessThreshold')?.value) || 60;
    THRESHOLDS.ATTENDANCE_CRITICAL = parseInt(document.getElementById('attendanceCriticalThreshold')?.value) || 50;
    THRESHOLDS.ATTENDANCE_WARNING = parseInt(document.getElementById('attendanceWarningThreshold')?.value) || 70;
    
    const mlEndpoint = document.getElementById('mlApiEndpoint')?.value;
    ML_API_URL = mlEndpoint || '';
    
    showToast("Settings saved");
    loadDashboard();
}

function loadThresholdSettings() {
    const high = document.getElementById('dropoutHighRiskThreshold');
    const med = document.getElementById('dropoutMediumRiskThreshold');
    const acad = document.getElementById('academicWeaknessThreshold');
    const attCrit = document.getElementById('attendanceCriticalThreshold');
    const attWarn = document.getElementById('attendanceWarningThreshold');
    
    if (high) high.value = THRESHOLDS.DROPOUT_HIGH_RISK;
    if (med) med.value = THRESHOLDS.DROPOUT_MEDIUM_RISK;
    if (acad) acad.value = THRESHOLDS.ACADEMIC_WEAKNESS;
    if (attCrit) attCrit.value = THRESHOLDS.ATTENDANCE_CRITICAL;
    if (attWarn) attWarn.value = THRESHOLDS.ATTENDANCE_WARNING;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
    if (tabId === 'dashboard' && currentRiskAssessments) {
        setTimeout(() => {
            updateRiskDistributionChart(currentRiskAssessments);
            updateSubjectWeaknessChart(currentRiskAssessments);
        }, 200);
    }
}

function viewStudentInterventions(studentId) {
    if (currentRiskAssessments) {
        updateInterventionPanel(currentRiskAssessments, studentId);
    }
}

// ============================================
// INITIALIZATION
// ============================================

function setupEventListeners() {
    const classFilter = document.getElementById('classFilter');
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    const exportBtn = document.getElementById('exportReportBtn');
    const saveBtn = document.getElementById('saveThresholdsBtn');
    
    if (classFilter) classFilter.addEventListener('change', loadDashboard);
    if (refreshBtn) refreshBtn.addEventListener('click', loadDashboard);
    if (exportBtn) exportBtn.addEventListener('click', exportRiskReport);
    if (saveBtn) saveBtn.addEventListener('click', saveRiskThresholds);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

function initialize() {
    console.log("Afrischool Early Warning System - Research Demo");
    console.log("WARNING: This is a research prototype. Not for production use.");
    console.log(`Loaded ${allStudents.length} synthetic student records`);
    
    setupEventListeners();
    loadThresholdSettings();
    loadDashboard();
}

document.addEventListener('DOMContentLoaded', initialize);

// Global exports
window.viewStudentInterventions = viewStudentInterventions;
window.exportRiskReport = exportRiskReport;
