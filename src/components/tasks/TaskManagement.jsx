import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';
import { format } from 'date-fns';

const { 
  FiPlus, FiX, FiCheck, FiClock, FiAlertCircle, FiEdit, 
  FiTrash2, FiUser, FiCalendar, FiFlag, FiCheckSquare,
  FiCircle, FiLoader
} = FiIcons;

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600'
};

const statusIcons = {
  todo: FiCircle,
  in_progress: FiLoader,
  completed: FiCheckSquare
};

const statusColors = {
  todo: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500'
};

const TaskManagement = ({ organizationId, userId, userRole = 'organization' }) => {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, todo, in_progress, completed
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'medium',
    due_date: '',
    task_type: 'other'
  });

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId, userId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load tasks based on role
    let tasksResult;
    if (userRole === 'team_member') {
      tasksResult = await taskService.getMyTasks(userId);
    } else {
      tasksResult = await taskService.getOrgTasks(organizationId);
    }
    setTasks(tasksResult.data || []);
    
    // Load team members for assignment (only for org owners)
    if (userRole === 'organization') {
      const membersResult = await teamService.getTeamMembers(organizationId);
      setMembers(membersResult.data || []);
    }
    
    setLoading(false);
  };

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || '',
        description: task.description || '',
        assignee_id: task.assignee_id || '',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        task_type: task.task_type || 'other'
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        assignee_id: '',
        priority: 'medium',
        due_date: '',
        task_type: 'other'
      });
    }
    setShowModal(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const payload = {
      ...taskForm,
      organization_id: organizationId,
      created_by: userId
    };

    let result;
    if (editingTask) {
      result = await taskService.updateTask(editingTask.id, payload);
    } else {
      result = await taskService.createTask(payload);
    }

    if (!result.error) {
      setShowModal(false);
      setEditingTask(null);
      loadData();
    } else {
      alert('Error: ' + result.error);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    const { error } = await taskService.updateTask(task.id, { status: newStatus });
    if (!error) {
      loadData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      const { error } = await taskService.deleteTask(taskId);
      if (!error) {
        loadData();
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const getAssigneeName = (assigneeId) => {
    const member = members.find(m => m.id === assigneeId);
    return member?.profile?.full_name || 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-navy">Task Management</h2>
          <p className="text-sm text-gray-500">
            {userRole === 'team_member' ? 'Your assigned tasks' : 'Manage team tasks and assignments'}
          </p>
        </div>
        {userRole === 'organization' && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'todo', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === status
                ? 'bg-navy text-white shadow-lg'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
              filter === status ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {taskCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <SafeIcon icon={FiCheckSquare} className="text-5xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">No tasks found</h3>
            <p className="text-sm text-gray-400">
              {filter === 'all' 
                ? (userRole === 'organization' ? 'Create your first task to get started' : 'No tasks assigned to you yet')
                : `No ${filter.replace('_', ' ')} tasks`
              }
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const StatusIcon = statusIcons[task.status] || FiCircle;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${
                  task.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleStatusChange(task, task.status === 'completed' ? 'todo' : 'completed')}
                    className={`mt-1 p-1 rounded-lg hover:bg-gray-100 transition-colors ${statusColors[task.status]}`}
                    title={task.status === 'completed' ? 'Mark as todo' : 'Mark as complete'}
                  >
                    <SafeIcon icon={StatusIcon} className="text-xl" />
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-navy ${task.status === 'completed' ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        {userRole === 'organization' && (
                          <>
                            <button
                              onClick={() => handleOpenModal(task)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <SafeIcon icon={FiEdit} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${
                          new Date(task.due_date) < new Date() && task.status !== 'completed' 
                            ? 'text-red-500 font-bold' 
                            : ''
                        }`}>
                          <SafeIcon icon={FiCalendar} />
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {userRole === 'organization' && (
                        <span className="flex items-center gap-1">
                          <SafeIcon icon={FiUser} />
                          {getAssigneeName(task.assignee_id)}
                        </span>
                      )}
                      {task.task_type && task.task_type !== 'other' && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {task.task_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Quick Status Change */}
                    {task.status !== 'completed' && (
                      <div className="flex gap-2 mt-3">
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleStatusChange(task, 'in_progress')}
                            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                          >
                            Start Working
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatusChange(task, 'completed')}
                            className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-navy">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h3>
                <button
                  onClick={() => { setShowModal(false); setEditingTask(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <SafeIcon icon={FiX} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Title *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Add more details..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {members.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">Assign To</label>
                    <select
                      value={taskForm.assignee_id}
                      onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Unassigned</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.profile?.full_name || 'Team Member'} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Task Type</label>
                  <select
                    value={taskForm.task_type}
                    onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="other">General</option>
                    <option value="installation">Installation</option>
                    <option value="inspection">Inspection</option>
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="follow_up">Follow Up</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowModal(false); setEditingTask(null); }}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTask}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <SafeIcon icon={FiCheck} />
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManagement;
