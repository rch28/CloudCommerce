"use client"

import { create } from "zustand"

interface SettingsState {
  dirty: Record<string, boolean>
  setDirty: (key: string, value: boolean) => void
  resetDirty: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  dirty: {},

  setDirty: (key: string, value: boolean) =>
    set((state) => ({ dirty: { ...state.dirty, [key]: value } })),

  resetDirty: () => set({ dirty: {} }),
}))
