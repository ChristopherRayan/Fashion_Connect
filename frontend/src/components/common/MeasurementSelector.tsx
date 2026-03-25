import React, { useState, useEffect } from 'react';
import { Ruler, Upload, X, Check, Info } from 'lucide-react';
import { MeasurementConfig, MeasurementField } from '../../services/productService';
import { MEASUREMENT_DEFINITIONS, getMeasurementCategories } from '../../utils/measurementDefinitions';

interface MeasurementSelectorProps {
  value: MeasurementConfig;
  onChange: (config: MeasurementConfig) => void;
  className?: string;
}

const MeasurementSelector: React.FC<MeasurementSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [guideImageFile, setGuideImageFile] = useState<File | null>(null);
  const [guideImagePreview, setGuideImagePreview] = useState<string>('');

  // Initialize selected categories from existing config
  useEffect(() => {
    if (value.requiredMeasurements && value.requiredMeasurements.length > 0) {
      const categories = value.requiredMeasurements.map(rm => rm.category);
      setSelectedCategories(categories);
    }
    
    if (value.guideImage) {
      setGuideImagePreview(value.guideImage);
    }
  }, [value]);

  // Handle category selection
  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
    updateMeasurementConfig(newCategories);
  };

  // Handle measurement field toggle within a category
  const handleMeasurementToggle = (categoryId: string, measurementField: string) => {
    const updatedConfig = { ...value };
    const categoryIndex = updatedConfig.requiredMeasurements.findIndex(rm => rm.category === categoryId);
    
    if (categoryIndex >= 0) {
      const measurements = updatedConfig.requiredMeasurements[categoryIndex].measurements;
      const measurementIndex = measurements.findIndex(m => m.field === measurementField);
      
      if (measurementIndex >= 0) {
        // Remove measurement
        measurements.splice(measurementIndex, 1);
        
        // If no measurements left, remove the category
        if (measurements.length === 0) {
          updatedConfig.requiredMeasurements.splice(categoryIndex, 1);
          setSelectedCategories(prev => prev.filter(id => id !== categoryId));
        }
      } else {
        // Add measurement
        const definition = MEASUREMENT_DEFINITIONS.find(def => def.category === categoryId);
        const measurementDef = definition?.measurements.find(m => m.field === measurementField);
        
        if (measurementDef) {
          measurements.push(measurementDef);
        }
      }
    }
    
    onChange(updatedConfig);
  };

  // Update measurement config when categories change
  const updateMeasurementConfig = (categories: string[]) => {
    const requiredMeasurements = categories.map(categoryId => {
      const definition = MEASUREMENT_DEFINITIONS.find(def => def.category === categoryId);
      if (!definition) return null;
      
      // Start with all required measurements selected by default
      const defaultMeasurements = definition.measurements.filter(m => m.required);
      
      return {
        category: categoryId,
        measurements: defaultMeasurements
      };
    }).filter(Boolean) as any[];

    const newConfig: MeasurementConfig = {
      ...value,
      enabled: categories.length > 0,
      requiredMeasurements
    };

    onChange(newConfig);
  };

  // Handle guide image upload
  const handleGuideImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGuideImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setGuideImagePreview(result);
        
        // Update config with the file (in real implementation, you'd upload this to server first)
        onChange({
          ...value,
          guideImage: result // In production, this would be the uploaded URL
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove guide image
  const removeGuideImage = () => {
    setGuideImageFile(null);
    setGuideImagePreview('');
    onChange({
      ...value,
      guideImage: undefined
    });
  };

  const categories = getMeasurementCategories();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <Ruler className="h-5 w-5 text-yellow-500 mr-3" />
          <div>
            <h3 className="font-medium text-gray-900">Custom Measurements</h3>
            <p className="text-sm text-gray-600">
              Configure measurement requirements for this product
            </p>
          </div>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="sr-only"
          />
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value.enabled ? 'bg-yellow-500' : 'bg-gray-300'
          }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </div>
        </label>
      </div>

      {value.enabled && (
        <>
          {/* Guide Image Upload */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Measurement Guide Image
            </h4>
            
            {guideImagePreview ? (
              <div className="relative">
                <img
                  src={guideImagePreview}
                  alt="Measurement Guide"
                  className="w-full max-w-md h-auto rounded-lg border border-gray-300"
                />
                <button
                  onClick={removeGuideImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload a measurement guide image to help customers
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGuideImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Measurement Categories */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Select Measurement Categories
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.value);
                const definition = MEASUREMENT_DEFINITIONS.find(def => def.category === category.value);
                
                return (
                  <div
                    key={category.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCategoryToggle(category.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 flex items-center">
                          {category.label}
                          {isSelected && (
                            <Check className="h-4 w-4 ml-2 text-yellow-500" />
                          )}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                        {definition && (
                          <p className="text-xs text-gray-500 mt-2">
                            {definition.measurements.length} measurements available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Measurements Configuration */}
          {selectedCategories.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                Configure Required Measurements
              </h4>
              
              {selectedCategories.map((categoryId) => {
                const definition = MEASUREMENT_DEFINITIONS.find(def => def.category === categoryId);
                const configCategory = value.requiredMeasurements.find(rm => rm.category === categoryId);
                
                if (!definition) return null;
                
                return (
                  <div key={categoryId} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      {definition.label}
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {definition.measurements.map((measurement) => {
                        const isSelected = configCategory?.measurements.some(m => m.field === measurement.field) || false;
                        
                        return (
                          <label
                            key={measurement.field}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleMeasurementToggle(categoryId, measurement.field)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                              isSelected
                                ? 'border-yellow-400 bg-yellow-400'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 flex items-center">
                                {measurement.label}
                                {measurement.required && (
                                  <span className="text-red-500 ml-1 text-xs">*</span>
                                )}
                              </div>
                              {measurement.helpText && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {measurement.helpText}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MeasurementSelector;