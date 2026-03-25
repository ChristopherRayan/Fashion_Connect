import { MeasurementField } from '../services/productService';

// Predefined measurement categories with all possible measurements
export interface MeasurementDefinition {
  category: string;
  label: string;
  description: string;
  measurements: MeasurementField[];
}

export const MEASUREMENT_DEFINITIONS: MeasurementDefinition[] = [
  {
    category: 'shirts',
    label: 'Shirts',
    description: 'Measurements for shirts, blouses, and tops',
    measurements: [
      {
        field: 'neck',
        label: 'Neck',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 15.5',
        helpText: 'Measure around the base of the neck where the collar sits'
      },
      {
        field: 'shoulder_to_shoulder',
        label: 'Shoulder to Shoulder',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 18',
        helpText: 'Measure across the back from shoulder point to shoulder point'
      },
      {
        field: 'chest',
        label: 'Chest',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 40',
        helpText: 'Measure around the fullest part of the chest'
      },
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 34',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 38',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'sleeve_length',
        label: 'Sleeve Length',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 25',
        helpText: 'Measure from shoulder point to desired cuff length'
      },
      {
        field: 'bicep',
        label: 'Bicep',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 14',
        helpText: 'Measure around the fullest part of the upper arm'
      },
      {
        field: 'cuff',
        label: 'Cuff (Wrist Opening)',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 9',
        helpText: 'Measure around the wrist where the cuff will sit'
      },
      {
        field: 'shirt_height',
        label: 'Shirt Height (Shoulder to Hem)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 28',
        helpText: 'Measure from shoulder point down to desired hem length'
      },
      {
        field: 'armhole',
        label: 'Armhole',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 20',
        helpText: 'Measure around the armpit area'
      }
    ]
  },
  {
    category: 'trousers',
    label: 'Trousers / Pants',
    description: 'Measurements for trousers, pants, and formal wear bottoms',
    measurements: [
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 32',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 40',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'rise_front',
        label: 'Rise (Front)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 11',
        helpText: 'Measure from waist to crotch seam in front'
      },
      {
        field: 'rise_back',
        label: 'Rise (Back)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 15',
        helpText: 'Measure from waist to crotch seam in back'
      },
      {
        field: 'thigh',
        label: 'Thigh',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 24',
        helpText: 'Measure around the fullest part of the thigh'
      },
      {
        field: 'knee',
        label: 'Knee',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 16',
        helpText: 'Measure around the knee'
      },
      {
        field: 'inseam',
        label: 'Inseam',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 32',
        helpText: 'Measure from crotch seam to desired hem length'
      },
      {
        field: 'outseam',
        label: 'Outseam (Total Length)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 42',
        helpText: 'Measure from waist to desired hem length along the side'
      },
      {
        field: 'hem_opening',
        label: 'Hem / Leg Opening',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 8',
        helpText: 'Measure around the leg opening at the hem'
      }
    ]
  },
  {
    category: 'shorts',
    label: 'Shorts',
    description: 'Measurements for shorts and casual bottoms',
    measurements: [
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 32',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 40',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'rise_front',
        label: 'Rise (Front)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 11',
        helpText: 'Measure from waist to crotch seam in front'
      },
      {
        field: 'rise_back',
        label: 'Rise (Back)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 15',
        helpText: 'Measure from waist to crotch seam in back'
      },
      {
        field: 'thigh',
        label: 'Thigh',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 24',
        helpText: 'Measure around the fullest part of the thigh'
      },
      {
        field: 'inseam',
        label: 'Inseam',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 9',
        helpText: 'Measure from crotch seam to desired hem length'
      },
      {
        field: 'outseam',
        label: 'Outseam (Total Length)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 19',
        helpText: 'Measure from waist to desired hem length along the side'
      },
      {
        field: 'hem_opening',
        label: 'Hem Opening',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 10',
        helpText: 'Measure around the leg opening at the hem'
      }
    ]
  },
  {
    category: 'suits_jacket',
    label: 'Suits (Jacket)',
    description: 'Measurements for suit jackets and blazers',
    measurements: [
      {
        field: 'neck',
        label: 'Neck',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 15.5',
        helpText: 'Measure around the base of the neck'
      },
      {
        field: 'shoulder_to_shoulder',
        label: 'Shoulder to Shoulder',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 18',
        helpText: 'Measure across the back from shoulder point to shoulder point'
      },
      {
        field: 'chest',
        label: 'Chest',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 40',
        helpText: 'Measure around the fullest part of the chest'
      },
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 34',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 38',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'sleeve_length',
        label: 'Sleeve Length',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 25',
        helpText: 'Measure from shoulder point to desired cuff length'
      },
      {
        field: 'bicep',
        label: 'Bicep',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 14',
        helpText: 'Measure around the fullest part of the upper arm'
      },
      {
        field: 'cuff',
        label: 'Cuff',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 9',
        helpText: 'Measure around the wrist where the cuff will sit'
      },
      {
        field: 'jacket_length',
        label: 'Jacket Length',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 30',
        helpText: 'Measure from shoulder point to desired jacket hem'
      },
      {
        field: 'armhole',
        label: 'Armhole',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 20',
        helpText: 'Measure around the armpit area'
      },
      {
        field: 'lapel_width',
        label: 'Lapel Width',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 3.5',
        helpText: 'Measure the width of the lapel at its widest point'
      }
    ]
  },
  {
    category: 'suits_trousers',
    label: 'Suits (Trousers)',
    description: 'Measurements for suit trousers',
    measurements: [
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 32',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 40',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'rise_front',
        label: 'Rise (Front)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 11',
        helpText: 'Measure from waist to crotch seam in front'
      },
      {
        field: 'rise_back',
        label: 'Rise (Back)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 15',
        helpText: 'Measure from waist to crotch seam in back'
      },
      {
        field: 'thigh',
        label: 'Thigh',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 24',
        helpText: 'Measure around the fullest part of the thigh'
      },
      {
        field: 'knee',
        label: 'Knee',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 16',
        helpText: 'Measure around the knee'
      },
      {
        field: 'inseam',
        label: 'Inseam',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 32',
        helpText: 'Measure from crotch seam to desired hem length'
      },
      {
        field: 'outseam',
        label: 'Outseam (Total Length)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 42',
        helpText: 'Measure from waist to desired hem length along the side'
      },
      {
        field: 'hem_opening',
        label: 'Hem / Leg Opening',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 8',
        helpText: 'Measure around the leg opening at the hem'
      }
    ]
  },
  {
    category: 'coats_blazers',
    label: 'Coats / Blazers',
    description: 'Measurements for coats, blazers, and outerwear',
    measurements: [
      {
        field: 'shoulder_to_shoulder',
        label: 'Shoulder to Shoulder',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 18',
        helpText: 'Measure across the back from shoulder point to shoulder point'
      },
      {
        field: 'chest',
        label: 'Chest',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 40',
        helpText: 'Measure around the fullest part of the chest'
      },
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 34',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 38',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'sleeve_length',
        label: 'Sleeve Length',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 25',
        helpText: 'Measure from shoulder point to desired cuff length'
      },
      {
        field: 'bicep',
        label: 'Bicep',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 14',
        helpText: 'Measure around the fullest part of the upper arm'
      },
      {
        field: 'cuff',
        label: 'Cuff',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 9',
        helpText: 'Measure around the wrist where the cuff will sit'
      },
      {
        field: 'armhole',
        label: 'Armhole',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 20',
        helpText: 'Measure around the armpit area'
      },
      {
        field: 'back_length',
        label: 'Back Length (Nape to Hem)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 32',
        helpText: 'Measure from the nape of the neck to desired hem length'
      },
      {
        field: 'coat_length',
        label: 'Coat Length (Shoulder to Hem)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 36',
        helpText: 'Measure from shoulder point to desired hem length'
      }
    ]
  },
  {
    category: 'gowns_dresses',
    label: 'Gowns / Dresses',
    description: 'Measurements for gowns, dresses, and formal wear',
    measurements: [
      {
        field: 'bust',
        label: 'Bust',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 36',
        helpText: 'Measure around the fullest part of the bust'
      },
      {
        field: 'waist',
        label: 'Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 28',
        helpText: 'Measure around the natural waistline'
      },
      {
        field: 'hip',
        label: 'Hip',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 38',
        helpText: 'Measure around the fullest part of the hips'
      },
      {
        field: 'shoulder_to_bust',
        label: 'Shoulder to Bust',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 10',
        helpText: 'Measure from shoulder point to bust point'
      },
      {
        field: 'shoulder_to_waist',
        label: 'Shoulder to Waist',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 16',
        helpText: 'Measure from shoulder point to natural waistline'
      },
      {
        field: 'shoulder_to_hem',
        label: 'Shoulder to Hem (Total Length)',
        required: true,
        unit: 'inches',
        placeholder: 'e.g., 60',
        helpText: 'Measure from shoulder point to desired hem length'
      },
      {
        field: 'sleeve_length',
        label: 'Sleeve Length',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 24',
        helpText: 'Measure from shoulder point to desired cuff length (if applicable)'
      },
      {
        field: 'bicep',
        label: 'Bicep',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 12',
        helpText: 'Measure around the fullest part of the upper arm (if applicable)'
      },
      {
        field: 'cuff',
        label: 'Cuff',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 8',
        helpText: 'Measure around the wrist where the cuff will sit (if applicable)'
      },
      {
        field: 'armhole',
        label: 'Armhole',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 18',
        helpText: 'Measure around the armpit area'
      },
      {
        field: 'back_length',
        label: 'Back Length',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 16',
        helpText: 'Measure from nape of neck to natural waistline'
      },
      {
        field: 'skirt_length',
        label: 'Skirt Length',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 44',
        helpText: 'Measure from waistline to desired hem length'
      },
      {
        field: 'hem_circumference',
        label: 'Hem Circumference',
        required: false,
        unit: 'inches',
        placeholder: 'e.g., 80',
        helpText: 'Measure around the hem of the dress'
      }
    ]
  }
];

// Helper function to get measurement definition by category
export const getMeasurementDefinition = (category: string): MeasurementDefinition | undefined => {
  return MEASUREMENT_DEFINITIONS.find(def => def.category === category);
};

// Helper function to get all available categories
export const getMeasurementCategories = (): { value: string; label: string; description: string }[] => {
  return MEASUREMENT_DEFINITIONS.map(def => ({
    value: def.category,
    label: def.label,
    description: def.description
  }));
};