import React, { useState } from 'react';
import DamageAssessmentViewer from './DamageAssessmentViewer';

interface AssessmentListProps {
  projectId?: string;
}

const AssessmentList: React.FC<AssessmentListProps> = ({ projectId }) => {
  const [filter, setFilter] = useState('all');
  
  // Mock data - in a real app, this would come from an API
  const assessments = [
    {
      id: 'asmnt-001',
      projectId: 'proj-001',
      imageUrl: '/placeholder-roof-1.jpg',
      date: 'April 10, 2025',
      assessedBy: 'AI Damage Assessor',
      confidence: 92,
      status: 'completed',
      detections: [
        {
          id: 'det-001',
          type: 'missing_shingle',
          boundingBox: { x: 20, y: 30, width: 15, height: 10 },
          confidence: 95,
          severity: 'high',
        },
        {
          id: 'det-002',
          type: 'water_damage',
          boundingBox: { x: 50, y: 45, width: 20, height: 15 },
          confidence: 88,
          severity: 'medium',
        },
      ],
    },
    {
      id: 'asmnt-002',
      projectId: 'proj-001',
      imageUrl: '/placeholder-roof-2.jpg',
      date: 'April 12, 2025',
      assessedBy: 'AI Damage Assessor',
      confidence: 87,
      status: 'pending_review',
      detections: [
        {
          id: 'det-003',
          type: 'crack',
          boundingBox: { x: 35, y: 20, width: 10, height: 5 },
          confidence: 91,
          severity: 'low',
        },
        {
          id: 'det-004',
          type: 'hail_damage',
          boundingBox: { x: 60, y: 30, width: 25, height: 20 },
          confidence: 84,
          severity: 'medium',
        },
      ],
    },
  ];

  const filteredAssessments = projectId
    ? assessments.filter(assessment => assessment.projectId === projectId)
    : assessments;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral">Damage Assessments</h2>
        
        <div className="flex space-x-2">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            New Assessment
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredAssessments.map((assessment) => (
          <DamageAssessmentViewer
            key={assessment.id}
            assessmentId={assessment.id}
            imageUrl={assessment.imageUrl}
            detections={assessment.detections}
            confidence={assessment.confidence}
            date={assessment.date}
            assessedBy={assessment.assessedBy}
          />
        ))}
        
        {filteredAssessments.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No assessments found for this project.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentList;
