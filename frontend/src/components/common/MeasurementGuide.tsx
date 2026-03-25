import React from 'react';
import { X, Ruler, Info } from 'lucide-react';

interface MeasurementGuideProps {
  isOpen: boolean;
  onClose: () => void;
  guideImage?: string;
  productName?: string;
  measurements?: Array<{
    field: string;
    label: string;
    helpText?: string;
    required: boolean;
  }>;
}

const MeasurementGuide: React.FC<MeasurementGuideProps> = ({
  isOpen,
  onClose,
  guideImage,
  productName,
  measurements = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Ruler className="h-6 w-6 text-yellow-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Measurement Guide
              </h2>
              {productName && (
                <p className="text-sm text-gray-600 mt-1">
                  For: {productName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Guide Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                Visual Guide
              </h3>
              
              {guideImage ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <img
                    src={guideImage}
                    alt="Measurement Guide"
                    className="w-full h-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden text-center py-8 text-gray-500">
                    <Ruler className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Measurement guide image not available</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Ruler className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">No measurement guide image available</p>
                  <p className="text-sm text-gray-400">
                    Please refer to the measurement instructions below
                  </p>
                </div>
              )}

              {/* General Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">📏 Measurement Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use a flexible measuring tape</li>
                  <li>• Measure over undergarments or fitted clothing</li>
                  <li>• Keep the tape snug but not tight</li>
                  <li>• Stand straight with arms at your sides</li>
                  <li>• Have someone help you for accurate measurements</li>
                </ul>
              </div>
            </div>

            {/* Measurement Instructions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Required Measurements
              </h3>
              
              {measurements.length > 0 ? (
                <div className="space-y-3">
                  {measurements.map((measurement, index) => (
                    <div
                      key={measurement.field}
                      className={`p-4 rounded-lg border ${
                        measurement.required 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            {measurement.label}
                            {measurement.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </h4>
                          {measurement.helpText && (
                            <p className="text-sm text-gray-600 mt-1">
                              {measurement.helpText}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Info className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No specific measurements defined</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Please provide standard measurements as requested
                  </p>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">💬 Need Help?</h4>
                <p className="text-sm text-blue-700">
                  If you're unsure about any measurements, don't hesitate to contact the designer. 
                  They can provide additional guidance or arrange for professional measuring.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeasurementGuide;