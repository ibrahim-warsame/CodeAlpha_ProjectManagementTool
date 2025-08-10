import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task';
import Column from '../models/Column';
import Project from '../models/Project';

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access
    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('column', 'name color')
      .sort('order');

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new task
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim(),
  body('column').isMongoId().withMessage('Valid column ID is required'),
  body('board').isMongoId().withMessage('Valid board ID is required'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('assignedTo').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
  body('tags').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, column, board, project, assignedTo, priority, dueDate, tags } = req.body;

    // Check if user has access to the project
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!projectDoc.members.includes((req as any).user.id) && !projectDoc.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the highest order in the column
    const lastTask = await Task.findOne({ column }).sort('-order');
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = new Task({
      title,
      description,
      column,
      board,
      project,
      assignedTo: assignedTo || [],
      priority: priority || 'medium',
      dueDate,
      tags: tags || [],
      createdBy: (req as any).user.id,
      order
    });

    await task.save();

    // Add task to column
    await Column.findByIdAndUpdate(column, {
      $push: { tasks: task._id }
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('column', 'name color');

    res.status(201).json(populatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('column', 'name color')
      .populate('board', 'name')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('assignedTo').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('dueDate').optional().isISO8601(),
  body('tags').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('column', 'name color');

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Move task to different column
router.put('/:id/move', [
  body('columnId').isMongoId().withMessage('Valid column ID is required'),
  body('order').isInt({ min: 0 }).withMessage('Valid order is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { columnId, order } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldColumnId = task.column;

    // Remove from old column
    await Column.findByIdAndUpdate(oldColumnId, {
      $pull: { tasks: task._id }
    });

    // Add to new column
    await Column.findByIdAndUpdate(columnId, {
      $push: { tasks: task._id }
    });

    // Update task
    task.column = columnId;
    task.order = order;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('column', 'name color');

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove from column
    await Column.findByIdAndUpdate(task.column, {
      $pull: { tasks: task._id }
    });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
