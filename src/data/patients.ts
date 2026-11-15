import {
  AppointmentRecord,
  AuditLogEntry,
  GlucosePoint,
  PatientMessage,
  PatientProfile,
  VitalPoint,
} from '../types/clinical';
import {
  daysAgoDateStr,
  daysAgoISO,
  daysAheadDateStr,
  formatMonthYear,
} from '../utils/dateUtils';

// Deterministic wave generator for realistic clinical curves without non-deterministic randomness
function seededNoise(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297) * 233280;
  return x - Math.floor(x);
}

function buildGlucose24h(
  seed: number,
  baseline: number,
  postMealAmplitude: number,
  variability: number,
  hasCgm: boolean
): GlucosePoint[] {
  const now = new Date();
  now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);
  const points: GlucosePoint[] = [];

  if (!hasCgm) {
    // Plausible 4-point fingerstick checks over 24 hours
    const offsets = [
      { hoursAgo: 20, label: 'Fasting', delta: -12 },
      { hoursAgo: 14, label: 'Post-Lunch', delta: postMealAmplitude * 0.8 },
      { hoursAgo: 8, label: 'Pre-Dinner', delta: 6 },
      { hoursAgo: 2, label: 'Bedtime', delta: 18 },
    ];
    offsets.forEach((o, i) => {
      const t = new Date(now.getTime() - o.hoursAgo * 3600 * 1000);
      const val = Math.round(
        baseline + o.delta + (seededNoise(seed, i) - 0.5) * variability
      );
      points.push({
        timestamp: t.toISOString(),
        label: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        value: Math.max(68, Math.min(310, val)),
        source: 'Fingerstick',
      });
    });
    return points;
  }

  // 96 samples (every 15 min over past 24 hours)
  for (let i = 95; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60 * 1000);
    const hour = t.getHours() + t.getMinutes() / 60;
    // Post-prandial rises around 8:30, 13:15, 19:45 + mild dawn phenomenon ~5:30
    const breakfast = Math.exp(-Math.pow((hour - 8.7) / 1.4, 2)) * postMealAmplitude * 0.9;
    const lunch = Math.exp(-Math.pow((hour - 13.4) / 1.6, 2)) * postMealAmplitude * 0.8;
    const dinner = Math.exp(-Math.pow((hour - 19.6) / 1.8, 2)) * postMealAmplitude;
    const dawn = Math.exp(-Math.pow((hour - 5.5) / 1.5, 2)) * 12;
    const ripple = (seededNoise(seed, 95 - i) - 0.5) * variability;
    const val = Math.round(baseline + breakfast + lunch + dinner + dawn + ripple);

    points.push({
      timestamp: t.toISOString(),
      label: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      value: Math.max(64, Math.min(320, val)),
      source: 'CGM',
    });
  }
  return points;
}

function buildGlucoseDaily(
  seed: number,
  days: number,
  baseline: number,
  spread: number,
  slopePerDay = 0
): GlucosePoint[] {
  const points: GlucosePoint[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const dateStr = daysAgoDateStr(d);
    const trendShift = (days - 1 - d) * slopePerDay;
    const avg = Math.round(
      baseline + trendShift + (seededNoise(seed + 11, d) - 0.5) * spread * 0.6
    );
    const min = Math.max(65, Math.round(avg - spread * 0.55 - seededNoise(seed + 22, d) * 14));
    const max = Math.min(325, Math.round(avg + spread * 0.85 + seededNoise(seed + 33, d) * 20));
    points.push({
      timestamp: `${dateStr}T12:00:00`,
      label: formatMonthYear(dateStr),
      value: avg,
      min,
      max,
      source: 'CGM',
    });
  }
  return points;
}

function buildVitals24h(
  seed: number,
  baseSys: number,
  baseDia: number,
  baseHr: number
): VitalPoint[] {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const points: VitalPoint[] = [];
  // Plausible 2-hour intervals for wearable HR and cuff BP checks
  for (let h = 22; h >= 0; h -= 2) {
    const t = new Date(now.getTime() - h * 3600 * 1000);
    const hourOfDay = t.getHours();
    const daytimeBump = hourOfDay >= 8 && hourOfDay <= 20 ? 6 : -5;
    const sys = Math.round(baseSys + daytimeBump + (seededNoise(seed + 1, h) - 0.5) * 8);
    const dia = Math.round(baseDia + daytimeBump * 0.5 + (seededNoise(seed + 2, h) - 0.5) * 5);
    const hr = Math.round(baseHr + daytimeBump * 1.1 + (seededNoise(seed + 3, h) - 0.5) * 8);
    points.push({
      timestamp: t.toISOString(),
      label: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
    });
  }
  return points;
}

function buildVitalsSeries(
  seed: number,
  count: number,
  stepDays: number,
  baseSys: number,
  baseDia: number,
  baseHr: number,
  baseWeight: number,
  weightDeltaTotal: number,
  bpDeltaTotal = 0
): VitalPoint[] {
  const points: VitalPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const daysAgo = i * stepDays;
    const dateStr = daysAgoDateStr(daysAgo);
    const progress = (count - 1 - i) / Math.max(1, count - 1);
    const sys = Math.round(
      baseSys + progress * bpDeltaTotal + (seededNoise(seed + 41, i) - 0.5) * 8
    );
    const dia = Math.round(
      baseDia + progress * (bpDeltaTotal * 0.5) + (seededNoise(seed + 42, i) - 0.5) * 5
    );
    const hr = Math.round(baseHr + (seededNoise(seed + 43, i) - 0.5) * 6);
    const weight = Number(
      (baseWeight + progress * weightDeltaTotal + (seededNoise(seed + 44, i) - 0.5) * 0.4).toFixed(1)
    );
    points.push({
      timestamp: `${dateStr}T09:00:00`,
      label: formatMonthYear(dateStr),
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
      weightKg: weight,
    });
  }
  return points;
}

