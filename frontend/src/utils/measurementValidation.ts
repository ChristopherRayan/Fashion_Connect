// Measurement validation utility for custom orders
// All measurements are in inches

export interface MeasurementRange {
  min: number;
  max: number;
  label: string;
}

// Realistic measurement ranges in inches for adults
export const MEASUREMENT_RANGES: Record<string, MeasurementRange> = {
  // Torso measurements
  chest: { min: 28, max: 60, label: 'Chest' },
  bust: { min: 28, max: 60, label: 'Bust' },
  waist: { min: 20, max: 50, label: 'Waist' },
  hip: { min: 30, max: 65, label: 'Hip' },
  
  // Upper body measurements
  shoulder: { min: 12, max: 24, label: 'Shoulder Width' },
  sleeve: { min: 20, max: 38, label: 'Sleeve Length' },
  neck: { min: 12, max: 20, label: 'Neck' },
  
  // Length measurements
  jacket_length: { min: 20, max: 36, label: 'Jacket Length' },
  dress_length: { min: 28, max: 65, label: 'Dress Length' },
  shirt_length: { min: 20, max: 35, label: 'Shirt Length' },
  train_length: { min: 6, max: 120, label: 'Train Length' }, // Wedding dresses can have very long trains
  
  // Lower body measurements
  trouser_waist: { min: 20, max: 50, label: 'Trouser Waist' },
  trouser_length: { min: 26, max: 50, label: 'Trouser Length' },
  inseam: { min: 26, max: 40, label: 'Inseam' },
  thigh: { min: 16, max: 35, label: 'Thigh' },
  
  // General measurements
  length: { min: 12, max: 65, label: 'Length' },
  height: { min: 48, max: 84, label: 'Height' }, // 4 feet to 7 feet
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates a measurement value
 */
export const validateMeasurement = (
  field: string, 
  value: string | number, 
  isRequired: boolean = false
): ValidationResult => {
  // Convert to string for processing
  const stringValue = String(value).trim();
  
  // Check if empty
  if (!stringValue) {
    if (isRequired) {
      return { isValid: false, error: 'This measurement is required' };
    }
    return { isValid: true };
  }
  
  // Check for non-numeric characters (except decimal point)
  if (!/^\d*\.?\d*$/.test(stringValue)) {
    return { isValid: false, error: 'Please enter numbers only (no letters or special characters)' };
  }
  
  // Convert to number
  const numValue = parseFloat(stringValue);
  
  // Check for invalid numbers
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  // Check for zero or negative values
  if (numValue <= 0) {
    return { isValid: false, error: 'Measurement must be greater than 0' };
  }
  
  // Check for unrealistic decimal precision (more than 2 decimal places)
  if (stringValue.includes('.') && stringValue.split('.')[1].length > 2) {
    return { isValid: false, error: 'Please use at most 2 decimal places (e.g., 36.75)' };
  }
  
  // Get measurement range for this field
  const range = MEASUREMENT_RANGES[field];
  if (!range) {
    // For unknown fields, just check basic constraints
    if (numValue > 200) {
      return { isValid: false, error: 'This measurement seems unrealistically large' };
    }
    return { isValid: true };
  }
  
  // Check if within realistic range
  if (numValue < range.min) {
    return { 
      isValid: false, 
      error: `${range.label} must be at least ${range.min} inches` 
    };
  }
  
  if (numValue > range.max) {
    return { 
      isValid: false, 
      error: `${range.label} cannot exceed ${range.max} inches` 
    };
  }
  
  // Check for values that might be in centimeters instead of inches
  if (field !== 'train_length' && numValue > 100) {
    return {
      isValid: false,
      error: 'This seems too large for inches. Please ensure you\'re using inches, not centimeters'
    };
  }
  
  // Provide warnings for edge cases
  let warning: string | undefined;
  
  // Warn if close to minimum
  if (numValue <= range.min + 2) {
    warning = `This ${range.label.toLowerCase()} measurement is quite small. Please double-check.`;
  }
  
  // Warn if close to maximum
  if (numValue >= range.max - 3) {
    warning = `This ${range.label.toLowerCase()} measurement is quite large. Please double-check.`;
  }
  
  return { isValid: true, warning };
};

/**
 * Validates all measurements in a form
 */
export const validateAllMeasurements = (
  measurements: Record<string, string | number | undefined>,
  requiredFields: string[] = []
): { isValid: boolean; errors: Record<string, string>; warnings: Record<string, string> } => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  
  Object.entries(measurements).forEach(([field, value]) => {
    if (value !== undefined && value !== '') {
      const isRequired = requiredFields.includes(field);
      const result = validateMeasurement(field, value, isRequired);
      
      if (!result.isValid && result.error) {
        errors[field] = result.error;
      }
      
      if (result.warning) {
        warnings[field] = result.warning;
      }
    }
  });
  
  // Check for required fields
  requiredFields.forEach(field => {
    const value = measurements[field];
    if (!value || String(value).trim() === '') {
      errors[field] = 'This measurement is required';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

/**
 * Formats a measurement value for display
 */
export const formatMeasurement = (value: string | number): string => {
  if (!value) return '';
  const numValue = parseFloat(String(value));
  if (isNaN(numValue)) return '';
  
  // Format to at most 2 decimal places, removing trailing zeros
  return numValue.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Gets the measurement range info for display
 */
export const getMeasurementInfo = (field: string): string => {
  const range = MEASUREMENT_RANGES[field];
  if (!range) return '';
  
  return `Range: ${range.min}-${range.max} inches`;
};
