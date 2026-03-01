// ─── Body Metrics ─────────────────────────────────────────────
export const METRIC_TYPES = {
  // Core
  weight:       { label: 'Weight',          unit: 'kg',     group: 'core' },
  height:       { label: 'Height',          unit: 'cm',     group: 'core' },
  bodyFat:      { label: 'Body Fat',        unit: '%',      group: 'core' },
  waist:        { label: 'Waist',           unit: 'cm',     group: 'core' },

  // InBody / Composition
  smm:          { label: 'Skeletal Muscle', unit: 'kg',     group: 'inbody' },
  bmr:          { label: 'BMR',             unit: 'kcal',   group: 'inbody' },
  totalBodyWater: { label: 'Total Body Water', unit: 'L',   group: 'inbody' },
  protein:      { label: 'Protein',         unit: 'kg',     group: 'inbody' },
  minerals:     { label: 'Minerals',        unit: 'kg',     group: 'inbody' },
  smi:          { label: 'SMI',             unit: 'kg/m²',  group: 'inbody' },
  visceralFat:  { label: 'Visceral Fat',    unit: 'level',  group: 'inbody' },
  leanBodyMass: { label: 'Lean Body Mass',  unit: 'kg',     group: 'inbody' },

  // Measurements — Upper
  neck:         { label: 'Neck',            unit: 'cm',     group: 'upper' },
  chest:        { label: 'Chest',           unit: 'cm',     group: 'upper' },
  shoulders:    { label: 'Shoulders',       unit: 'cm',     group: 'upper' },

  // Measurements — Arms
  bicepLeft:    { label: 'Bicep (L)',       unit: 'cm',     group: 'arms' },
  bicepRight:   { label: 'Bicep (R)',       unit: 'cm',     group: 'arms' },
  forearmLeft:  { label: 'Forearm (L)',     unit: 'cm',     group: 'arms' },
  forearmRight: { label: 'Forearm (R)',     unit: 'cm',     group: 'arms' },

  // Measurements — Lower
  hips:         { label: 'Hips',            unit: 'cm',     group: 'lower' },
  thighLeft:    { label: 'Thigh (L)',       unit: 'cm',     group: 'lower' },
  thighRight:   { label: 'Thigh (R)',       unit: 'cm',     group: 'lower' },
  calfLeft:     { label: 'Calf (L)',        unit: 'cm',     group: 'lower' },
  calfRight:    { label: 'Calf (R)',        unit: 'cm',     group: 'lower' },

  // Blood — Lipids
  cholesterolTotal: { label: 'Total Cholesterol', unit: 'mg/dL', group: 'lipids' },
  cholesterolHDL:   { label: 'HDL',               unit: 'mg/dL', group: 'lipids' },
  cholesterolLDL:   { label: 'LDL',               unit: 'mg/dL', group: 'lipids' },
  triglycerides:    { label: 'Triglycerides',      unit: 'mg/dL', group: 'lipids' },

  // Blood — Sugar & Metabolic
  fastingGlucose: { label: 'Fasting Glucose',  unit: 'mg/dL', group: 'metabolic' },
  hba1c:          { label: 'HbA1c',            unit: '%',      group: 'metabolic' },
  insulin:        { label: 'Insulin',           unit: 'µU/mL',  group: 'metabolic' },
  uricAcid:       { label: 'Uric Acid',        unit: 'mg/dL', group: 'metabolic' },
  creatinine:     { label: 'Creatinine',        unit: 'mg/dL', group: 'metabolic' },

  // Blood — Vitamins & Minerals
  vitaminD:   { label: 'Vitamin D',   unit: 'ng/mL',  group: 'vitamins' },
  vitaminB12: { label: 'Vitamin B12', unit: 'pg/mL',  group: 'vitamins' },
  iron:       { label: 'Iron',        unit: 'µg/dL',  group: 'vitamins' },
  ferritin:   { label: 'Ferritin',    unit: 'ng/mL',  group: 'vitamins' },
  calcium:    { label: 'Calcium',     unit: 'mg/dL',  group: 'vitamins' },

  // Blood — General
  hemoglobin: { label: 'Hemoglobin',  unit: 'g/dL',   group: 'blood' },
  rbc:        { label: 'RBC',         unit: 'M/µL',   group: 'blood' },
  wbc:        { label: 'WBC',         unit: 'K/µL',   group: 'blood' },
  platelets:  { label: 'Platelets',   unit: 'K/µL',   group: 'blood' },
  tsh:        { label: 'TSH',         unit: 'µIU/mL', group: 'blood' },
  testosterone: { label: 'Testosterone', unit: 'ng/dL', group: 'blood' },
};

