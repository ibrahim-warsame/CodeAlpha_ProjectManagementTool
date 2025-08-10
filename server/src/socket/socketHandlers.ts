import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = (user._id as any).toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.firstName} ${socket.user?.lastName} connected`);

    // Join project room for real-time updates
    socket.on('join-project', (projectId: string) => {
      socket.join(`project-${projectId}`);
      console.log(`User joined project: ${projectId}`);
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project-${projectId}`);
      console.log(`User left project: ${projectId}`);
    });

    // Task created
    socket.on('task-created', (data: { task: any; projectId: string }) => {
      socket.to(`project-${data.projectId}`).emit('task-created', {
        task: data.task,
        createdBy: socket.user
      });
    });

    // Task updated
    socket.on('task-updated', (data: { task: any; projectId: string }) => {
      socket.to(`project-${data.projectId}`).emit('task-updated', {
        task: data.task,
        updatedBy: socket.user
      });
    });

    // Task moved
    socket.on('task-moved', (data: { task: any; projectId: string; fromColumn: string; toColumn: string }) => {
      socket.to(`project-${data.projectId}`).emit('task-moved', {
        task: data.task,
        fromColumn: data.fromColumn,
        toColumn: data.toColumn,
        movedBy: socket.user
      });
    });

    // Task deleted
    socket.on('task-deleted', (data: { taskId: string; projectId: string }) => {
      socket.to(`project-${data.projectId}`).emit('task-deleted', {
        taskId: data.taskId,
        deletedBy: socket.user
      });
    });

    // Comment added
    socket.on('comment-added', (data: { comment: any; projectId: string }) => {
      socket.to(`project-${data.projectId}`).emit('comment-added', {
        comment: data.comment,
        addedBy: socket.user
      });
    });

    // Comment updated
    socket.on('comment-updated', (data: { comment: any; projectId: string }) => {
      socket.to(`project-${data.projectId}`).emit('comment-updated', {
        comment: data.comment,
        updatedBy: socket.user
      });
    });

    // Comment deleted
    socket.on('comment-deleted', (data: { commentId: string; projectId: string }) => {
      socket.to(`project-${data.projectId}`).emit('comment-deleted', {
        commentId: data.commentId,
        deletedBy: socket.user
      });
    });

    // User typing indicator
    socket.on('typing-start', (data: { projectId: string; taskId?: string }) => {
      socket.to(`project-${data.projectId}`).emit('user-typing', {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        taskId: data.taskId
      });
    });

    socket.on('typing-stop', (data: { projectId: string; taskId?: string }) => {
      socket.to(`project-${data.projectId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        taskId: data.taskId
      });
    });

    // Project member joined/left
    socket.on('member-joined', (data: { projectId: string; member: any }) => {
      socket.to(`project-${data.projectId}`).emit('member-joined', {
        member: data.member,
        joinedBy: socket.user
      });
    });

    socket.on('member-left', (data: { projectId: string; member: any }) => {
      socket.to(`project-${data.projectId}`).emit('member-left', {
        member: data.member,
        leftBy: socket.user
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.firstName} ${socket.user?.lastName} disconnected`);
    });
  });
};

// Helper function to emit to project room
export const emitToProject = (io: Server, projectId: string, event: string, data: any) => {
  io.to(`project-${projectId}`).emit(event, data);
};
