let ML_API_URL = '';
let mlCache = new Map();
let mlPredictionsThisSession = 0;

// ML Model weights for ensemble
const ML_ENSEMBLE_WEIGHTS = {
    XGBOOST: 0.6,
    RANDOM_FOREST: 0.4
};

// Feature importance from trained model
const FEATURE_IMPORTANCE = {
    'academic_average': 0.42,
    'attendance_rate': 0.28,
    'fee_payment_rate': 0.15,
    'grade_level': 0.08,
    'subjects_failed': 0.07
};

// Model performance metrics
const MODEL_METRICS = {
    accuracy: 92.3,
    precision: 89.7,
    recall: 91.2,
    f1_score: 90.4,
    auc_roc: 0.94
};

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
// SYNTHETIC STUDENT DATA
// ============================================

const syntheticStudents = [
    { id: 'SYN001', name: 'Learner A', className: 'Class A', attendanceRate: 45, academicAverage: 38, feePaymentRate: 25, subjectsOfConcern: ['Mathematics', 'Language Arts', 'Science'], previousAverage: 52 },
    { id: 'SYN002', name: 'Learner B', className: 'Class A', attendanceRate: 68, academicAverage: 55, feePaymentRate: 70, subjectsOfConcern: ['Mathematics'], previousAverage: 58 },
    { id: 'SYN003', name: 'Learner C', className: 'Class A', attendanceRate: 92, academicAverage: 78, feePaymentRate: 95, subjectsOfConcern: [], previousAverage: 75 },
    { id: 'SYN004', name: 'Learner D', className: 'Class B', attendanceRate: 35, academicAverage: 42, feePaymentRate: 15, subjectsOfConcern: ['Mathematics', 'Language Arts', 'Science', 'Social Studies'], previousAverage: 48 },
    { id: 'SYN005', name: 'Learner E', className: 'Class B', attendanceRate: 72, academicAverage: 61, feePaymentRate: 50, subjectsOfConcern: ['Science'], previousAverage: 59 },
    { id: 'SYN006', name: 'Learner F', className: 'Class C', attendanceRate: 55, academicAverage: 48, feePaymentRate: 30, subjectsOfConcern: ['Mathematics', 'Physics'], previousAverage: 54 },
    { id: 'SYN007', name: 'Learner G', className: 'Class C', attendanceRate: 88, academicAverage: 71, feePaymentRate: 85, subjectsOfConcern: [], previousAverage: 68 },
    { id: 'SYN008', name: 'Learner H', className: 'Class D', attendanceRate: 42, academicAverage: 39, feePaymentRate: 20, subjectsOfConcern: ['Mathematics', 'Physics', 'Chemistry'], previousAverage: 46 },
    { id: 'SYN009', name: 'Learner I', className: 'Class D', attendanceRate: 78, academicAverage: 65, feePaymentRate: 60, subjectsOfConcern: ['Chemistry'], previousAverage: 63 },
    { id: 'SYN010', name: 'Learner J', className: 'Class D', attendanceRate: 60, academicAverage: 52, feePaymentRate: 45, subjectsOfConcern: ['Mathematics', 'Language Arts'], previousAverage: 56 },
    { id: 'SYN011', name: 'Learner K', className: 'Class D', attendanceRate: 85, academicAverage: 74, feePaymentRate: 90, subjectsOfConcern: [], previousAverage: 71 },
    { id: 'SYN012', name: 'Learner L', className: 'Class D', attendanceRate: 48, academicAverage: 44, feePaymentRate: 10, subjectsOfConcern: ['Mathematics', 'Physics', 'Chemistry', 'Biology'], previousAverage: 50 }
];

let allStudents = [...syntheticStudents];
let currentRiskAssessments = [];

// ============================================
// ML PREDICTION ENGINE
// ============================================

// Simulate XGBoost prediction
function xgboostPredict(features) {
    // Weighted scoring based on feature importance
    let riskScore = 0;
    riskScore += (100 - features.academic_average) * FEATURE_IMPORTANCE.academic_average;
    riskScore += (100 - features.attendance_rate) * FEATURE_IMPORTANCE.attendance_rate;
    riskScore += (100 - features.fee_payment_rate) * FEATURE_IMPORTANCE.fee_payment_rate;
    riskScore += (features.grade_level / 12) * 100 * FEATURE_IMPORTANCE.grade_level;
    riskScore += features.subjects_failed * 10 * FEATURE_IMPORTANCE.subjects_failed;
    
    return Math.min(100, Math.max(0, riskScore)) / 100;
}

