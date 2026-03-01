// ─── BMI ──────────────────────────────────────────────────────
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm === 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMIStatus(bmi) {
  if (bmi == null) return { label: 'N/A', color: 'text-neutral-600', bg: '' };
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-yellow-400', bg: 'border-yellow-500/20' };
  if (bmi < 25)   return { label: 'Normal',      color: 'text-green-400',  bg: 'border-green-500/20' };
  if (bmi < 30)   return { label: 'Overweight',   color: 'text-orange-400', bg: 'border-orange-500/20' };
  return { label: 'Obese', color: 'text-red-400', bg: 'border-red-500/20' };
}

// ─── SMI (Skeletal Muscle Index) ─────────────────────────────
// SMI = Skeletal Muscle Mass (kg) / Height (m)²
export function calculateSMI(smmKg, heightCm) {
  if (!smmKg || !heightCm || heightCm === 0) return null;
  const heightM = heightCm / 100;
  return smmKg / (heightM * heightM);
}

export function getSMIStatus(smi, isMale = true) {
  if (smi == null) return { label: 'N/A', color: 'text-neutral-600' };
  // General reference ranges (varies by source)
  const low = isMale ? 7.0 : 5.7;
  if (smi < low) return { label: 'Low', color: 'text-orange-400' };
  return { label: 'Normal', color: 'text-green-400' };
}

// ─── BMR (Basal Metabolic Rate) ──────────────────────────────
// Mifflin-St Jeor: 10*weight(kg) + 6.25*height(cm) - 5*age - 161 (F) or +5 (M)
// We auto-calc only if user hasn't logged a direct BMR from InBody
export function calculateBMR(weightKg, heightCm, ageYears, isMale = true) {
  if (!weightKg || !heightCm || !ageYears) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(isMale ? base + 5 : base - 161);
}

// ─── Reference Ranges (for color coding) ─────────────────────
// Returns { status, color } for medical metrics
export function getMedicalStatus(metricType, value) {
  if (value == null) return null;

  const ranges = {
    cholesterolTotal: [
      [0, 200, 'Normal', 'text-green-400'],
      [200, 240, 'Borderline', 'text-yellow-400'],
      [240, Infinity, 'High', 'text-red-400'],
    ],
    cholesterolHDL: [
      [0, 40, 'Low', 'text-red-400'],
      [40, 60, 'Normal', 'text-green-400'],
      [60, Infinity, 'Optimal', 'text-green-400'],
    ],
    cholesterolLDL: [
      [0, 100, 'Optimal', 'text-green-400'],
      [100, 130, 'Near Optimal', 'text-green-400'],
      [130, 160, 'Borderline', 'text-yellow-400'],
      [160, Infinity, 'High', 'text-red-400'],
    ],
    triglycerides: [
      [0, 150, 'Normal', 'text-green-400'],
      [150, 200, 'Borderline', 'text-yellow-400'],
      [200, Infinity, 'High', 'text-red-400'],
    ],
    fastingGlucose: [
      [0, 100, 'Normal', 'text-green-400'],
      [100, 126, 'Pre-diabetic', 'text-yellow-400'],
      [126, Infinity, 'Diabetic', 'text-red-400'],
    ],
    hba1c: [
      [0, 5.7, 'Normal', 'text-green-400'],
      [5.7, 6.5, 'Pre-diabetic', 'text-yellow-400'],
      [6.5, Infinity, 'Diabetic', 'text-red-400'],
    ],
    vitaminD: [
      [0, 20, 'Deficient', 'text-red-400'],
      [20, 30, 'Insufficient', 'text-yellow-400'],
      [30, 100, 'Normal', 'text-green-400'],
      [100, Infinity, 'Excess', 'text-red-400'],
    ],
    vitaminB12: [
      [0, 200, 'Low', 'text-red-400'],
      [200, 300, 'Borderline', 'text-yellow-400'],
      [300, 900, 'Normal', 'text-green-400'],
      [900, Infinity, 'High', 'text-yellow-400'],
    ],
    hemoglobin: [
      [0, 12, 'Low', 'text-red-400'],
      [12, 17.5, 'Normal', 'text-green-400'],
      [17.5, Infinity, 'High', 'text-yellow-400'],
    ],
    tsh: [
      [0, 0.4, 'Low', 'text-yellow-400'],
      [0.4, 4.0, 'Normal', 'text-green-400'],
      [4.0, Infinity, 'High', 'text-yellow-400'],
    ],
  };

  const range = ranges[metricType];
  if (!range) return null;

  for (const [low, high, status, color] of range) {
    if (value >= low && value < high) return { status, color };
  }
  return null;
}
