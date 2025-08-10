import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Project from '../models/Project';
import Board from '../models/Board';
import Column from '../models/Column';

const router = express.Router();

// Get all projects for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: (req as any).user.id },
        { members: (req as any).user.id }
      ]
    }).populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate('boards');

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new project
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, isPublic = false } = req.body;

    const project = new Project({
      name,
      description,
      owner: (req as any).user.id,
      members: [(req as any).user.id],
      isPublic
    });

    await project.save();

    // Create default board and columns
    const board = new Board({
      name: 'Main Board',
      project: project._id,
      order: 0
    });
    await board.save();

    const columns = [
      { name: 'To Do', color: '#E5E7EB', order: 0 },
      { name: 'In Progress', color: '#FEF3C7', order: 1 },
      { name: 'Review', color: '#DBEAFE', order: 2 },
      { name: 'Done', color: '#D1FAE5', order: 3 }
    ];

    const createdColumns = await Promise.all(
      columns.map(col => new Column({ ...col, board: board._id }).save())
    );

    board.columns = createdColumns.map(col => col._id as any);
    await board.save();

    project.boards = [board._id as any];
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate({
        path: 'boards',
        populate: {
          path: 'columns',
          model: 'Column'
        }
      });

    res.status(201).json(populatedProject);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .populate({
        path: 'boards',
        populate: {
          path: 'columns',
          populate: {
            path: 'tasks',
            populate: [
              { path: 'assignedTo', select: 'firstName lastName email' },
              { path: 'createdBy', select: 'firstName lastName email' }
            ]
          }
        }
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access
    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('isPublic').optional().isBoolean(),
  body('color').optional().isHexColor()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (!project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Only project owner can update project' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (!project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Only project owner can delete project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add member to project
router.post('/:id/members', [
  body('email').isEmail().normalizeEmail()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or member
    if (!project.owner.equals((req as any).user.id) && !project.members.includes((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find user by email
    const User = require('../models/User');
    const newMember = await User.findOne({ email: req.body.email });
    if (!newMember) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (project.members.includes(newMember._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(newMember._id);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.json(populatedProject);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove member from project
router.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (!project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Only project owner can remove members' });
    }

    project.members = project.members.filter(
      memberId => !memberId.equals(req.params.memberId)
    );
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'firstName lastName email')
      .populate('members', 'firstName lastName email');

    res.json(populatedProject);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
