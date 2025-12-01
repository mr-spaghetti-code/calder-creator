// Unit conversion utilities for real-world mobile construction
// Scene units to metric conversions

// Scale factors
export const SCALE = {
  // 1 scene unit = 10 cm for lengths
  LENGTH_TO_CM: 10,
  // 1 mass unit = 50 grams
  MASS_TO_GRAMS: 50,
}

// Conversion constants
const CM_TO_INCHES = 0.393701
const GRAMS_TO_OZ = 0.035274

// Current unit system - reactive state
let currentUnitSystem = 'metric'
const listeners = new Set()

export function setUnitSystem(system) {
  currentUnitSystem = system
  listeners.forEach(fn => fn(system))
}

export function getUnitSystem() {
  return currentUnitSystem
}

export function subscribeToUnitSystem(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useFreedomUnits() {
  return currentUnitSystem === 'imperial'
}

// Convert scene length to centimeters
export function lengthToCm(sceneUnits) {
  return sceneUnits * SCALE.LENGTH_TO_CM
}

// Convert centimeters to scene length
export function cmToLength(cm) {
  return cm / SCALE.LENGTH_TO_CM
}

// Convert scene mass to grams
export function massToGrams(sceneMass) {
  return sceneMass * SCALE.MASS_TO_GRAMS
}

// Convert grams to scene mass
export function gramsToMass(grams) {
  return grams / SCALE.MASS_TO_GRAMS
}

// Convert scene length to inches
export function lengthToInches(sceneUnits) {
  return lengthToCm(sceneUnits) * CM_TO_INCHES
}

// Convert scene mass to ounces
export function massToOz(sceneMass) {
  return massToGrams(sceneMass) * GRAMS_TO_OZ
}

// Format length with unit (cm or inches)
export function formatLength(sceneUnits, decimals = 1) {
  if (currentUnitSystem === 'imperial') {
    const inches = lengthToInches(sceneUnits)
    return `${inches.toFixed(decimals)} in`
  }
  const cm = lengthToCm(sceneUnits)
  return `${cm.toFixed(decimals)} cm`
}

// Format mass with unit (g or oz)
export function formatMass(sceneMass, decimals = 0) {
  if (currentUnitSystem === 'imperial') {
    const oz = massToOz(sceneMass)
    return `${oz.toFixed(1)} oz`
  }
  const grams = massToGrams(sceneMass)
  return `${grams.toFixed(decimals)}g`
}

// Get raw length value for display (cm or inches)
export function getLength(sceneUnits) {
  if (currentUnitSystem === 'imperial') {
    return lengthToInches(sceneUnits)
  }
  return lengthToCm(sceneUnits)
}

// Get raw mass value for display (grams or oz)
export function getMass(sceneMass) {
  if (currentUnitSystem === 'imperial') {
    return massToOz(sceneMass)
  }
  return massToGrams(sceneMass)
}

// Get length unit label
export function getLengthUnit() {
  return currentUnitSystem === 'imperial' ? 'in' : 'cm'
}

// Get mass unit label
export function getMassUnit() {
  return currentUnitSystem === 'imperial' ? 'oz' : 'g'
}

// Legacy aliases for backward compatibility
export function getCm(sceneUnits) {
  return lengthToCm(sceneUnits)
}

export function getGrams(sceneMass) {
  return massToGrams(sceneMass)
}

// Slider ranges in metric units (converted to scene units internally)
export const METRIC_RANGES = {
  // Arm length: 10cm to 100cm (~4" to 39")
  armLength: {
    min: cmToLength(10),
    max: cmToLength(100),
    step: cmToLength(1),
    metricMin: 10,
    metricMax: 100,
    metricStep: 1,
    imperialMin: 4,
    imperialMax: 39,
    imperialStep: 0.5,
    unit: 'cm',
    imperialUnit: 'in'
  },
  // Wire length: 2cm to 30cm (~0.8" to 12")
  wireLength: {
    min: cmToLength(2),
    max: cmToLength(30),
    step: cmToLength(0.5),
    metricMin: 2,
    metricMax: 30,
    metricStep: 0.5,
    imperialMin: 0.8,
    imperialMax: 12,
    imperialStep: 0.25,
    unit: 'cm',
    imperialUnit: 'in'
  },
  // Weight mass: 5g to 500g (~0.2oz to 17.6oz)
  weightMass: {
    min: gramsToMass(5),
    max: gramsToMass(500),
    step: gramsToMass(5),
    metricMin: 5,
    metricMax: 500,
    metricStep: 5,
    imperialMin: 0.2,
    imperialMax: 17.6,
    imperialStep: 0.2,
    unit: 'g',
    imperialUnit: 'oz'
  },
  // Weight size (diameter): 1cm to 10cm (~0.4" to 4")
  weightSize: {
    min: cmToLength(1),
    max: cmToLength(10),
    step: cmToLength(0.5),
    metricMin: 1,
    metricMax: 10,
    metricStep: 0.5,
    imperialMin: 0.4,
    imperialMax: 4,
    imperialStep: 0.2,
    unit: 'cm',
    imperialUnit: 'in'
  }
}

// Get display values for range based on current unit system
export function getRangeDisplay(rangeKey) {
  const range = METRIC_RANGES[rangeKey]
  if (!range) return null
  
  if (currentUnitSystem === 'imperial') {
    return {
      min: range.imperialMin,
      max: range.imperialMax,
      step: range.imperialStep,
      unit: range.imperialUnit
    }
  }
  return {
    min: range.metricMin,
    max: range.metricMax,
    step: range.metricStep,
    unit: range.unit
  }
}

// Wire gauge recommendations based on total supported weight
export function getRecommendedWireGauge(totalWeightGrams) {
  if (totalWeightGrams < 100) return { gauge: '24 AWG', diameter: '0.5mm' }
  if (totalWeightGrams < 250) return { gauge: '22 AWG', diameter: '0.6mm' }
  if (totalWeightGrams < 500) return { gauge: '20 AWG', diameter: '0.8mm' }
  if (totalWeightGrams < 1000) return { gauge: '18 AWG', diameter: '1.0mm' }
  return { gauge: '16 AWG', diameter: '1.3mm' }
}

// Arm material recommendations based on length
export function getRecommendedArmMaterial(lengthCm) {
  if (lengthCm <= 30) {
    return { material: 'Wooden dowel or brass rod', diameter: '3-4mm' }
  }
  if (lengthCm <= 60) {
    return { material: 'Wooden dowel or aluminum rod', diameter: '5-6mm' }
  }
  return { material: 'Wooden dowel or aluminum tube', diameter: '8-10mm' }
}

// Estimate wire weight per cm (approximate for thin craft wire)
export const WIRE_WEIGHT_PER_CM = 0.05 // grams per cm (approximate)