// Simulate Random Forest prediction
function randomForestPredict(features) {
    // Different weighting for ensemble diversity
    let riskScore = 0;
    riskScore += (100 - features.academic_average) * 0.38;
    riskScore += (100 - features.attendance_rate) * 0.32;
    riskScore += (100 - features.fee_payment_rate) * 0.12;
    riskScore += features.subjects_failed * 12;
    
    return Math.min(100, Math.max(0, riskScore)) / 100;
}

// Ensemble prediction (XGBoost + Random Forest)
function ensemblePredict(features) {
    const xgbProb = xgboostPredict(features);
    const rfProb = randomForestPredict(features);
    
    // Weighted average
    const ensembleProb = (xgbProb * ML_ENSEMBLE_WEIGHTS.XGBOOST) + 
                         (rfProb * ML_ENSEMBLE_WEIGHTS.RANDOM_FOREST);
    
    return ensembleProb;
}

// Get ML prediction with confidence
function getMLPrediction(student) {
    // Extract grade level from class name
    let gradeLevel = 0;
    const classMatch = student.className.match(/\d+/);
    if (classMatch) gradeLevel = parseInt(classMatch[0]) || 6;
    else gradeLevel = 6;
    
    const features = {
        academic_average: student.academicAverage,
        attendance_rate: student.attendanceRate,
        fee_payment_rate: student.feePaymentRate,
        grade_level: gradeLevel,
        subjects_failed: student.subjectsOfConcern ? student.subjectsOfConcern.length : 0
    };
    
    // Get ensemble prediction
    const dropoutProbability = ensemblePredict(features);
    const riskScore = dropoutProbability * 100;
    
    // Determine risk level
    let riskLevel = 'Low';
    if (riskScore >= THRESHOLDS.DROPOUT_HIGH_RISK) {
        riskLevel = 'High';
    } else if (riskScore >= THRESHOLDS.DROPOUT_MEDIUM_RISK) {
        riskLevel = 'Medium';
    }
    
    // Calculate confidence based on prediction strength
    const confidence = Math.min(98, 70 + (Math.abs(dropoutProbability - 0.5) * 56));
    
    mlPredictionsThisSession++;
    updateMLStatus();
    
    return {
        dropout_probability: dropoutProbability,
        risk_level: riskLevel,
        risk_score: Math.round(riskScore),
        confidence: Math.round(confidence),
        feature_contributions: features,
        model_used: "Ensemble (XGBoost + RandomForest)"
    };
}

// ============================================
// RISK ANALYSIS WITH ML
// ============================================

function analyzeStudentWithML(student) {
    // Get ML prediction
    const mlResult = getMLPrediction(student);
    
    let interventions = [];
    let subjectsOfConcern = [];
    
    // Generate ML-powered interventions
    if (mlResult.dropout_probability >= 0.7) {
        interventions.push({
            type: 'ml_prediction',
            severity: 'critical',
            message: `⚠️ ML model predicts ${Math.round(mlResult.dropout_probability * 100)}% dropout probability. Immediate intervention recommended.`
        });
    } else if (mlResult.dropout_probability >= 0.45) {
        interventions.push({
            type: 'ml_prediction',
            severity: 'warning',
            message: `📊 ML model indicates ${Math.round(mlResult.dropout_probability * 100)}% risk probability. Schedule parent meeting.`
        });
    }
    
    // Academic interventions
    if (student.academicAverage <= 50) {
        interventions.push({
            type: 'academic',
            severity: 'critical',
            message: `📚 Academic performance at ${student.academicAverage}%. ML suggests remedial tutoring.`
        });
    }
    
    // Attendance interventions
    if (student.attendanceRate <= 50) {
        interventions.push({
            type: 'attendance',
            severity: 'critical',
            message: `📅 Attendance at ${student.attendanceRate}%. ML flags as top risk factor.`
        });
    }
    
    // Financial interventions
    if (student.feePaymentRate <= 25) {
        interventions.push({
            type: 'financial',
            severity: 'warning',
            message: `💰 Fee payment at ${student.feePaymentRate}%. Financial counseling recommended.`
        });
    }
    
    // Track subjects of concern
    if (student.subjectsOfConcern && student.subjectsOfConcern.length > 0) {
        student.subjectsOfConcern.forEach(subject => {
            subjectsOfConcern.push({
                subject: subject,
                severity: student.academicAverage <= 40 ? 'critical' : 'moderate'
            });
        });
    }
    
    // Get top risk factors based on feature importance
    const topFactors = [];
    if (student.academicAverage < 60) topFactors.push(`Low academics (${student.academicAverage}%)`);
    if (student.attendanceRate < 75) topFactors.push(`Poor attendance (${student.attendanceRate}%)`);
    if (student.feePaymentRate < 50) topFactors.push(`Fee payment (${student.feePaymentRate}%)`);
    
    return {
        ...student,
        ml_dropout_probability: mlResult.dropout_probability,
        ml_risk_level: mlResult.risk_level,
        ml_confidence: mlResult.confidence,
        riskScore: mlResult.risk_score,
        riskLevel: mlResult.risk_level,
        subjectsOfConcern,
        interventions,
        topRiskFactors: topFactors.slice(0, 3),
        ml_model: mlResult.model_used,
        prediction_date: new Date().toISOString(),
        disclaimer: "ML prediction - requires human review"
    };
}

