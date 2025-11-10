'use client';

import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '@/lib/tasksApi';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryParams,
  PaginatedTasksResponse,
  TaskStatus,
  TaskPriority,
} from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  today: number;
}

interface UseTasksOptions {
  autoLoad?: boolean;
  initialFilters?: TaskQueryParams;
}

interface UseTasksReturn {
  tasks: Task[];
  stats: TaskStats;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  fetchTasks: (params?: TaskQueryParams) => Promise<void>;
  createTask: (data: CreateTaskDto) => Promise<Task | null>;
  updateTask: (id: string, data: UpdateTaskDto) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  completeTask: (id: string) => Promise<Task | null>;
  refreshTasks: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: TaskQueryParams) => void;
}

/**
 * Hook for managing all tasks with API integration
 */
export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { autoLoad = true, initialFilters = {} } = options;
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TaskQueryParams>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 100, // Increased to show more tasks for better statistics
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Calculate statistics from tasks
  const calculateStats = useCallback((taskList: Task[]): TaskStats => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    return {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'Completed').length,
      inProgress: taskList.filter(t => 
        t.status === 'Pending' && 
        new Date(t.dueDate) >= now &&
        !(new Date(t.dueDate) >= todayStart && new Date(t.dueDate) < todayEnd)
      ).length,
      overdue: taskList.filter(t => 
        t.status === 'Pending' && 
        new Date(t.dueDate) < now
      ).length,
      today: taskList.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate >= todayStart && 
               dueDate < todayEnd &&
               t.status === 'Pending';
      }).length,
    };
  }, []);

  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    today: 0,
  });

  /**
   * Fetch tasks from API
   */
  const fetchTasks = useCallback(async (params?: TaskQueryParams) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        ...filters,
        ...params,
        page: params?.page || pagination.page,
        pageSize: params?.pageSize || pagination.pageSize,
      };

      const response: PaginatedTasksResponse = await tasksApi.getTasks(queryParams);
      
      setTasks(response.data);
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage,
      });

      // Calculate stats from fetched tasks
      setStats(calculateStats(response.data));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, calculateStats]);

  /**
   * Create a new task
   */
  const createTask = useCallback(async (data: CreateTaskDto): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      const newTask = await tasksApi.createTask(data);
      
      // Refresh tasks to get updated list
      await fetchTasks();
      
      return newTask;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
      setError(errorMessage);
      console.error('Error creating task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTasks]);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (id: string, data: UpdateTaskDto): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      const updatedTask = await tasksApi.updateTask(id, data);
      
      // Update task in local state
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === id ? updatedTask : task)
      );
      
      // Recalculate stats
      const updatedTasks = tasks.map(task => task.id === id ? updatedTask : task);
      setStats(calculateStats(updatedTasks));
      
      return updatedTask;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update task';
      setError(errorMessage);
      console.error('Error updating task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tasks, calculateStats]);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await tasksApi.deleteTask(id);
      
      // Remove task from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      
      // Recalculate stats
      const updatedTasks = tasks.filter(task => task.id !== id);
      setStats(calculateStats(updatedTasks));
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete task';
      setError(errorMessage);
      console.error('Error deleting task:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tasks, calculateStats]);

  /**
   * Mark a task as completed
   */
  const completeTask = useCallback(async (id: string): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      const completedTask = await tasksApi.completeTask(id);
      
      // Update task in local state
      setTasks(prevTasks => 
        prevTasks.map(task => task.id === id ? completedTask : task)
      );
      
      // Recalculate stats
      const updatedTasks = tasks.map(task => task.id === id ? completedTask : task);
      setStats(calculateStats(updatedTasks));
      
      return completedTask;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to complete task';
      setError(errorMessage);
      console.error('Error completing task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tasks, calculateStats]);

  /**
   * Refresh tasks with current filters
   */
  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  /**
   * Set current page
   */
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Set filters
   */
  const setFilters = useCallback((newFilters: TaskQueryParams) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);

  // Auto-load tasks on mount and when filters or page change
  useEffect(() => {
    if (autoLoad && user) {
      fetchTasks();
    }
  }, [autoLoad, user, filters, pagination.page]);

  return {
    tasks,
    stats,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refreshTasks,
    setPage,
    setFilters,
  };
}

/**
 * Hook for managing tasks for a specific lead
 */
export function useTasksByLead(leadId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasksForLead = useCallback(async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      setError(null);
      const leadTasks = await tasksApi.getTasksByLead(leadId);
      setTasks(leadTasks);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch tasks for lead';
      setError(errorMessage);
      console.error('Error fetching tasks for lead:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  // Auto-load tasks when leadId changes
  useEffect(() => {
    fetchTasksForLead();
  }, [fetchTasksForLead]);

  return {
    tasks,
    loading,
    error,
    refreshTasks: fetchTasksForLead,
  };
}

export default useTasks;
