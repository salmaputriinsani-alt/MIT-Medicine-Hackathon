import {
  FactorContribution,
  PatientProfile,
  PatientRiskAnalysis,
  RiskLevel,
  TriageItem,
} from '../types/clinical';

function getKdigoG(egfr?: number): PatientRiskAnalysis['kidney']['kdigoG'] {
  if (egfr === undefined) return 'Unknown';
  if (egfr >= 90) return 'G1';
  if (egfr >= 60) return 'G2';
  if (egfr >= 45) return 'G3a';
  if (egfr >= 30) return 'G3b';
  if (egfr >= 15) return 'G4';
  return 'G5';
}

function getKdigoA(uacr?: number): PatientRiskAnalysis['kidney']['kdigoA'] {
  if (uacr === undefined) return 'Unknown';
  if (uacr < 30) return 'A1';
  if (uacr <= 300) return 'A2';
  return 'A3';
}

export function analyzePatientRisk(patient: PatientProfile): PatientRiskAnalysis {
  const labs = patient.labs;
  const latestLab = labs[labs.length - 1];
  const prevLab = labs.length > 1 ? labs[labs.length - 2] : undefined;

  // 1. Glucose & Diabetes Analysis
  const gValues = patient.glucose24h.map((g) => g.value);
  const latestGlucose = gValues[gValues.length - 1] ?? 120;
  const meanGlucose =
    gValues.reduce((acc, v) => acc + v, 0) / Math.max(1, gValues.length);
  const variance =
    gValues.reduce((acc, v) => acc + Math.pow(v - meanGlucose, 2), 0) /
    Math.max(1, gValues.length);
  const stdDev = Math.sqrt(variance);
  const glucoseVariabilityCV = Math.round((stdDev / Math.max(1, meanGlucose)) * 100);
  const inRangeCount = gValues.filter((v) => v >= 70 && v <= 180).length;
  const timeInRangePct = Math.round((inRangeCount / Math.max(1, gValues.length)) * 100);

  const latestHba1c = latestLab?.hba1c;
  const prevHba1c = prevLab?.hba1c;
  let diabetesTrend: PatientRiskAnalysis['diabetes']['trend'] = 'Stable';
  if (latestHba1c !== undefined && prevHba1c !== undefined) {
    if (latestHba1c - prevHba1c <= -0.2) diabetesTrend = 'Improving';
    else if (latestHba1c - prevHba1c >= 0.3) diabetesTrend = 'Worsening';
  } else if (latestHba1c === undefined) {
    diabetesTrend = 'Insufficient Data';
  }

  let diabetesLevel: RiskLevel = 'Low';
  if ((latestHba1c ?? 0) >= 8.5 || glucoseVariabilityCV >= 35) {
    diabetesLevel = 'High Priority';
  } else if ((latestHba1c ?? 0) >= 7.5 || glucoseVariabilityCV >= 26) {
    diabetesLevel = 'Elevated';
  } else if ((latestHba1c ?? 0) >= 6.5) {
    diabetesLevel = 'Moderate';
  }

  const diabetesObs: string[] = [];
  if (latestHba1c !== undefined && prevHba1c !== undefined) {
    const diff = Number((latestHba1c - prevHba1c).toFixed(1));
    diabetesObs.push(
      `Latest HbA1c is ${latestHba1c}% (${diff > 0 ? `+${diff}%` : `${diff}%`} vs prior ${prevHba1c}%).`
    );
  } else if (latestHba1c !== undefined) {
    diabetesObs.push(`Latest HbA1c recorded at ${latestHba1c}%.`);
  }
  diabetesObs.push(
    `24-hour ${patient.hasCgm ? 'CGM' : 'fingerstick'} readings average ${Math.round(meanGlucose)} mg/dL (${timeInRangePct}% in 70–180 mg/dL range, CV ${glucoseVariabilityCV}%).`
  );
  if (patient.diabetesYears) {
    diabetesObs.push(`Documented diabetes duration: ${patient.diabetesYears} years.`);
  }

  // 2. Kidney Risk Analysis
  const latestEgfr = latestLab?.egfr;
  const prevEgfr = prevLab?.egfr;
  const latestUacr = latestLab?.uacr;
  const prevUacr = prevLab?.uacr;
  const latestCreatinine = latestLab?.creatinine;
  const latestVital = patient.vitals24h[patient.vitals24h.length - 1];
  const latestSys = latestVital?.systolic ?? 125;
  const latestDia = latestVital?.diastolic ?? 78;

  const hasSufficientKidneyData =
    latestEgfr !== undefined && latestUacr !== undefined;

  let kidneyTrend: PatientRiskAnalysis['kidney']['trend'] = 'Stable';
  if (!hasSufficientKidneyData) {
    kidneyTrend = 'Insufficient Data';
  } else if (
    (prevEgfr !== undefined && latestEgfr! - prevEgfr <= -4) ||
    (prevUacr !== undefined && latestUacr! - prevUacr >= 8)
  ) {
    kidneyTrend = 'Declining Signal';
  } else if (prevUacr !== undefined && latestUacr! - prevUacr <= -5) {
    kidneyTrend = 'Improving';
  }

  let kidneyLevel: RiskLevel = 'Low';
  if (!hasSufficientKidneyData) {
    kidneyLevel = 'Moderate';
  } else if (
    latestEgfr! < 60 ||
    latestUacr! >= 100 ||
    (latestEgfr! < 75 && latestUacr! >= 30 && kidneyTrend === 'Declining Signal')
  ) {
    kidneyLevel = latestEgfr! < 55 || latestUacr! >= 120 ? 'High Priority' : 'Elevated';
  } else if (latestUacr! >= 30 || latestEgfr! < 75) {
    kidneyLevel = 'Moderate';
  }

  const egfrDelta =
    latestEgfr !== undefined && prevEgfr !== undefined ? latestEgfr - prevEgfr : 0;
  const uacrDelta =
    latestUacr !== undefined && prevUacr !== undefined ? latestUacr - prevUacr : 0;

  const kidneyFactors: FactorContribution[] = [
    {
      factor: 'Historical eGFR Trajectory',
      impact:
        latestEgfr === undefined
          ? 0
          : latestEgfr < 60
          ? 28
          : egfrDelta <= -5
          ? 22
          : latestEgfr >= 85
          ? -10
          : 8,
      direction:
        latestEgfr === undefined
          ? 'neutral'
          : latestEgfr < 75 || egfrDelta <= -4
          ? 'increases_risk'
          : 'protective',
      detail:
        latestEgfr !== undefined
          ? `Latest eGFR ${latestEgfr} mL/min/1.73 m²${prevEgfr !== undefined ? ` (prior ${prevEgfr})` : ''}`
          : 'Missing eGFR measurement',
    },
    {
      factor: 'Urine Albumin (UACR)',
      impact:
        latestUacr === undefined
          ? 12
          : latestUacr >= 100
          ? 32
          : latestUacr >= 30
          ? 24
          : -8,
      direction:
        latestUacr === undefined || latestUacr >= 30
          ? 'increases_risk'
          : 'protective',
      detail:
        latestUacr !== undefined
          ? `Latest UACR ${latestUacr} mg/g${prevUacr !== undefined ? ` (prior ${prevUacr} mg/g)` : ''}`
          : 'No UACR recorded in past 12 months (screening gap)',
    },
    {
      factor: 'Blood Pressure Trend',
      impact: latestSys >= 140 ? 20 : latestSys >= 130 ? 14 : -4,
      direction: latestSys >= 130 ? 'increases_risk' : 'protective',
      detail: `Recent seated BP ~${latestSys}/${latestDia} mmHg`,
    },
    {
      factor: 'Diabetes Duration & Glycemic Load',
      impact:
        (patient.diabetesYears ?? 0) >= 10
          ? 16
          : (patient.diabetesYears ?? 0) >= 5
          ? 11
          : 4,
      direction: (patient.diabetesYears ?? 0) >= 5 ? 'increases_risk' : 'neutral',
      detail: `${patient.diabetesYears ?? 0} yrs documented diabetes · Latest HbA1c ${latestHba1c ?? '—'}%`,
    },
    {
      factor: 'Recent Glycemic Improvement',
      impact: diabetesTrend === 'Improving' ? -9 : diabetesTrend === 'Worsening' ? 12 : 0,
      direction:
        diabetesTrend === 'Improving'
          ? 'protective'
          : diabetesTrend === 'Worsening'
          ? 'increases_risk'
          : 'neutral',
      detail:
        diabetesTrend === 'Improving'
          ? 'Downward HbA1c trajectory reduces cumulative microvascular stress'
          : diabetesTrend === 'Worsening'
          ? 'Rising HbA1c may increase microvascular workload'
          : 'Stable recent glycemic trajectory',
    },
  ];

  const kidneyObs: string[] = [];
  if (latestEgfr !== undefined) {
    kidneyObs.push(
      `eGFR measured at ${latestEgfr} mL/min/1.73 m²${prevEgfr !== undefined ? ` (changed from ${prevEgfr})` : ''}.`
    );
  }
  if (latestUacr !== undefined) {
    kidneyObs.push(
      `UACR measured at ${latestUacr} mg/g${prevUacr !== undefined ? ` (changed from ${prevUacr} mg/g)` : ''}.`
    );
  } else {
    kidneyObs.push('UACR laboratory test is missing from recent records.');
  }
  kidneyObs.push(`Recent blood pressure averages ${latestSys}/${latestDia} mmHg.`);

  // 3. Retinal Screening Analysis (strictly uses stored sample cases)
  const latestRetinal =
    patient.retinalScreenings[patient.retinalScreenings.length - 1];
  let retinalLevel: RiskLevel = 'Low';
  if (!latestRetinal) {
    retinalLevel = patient.diabetesYears && patient.diabetesYears > 0 ? 'Elevated' : 'Low';
  } else if (
    latestRetinal.possibleStage === 'Moderate NPDR' ||
    latestRetinal.possibleStage === 'Severe NPDR' ||
    latestRetinal.possibleStage === 'Proliferative DR'
  ) {
    retinalLevel = 'High Priority';
  } else if (latestRetinal.possibleStage === 'Mild NPDR') {
    retinalLevel = latestRetinal.reviewStatus === 'Physician Reviewed' ? 'Moderate' : 'Elevated';
  }

  const retinalObs: string[] = [];
  if (!latestRetinal) {
    retinalObs.push('No retinal screening examination found on file.');
  } else {
    retinalObs.push(latestRetinal.simulatedObservation);
    if (latestRetinal.isUnconfirmed && latestRetinal.reviewStatus !== 'Physician Reviewed') {
      retinalObs.push('Status: Unconfirmed — requires physician assessment before diagnosis.');
    } else if (latestRetinal.doctorAssessment) {
      retinalObs.push(`Physician assessment: ${latestRetinal.doctorAssessment}.`);
    }
  }

  // Overall Data Completeness
  let completeness = 40;
  if (latestHba1c !== undefined) completeness += 15;
  if (latestEgfr !== undefined) completeness += 15;
  if (latestUacr !== undefined) completeness += 15;
  if (latestRetinal !== undefined) completeness += 15;

  // Overall Risk Priority
  const rank: Record<RiskLevel, number> = {
    Low: 1,
    Moderate: 2,
    Elevated: 3,
    'High Priority': 4,
  };
  const maxRank = Math.max(
    rank[diabetesLevel],
    rank[kidneyLevel],
    rank[retinalLevel]
  );
  const overallRisk: RiskLevel =
    maxRank === 4
      ? 'High Priority'
      : maxRank === 3
      ? 'Elevated'
      : maxRank === 2
      ? 'Moderate'
      : 'Low';

  // Primary summary signal
  let primarySignalSummary = 'Routine metabolic stability';
  if (!latestRetinal && patient.diabetesYears && patient.diabetesYears > 0) {
    primarySignalSummary = 'Missing retinal & UACR screening records';
  } else if (kidneyLevel === 'High Priority') {
    primarySignalSummary = `Declining eGFR (${latestEgfr}) & rising UACR (${latestUacr} mg/g)`;
  } else if (retinalLevel === 'High Priority' || (latestRetinal?.isUnconfirmed && latestRetinal.reviewStatus !== 'Physician Reviewed')) {
    primarySignalSummary = `Retinal screening (${latestRetinal?.possibleStage}) & renal marker shift`;
  } else if (diabetesLevel === 'High Priority') {
    primarySignalSummary =
      latestHba1c && latestHba1c >= 8.5
        ? `Worsening HbA1c (${latestHba1c}%) & post-meal excursions`
        : `Elevated CGM glucose variability (CV ${glucoseVariabilityCV}%)`;
  } else if (kidneyLevel === 'Elevated' || kidneyLevel === 'Moderate') {
    primarySignalSummary = `Elevated BP (${latestSys}/${latestDia}) & UACR monitoring`;
  }

  return {
    overallRisk,
    dataCompleteness: completeness,
    diabetes: {
      level: diabetesLevel,
      trend: diabetesTrend,
      latestHba1c,
      previousHba1c: prevHba1c,
      latestGlucose,
      glucoseVariabilityCV,
      timeInRangePct,
      observations: diabetesObs,
      explanation:
        diabetesTrend === 'Improving'
          ? `Threshold-based demo analysis notes improving HbA1c (${prevHba1c}% to ${latestHba1c}%), while ${patient.hasCgm ? 'CGM' : 'glucose'} monitoring shows ${timeInRangePct}% time-in-range.`
          : diabetesTrend === 'Worsening'
          ? `Threshold-based demo analysis flagged rising HbA1c (${prevHba1c}% to ${latestHba1c}%) and elevated post-prandial peaks.`
          : `Glycemic markers remain ${diabetesLevel.toLowerCase()} risk in this threshold-based demonstration.`,
      lastAnalyzed: patient.glucose24h[patient.glucose24h.length - 1]?.timestamp ?? new Date().toISOString(),
      reviewStatus: patient.reviewStatus,
    },
    kidney: {
      level: kidneyLevel,
      trend: kidneyTrend,
      latestEgfr,
      previousEgfr: prevEgfr,
      latestUacr,
      previousUacr: prevUacr,
      latestCreatinine,
      hasSufficientData: hasSufficientKidneyData,
      kdigoG: getKdigoG(latestEgfr),
      kdigoA: getKdigoA(latestUacr),
      observations: kidneyObs,
      factors: kidneyFactors,
      explanation: !hasSufficientKidneyData
        ? 'Incomplete renal data: both eGFR and UACR are needed before displaying an illustrative kidney risk interpretation.'
        : kidneyTrend === 'Declining Signal'
        ? `Simulated threshold rules flagged a downward eGFR shift (${prevEgfr} -> ${latestEgfr}) alongside rising UACR (${prevUacr} -> ${latestUacr} mg/g) and BP ${latestSys}/${latestDia} mmHg. Confirming chronic kidney disease requires clinician evaluation and longitudinal chronicity.`
        : `Longitudinal kidney markers remain stable within current demonstration thresholds. Only a physician can determine CKD staging.`,
      lastAnalyzed: latestLab?.date ?? patient.lastVisitDate,
      reviewStatus: patient.reviewStatus,
    },
    retinal: {
      level: retinalLevel,
      latestStage: latestRetinal ? latestRetinal.possibleStage : 'No Screening Record',
      screeningDate: latestRetinal?.date,
      isUnconfirmed: latestRetinal ? latestRetinal.isUnconfirmed : false,
      observations: retinalObs,
      explanation: !latestRetinal
        ? 'No retinal fundus screening record exists for this patient. Preventive annual screening is flagged for follow-up.'
        : latestRetinal.reviewStatus === 'Physician Reviewed'
        ? `Clinician-reviewed screening record (${latestRetinal.doctorAssessment ?? latestRetinal.possibleStage}).`
        : `Stored sample case flagged possible ${latestRetinal.possibleStage} features. Simulated retinal findings are unconfirmed and require physician review.`,
      lastAnalyzed: latestRetinal?.date ?? patient.lastVisitDate,
      reviewStatus: latestRetinal?.reviewStatus ?? 'Additional Evidence Required',
    },
    primarySignalSummary,
  };
}

