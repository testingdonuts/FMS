import React, { useEffect, useMemo, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useAuth } from '../../hooks/useAuth';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';
import TaskList from '../tasks/TaskList';
import TaskForm from '../tasks/TaskForm';

const { FiPlus, FiRefreshCw, FiFilter } = FiIcons;

const OrgTasks = ({ organizationId }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', type: 'all', assignee: 'all', search: '' });

  useEffect(() => {
    if (organizationId) {
      load();
      loadMembers();
    }
  }, [organizationId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await taskService.getOrgTasks(organizationId);
      if (error) throw new Error(error);
      setTasks(data);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await teamService.getTeamMembers(organizationId);
      console.log('Team members loaded:', res);
      if (res?.error) {
        console.error('Error loading team members:', res.error);
      }
      setMembers(res?.data || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
      setMembers([]);
    }
  };

  const assigneeOptions = useMemo(() => {
    console.log('Creating assigneeOptions from members:', members);
    return members.map(m => ({ 
      id: m.id, 
      label: m.profile?.full_name || m.profile?.email || 'Team Member' 
    }));
  }, [members]);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filters.status !== 'all') list = list.filter(t => t.status === filters.status);
    if (filters.type !== 'all') list = list.filter(t => t.task_type === filters.type);
    if (filters.assignee !== 'all') list = list.filter(t => t.assignee_id === filters.assignee);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.context_label || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, filters]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-navy">Team Tasks</h3>
          <p className="text-sm text-gray-500">Assign and track tasks for your team</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-50"><SafeIcon icon={FiRefreshCw} /></button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-2"><SafeIcon icon={FiPlus} /><span>New Task</span></button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-black uppercase text-gray-400">Status</label>
            <select className="w-full border rounded-lg p-2" value={filters.status} onChange={(e)=>setFilters(f=>({...f, status:e.target.value}))}>
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase text-gray-400">Type</label>
            <select className="w-full border rounded-lg p-2" value={filters.type} onChange={(e)=>setFilters(f=>({...f, type:e.target.value}))}>
              <option value="all">All</option>
              <option value="service_booking">Booked Service</option>
              <option value="equipment_maintenance">Equipment Maintenance</option>
              <option value="pickup">Pickup</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase text-gray-400">Assignee</label>
            <select className="w-full border rounded-lg p-2" value={filters.assignee} onChange={(e)=>setFilters(f=>({...f, assignee:e.target.value}))}>
              <option value="all">All</option>
              {assigneeOptions.map(a => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase text-gray-400">Search</label>
            <input className="w-full border rounded-lg p-2" placeholder="Title, description, context" value={filters.search} onChange={(e)=>setFilters(f=>({...f, search:e.target.value}))} />
          </div>
        </div>
      </div>

      <TaskList
        tasks={filtered}
        isLoading={loading}
        onUpdateStatus={async (id, status) => { await taskService.updateTask(id, { status }); load(); }}
        onEdit={(task) => setEditingTask(task)}
        onDelete={(task) => setDeleteConfirm(task)}
      />

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-navy mb-2">Delete Task?</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const result = await taskService.deleteTask(deleteConfirm.id);
                  if (result.error) {
                    console.error('Delete failed:', result.error);
                  }
                  setDeleteConfirm(null);
                  load();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create new task */}
      {showCreate && (
        <TaskForm
          organizationId={organizationId}
          assigneeOptions={assigneeOptions}
          onClose={() => setShowCreate(false)}
          onSave={async (values) => {
            const result = await taskService.createTask({
              organization_id: organizationId,
              assignee_id: values.assignee_id,
              title: values.title,
              description: values.description,
              priority: values.priority,
              due_date: values.due_date || null,
              task_type: values.task_type,
              booking_id: values.booking_id || null,
              equipment_id: values.equipment_id || null,
              rental_id: values.rental_id || null,
              context_label: values.context_label || null,
              created_by: user?.id,
            });
            console.log('[OrgTasks] createTask result:', result);
            if (result.error) {
              throw new Error(result.error);
            }
            setShowCreate(false);
            load();
          }}
        />
      )}

      {/* Edit existing task */}
      {editingTask && (
        <TaskForm
          organizationId={organizationId}
          assigneeOptions={assigneeOptions}
          initialData={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (values) => {
            const result = await taskService.updateTask(editingTask.id, {
              assignee_id: values.assignee_id,
              title: values.title,
              description: values.description,
              priority: values.priority,
              due_date: values.due_date || null,
              task_type: values.task_type,
              booking_id: values.booking_id || null,
              equipment_id: values.equipment_id || null,
              rental_id: values.rental_id || null,
              context_label: values.context_label || null,
            });
            console.log('[OrgTasks] updateTask result:', result);
            if (result.error) {
              throw new Error(result.error);
            }
            setEditingTask(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default OrgTasks;
