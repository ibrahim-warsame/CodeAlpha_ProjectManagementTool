import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Comment from '../models/Comment';
import Task from '../models/Task';
import Project from '../models/Project';

const router = express.Router();

// Get all comments for a task
router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.taskId);
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

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'firstName lastName email')
      .populate('mentions', 'firstName lastName email')
      .sort('createdAt');

    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new comment
router.post('/', [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
  body('task').isMongoId().withMessage('Valid task ID is required'),
  body('mentions').optional().isArray(),
  body('attachments').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, task, mentions, attachments } = req.body;

    // Check if task exists
    const taskDoc = await Task.findById(task);
    if (!taskDoc) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to the project
    const project = await Project.findById(taskDoc.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comment = new Comment({
      content,
      task,
      author: (req as any).user.id,
      mentions: mentions || [],
      attachments: attachments || []
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'firstName lastName email')
      .populate('mentions', 'firstName lastName email');

    res.status(201).json(populatedComment);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update comment
router.put('/:id', [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
  body('mentions').optional().isArray(),
  body('attachments').optional().isArray()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (!comment.author.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Only comment author can update comment' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email')
      .populate('mentions', 'firstName lastName email');

    res.json(updatedComment);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete comment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author or project owner
    const task = await Task.findById(comment.task);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!comment.author.equals((req as any).user.id) && !project.owner.equals((req as any).user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
