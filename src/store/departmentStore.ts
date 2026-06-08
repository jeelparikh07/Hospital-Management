'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Department } from '@/types';

interface DepartmentState {
  departments: Record<string, Department[]>; // hospitalId -> departments[]
  addDepartment: (hospitalId: string, department: Department) => void;
  updateDepartment: (hospitalId: string, departmentId: string, updates: Partial<Department>) => void;
  deleteDepartment: (hospitalId: string, departmentId: string) => void;
  getDepartments: (hospitalId: string) => Department[];
  getDepartmentCount: (hospitalId: string) => number;
}

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      departments: {},

      addDepartment: (hospitalId, department) => {
        set((state) => {
          const existing = state.departments[hospitalId] || [];
          return {
            departments: {
              ...state.departments,
              [hospitalId]: [...existing, department],
            },
          };
        });
      },

      updateDepartment: (hospitalId, departmentId, updates) => {
        set((state) => {
          const existing = state.departments[hospitalId] || [];
          const updated = existing.map((dept) =>
            dept.id === departmentId ? { ...dept, ...updates } : dept
          );
          return {
            departments: {
              ...state.departments,
              [hospitalId]: updated,
            },
          };
        });
      },

      deleteDepartment: (hospitalId, departmentId) => {
        set((state) => {
          const existing = state.departments[hospitalId] || [];
          const filtered = existing.filter((dept) => dept.id !== departmentId);
          return {
            departments: {
              ...state.departments,
              [hospitalId]: filtered,
            },
          };
        });
      },

      getDepartments: (hospitalId) => {
        return get().departments[hospitalId] || [];
      },

      getDepartmentCount: (hospitalId) => {
        return (get().departments[hospitalId] || []).length;
      },
    }),
    {
      name: 'queuemed-departments',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
