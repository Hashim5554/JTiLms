import { create } from 'zustand';
import type { Class } from '../types/index';

interface ClassStore {
  selectedClass: Class | null;
  setSelectedClass: (class_: Class | null) => void;
}

export const useClassStore = create<ClassStore>((set) => ({
  selectedClass: null,
  setSelectedClass: (class_) => set({ selectedClass: class_ }),
})); 