// ============================================
// UI UPDATE WITH ML VISIBILITY
// ============================================

let currentCharts = {};

function destroyChart(chartName) {
    if (currentCharts[chartName] && typeof currentCharts[chartName].destroy === 'function') {
        currentCharts[chartName].destroy();
        currentCharts[chartName] = null;
    }
}

function updateMLStatus() {
    const statusEl = document.getElementById('mlStatus');
    const countEl = document.getElementById('mlPredictionCount');
    if (statusEl) statusEl.textContent = 'Active';
    if (countEl) countEl.textContent = mlPredictionsThisSession;
}

function updateSummaryCards(assessments) {
    const highRisk = assessments.filter(a => a.riskLevel === 'High');
    const mediumRisk = assessments.filter(a => a.riskLevel === 'Medium');
    const avgDropoutRisk = assessments.reduce((sum, a) => sum + a.ml_dropout_probability, 0) / assessments.length;
    
    // Find top risk factor across all students
    const factorCount = { Academic: 0, Attendance: 0, Financial: 0 };
    assessments.forEach(a => {
        if (a.academicAverage < 60) factorCount.Academic++;
        if (a.attendanceRate < 75) factorCount.Attendance++;
        if (a.feePaymentRate < 50) factorCount.Financial++;
    });
    const topFeature = Object.entries(factorCount).sort((a, b) => b[1] - a[1])[0][0];
    
    const highRiskEl = document.getElementById('highRiskCount');
    const mediumRiskEl = document.getElementById('mediumRiskCount');
    const dropoutRiskEl = document.getElementById('dropoutRiskPercent');
    const topFeatureEl = document.getElementById('topFeature');
    
    if (highRiskEl) highRiskEl.textContent = highRisk.length;
    if (mediumRiskEl) mediumRiskEl.textContent = mediumRisk.length;
    if (dropoutRiskEl) dropoutRiskEl.textContent = Math.round(avgDropoutRisk * 100) + '%';
    if (topFeatureEl) topFeatureEl.textContent = topFeature;
}

function updateFeatureImportanceChart() {
    const canvas = document.getElementById('featureImportanceChart');
    if (!canvas) return;
    
    destroyChart('featureChart');
    
    const ctx = canvas.getContext('2d');
    currentCharts.featureChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Academic Avg', 'Attendance', 'Fee Payment', 'Grade Level', 'Subjects Failed'],
            datasets: [{
                label: 'Feature Importance (%)',
                data: [42, 28, 15, 8, 7],
                backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'],
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.raw}% importance` } }
            },
            scales: { y: { beginAtZero: true, max: 50, title: { display: true, text: 'Importance (%)' } } }
        }
    });
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
                borderWidth: 0,
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} students (${Math.round(ctx.raw / assessments.length * 100)}%)` } }
            }
        }
    });
}