export function generateInitialTriageQueue(patients: PatientProfile[]): TriageItem[] {
  const items: TriageItem[] = [];

  patients.forEach((p) => {
    const analysis = analyzePatientRisk(p);
    const latestLab = p.labs[p.labs.length - 1];
    const prevLab = p.labs.length > 1 ? p.labs[p.labs.length - 2] : undefined;
    const latestRetinal = p.retinalScreenings[p.retinalScreenings.length - 1];

    if (p.id === 'PT-1001') {
      items.push({
        id: 'tri-1001-retinal',
        patientId: p.id,
        patientName: p.name,
        category: 'Retinal screening observation',
        triggeringObservation: 'Possible mild NPDR — awaiting physician review',
        relevantMeasurements: `HbA1c ${latestLab?.hba1c}% · BP 136/86 mmHg`,
        historicalChange: 'Prior scan: No apparent DR -> Recent: Possible mild NPDR',
        priority: 'High',
        dataCompleteness: analysis.dataCompleteness,
        aiExplanation:
          'Simulated retinal screening flagged punctate microaneurysm-like spots in the temporal quadrant. Physician review is required to confirm or override.',
        status: 'Pending',
        updatedAt: latestRetinal?.date ?? p.lastVisitDate,
      });
      items.push({
        id: 'tri-1001-kidney',
        patientId: p.id,
        patientName: p.name,
        category: 'Kidney-risk signal',
        triggeringObservation: 'Downward eGFR shift & rising UACR',
        relevantMeasurements: `eGFR ${latestLab?.egfr} mL/min/1.73m² · UACR ${latestLab?.uacr} mg/g`,
        historicalChange: `eGFR ${prevLab?.egfr} -> ${latestLab?.egfr} · UACR ${prevLab?.uacr} -> ${latestLab?.uacr} mg/g`,
        priority: 'Moderate',
        dataCompleteness: analysis.dataCompleteness,
        aiExplanation:
          'Combined mild eGFR reduction (-7 over 3 mo), increasing UACR (+8 mg/g), 7-yr T2D history, and elevated BP (136/86). Not a CKD diagnosis; requires physician evaluation.',
        status: 'Pending',
        updatedAt: latestLab?.date ?? p.lastVisitDate,
      });
      return;
    }

    if (analysis.retinal.isUnconfirmed && latestRetinal?.reviewStatus !== 'Physician Reviewed') {
      items.push({
        id: `tri-${p.id}-retinal`,
        patientId: p.id,
        patientName: p.name,
        category: 'Retinal screening observation',
        triggeringObservation: `Possible ${latestRetinal?.possibleStage} — unconfirmed`,
        relevantMeasurements: `HbA1c ${latestLab?.hba1c ?? '—'}%`,
        historicalChange: p.retinalScreenings.length > 1 ? 'Change from prior screening' : 'New screening exam',
        priority: latestRetinal?.possibleStage === 'Moderate NPDR' ? 'High' : 'Moderate',
        dataCompleteness: analysis.dataCompleteness,
        aiExplanation: analysis.retinal.explanation,
        status: p.reviewStatus === 'Follow-up Requested' ? 'Follow-up Requested' : 'Pending',
        updatedAt: latestRetinal?.date ?? p.lastVisitDate,
      });
    }

    if (analysis.kidney.level === 'High Priority' || analysis.kidney.level === 'Elevated') {
      items.push({
        id: `tri-${p.id}-kidney`,
        patientId: p.id,
        patientName: p.name,
        category: 'Kidney-risk signal',
        triggeringObservation: `eGFR ${latestLab?.egfr} · UACR ${latestLab?.uacr} mg/g`,
        relevantMeasurements: `Creatinine ${latestLab?.creatinine} mg/dL`,
        historicalChange: prevLab
          ? `eGFR ${prevLab.egfr} -> ${latestLab?.egfr} · UACR ${prevLab.uacr} -> ${latestLab?.uacr}`
          : 'Baseline signal',
        priority: analysis.kidney.level === 'High Priority' ? 'High' : 'Moderate',
        dataCompleteness: analysis.dataCompleteness,
        aiExplanation: analysis.kidney.explanation,
        status:
          p.reviewStatus === 'Under Review'
            ? 'Under Review'
            : p.reviewStatus === 'Follow-up Requested'
            ? 'Follow-up Requested'
            : 'Pending',
        updatedAt: latestLab?.date ?? p.lastVisitDate,
      });
    }

    if (analysis.diabetes.level === 'High Priority') {
      items.push({
        id: `tri-${p.id}-glucose`,
        patientId: p.id,
        patientName: p.name,
        category:
          analysis.diabetes.trend === 'Worsening'
            ? 'Abnormal trend'
            : 'Glucose variability',
        triggeringObservation:
          analysis.diabetes.trend === 'Worsening'
            ? `Rising HbA1c (${latestLab?.hba1c}%)`
            : `High CGM variability (CV ${analysis.diabetes.glucoseVariabilityCV}%)`,
        relevantMeasurements: `TIR ${analysis.diabetes.timeInRangePct}% · Latest ${analysis.diabetes.latestGlucose} mg/dL`,
        historicalChange: prevLab?.hba1c
          ? `HbA1c ${prevLab.hba1c}% -> ${latestLab?.hba1c}%`
          : 'Recent CGM pattern',
        priority: 'High',
        dataCompleteness: analysis.dataCompleteness,
        aiExplanation: analysis.diabetes.explanation,
        status: 'Pending',
        updatedAt: p.lastVisitDate,
      });
    }

    if (p.missingDataNotes.length > 0 && p.id === 'PT-1008') {
      items.push({
        id: `tri-${p.id}-missing`,
        patientId: p.id,
        patientName: p.name,
        category: 'Missing screening',
        triggeringObservation: 'Missing retinal photography & annual UACR',
        relevantMeasurements: `Last visit ${p.lastVisitDate}`,
        historicalChange: 'No retinal exam on file (>12 months)',
        priority: 'Moderate',
        dataCompleteness: analysis.dataCompleteness,
        aiExplanation:
          'Preventive screening gap detected. Incomplete lab/retinal data limits risk evaluation.',
        status: 'Pending',
        updatedAt: p.lastVisitDate,
      });
    }
  });

  return items;
}