// Auto-calculated metrics (not stored, derived on the fly)
export const COMPUTED_METRICS = ['bmi', 'smiComputed'];

export const METRIC_GROUPS = {
  core:      { label: 'Core Metrics',        types: ['weight', 'height', 'bodyFat', 'waist'] },
  inbody:    { label: 'Body Composition',    types: ['smm', 'bmr', 'totalBodyWater', 'protein', 'minerals', 'smi', 'visceralFat', 'leanBodyMass'] },
  upper:     { label: 'Upper Body',          types: ['neck', 'chest', 'shoulders'] },
  arms:      { label: 'Arms',               types: ['bicepLeft', 'bicepRight', 'forearmLeft', 'forearmRight'] },
  lower:     { label: 'Lower Body',          types: ['hips', 'thighLeft', 'thighRight', 'calfLeft', 'calfRight'] },
  lipids:    { label: 'Lipid Panel',         types: ['cholesterolTotal', 'cholesterolHDL', 'cholesterolLDL', 'triglycerides'] },
  metabolic: { label: 'Sugar & Metabolic',   types: ['fastingGlucose', 'hba1c', 'insulin', 'uricAcid', 'creatinine'] },
  vitamins:  { label: 'Vitamins & Minerals', types: ['vitaminD', 'vitaminB12', 'iron', 'ferritin', 'calcium'] },
  blood:     { label: 'Blood Panel',         types: ['hemoglobin', 'rbc', 'wbc', 'platelets', 'tsh', 'testosterone'] },
};

// Groups shown by default vs under "Advanced"
export const DEFAULT_GROUPS = ['core', 'inbody', 'upper', 'arms', 'lower'];
export const ADVANCED_GROUPS = ['lipids', 'metabolic', 'vitamins', 'blood'];

// ─── Exercise Library ────────────────────────────────────────
export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
];

export const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Resistance Band',
];

export const MOCK_EXERCISES = [
  { id: 'ex-1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'ex-2', name: 'Squat', muscleGroup: 'Quads', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'ex-3', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Advanced' },
  { id: 'ex-4', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'ex-5', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'ex-6', name: 'Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', difficulty: 'Intermediate' },
  { id: 'ex-7', name: 'Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { id: 'ex-8', name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: 'ex-9', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', difficulty: 'Beginner' },
  { id: 'ex-10', name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', difficulty: 'Beginner' },
  { id: 'ex-11', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', difficulty: 'Beginner' },
  { id: 'ex-12', name: 'Dumbbell Fly', muscleGroup: 'Chest', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: 'ex-13', name: 'Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: 'ex-14', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { id: 'ex-15', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'ex-16', name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Barbell', difficulty: 'Intermediate' },
  { id: 'ex-17', name: 'Calf Raise', muscleGroup: 'Calves', equipment: 'Machine', difficulty: 'Beginner' },
  { id: 'ex-18', name: 'Cable Crunch', muscleGroup: 'Core', equipment: 'Cable', difficulty: 'Beginner' },
  { id: 'ex-19', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { id: 'ex-20', name: 'Skull Crusher', muscleGroup: 'Triceps', equipment: 'Barbell', difficulty: 'Intermediate' },
];
