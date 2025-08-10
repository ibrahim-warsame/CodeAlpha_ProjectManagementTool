import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, MessageSquare } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  comments: any[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'review', title: 'Review', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] }
  ]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: '',
    dueDate: ''
  });
  
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
    
    if (socket) {
      socket.on('taskCreated', (task: Task) => {
        addTaskToColumn(task);
        toast.success('New task created!');
      });
      
      socket.on('taskUpdated', (updatedTask: Task) => {
        updateTaskInColumns(updatedTask);
        toast.success('Task updated!');
      });
      
      socket.on('taskMoved', (data: { taskId: string; fromStatus: string; toStatus: string }) => {
        moveTaskInColumns(data.taskId, data.fromStatus, data.toStatus);
      });
    }

    return () => {
      if (socket) {
        socket.off('taskCreated');
        socket.off('taskUpdated');
        socket.off('taskMoved');
      }
    };
  }, [projectId, socket]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to fetch project');
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const tasks = await response.json();
        organizeTasksIntoColumns(tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const organizeTasksIntoColumns = (tasks: Task[]) => {
    const newColumns = columns.map(col => ({
      ...col,
      tasks: tasks.filter(task => task.status === col.id)
    }));
    setColumns(newColumns);
  };

  const addTaskToColumn = (task: Task) => {
    setColumns(prev => prev.map(col => 
      col.id === task.status 
        ? { ...col, tasks: [...col.tasks, task] }
        : col
    ));
  };

  const updateTaskInColumns = (updatedTask: Task) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    })));
  };

  const moveTaskInColumns = (taskId: string, fromStatus: string, toStatus: string) => {
    setColumns(prev => {
      const newColumns = [...prev];
      
      // Remove from old column
      const fromColumn = newColumns.find(col => col.id === fromStatus);
      if (fromColumn) {
        fromColumn.tasks = fromColumn.tasks.filter(task => task._id !== taskId);
      }
      
      // Add to new column
      const toColumn = newColumns.find(col => col.id === toStatus);
      if (toColumn) {
        const task = prev.flatMap(col => col.tasks).find(t => t._id === taskId);
        if (task) {
          toColumn.tasks.push({ ...task, status: toStatus as any });
        }
      }
      
      return newColumns;
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTask,
          status: 'todo'
        })
      });
      
      if (response.ok) {
        const task = await response.json();
        addTaskToColumn(task);
        setShowCreateTask(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          assignee: '',
          dueDate: ''
        });
        toast.success('Task created successfully!');
        
        if (socket) {
          socket.emit('createTask', { projectId, task });
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      
      if (response.ok) {
        moveTaskInColumns(taskId, 'todo', targetStatus); // This will be updated by the socket event
        
        if (socket) {
          socket.emit('moveTask', { taskId, fromStatus: 'todo', toStatus: targetStatus });
        }
      }
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">Project not found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-2 text-gray-600">{project.description}</p>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{column.title}</h3>
              <span className="text-sm text-gray-500">{column.tasks.length}</span>
            </div>
            
            <div
              className="min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {column.tasks.map((task) => (
                <div
                  key={task._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task._id)}
                  className="bg-white p-4 rounded-lg shadow-sm border mb-3 cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                    <button className="text-gray-400 hover:text-gray-600" title="More options">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      {task.comments && task.comments.length > 0 && (
                        <div className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {task.comments.length}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
              <form onSubmit={handleCreateTask}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter task description"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Select task priority"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Select due date"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTask(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
