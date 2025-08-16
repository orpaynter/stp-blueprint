import React from 'react';

interface DamageAssessmentViewerProps {
  assessmentId: string;
  imageUrl: string;
  detections: Detection[];
  confidence: number;
  date: string;
  assessedBy: string;
}

interface Detection {
  id: string;
  type: 'missing_shingle' | 'crack' | 'water_damage' | 'hail_damage' | 'debris';
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  severity: 'low' | 'medium' | 'high';
}

const DamageAssessmentViewer: React.FC<DamageAssessmentViewerProps> = ({
  assessmentId,
  imageUrl,
  detections,
  confidence,
  date,
  assessedBy,
}) => {
  const getDetectionColor = (type: string) => {
    switch (type) {
      case 'missing_shingle':
        return 'rgba(239, 68, 68, 0.7)'; // red
      case 'crack':
        return 'rgba(245, 158, 11, 0.7)'; // amber
      case 'water_damage':
        return 'rgba(59, 130, 246, 0.7)'; // blue
      case 'hail_damage':
        return 'rgba(139, 92, 246, 0.7)'; // purple
      case 'debris':
        return 'rgba(34, 197, 94, 0.7)'; // green
      default:
        return 'rgba(156, 163, 175, 0.7)'; // gray
    }
  };

  const getDetectionLabel = (type: string) => {
    switch (type) {
      case 'missing_shingle':
        return 'Missing Shingle';
      case 'crack':
        return 'Crack';
      case 'water_damage':
        return 'Water Damage';
      case 'hail_damage':
        return 'Hail Damage';
      case 'debris':
        return 'Debris';
      default:
        return 'Unknown';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'Low Severity';
      case 'medium':
        return 'Medium Severity';
      case 'high':
        return 'High Severity';
      default:
        return 'Unknown Severity';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-neutral">Damage Assessment #{assessmentId}</h3>
        <p className="text-sm text-gray-500">
          Assessed on {date} by {assessedBy}
        </p>
      </div>

      <div className="relative">
        <img 
          src={imageUrl || '/placeholder-roof.jpg'} 
          alt="Roof assessment" 
          className="w-full h-auto"
        />
        
        {/* Overlay detections */}
        {detections.map((detection) => (
          <div
            key={detection.id}
            className="absolute border-2 border-white cursor-pointer"
            style={{
              left: `${detection.boundingBox.x}%`,
              top: `${detection.boundingBox.y}%`,
              width: `${detection.boundingBox.width}%`,
              height: `${detection.boundingBox.height}%`,
              backgroundColor: getDetectionColor(detection.type),
            }}
            title={`${getDetectionLabel(detection.type)} - ${getSeverityLabel(detection.severity)}`}
          ></div>
        ))}
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4">
          <div className="w-full">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">AI Confidence</span>
              <span className="font-medium text-neutral">{confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
          </div>
        </div>

        <h4 className="font-medium text-neutral mb-2">Detected Issues</h4>
        <div className="space-y-2">
          {detections.map((detection) => (
            <div 
              key={detection.id} 
              className="flex items-center p-2 rounded-md hover:bg-gray-50"
            >
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: getDetectionColor(detection.type) }}
              ></div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral">
                    {getDetectionLabel(detection.type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {detection.confidence}% confidence
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {getSeverityLabel(detection.severity)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 px-4 py-3 flex justify-between">
        <button
          type="button"
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          Download Report
        </button>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          Request Second Opinion
        </button>
      </div>
    </div>
  );
};

export default DamageAssessmentViewer;
