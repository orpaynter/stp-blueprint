const express = require('express');
const router = express.Router();
const { protect, restrictTo, hasPermission } = require('../../auth/middleware/auth');

// Import project controllers
const projectController = require('./projectController');

// All project routes require authentication
router.use(protect);

// GET all projects (filtered by user role)
router.get('/', projectController.getAllProjects);

// GET project by ID
router.get('/:id', projectController.getProject);

// POST create new project
router.post('/', 
  restrictTo('contractor', 'admin'),
  hasPermission('create:project'),
  projectController.createProject
);

// PATCH update project
router.patch('/:id', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:project'),
  projectController.updateProject
);

// DELETE project
router.delete('/:id', 
  restrictTo('contractor', 'admin'),
  hasPermission('delete:project'),
  projectController.deleteProject
);

// GET project timeline
router.get('/:id/timeline', projectController.getProjectTimeline);

// POST add timeline event
router.post('/:id/timeline', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:project'),
  projectController.addTimelineEvent
);

// GET project team
router.get('/:id/team', projectController.getProjectTeam);

// POST add team member
router.post('/:id/team', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:project'),
  projectController.addTeamMember
);

// DELETE remove team member
router.delete('/:id/team/:memberId', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:project'),
  projectController.removeTeamMember
);

// GET project documents
router.get('/:id/documents', projectController.getProjectDocuments);

// POST upload document
router.post('/:id/documents', 
  projectController.uploadProjectDocument
);

// DELETE document
router.delete('/:id/documents/:documentId', 
  restrictTo('contractor', 'admin', 'homeowner'),
  projectController.deleteProjectDocument
);

// GET project schedule
router.get('/:id/schedule', projectController.getProjectSchedule);

// POST update schedule
router.post('/:id/schedule', 
  restrictTo('contractor', 'admin'),
  hasPermission('update:project'),
  projectController.updateProjectSchedule
);

// GET weather forecast for project
router.get('/:id/weather', projectController.getProjectWeatherForecast);

// GET project materials
router.get('/:id/materials', projectController.getProjectMaterials);

// POST add materials
router.post('/:id/materials', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('update:project'),
  projectController.addProjectMaterials
);

// PATCH update material status
router.patch('/:id/materials/:materialId', 
  restrictTo('contractor', 'admin', 'supplier'),
  hasPermission('update:project'),
  projectController.updateMaterialStatus
);

// GET project communications
router.get('/:id/communications', projectController.getProjectCommunications);

// POST add communication
router.post('/:id/communications', 
  projectController.addProjectCommunication
);

// GET project status report
router.get('/:id/status-report', projectController.getProjectStatusReport);

// POST generate status report
router.post('/:id/status-report', 
  restrictTo('contractor', 'admin'),
  hasPermission('create:report'),
  projectController.generateProjectStatusReport
);

module.exports = router;
