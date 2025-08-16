import React, { useState } from 'react';
import ProjectCard from './ProjectCard';

interface ProjectsListProps {
  userRole: 'homeowner' | 'contractor' | 'supplier' | 'insurance';
}

const ProjectsList: React.FC<ProjectsListProps> = ({ userRole }) => {
  const [filter, setFilter] = useState('all');
  
  // Mock data - in a real app, this would come from an API
  const projects = [
    {
      id: 'proj-001',
      title: 'Roof Replacement - Main House',
      status: 'in_progress' as const,
      progress: 65,
      dueDate: 'May 15, 2025',
      contractor: 'Smith Roofing Co.',
      address: '123 Main St, Anytown, USA',
      imageUrl: '',
    },
    {
      id: 'proj-002',
      title: 'Shingle Repair - Garage',
      status: 'pending' as const,
      progress: 10,
      dueDate: 'May 30, 2025',
      contractor: 'Smith Roofing Co.',
      address: '123 Main St, Anytown, USA',
      imageUrl: '',
    },
    {
      id: 'proj-003',
      title: 'Storm Damage Assessment',
      status: 'completed' as const,
      progress: 100,
      dueDate: 'April 10, 2025',
      contractor: 'Smith Roofing Co.',
      address: '123 Main St, Anytown, USA',
      imageUrl: '',
    },
    {
      id: 'proj-004',
      title: 'Gutter Installation',
      status: 'on_hold' as const,
      progress: 30,
      dueDate: 'June 5, 2025',
      contractor: 'Smith Roofing Co.',
      address: '123 Main St, Anytown, USA',
      imageUrl: '',
    },
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.status === filter);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral">Projects</h2>
        
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="all">All Projects</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
          
          {userRole === 'homeowner' && (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              New Project
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
        
        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No projects found matching your filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