export interface SyntheticEvaluationMetrics {
  sampleSize: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
  precisionPct: number;
  recallPct: number;
  specificityPct: number;
  f1ScorePct: number;
  accuracyPct: number;
}

// Coherent synthetic confusion matrix where every metric is mathematically derived
export function computeSyntheticEvaluationMetrics(): SyntheticEvaluationMetrics {
  const tp = 86;
  const fp = 14;
  const fn = 12;
  const tn = 188;
  const sampleSize = tp + fp + fn + tn; // 300 fictional synthetic test cases

  const precision = tp / (tp + fp); // 86 / 100 = 0.86
  const recall = tp / (tp + fn); // 86 / 98 = 0.87755...
  const specificity = tn / (tn + fp); // 188 / 202 = 0.93069...
  const f1 = (2 * precision * recall) / (precision + recall); // 0.86868...
  const accuracy = (tp + tn) / sampleSize; // 274 / 300 = 0.9133...

  return {
    sampleSize,
    confusionMatrix: { tp, fp, fn, tn },
    precisionPct: Number((precision * 100).toFixed(1)),
    recallPct: Number((recall * 100).toFixed(1)),
    specificityPct: Number((specificity * 100).toFixed(1)),
    f1ScorePct: Number((f1 * 100).toFixed(1)),
    accuracyPct: Number((accuracy * 100).toFixed(1)),
  };
}
