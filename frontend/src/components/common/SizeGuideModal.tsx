import React from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, category = 'general' }) => {
  if (!isOpen) return null;

  // Size guide data based on category
  const getSizeGuideData = () => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('men') || categoryLower.includes('male')) {
      return {
        title: "Men's Size Guide",
        description: "All measurements are in inches. For best fit, measure yourself and compare with the chart below.",
        measurements: [
          { label: 'Chest', description: 'Measure around the fullest part of your chest' },
          { label: 'Waist', description: 'Measure around your natural waistline' },
          { label: 'Hip', description: 'Measure around the fullest part of your hips' },
          { label: 'Shoulder', description: 'Measure from shoulder point to shoulder point' },
          { label: 'Sleeve', description: 'Measure from shoulder to wrist with arm extended' }
        ],
        sizes: [
          { size: 'XS', chest: '32-34', waist: '26-28', hip: '32-34', shoulder: '16-17', sleeve: '32-33' },
          { size: 'S', chest: '34-36', waist: '28-30', hip: '34-36', shoulder: '17-18', sleeve: '33-34' },
          { size: 'M', chest: '36-38', waist: '30-32', hip: '36-38', shoulder: '18-19', sleeve: '34-35' },
          { size: 'L', chest: '38-40', waist: '32-34', hip: '38-40', shoulder: '19-20', sleeve: '35-36' },
          { size: 'XL', chest: '40-42', waist: '34-36', hip: '40-42', shoulder: '20-21', sleeve: '36-37' },
          { size: 'XXL', chest: '42-44', waist: '36-38', hip: '42-44', shoulder: '21-22', sleeve: '37-38' }
        ]
      };
    } else if (categoryLower.includes('women') || categoryLower.includes('female')) {
      return {
        title: "Women's Size Guide",
        description: "All measurements are in inches. For best fit, measure yourself and compare with the chart below.",
        measurements: [
          { label: 'Bust', description: 'Measure around the fullest part of your bust' },
          { label: 'Waist', description: 'Measure around your natural waistline' },
          { label: 'Hip', description: 'Measure around the fullest part of your hips' },
          { label: 'Shoulder', description: 'Measure from shoulder point to shoulder point' },
          { label: 'Sleeve', description: 'Measure from shoulder to wrist with arm extended' }
        ],
        sizes: [
          { size: 'XS', bust: '30-32', waist: '24-26', hip: '32-34', shoulder: '14-15', sleeve: '30-31' },
          { size: 'S', bust: '32-34', waist: '26-28', hip: '34-36', shoulder: '15-16', sleeve: '31-32' },
          { size: 'M', bust: '34-36', waist: '28-30', hip: '36-38', shoulder: '16-17', sleeve: '32-33' },
          { size: 'L', bust: '36-38', waist: '30-32', hip: '38-40', shoulder: '17-18', sleeve: '33-34' },
          { size: 'XL', bust: '38-40', waist: '32-34', hip: '40-42', shoulder: '18-19', sleeve: '34-35' },
          { size: 'XXL', bust: '40-42', waist: '34-36', hip: '42-44', shoulder: '19-20', sleeve: '35-36' }
        ]
      };
    } else if (categoryLower.includes('kid') || categoryLower.includes('child')) {
      return {
        title: "Kids Size Guide",
        description: "All measurements are in inches. For growing children, consider sizing up for longer wear.",
        measurements: [
          { label: 'Chest', description: 'Measure around the fullest part of chest' },
          { label: 'Waist', description: 'Measure around natural waistline' },
          { label: 'Hip', description: 'Measure around the fullest part of hips' },
          { label: 'Height', description: 'Measure from head to toe' },
          { label: 'Age', description: 'Approximate age range' }
        ],
        sizes: [
          { size: 'XS', chest: '20-22', waist: '19-20', hip: '21-22', height: '35-38', age: '2-3 years' },
          { size: 'S', chest: '22-24', waist: '20-21', hip: '22-24', height: '38-42', age: '4-5 years' },
          { size: 'M', chest: '24-26', waist: '21-22', hip: '24-26', height: '42-46', age: '6-7 years' },
          { size: 'L', chest: '26-28', waist: '22-23', hip: '26-28', height: '46-50', age: '8-9 years' },
          { size: 'XL', chest: '28-30', waist: '23-24', hip: '28-30', height: '50-54', age: '10-11 years' },
          { size: 'XXL', chest: '30-32', waist: '24-25', hip: '30-32', height: '54-58', age: '12-13 years' }
        ]
      };
    } else {
      // General/Unisex size guide
      return {
        title: "General Size Guide",
        description: "All measurements are in inches. Choose the size that best matches your measurements.",
        measurements: [
          { label: 'Chest/Bust', description: 'Measure around the fullest part of chest/bust' },
          { label: 'Waist', description: 'Measure around your natural waistline' },
          { label: 'Hip', description: 'Measure around the fullest part of your hips' },
          { label: 'Shoulder', description: 'Measure from shoulder point to shoulder point' },
          { label: 'Length', description: 'Measure from shoulder to desired length' }
        ],
        sizes: [
          { size: 'XS', chest: '30-32', waist: '24-26', hip: '32-34', shoulder: '14-16', length: '24-26' },
          { size: 'S', chest: '32-34', waist: '26-28', hip: '34-36', shoulder: '16-17', length: '26-28' },
          { size: 'M', chest: '34-36', waist: '28-30', hip: '36-38', shoulder: '17-18', length: '28-30' },
          { size: 'L', chest: '36-38', waist: '30-32', hip: '38-40', shoulder: '18-19', length: '30-32' },
          { size: 'XL', chest: '38-40', waist: '32-34', hip: '40-42', shoulder: '19-20', length: '32-34' },
          { size: 'XXL', chest: '40-42', waist: '34-36', hip: '42-44', shoulder: '20-21', length: '34-36' }
        ]
      };
    }
  };

  const sizeGuide = getSizeGuideData();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-black px-6 py-4 border-b-2 border-yellow-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Ruler className="h-6 w-6 text-yellow-400 mr-2" />
                <h3 className="text-lg font-medium text-yellow-400">
                  {sizeGuide.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-yellow-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-[80vh] overflow-y-auto">
            {/* Description */}
            <div className="mb-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                {sizeGuide.description}
              </p>
            </div>

            {/* How to Measure */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">How to Measure</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizeGuide.measurements.map((measurement, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                    <div>
                      <h5 className="font-medium text-gray-900">{measurement.label}</h5>
                      <p className="text-sm text-gray-600">{measurement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Size Chart */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Size Chart</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Size
                      </th>
                      {Object.keys(sizeGuide.sizes[0]).filter(key => key !== 'size').map((key) => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sizeGuide.sizes.map((sizeData, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                          {sizeData.size}
                        </td>
                        {Object.entries(sizeData).filter(([key]) => key !== 'size').map(([key, value], idx) => (
                          <td key={idx} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200 last:border-r-0">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="font-medium text-yellow-800 mb-2">Sizing Tips</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• If you're between sizes, we recommend sizing up for a more comfortable fit</li>
                <li>• For custom orders, precise measurements ensure the best fit</li>
                <li>• Contact the designer if you need help with measurements or sizing</li>
                <li>• Different fabrics may fit differently - check product descriptions for fabric details</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4 flex justify-end border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-yellow-400 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors border border-yellow-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
