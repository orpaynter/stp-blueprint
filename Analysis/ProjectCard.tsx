import React from 'react';
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  dueDate?: string;
  contractor?: string;
  address: string;
  imageUrl?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  status,
  progress,
  dueDate,
  contractor,
  address,
  imageUrl,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="relative h-48 bg-gray-200">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-light text-white text-xl font-bold">
            {title.charAt(0)}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <div className="px-4 py-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-neutral truncate">{title}</h3>
        </div>
        
        <p className="mt-1 text-sm text-gray-500 truncate">{address}</p>
        
        {contractor && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium">Contractor:</span> {contractor}
          </p>
        )}
        
        {dueDate && (
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium">Due:</span> {dueDate}
          </p>
        )}
        
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-neutral">{progress}%</span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 flex justify-between">
        <Link
          href={`/projects/${id}`}
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          View Details
        </Link>
        <Link
          href={`/projects/${id}/assessments`}
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          View Assessments
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