export const INITIAL_PATIENTS: PatientProfile[] = [
  // 1. PRIMARY PATIENT SCENARIO: AISHA RAHMAN (PT-1001)
  {
    id: 'PT-1001',
    name: 'Aisha Rahman',
    age: 42,
    sex: 'Female',
    conditions: ['Type 2 Diabetes (7 yrs)', 'Elevated Blood Pressure', 'Kidney-Risk Monitoring'],
    diabetesYears: 7,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Multi-marker review: Improving HbA1c, rising UACR & unconfirmed retinal observation',
    heightCm: 163,
    weightKg: 71.4,
    bmi: 26.9,
    lastVisitDate: daysAgoDateStr(18),
    reviewStatus: 'Pending Review',
    glucose24h: buildGlucose24h(101, 134, 48, 16, true),
    glucose7d: buildGlucoseDaily(101, 7, 142, 34, -0.5),
    glucose30d: buildGlucoseDaily(101, 30, 149, 38, -0.25),
    vitals24h: buildVitals24h(101, 136, 86, 74),
    vitals7d: buildVitalsSeries(101, 7, 1, 135, 85, 74, 71.6, -0.2, 1),
    vitals30d: buildVitalsSeries(101, 15, 2, 134, 84, 75, 72.1, -0.7, 2),
    vitals6m: buildVitalsSeries(101, 12, 15, 131, 82, 74, 73.0, -1.6, 5),
    vitals12m: buildVitalsSeries(101, 12, 30, 128, 80, 73, 73.5, -2.1, 8),
    labs: [
      {
        id: 'lab-1001-1',
        date: daysAgoDateStr(330),
        label: '11 Months Ago',
        hba1c: 8.3,
        egfr: 86,
        uacr: 18,
        creatinine: 0.82,
        fastingGlucose: 158,
        notes: 'Annual comprehensive metabolic & urine albumin screen.',
      },
      {
        id: 'lab-1001-2',
        date: daysAgoDateStr(190),
        label: 'Earlier (~6 mo)',
        hba1c: 8.1,
        egfr: 83,
        uacr: 21,
        creatinine: 0.85,
        fastingGlucose: 151,
        notes: 'Baseline endocrine clinic laboratory panel.',
      },
      {
        id: 'lab-1001-3',
        date: daysAgoDateStr(96),
        label: 'Middle (~3 mo)',
        hba1c: 7.7,
        egfr: 79,
        uacr: 36,
        creatinine: 0.91,
        fastingGlucose: 141,
        notes: 'HbA1c improving; mild UACR elevation noted for repeat verification.',
      },
      {
        id: 'lab-1001-4',
        date: daysAgoDateStr(10),
        label: 'Latest',
        hba1c: 7.4,
        egfr: 72,
        uacr: 44,
        creatinine: 1.02,
        fastingGlucose: 132,
        notes: 'Latest metabolic and renal panel awaiting physician review.',
      },
    ],
    retinalScreenings: [
      {
        id: 'ret-1001-prev',
        date: daysAgoDateStr(195),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'No apparent diabetic retinopathy features detected in illustrative sample.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        doctorNote: 'Routine annual screening unremarkable. Continue annual retinal monitoring.',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(192),
        lesions: [],
      },
      {
        id: 'ret-1001-recent',
        date: daysAgoDateStr(6),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'mild_npdr',
        simulatedObservation:
          'Simulated imaging review flagged 2 punctate microaneurysm-like spots and 1 subtle hemorrhage-like marker in the temporal quadrant.',
        possibleStage: 'Mild NPDR',
        isUnconfirmed: true,
        reviewStatus: 'Pending Review',
        lesions: [
          {
            id: 'les-1',
            type: 'microaneurysm',
            label: 'Microaneurysm-like dot (Illustrative)',
            x: 268,
            y: 165,
            description: 'Small focal capillary outpouching-like appearance superior-temporal to macula.',
          },
          {
            id: 'les-2',
            type: 'microaneurysm',
            label: 'Microaneurysm-like dot (Illustrative)',
            x: 245,
            y: 232,
            description: 'Tiny punctate red spot inferior-temporal to foveal zone.',
          },
          {
            id: 'les-3',
            type: 'hemorrhage',
            label: 'Dot-blot hemorrhage-like mark (Illustrative)',
            x: 294,
            y: 205,
            description: 'Small deeper retinal spot requiring ophthalmologic/clinician evaluation.',
          },
        ],
      },
    ],
    events: [
      {
        id: 'ev-1001-1',
        date: daysAgoISO(1, 10),
        type: 'glucose',
        title: 'Blood glucose trend analyzed',
        summary: '24-hour CGM average 141 mg/dL with moderate post-dinner excursion.',
        details:
          'Simulated CGM monitoring indicates 76% time-in-range (70–180 mg/dL) over the last 7 days, down slightly from peak post-prandial spikes 30 days ago. Requires routine clinical review.',
        actor: 'Aurelix AI (Simulated Monitor)',
      },
      {
        id: 'ev-1001-2',
        date: daysAgoISO(6, 14),
        type: 'retinal',
        title: 'Retinal screening completed',
        summary: 'Possible mild NPDR — unconfirmed, awaiting physician review.',
        details:
          'Bilateral non-mydriatic fundus screening captured in clinic. Simulated screening highlights possible mild NPDR features; physician confirmation is required before updating diagnosis or care plan.',
        actor: 'Retinal Screening Clinic',
        reviewStatus: 'Pending Review',
      },
      {
        id: 'ev-1001-3',
        date: daysAgoISO(10, 9),
        type: 'lab',
        title: 'Kidney & metabolic laboratory results added',
        summary: 'HbA1c 7.4% (improved from 7.7%), eGFR 72, UACR 44 mg/g.',
        details:
          'Glycemic trend continues to improve (8.1% -> 7.7% -> 7.4%). However, eGFR shifted from 79 to 72 mL/min/1.73 m² and UACR rose from 36 to 44 mg/g alongside mildly elevated BP (136/86 mmHg). Note: CKD diagnosis requires clinician confirmation and repeat chronicity assessment.',
        actor: 'Central Pathology Lab',
        reviewStatus: 'Pending Review',
      },
      {
        id: 'ev-1001-4',
        date: daysAgoISO(18, 11),
        type: 'doctor_review',
        title: 'Previous clinic check-in reviewed',
        summary: 'Dr. Maya Tan noted improving HbA1c and ordered follow-up renal & retinal screening.',
        details:
          'Patient reports good adherence to morning glucose checks and walking routine. Ordered repeat UACR, CMP, HbA1c, and bilateral retinal screening prior to next follow-up.',
        actor: 'Dr. Maya Tan',
        reviewStatus: 'Physician Reviewed',
      },
    ],
    carePlan: [
      {
        id: 'cp-1001-1',
        title: 'Continue daily CGM wear & log post-dinner meals',
        description: 'Maintain sensor telemetry to review evening glycemic variability at next visit.',
        category: 'Monitoring',
        sourceType: 'Physician Approved',
        completed: true,
        dueDate: daysAgoDateStr(0),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(18),
      },
      {
        id: 'cp-1001-2',
        title: 'Home blood pressure log (morning & evening)',
        description: 'Record seated blood pressure readings 4 times weekly ahead of physician review.',
        category: 'Monitoring',
        sourceType: 'Physician Approved',
        completed: false,
        dueDate: daysAheadDateStr(5),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(18),
      },
      {
        id: 'cp-1001-3',
        title: 'Review recent retinal screening (Possible mild NPDR — unconfirmed)',
        description: 'Simulated retinal observation flagged for ophthalmologic/physician assessment.',
        category: 'Screening',
        sourceType: 'Awaiting Clinician Review',
        completed: false,
        dueDate: daysAheadDateStr(3),
      },
      {
        id: 'cp-1001-4',
        title: 'Evaluate longitudinal eGFR (72) & UACR (44 mg/g) trend',
        description: 'AI-organized renal observation awaiting Dr. Maya Tan review and repeat confirmation plan.',
        category: 'Laboratory',
        sourceType: 'AI Observation',
        completed: false,
        dueDate: daysAheadDateStr(7),
      },
    ],
    clinicalNotes: [
      {
        id: 'cn-1001-1',
        date: daysAgoDateStr(18),
        author: 'Dr. Maya Tan',
        role: 'Attending Endocrinologist',
        note: 'HbA1c improved from 8.1% to 7.7% previously; scheduled repeat renal panel, UACR, and annual retinal photography to verify microvascular and renal trajectory.',
        outcome: 'Physician Reviewed',
      },
    ],
    missingDataNotes: [],
  },

  // 2. Stable diabetes management
  {
    id: 'PT-1002',
    name: 'Daniel Lim',
    age: 56,
    sex: 'Male',
    conditions: ['Type 2 Diabetes (5 yrs)', 'Dyslipidemia'],
    diabetesYears: 5,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Stable diabetes management',
    heightCm: 174,
    weightKg: 76.2,
    bmi: 25.2,
    lastVisitDate: daysAgoDateStr(12),
    reviewStatus: 'Physician Reviewed',
    glucose24h: buildGlucose24h(102, 114, 28, 10, true),
    glucose7d: buildGlucoseDaily(102, 7, 116, 20, 0),
    glucose30d: buildGlucoseDaily(102, 30, 118, 22, -0.05),
    vitals24h: buildVitals24h(102, 121, 76, 68),
    vitals7d: buildVitalsSeries(102, 7, 1, 120, 76, 68, 76.3, -0.1),
    vitals30d: buildVitalsSeries(102, 15, 2, 121, 77, 69, 76.5, -0.3),
    vitals6m: buildVitalsSeries(102, 12, 15, 122, 77, 69, 77.0, -0.8),
    vitals12m: buildVitalsSeries(102, 12, 30, 123, 78, 70, 77.5, -1.3),
    labs: [
      { id: 'lab-1002-1', date: daysAgoDateStr(185), label: '6 mo', hba1c: 6.7, egfr: 91, uacr: 12, creatinine: 0.89, fastingGlucose: 112 },
      { id: 'lab-1002-2', date: daysAgoDateStr(92), label: '3 mo', hba1c: 6.6, egfr: 90, uacr: 11, creatinine: 0.90, fastingGlucose: 110 },
      { id: 'lab-1002-3', date: daysAgoDateStr(14), label: 'Latest', hba1c: 6.5, egfr: 90, uacr: 12, creatinine: 0.88, fastingGlucose: 108 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1002-1',
        date: daysAgoDateStr(42),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'No apparent retinopathy markers observed.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        doctorNote: 'Clear bilateral fundus. Continue routine annual review.',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(39),
        lesions: [],
      },
    ],
    events: [
      {
        id: 'ev-1002-1',
        date: daysAgoISO(12, 10),
        type: 'doctor_review',
        title: 'Routine review completed',
        summary: 'HbA1c 6.5%, normal renal markers, 88% time-in-range.',
        details: 'Consistent glycemic stability and normal UACR (12 mg/g). Continue routine monitoring every 6 months.',
        actor: 'Dr. Maya Tan',
        reviewStatus: 'Physician Reviewed',
      },
    ],
    carePlan: [
      {
        id: 'cp-1002-1',
        title: 'Maintain current physical activity & routine quarterly check',
        description: 'Continue balanced meal timing and quarterly laboratory monitoring.',
        category: 'Lifestyle',
        sourceType: 'Physician Approved',
        completed: true,
        dueDate: daysAheadDateStr(60),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(12),
      },
    ],
    clinicalNotes: [
      {
        id: 'cn-1002-1',
        date: daysAgoDateStr(12),
        author: 'Dr. Maya Tan',
        role: 'Attending Endocrinologist',
        note: 'Stable metabolic and renal parameters. No concerns identified.',
        outcome: 'Physician Reviewed',
      },
    ],
    missingDataNotes: [],
  },

  // 3. Worsening glucose control
  {
    id: 'PT-1003',
    name: 'Mei-Ling Chong',
    age: 61,
    sex: 'Female',
    conditions: ['Type 2 Diabetes (11 yrs)', 'Post-prandial Hyperglycemia'],
    diabetesYears: 11,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Worsening glucose control',
    heightCm: 158,
    weightKg: 69.8,
    bmi: 28.0,
    lastVisitDate: daysAgoDateStr(34),
    reviewStatus: 'Pending Review',
    glucose24h: buildGlucose24h(103, 168, 86, 28, true),
    glucose7d: buildGlucoseDaily(103, 7, 198, 52, 2.2),
    glucose30d: buildGlucoseDaily(103, 30, 178, 48, 0.9),
    vitals24h: buildVitals24h(103, 132, 82, 78),
    vitals7d: buildVitalsSeries(103, 7, 1, 131, 81, 77, 69.8, 0.2),
    vitals30d: buildVitalsSeries(103, 15, 2, 130, 80, 76, 69.2, 0.6),
    vitals6m: buildVitalsSeries(103, 12, 15, 129, 80, 75, 68.1, 1.7),
    vitals12m: buildVitalsSeries(103, 12, 30, 128, 79, 75, 67.5, 2.3),
    labs: [
      { id: 'lab-1003-1', date: daysAgoDateStr(190), label: '6 mo', hba1c: 7.6, egfr: 81, uacr: 19, creatinine: 0.78, fastingGlucose: 146 },
      { id: 'lab-1003-2', date: daysAgoDateStr(95), label: '3 mo', hba1c: 8.2, egfr: 80, uacr: 24, creatinine: 0.79, fastingGlucose: 162 },
      { id: 'lab-1003-3', date: daysAgoDateStr(8), label: 'Latest', hba1c: 8.8, egfr: 78, uacr: 27, creatinine: 0.81, fastingGlucose: 184 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1003-1',
        date: daysAgoDateStr(85),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'No apparent retinopathy features on prior exam.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(82),
        lesions: [],
      },
    ],
    events: [
      {
        id: 'ev-1003-1',
        date: daysAgoISO(8, 11),
        type: 'lab',
        title: 'Rising HbA1c detected (8.8%)',
        summary: 'HbA1c increased from 7.6% to 8.8% over 6 months alongside elevated CGM excursions.',
        details: 'Repeated post-meal peaks above 240 mg/dL on CGM. Requires physician review of dietary factors, adherence, and clinical plan.',
        actor: 'Central Pathology Lab',
        reviewStatus: 'Pending Review',
      },
    ],
    carePlan: [
      {
        id: 'cp-1003-1',
        title: 'Schedule glycemic pattern consultation',
        description: 'Review CGM post-meal surges and latest HbA1c 8.8% with Dr. Maya Tan.',
        category: 'Follow-up',
        sourceType: 'Awaiting Clinician Review',
        completed: false,
        dueDate: daysAheadDateStr(4),
      },
    ],
    clinicalNotes: [
      {
        id: 'cn-1003-1',
        date: daysAgoDateStr(34),
        author: 'Dr. Maya Tan',
        role: 'Attending Endocrinologist',
        note: 'Noted upward glycemic trend at last visit; ordered repeat HbA1c and CGM upload review.',
        outcome: 'Follow-up Requested',
      },
    ],
    missingDataNotes: [],
  },

  // 4. Rising kidney-risk indicators
  {
    id: 'PT-1004',
    name: 'Rajendra Nair',
    age: 64,
    sex: 'Male',
    conditions: ['Type 2 Diabetes (14 yrs)', 'Hypertension', 'Progressive Albuminuria Signal'],
    diabetesYears: 14,
    hasCgm: false,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Rising kidney-risk indicators',
    heightCm: 171,
    weightKg: 81.5,
    bmi: 27.9,
    lastVisitDate: daysAgoDateStr(22),
    reviewStatus: 'Under Review',
    glucose24h: buildGlucose24h(104, 145, 42, 18, false),
    glucose7d: buildGlucoseDaily(104, 7, 148, 30, 0),
    glucose30d: buildGlucoseDaily(104, 30, 150, 32, -0.1),
    vitals24h: buildVitals24h(104, 144, 88, 72),
    vitals7d: buildVitalsSeries(104, 7, 1, 143, 88, 72, 81.5, 0),
    vitals30d: buildVitalsSeries(104, 15, 2, 141, 87, 72, 81.2, 0.3, 3),
    vitals6m: buildVitalsSeries(104, 12, 15, 136, 84, 71, 80.5, 1.0, 8),
    vitals12m: buildVitalsSeries(104, 12, 30, 132, 82, 70, 79.8, 1.7, 12),
    labs: [
      { id: 'lab-1004-1', date: daysAgoDateStr(340), label: '11 mo', hba1c: 7.5, egfr: 71, uacr: 48, creatinine: 1.08, fastingGlucose: 138 },
      { id: 'lab-1004-2', date: daysAgoDateStr(180), label: '6 mo', hba1c: 7.7, egfr: 66, uacr: 76, creatinine: 1.15, fastingGlucose: 144 },
      { id: 'lab-1004-3', date: daysAgoDateStr(90), label: '3 mo', hba1c: 7.8, egfr: 59, uacr: 112, creatinine: 1.26, fastingGlucose: 149 },
      { id: 'lab-1004-4', date: daysAgoDateStr(5), label: 'Latest', hba1c: 7.9, egfr: 54, uacr: 148, creatinine: 1.36, fastingGlucose: 152 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1004-1',
        date: daysAgoDateStr(60),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'mild_npdr',
        simulatedObservation: 'Mild background microaneurysm-like features previously reviewed.',
        possibleStage: 'Mild NPDR',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'Mild NPDR',
        doctorNote: 'Stable mild NPDR; ophthalmology follow-up in 6 months.',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(56),
        lesions: [
          {
            id: 'les-1004-1',
            type: 'microaneurysm',
            label: 'Microaneurysm-like dot',
            x: 255,
            y: 175,
            description: 'Focal temporal microaneurysm-like dot noted in baseline review.',
          },
        ],
      },
    ],
    events: [
      {
        id: 'ev-1004-1',
        date: daysAgoISO(5, 8),
        type: 'lab',
        title: 'Renal function & UACR trajectory alert',
        summary: 'eGFR decreased from 66 to 54 mL/min/1.73 m² over 6 months; UACR rose to 148 mg/g.',
        details: 'Consecutive downward eGFR shift accompanied by elevated BP (144/88 mmHg) and rising albuminuria. Requires physician clinical assessment and nephrology consideration.',
        actor: 'Aurelix AI (Simulated Monitor)',
        reviewStatus: 'Under Review',
      },
    ],
    carePlan: [
      {
        id: 'cp-1004-1',
        title: 'Nephrology co-management evaluation',
        description: 'Pending physician confirmation for specialist referral and repeat BMP/UACR.',
        category: 'Follow-up',
        sourceType: 'Awaiting Clinician Review',
        completed: false,
        dueDate: daysAheadDateStr(5),
      },
    ],
    clinicalNotes: [
      {
        id: 'cn-1004-1',
        date: daysAgoDateStr(22),
        author: 'Dr. Maya Tan',
        role: 'Attending Endocrinologist',
        note: 'Monitoring downward eGFR trend closely. Repeat serum creatinine, electrolytes, and morning UACR ordered.',
        outcome: 'Under Review',
      },
    ],
    missingDataNotes: [],
  },

  // 5. Retinopathy screening requiring review
  {
    id: 'PT-1005',
    name: 'Nurul Huda',
    age: 51,
    sex: 'Female',
    conditions: ['Type 2 Diabetes (9 yrs)', 'Retinal Screening Pending Review'],
    diabetesYears: 9,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Retinopathy screening requiring review',
    heightCm: 160,
    weightKg: 66.4,
    bmi: 25.9,
    lastVisitDate: daysAgoDateStr(15),
    reviewStatus: 'Pending Review',
    glucose24h: buildGlucose24h(105, 142, 46, 15, true),
    glucose7d: buildGlucoseDaily(105, 7, 146, 32, 0),
    glucose30d: buildGlucoseDaily(105, 30, 148, 35, 0),
    vitals24h: buildVitals24h(105, 128, 79, 71),
    vitals7d: buildVitalsSeries(105, 7, 1, 127, 78, 71, 66.4, 0),
    vitals30d: buildVitalsSeries(105, 15, 2, 128, 79, 71, 66.6, -0.2),
    vitals6m: buildVitalsSeries(105, 12, 15, 129, 80, 72, 67.0, -0.6),
    vitals12m: buildVitalsSeries(105, 12, 30, 130, 80, 72, 67.4, -1.0),
    labs: [
      { id: 'lab-1005-1', date: daysAgoDateStr(182), label: '6 mo', hba1c: 7.9, egfr: 88, uacr: 16, creatinine: 0.75 },
      { id: 'lab-1005-2', date: daysAgoDateStr(90), label: '3 mo', hba1c: 7.6, egfr: 87, uacr: 18, creatinine: 0.76 },
      { id: 'lab-1005-3', date: daysAgoDateStr(16), label: 'Latest', hba1c: 7.5, egfr: 86, uacr: 17, creatinine: 0.76 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1005-prev',
        date: daysAgoDateStr(350),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'mild_npdr',
        simulatedObservation: 'Earlier screening showed isolated microaneurysm-like dots.',
        possibleStage: 'Mild NPDR',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'Mild NPDR',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(345),
        lesions: [
          {
            id: 'les-1005-0',
            type: 'microaneurysm',
            label: 'Prior microaneurysm-like spot',
            x: 262,
            y: 182,
            description: 'Single punctate red spot near temporal arcade.',
          },
        ],
      },
      {
        id: 'ret-1005-recent',
        date: daysAgoDateStr(3),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'moderate_npdr',
        simulatedObservation:
          'Simulated screening indicates increased microaneurysm-like markers, blot hemorrhage-like spots, and hard exudate-like clusters.',
        possibleStage: 'Moderate NPDR',
        isUnconfirmed: true,
        reviewStatus: 'Pending Review',
        lesions: [
          {
            id: 'les-1005-1',
            type: 'microaneurysm',
            label: 'Microaneurysm cluster (Illustrative)',
            x: 248,
            y: 158,
            description: 'Multiple pinpoint capillary dilatations superior to macula.',
          },
          {
            id: 'les-1005-2',
            type: 'hemorrhage',
            label: 'Intraretinal hemorrhage-like feature (Illustrative)',
            x: 285,
            y: 224,
            description: 'Dot-blot hemorrhage-like spot in mid-periphery.',
          },
          {
            id: 'les-1005-3',
            type: 'exudate',
            label: 'Hard exudate-like deposit (Illustrative)',
            x: 222,
            y: 210,
            description: 'Yellowish lipid-like deposit near macular margin requiring ophthalmology review.',
          },
        ],
      },
    ],
    events: [
      {
        id: 'ev-1005-1',
        date: daysAgoISO(3, 15),
        type: 'retinal',
        title: 'Retinal scan flagged for physician review',
        summary: 'Possible progression from mild to moderate NPDR (unconfirmed).',
        details: 'Simulated screening indicates new exudate-like and hemorrhage-like features compared with prior year. Ophthalmology referral review recommended.',
        actor: 'Retinal Screening Clinic',
        reviewStatus: 'Pending Review',
      },
    ],
    carePlan: [
      {
        id: 'cp-1005-1',
        title: 'Ophthalmology review pending clinician confirmation',
        description: 'Awaiting Dr. Maya Tan assessment of bilateral fundus photography.',
        category: 'Screening',
        sourceType: 'Awaiting Clinician Review',
        completed: false,
        dueDate: daysAheadDateStr(2),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [],
  },

  // 6. Higher cardiovascular-risk factors
  {
    id: 'PT-1006',
    name: 'Kenneth Tan',
    age: 67,
    sex: 'Male',
    conditions: ['Type 2 Diabetes (10 yrs)', 'Stage 2 Hypertension', 'Obesity (BMI 31.2)'],
    diabetesYears: 10,
    hasCgm: false,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Higher cardiovascular-risk factors',
    heightCm: 173,
    weightKg: 93.4,
    bmi: 31.2,
    lastVisitDate: daysAgoDateStr(28),
    reviewStatus: 'Pending Review',
    glucose24h: buildGlucose24h(106, 154, 48, 16, false),
    glucose7d: buildGlucoseDaily(106, 7, 158, 34, 0),
    glucose30d: buildGlucoseDaily(106, 30, 156, 36, 0.2),
    vitals24h: buildVitals24h(106, 152, 94, 82),
    vitals7d: buildVitalsSeries(106, 7, 1, 151, 93, 81, 93.4, 0),
    vitals30d: buildVitalsSeries(106, 15, 2, 149, 92, 80, 93.0, 0.4, 4),
    vitals6m: buildVitalsSeries(106, 12, 15, 144, 89, 79, 91.8, 1.6, 8),
    vitals12m: buildVitalsSeries(106, 12, 30, 140, 86, 78, 90.5, 2.9, 12),
    labs: [
      { id: 'lab-1006-1', date: daysAgoDateStr(180), label: '6 mo', hba1c: 7.7, egfr: 74, uacr: 28, creatinine: 1.05 },
      { id: 'lab-1006-2', date: daysAgoDateStr(11), label: 'Latest', hba1c: 7.9, egfr: 69, uacr: 39, creatinine: 1.12 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1006-1',
        date: daysAgoDateStr(110),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'No apparent retinopathy; mild arteriolar narrowing noted.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(106),
        lesions: [],
      },
    ],
    events: [
      {
        id: 'ev-1006-1',
        date: daysAgoISO(4, 9),
        type: 'lab',
        title: 'Sustained blood pressure & UACR elevation',
        summary: 'Home BP averaging 151/93 mmHg; UACR rose from 28 to 39 mg/g.',
        details: 'Combined metabolic, hypertensive, and early albuminuric risk signals warrant clinician review.',
        actor: 'Aurelix AI (Simulated Monitor)',
        reviewStatus: 'Pending Review',
      },
    ],
    carePlan: [
      {
        id: 'cp-1006-1',
        title: 'Daily seated BP monitoring & cardiometabolic follow-up',
        description: 'Bring 14-day cuff log to clinic visit.',
        category: 'Monitoring',
        sourceType: 'Physician Approved',
        completed: false,
        dueDate: daysAheadDateStr(6),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(28),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [],
  },

  // 7. Improving longitudinal indicators
  {
    id: 'PT-1007',
    name: 'Sofia Alvarez',
    age: 38,
    sex: 'Female',
    conditions: ['Type 2 Diabetes (3 yrs)', 'Metabolic Remission Trajectory'],
    diabetesYears: 3,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Improving longitudinal indicators',
    heightCm: 165,
    weightKg: 67.2,
    bmi: 24.7,
    lastVisitDate: daysAgoDateStr(9),
    reviewStatus: 'Physician Reviewed',
    glucose24h: buildGlucose24h(107, 108, 26, 10, true),
    glucose7d: buildGlucoseDaily(107, 7, 110, 18, -0.5),
    glucose30d: buildGlucoseDaily(107, 30, 118, 24, -0.35),
    vitals24h: buildVitals24h(107, 116, 74, 66),
    vitals7d: buildVitalsSeries(107, 7, 1, 117, 74, 66, 67.3, -0.1),
    vitals30d: buildVitalsSeries(107, 15, 2, 119, 75, 68, 68.4, -1.2),
    vitals6m: buildVitalsSeries(107, 12, 15, 124, 78, 72, 72.1, -4.9, -8),
    vitals12m: buildVitalsSeries(107, 12, 30, 128, 82, 74, 74.5, -7.3, -12),
    labs: [
      { id: 'lab-1007-1', date: daysAgoDateStr(270), label: '9 mo', hba1c: 8.4, egfr: 95, uacr: 26, creatinine: 0.72 },
      { id: 'lab-1007-2', date: daysAgoDateStr(150), label: '5 mo', hba1c: 7.4, egfr: 96, uacr: 16, creatinine: 0.71 },
      { id: 'lab-1007-3', date: daysAgoDateStr(10), label: 'Latest', hba1c: 6.7, egfr: 98, uacr: 11, creatinine: 0.70 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1007-1',
        date: daysAgoDateStr(45),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'Healthy macular and optic disc appearance.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(43),
        lesions: [],
      },
    ],
    events: [
      {
        id: 'ev-1007-1',
        date: daysAgoISO(9, 14),
        type: 'doctor_review',
        title: 'Significant metabolic improvement confirmed',
        summary: 'HbA1c decreased from 8.4% to 6.7% with 91% CGM time-in-range.',
        details: 'Weight reduced by 7.3 kg over 12 months; UACR normalized from 26 to 11 mg/g.',
        actor: 'Dr. Maya Tan',
        reviewStatus: 'Physician Reviewed',
      },
    ],
    carePlan: [
      {
        id: 'cp-1007-1',
        title: 'Continue sustainable nutrition & resistance exercise plan',
        description: 'Follow-up HbA1c scheduled in 6 months.',
        category: 'Lifestyle',
        sourceType: 'Physician Approved',
        completed: true,
        dueDate: daysAheadDateStr(90),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(9),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [],
  },

  // 8. Incomplete screening records
  {
    id: 'PT-1008',
    name: 'Marcus Osei',
    age: 49,
    sex: 'Male',
    conditions: ['Type 2 Diabetes (6 yrs)', 'Overdue Retinal & UACR Screening'],
    diabetesYears: 6,
    hasCgm: false,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Incomplete screening records',
    heightCm: 179,
    weightKg: 84.0,
    bmi: 26.2,
    lastVisitDate: daysAgoDateStr(142),
    reviewStatus: 'Additional Evidence Required',
    glucose24h: buildGlucose24h(108, 138, 40, 15, false),
    glucose7d: buildGlucoseDaily(108, 7, 140, 26, 0),
    glucose30d: buildGlucoseDaily(108, 30, 139, 28, 0),
    vitals24h: buildVitals24h(108, 129, 81, 73),
    vitals7d: buildVitalsSeries(108, 7, 1, 129, 81, 73, 84.0, 0),
    vitals30d: buildVitalsSeries(108, 10, 3, 128, 80, 73, 84.0, 0),
    vitals6m: buildVitalsSeries(108, 6, 30, 127, 80, 72, 83.8, 0.2),
    vitals12m: buildVitalsSeries(108, 6, 60, 127, 79, 72, 83.5, 0.5),
    labs: [
      { id: 'lab-1008-1', date: daysAgoDateStr(240), label: '8 mo', hba1c: 7.3, egfr: 87, creatinine: 0.94 },
      { id: 'lab-1008-2', date: daysAgoDateStr(142), label: '5 mo', hba1c: 7.5, egfr: 85, creatinine: 0.96 },
    ],
    retinalScreenings: [],
    events: [
      {
        id: 'ev-1008-1',
        date: daysAgoISO(14, 9),
        type: 'appointment',
        title: 'Missing annual retinal & UACR screening',
        summary: 'No retinal scan on file and UACR not recorded in past 12 months.',
        details: 'System flagged incomplete preventive screening coverage. Patient outreach required before full kidney or retinopathy assessment can be generated.',
        actor: 'Aurelix AI (Completeness Check)',
        reviewStatus: 'Additional Evidence Required',
      },
    ],
    carePlan: [
      {
        id: 'cp-1008-1',
        title: 'Complete overdue urine albumin (UACR) & retinal photography',
        description: 'Required to establish baseline microvascular and kidney monitoring.',
        category: 'Screening',
        sourceType: 'Awaiting Clinician Review',
        completed: false,
        dueDate: daysAheadDateStr(10),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [
      'No UACR measurement recorded in past 12 months.',
      'No retinal screening examination on file.',
      'Last laboratory HbA1c/eGFR panel is >4 months old.',
    ],
  },

  // 9. Multiple conditions needing coordinated follow-up
  {
    id: 'PT-1009',
    name: 'Priya Krishnan',
    age: 58,
    sex: 'Female',
    conditions: ['Type 2 Diabetes (12 yrs)', 'Hypertension', 'CKD Monitoring', 'Mild NPDR History'],
    diabetesYears: 12,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Multiple conditions needing coordinated follow-up',
    heightCm: 159,
    weightKg: 74.2,
    bmi: 29.4,
    lastVisitDate: daysAgoDateStr(19),
    reviewStatus: 'Follow-up Requested',
    glucose24h: buildGlucose24h(109, 152, 62, 22, true),
    glucose7d: buildGlucoseDaily(109, 7, 162, 42, 0.5),
    glucose30d: buildGlucoseDaily(109, 30, 158, 40, 0.2),
    vitals24h: buildVitals24h(109, 141, 87, 76),
    vitals7d: buildVitalsSeries(109, 7, 1, 140, 87, 76, 74.2, 0),
    vitals30d: buildVitalsSeries(109, 15, 2, 139, 86, 76, 74.0, 0.2),
    vitals6m: buildVitalsSeries(109, 12, 15, 137, 85, 75, 73.5, 0.7),
    vitals12m: buildVitalsSeries(109, 12, 30, 135, 84, 74, 73.0, 1.2),
    labs: [
      { id: 'lab-1009-1', date: daysAgoDateStr(210), label: '7 mo', hba1c: 8.0, egfr: 64, uacr: 62, creatinine: 1.04 },
      { id: 'lab-1009-2', date: daysAgoDateStr(100), label: '3 mo', hba1c: 7.9, egfr: 61, uacr: 74, creatinine: 1.09 },
      { id: 'lab-1009-3', date: daysAgoDateStr(12), label: 'Latest', hba1c: 8.1, egfr: 58, uacr: 88, creatinine: 1.14 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1009-1',
        date: daysAgoDateStr(12),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'mild_npdr',
        simulatedObservation: 'Consistent mild NPDR-like microaneurysms without macular exudates.',
        possibleStage: 'Mild NPDR',
        isUnconfirmed: true,
        reviewStatus: 'Follow-up Requested',
        lesions: [
          {
            id: 'les-1009-1',
            type: 'microaneurysm',
            label: 'Microaneurysm-like dot (Illustrative)',
            x: 260,
            y: 170,
            description: 'Stable temporal microaneurysm-like dot.',
          },
        ],
      },
    ],
    events: [
      {
        id: 'ev-1009-1',
        date: daysAgoISO(12, 10),
        type: 'lab',
        title: 'Coordinated multi-specialty review flagged',
        summary: 'HbA1c 8.1%, eGFR 58, UACR 88 mg/g, and mild NPDR screening awaiting follow-up.',
        details: 'Multi-organ monitoring indicates need for coordinated endocrinology, nephrology, and ophthalmology follow-up.',
        actor: 'Aurelix AI (Simulated Monitor)',
        reviewStatus: 'Follow-up Requested',
      },
    ],
    carePlan: [
      {
        id: 'cp-1009-1',
        title: 'Coordinated endocrine & renal follow-up visit',
        description: 'Review lab trends and retinal exam together.',
        category: 'Follow-up',
        sourceType: 'Physician Approved',
        completed: false,
        dueDate: daysAheadDateStr(4),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(19),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [],
  },

  // 10. Prediabetes & early metabolic monitoring
  {
    id: 'PT-1010',
    name: 'Wei Jie Goh',
    age: 45,
    sex: 'Male',
    conditions: ['Prediabetes Monitoring', 'Borderline Elevated Blood Pressure'],
    diabetesYears: 0,
    hasCgm: false,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Early metabolic prevention',
    heightCm: 176,
    weightKg: 79.1,
    bmi: 25.5,
    lastVisitDate: daysAgoDateStr(25),
    reviewStatus: 'Physician Reviewed',
    glucose24h: buildGlucose24h(110, 106, 28, 10, false),
    glucose7d: buildGlucoseDaily(110, 7, 108, 20, 0),
    glucose30d: buildGlucoseDaily(110, 30, 109, 22, 0),
    vitals24h: buildVitals24h(110, 128, 82, 70),
    vitals7d: buildVitalsSeries(110, 7, 1, 128, 82, 70, 79.1, 0),
    vitals30d: buildVitalsSeries(110, 15, 2, 127, 81, 70, 79.4, -0.3),
    vitals6m: buildVitalsSeries(110, 12, 15, 129, 82, 71, 80.2, -1.1),
    vitals12m: buildVitalsSeries(110, 12, 30, 130, 83, 71, 80.8, -1.7),
    labs: [
      { id: 'lab-1010-1', date: daysAgoDateStr(180), label: '6 mo', hba1c: 6.1, egfr: 96, uacr: 9, creatinine: 0.88 },
      { id: 'lab-1010-2', date: daysAgoDateStr(26), label: 'Latest', hba1c: 6.0, egfr: 95, uacr: 10, creatinine: 0.89 },
    ],
    retinalScreenings: [],
    events: [
      {
        id: 'ev-1010-1',
        date: daysAgoISO(25, 11),
        type: 'doctor_review',
        title: 'Preventive metabolic check-in completed',
        summary: 'HbA1c steady at 6.0%; lifestyle guidance reinforced.',
        details: 'No diabetes-related microvascular complications indicated. Annual preventive monitoring.',
        actor: 'Dr. Maya Tan',
        reviewStatus: 'Physician Reviewed',
      },
    ],
    carePlan: [
      {
        id: 'cp-1010-1',
        title: '150 min/week aerobic activity & annual HbA1c',
        description: 'Continue lifestyle modifications.',
        category: 'Lifestyle',
        sourceType: 'Physician Approved',
        completed: true,
        dueDate: daysAheadDateStr(120),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(25),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: ['Retinal screening not indicated unless Type 2 diabetes develops.'],
  },

  // 11. Longstanding T2D, stable moderate eGFR 61
  {
    id: 'PT-1011',
    name: 'Hannah Patel',
    age: 63,
    sex: 'Female',
    conditions: ['Type 2 Diabetes (15 yrs)', 'Stable Renal Monitoring'],
    diabetesYears: 15,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'Longstanding T2D, stable moderate eGFR',
    heightCm: 161,
    weightKg: 68.5,
    bmi: 26.4,
    lastVisitDate: daysAgoDateStr(8),
    reviewStatus: 'Physician Reviewed',
    glucose24h: buildGlucose24h(111, 128, 36, 12, true),
    glucose7d: buildGlucoseDaily(111, 7, 130, 24, 0),
    glucose30d: buildGlucoseDaily(111, 30, 131, 26, 0),
    vitals24h: buildVitals24h(111, 124, 76, 69),
    vitals7d: buildVitalsSeries(111, 7, 1, 124, 76, 69, 68.5, 0),
    vitals30d: buildVitalsSeries(111, 15, 2, 124, 76, 69, 68.5, 0),
    vitals6m: buildVitalsSeries(111, 12, 15, 125, 77, 70, 68.7, -0.2),
    vitals12m: buildVitalsSeries(111, 12, 30, 125, 77, 70, 68.8, -0.3),
    labs: [
      { id: 'lab-1011-1', date: daysAgoDateStr(270), label: '9 mo', hba1c: 7.2, egfr: 62, uacr: 28, creatinine: 1.03 },
      { id: 'lab-1011-2', date: daysAgoDateStr(135), label: '4.5 mo', hba1c: 7.1, egfr: 61, uacr: 29, creatinine: 1.04 },
      { id: 'lab-1011-3', date: daysAgoDateStr(9), label: 'Latest', hba1c: 7.0, egfr: 61, uacr: 27, creatinine: 1.04 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1011-1',
        date: daysAgoDateStr(65),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'No apparent diabetic retinopathy.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(61),
        lesions: [],
      },
    ],
    events: [
      {
        id: 'ev-1011-1',
        date: daysAgoISO(8, 15),
        type: 'doctor_review',
        title: 'Quarterly renal & glycemic stability confirmed',
        summary: 'eGFR steady at 61–62 over 9 months; UACR stable at 27 mg/g.',
        details: 'Continued stability without progression. Next routine panel in 3 months.',
        actor: 'Dr. Maya Tan',
        reviewStatus: 'Physician Reviewed',
      },
    ],
    carePlan: [
      {
        id: 'cp-1011-1',
        title: 'Continue quarterly BMP & UACR monitoring',
        description: 'Stable renal plateau documented by clinician.',
        category: 'Laboratory',
        sourceType: 'Physician Approved',
        completed: true,
        dueDate: daysAheadDateStr(82),
        approvedBy: 'Dr. Maya Tan',
        approvedAt: daysAgoDateStr(8),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [],
  },

  // 12. High CGM glucose variability
  {
    id: 'PT-1012',
    name: 'David Kim',
    age: 53,
    sex: 'Male',
    conditions: ['Type 2 Diabetes (4 yrs)', 'High Glycemic Variability'],
    diabetesYears: 4,
    hasCgm: true,
    assignedDoctor: 'Dr. Maya Tan',
    trajectoryTag: 'High glucose variability on CGM',
    heightCm: 175,
    weightKg: 82.6,
    bmi: 27.0,
    lastVisitDate: daysAgoDateStr(21),
    reviewStatus: 'Pending Review',
    glucose24h: buildGlucose24h(112, 140, 96, 36, true),
    glucose7d: buildGlucoseDaily(112, 7, 152, 64, 0),
    glucose30d: buildGlucoseDaily(112, 30, 154, 62, 0),
    vitals24h: buildVitals24h(112, 126, 80, 73),
    vitals7d: buildVitalsSeries(112, 7, 1, 126, 80, 73, 82.6, 0),
    vitals30d: buildVitalsSeries(112, 15, 2, 126, 80, 73, 82.8, -0.2),
    vitals6m: buildVitalsSeries(112, 12, 15, 127, 81, 74, 83.4, -0.8),
    vitals12m: buildVitalsSeries(112, 12, 30, 128, 81, 74, 84.0, -1.4),
    labs: [
      { id: 'lab-1012-1', date: daysAgoDateStr(185), label: '6 mo', hba1c: 7.5, egfr: 89, uacr: 15, creatinine: 0.91 },
      { id: 'lab-1012-2', date: daysAgoDateStr(7), label: 'Latest', hba1c: 7.6, egfr: 88, uacr: 17, creatinine: 0.92 },
    ],
    retinalScreenings: [
      {
        id: 'ret-1012-1',
        date: daysAgoDateStr(150),
        eye: 'Bilateral (OD/OS)',
        exampleVariant: 'normal',
        simulatedObservation: 'No apparent retinopathy.',
        possibleStage: 'No apparent retinopathy',
        isUnconfirmed: false,
        reviewStatus: 'Physician Reviewed',
        doctorAssessment: 'No apparent retinopathy',
        reviewedBy: 'Dr. Maya Tan',
        reviewedAt: daysAgoDateStr(147),
        lesions: [],
      },
    ],
    events: [
      {
        id: 'ev-1012-1',
        date: daysAgoISO(2, 12),
        type: 'glucose',
        title: 'Elevated CGM coefficient of variation (>36%)',
        summary: 'Wide post-meal excursions despite modest HbA1c (7.6%).',
        details: 'Simulated CGM variability analysis highlights post-prandial swings between 78 and 262 mg/dL. Worth reviewing meal composition and timing.',
        actor: 'Aurelix AI (Simulated Monitor)',
        reviewStatus: 'Pending Review',
      },
    ],
    carePlan: [
      {
        id: 'cp-1012-1',
        title: 'Log carbohydrate timing for 7 days',
        description: 'Identify drivers of sharp afternoon and evening glucose spikes.',
        category: 'Monitoring',
        sourceType: 'AI Observation',
        completed: false,
        dueDate: daysAheadDateStr(7),
      },
    ],
    clinicalNotes: [],
    missingDataNotes: [],
  },
];

export const INITIAL_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'apt-1',
    patientId: 'PT-1001',
    date: daysAheadDateStr(4),
    time: '09:30 AM',
    clinician: 'Dr. Maya Tan',
    specialty: 'Endocrinology & Predictive Care',
    type: 'In-Clinic Review',
    status: 'Upcoming',
    location: 'Aurelix Medical Center · Suite 4B',
    notes: 'Review latest HbA1c (7.4%), renal panel (eGFR 72, UACR 44), and bilateral retinal screening.',
  },
  {
    id: 'apt-2',
    patientId: 'PT-1001',
    date: daysAheadDateStr(25),
    time: '02:00 PM',
    clinician: 'Dr. Maya Tan',
    specialty: 'Endocrinology & Predictive Care',
    type: 'Telehealth Check-in',
    status: 'Upcoming',
    location: 'Virtual Clinic Portal',
    notes: 'Follow-up on home blood pressure log and any specialist recommendations.',
  },
  {
    id: 'apt-3',
    patientId: 'PT-1001',
    date: daysAgoDateStr(18),
    time: '10:15 AM',
    clinician: 'Dr. Maya Tan',
    specialty: 'Endocrinology & Predictive Care',
    type: 'In-Clinic Review',
    status: 'Completed',
    location: 'Aurelix Medical Center · Suite 4B',
    notes: 'Ordered repeat HbA1c, renal function, UACR, and annual retinal imaging.',
  },
  {
    id: 'apt-4',
    patientId: 'PT-1001',
    date: daysAgoDateStr(96),
    time: '11:00 AM',
    clinician: 'Dr. Maya Tan',
    specialty: 'Endocrinology & Predictive Care',
    type: 'Retinal & Lab Follow-up',
    status: 'Completed',
    location: 'Aurelix Medical Center · Suite 4B',
    notes: 'Reviewed 3-month glycemic improvements; initiated home BP tracking.',
  },
];

export const INITIAL_MESSAGES: PatientMessage[] = [
  {
    id: 'msg-1',
    patientId: 'PT-1001',
    sender: 'Dr. Maya Tan',
    senderRole: 'doctor',
    timestamp: daysAgoISO(2, 16),
    subject: 'Upcoming review of your lab and eye screening results',
    body: 'Hi Aisha, your latest HbA1c improved to 7.4%, which reflects great consistency. I am reviewing your recent kidney markers and retinal photography ahead of our clinic visit in a few days. Please continue logging your morning blood pressure.',
    unread: true,
  },
  {
    id: 'msg-2',
    patientId: 'PT-1001',
    sender: 'Care Coordination Team',
    senderRole: 'care-coordinator',
    timestamp: daysAgoISO(6, 15),
    subject: 'Retinal screening images uploaded to your record',
    body: 'Your bilateral retinal screening photos have been added to your record and queued for physician review by Dr. Maya Tan. Automated demo observations are preliminary and require doctor confirmation.',
    unread: false,
  },
  {
    id: 'msg-3',
    patientId: 'PT-1001',
    sender: 'Aisha Rahman',
    senderRole: 'patient',
    timestamp: daysAgoISO(12, 10),
    subject: 'Completed fasting lab draw',
    body: 'Hi Dr. Tan, I completed my fasting blood and morning urine sample at the clinic lab today. Looking forward to reviewing the results at my appointment.',
    unread: false,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    timestamp: daysAgoISO(8, 15),
    doctor: 'Dr. Maya Tan',
    patientId: 'PT-1011',
    patientName: 'Hannah Patel',
    reviewAction: 'Quarterly Renal & Glycemic Review Saved',
    previousStatus: 'Under Review',
    newStatus: 'Physician Reviewed',
    notes: 'eGFR stable at 61 mL/min/1.73m²; continue routine quarterly monitoring.',
  },
  {
    id: 'aud-2',
    timestamp: daysAgoISO(9, 14),
    doctor: 'Dr. Maya Tan',
    patientId: 'PT-1007',
    patientName: 'Sofia Alvarez',
    reviewAction: 'Metabolic Trajectory Confirmed',
    previousStatus: 'Pending Review',
    newStatus: 'Physician Reviewed',
    notes: 'HbA1c improved to 6.7%; routine 6-month follow-up.',
  },
  {
    id: 'aud-3',
    timestamp: daysAgoISO(18, 11),
    doctor: 'Dr. Maya Tan',
    patientId: 'PT-1001',
    patientName: 'Aisha Rahman',
    reviewAction: 'Diagnostic Panel & Retinal Screening Ordered',
    previousStatus: 'Pending Review',
    newStatus: 'Physician Reviewed',
    notes: 'Requested repeat UACR, eGFR, HbA1c, and annual retinal photography.',
  },
];