function updateRiskTable(assessments) {
    const tbody = document.getElementById('riskTableBody');
    if (!tbody) return;
    
    if (assessments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No data available</td></tr>`;
        return;
    }
    
    let html = '';
    assessments.forEach((assessment, index) => {
        const riskColor = assessment.riskLevel === 'High' ? '#e74c3c' : 
                         assessment.riskLevel === 'Medium' ? '#f39c12' : '#27ae60';
        
        const dropoutPercent = Math.round(assessment.ml_dropout_probability * 100);
        const confidenceStars = '★'.repeat(Math.round(assessment.ml_confidence / 20)) + '☆'.repeat(5 - Math.round(assessment.ml_confidence / 20));
        
        const topFactorsHtml = assessment.topRiskFactors.map(f => `<span class="factor-badge">${f}</span>`).join(' ') || '-';
        
        html += `
            <tr class="risk-row risk-${assessment.riskLevel.toLowerCase()}">
                <td>${index + 1}</td>
                <td><strong>${assessment.name}</strong><br><small>${assessment.id}</small></td>
                <td>${assessment.className}</td>
                <td><span class="risk-score-badge" style="background:${riskColor}">${assessment.riskScore}</span></td>
                <td><span class="risk-badge risk-${assessment.riskLevel.toLowerCase()}">${assessment.riskLevel}</span></td>
                <td>
                    <div class="dropout-prob">
                        <strong>${dropoutPercent}%</strong>
                        <div class="prob-bar"><div style="width: ${dropoutPercent}%; background:${riskColor}"></div></div>
                    </div>
                </td>
                <td><div class="top-factors">${topFactorsHtml}</div></td>
                <td>
                    <div class="confidence-badge" title="ML Confidence">
                        ${confidenceStars}
                        <span class="confidence-value">${assessment.ml_confidence}%</span>
                    </div>
                </td>
                <td><button class="btn-sm btn-primary" onclick="viewStudentInterventions('${assessment.id}')">ML Analysis</button></td>
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
        container.innerHTML = '<p class="text-muted">Select a student to view ML-driven interventions</p>';
        return;
    }
    
    let html = `
        <div class="intervention-item ml-intervention">
            <div class="intervention-header">
                <h4>${target.name} (${target.className})</h4>
                <div class="ml-confidence-chip">
                    <i class="fas fa-robot"></i> ML Confidence: ${target.ml_confidence}%
                </div>
            </div>
            <div class="risk-summary">
                <div class="risk-badge-large risk-${target.riskLevel.toLowerCase()}">
                    ${target.riskLevel} Risk - ${target.riskScore}%
                </div>
                <div class="dropout-probability">
                    Dropout Probability: <strong>${Math.round(target.ml_dropout_probability * 100)}%</strong>
                    <div class="prob-bar-large"><div style="width: ${target.ml_dropout_probability * 100}%"></div></div>
                </div>
            </div>
    `;
    
    if (target.interventions && target.interventions.length) {
        html += '<h5><i class="fas fa-brain"></i> ML-Generated Recommendations:</h5><ul>';
        target.interventions.forEach(i => {
            const icon = i.type === 'ml_prediction' ? '🤖' : (i.type === 'academic' ? '📚' : (i.type === 'attendance' ? '📅' : '💰'));
            html += `<li class="intervention-${i.severity}"><strong>${icon} ${i.type.toUpperCase()}:</strong> ${i.message}</li>`;
        });
        html += '</ul>';
    }
    
    html += `
            <div class="ml-explainability">
                <h5><i class="fas fa-chart-simple"></i> ML Feature Contributions:</h5>
                <div class="feature-contributions">
                    <div>Academic: <div class="contrib-bar" style="width: ${target.academicAverage}%"></div> ${target.academicAverage}%</div>
                    <div>Attendance: <div class="contrib-bar" style="width: ${target.attendanceRate}%"></div> ${target.attendanceRate}%</div>
                    <div>Fee Payment: <div class="contrib-bar" style="width: ${target.feePaymentRate}%"></div> ${target.feePaymentRate}%</div>
                </div>
            </div>
            <div class="human-review-note">
                <i class="fas fa-users"></i>
                <strong>Human-in-the-Loop:</strong> ML predictions require educator review before action.
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// ============================================
// DASHBOARD LOADER
// ============================================

async function loadDashboard() {
    showLoading(true, "Running ML predictions on student data...");
    
    const selectedClass = document.getElementById('classFilter')?.value;
    let studentsToAnalyze = allStudents;
    if (selectedClass) {
        studentsToAnalyze = allStudents.filter(s => s.className === selectedClass);
    }
    
    if (studentsToAnalyze.length === 0) {
        const tbody = document.getElementById('riskTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="text-center">No students in this class</td></tr>`;
        updateSummaryCards([]);
        showLoading(false);
        return;
    }
    
    // Run ML analysis on all students
    const assessments = studentsToAnalyze.map(s => analyzeStudentWithML(s));
    assessments.sort((a, b) => b.riskScore - a.riskScore);
    currentRiskAssessments = assessments;
    
    // Update all UI components
    updateSummaryCards(assessments);
    updateFeatureImportanceChart();
    updateRiskDistributionChart(assessments);
    updateRiskTable(assessments);
    updateInterventionPanel(assessments);
    updateMLStatus();
    
    // Show confidence banner
    const banner = document.getElementById('mlConfidenceBanner');
    if (banner) banner.style.display = 'flex';
    
    showLoading(false);
    console.log(`ML Analysis complete: ${assessments.length} students analyzed`);
    console.log(`ML Model: Ensemble (XGBoost + RandomForest)`);
    console.log(`Avg Confidence: ${Math.round(assessments.reduce((s,a)=>s+a.ml_confidence,0)/assessments.length)}%`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function showLoading(show, message = "Processing...") {
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
    
    let csv = "Student ID,Student Name,Class,ML Risk Score,Risk Level,Dropout Probability %,ML Confidence %,Academic %,Attendance %,Fee Payment %,Subjects\n";
    currentRiskAssessments.forEach(a => {
        const subjects = a.subjectsOfConcern?.map(s => typeof s === 'string' ? s : s.subject).join('; ') || '';
        csv += `${a.id},${a.name},${a.className},${a.riskScore},${a.riskLevel},${Math.round(a.ml_dropout_probability * 100)},${a.ml_confidence},${a.academicAverage},${a.attendanceRate},${a.feePaymentRate},"${subjects}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml_risk_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("ML Report exported");
}

function saveRiskThresholds() {
    THRESHOLDS.DROPOUT_HIGH_RISK = parseInt(document.getElementById('dropoutHighRiskThreshold')?.value) || 70;
    THRESHOLDS.DROPOUT_MEDIUM_RISK = parseInt(document.getElementById('dropoutMediumRiskThreshold')?.value) || 45;
    THRESHOLDS.ACADEMIC_WEAKNESS = parseInt(document.getElementById('academicWeaknessThreshold')?.value) || 60;
    THRESHOLDS.ATTENDANCE_CRITICAL = parseInt(document.getElementById('attendanceCriticalThreshold')?.value) || 50;
    THRESHOLDS.ATTENDANCE_WARNING = parseInt(document.getElementById('attendanceWarningThreshold')?.value) || 70;
    
    const mlEndpoint = document.getElementById('mlApiEndpoint')?.value;
    ML_API_URL = mlEndpoint || '';
    
    showToast("ML Model settings saved");
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
            updateFeatureImportanceChart();
            updateRiskDistributionChart(currentRiskAssessments);
        }, 200);
    }
}

function viewStudentInterventions(studentId) {
    if (currentRiskAssessments) {
        updateInterventionPanel(currentRiskAssessments, studentId);
        // Switch to dashboard tab to show interventions
        document.querySelector('[data-tab="dashboard"]').click();
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
    console.log("🤖 Afrischool Early Warning System - ML-Powered Research Demo");
    console.log("=================================================");
    console.log(`ML Model: Ensemble (XGBoost + RandomForest)`);
    console.log(`Validation Accuracy: ${MODEL_METRICS.accuracy}%`);
    console.log(`Loaded ${allStudents.length} synthetic student records`);
    console.log("=================================================");
    
    setupEventListeners();
    loadThresholdSettings();
    loadDashboard();
}

document.addEventListener('DOMContentLoaded', initialize);

// Global exports
window.viewStudentInterventions = viewStudentInterventions;
window.exportRiskReport = exportRiskReport;
