"use client"

import { create } from "zustand"
import { authApi } from "@/services/auth.service"
import { storefrontApi } from "@/services/storefront.service"

export type Role = "merchant" | "admin"
export type Plan = "Starter" | "Growth" | "Scale"

export interface Session {
  id: string
  name: string
  email: string
  role: Role
  tenantId?: string
  storeName?: string
  subdomain?: string
  plan?: Plan
}

interface SignUpData {
  email: string
  password: string
  name: string
  role: Role
}

interface AuthState {
  session: Session | null
  loading: boolean
  setRole: (role: Role) => void
  signIn: (email: string, password: string) => Promise<Session>
  signUp: (data: SignUpData) => Promise<Session>
  customerSignIn: (email: string, password: string, tenantId: string) => Promise<void>
  customerSignUp: (data: { email: string; password: string; name: string; tenantId: string }) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: true,

  setRole: (role: Role) => {
    set((state) => state.session ? { session: { ...state.session, role } } : {})
  },

  init: async () => {
    set({ loading: true })
    try {
      const data = await authApi.me()
      if (data.loggedIn && data.user) {
        set({
          session: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as Role,
            tenantId: data.user.tenantId,
          },
        })
      } else {
        set({ session: null })
      }
    } catch {
      set({ session: null })
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    const session: Session = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as Role,
      tenantId: data.user.tenantId,
    }
    set({ session })
    return session
  },

  signUp: async (signUpData: SignUpData) => {
    const result = await authApi.register(signUpData)
    const session: Session = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role as Role,
      tenantId: result.user.tenantId,
    }
    set({ session })
    return session
  },

  customerSignIn: async (email: string, password: string, tenantId: string) => {
    await storefrontApi.customerLogin({ email, password })
    // Fetch session after login so the store reflects the authenticated state.
    await get().init()
  },

  customerSignUp: async (data: { email: string; password: string; name: string; tenantId: string }) => {
    await storefrontApi.customerRegister(data)
    // Fetch session after registration so the store reflects the authenticated state.
    await get().init()
  },

  signOut: async () => {
    await authApi.logout()
    set({ session: null })
    window.location.href = "/"
  },

  refresh: async () => {
    try {
      const data = await authApi.me()
      if (data.loggedIn && data.user) {
        set({
          session: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role as Role,
            tenantId: data.user.tenantId,
          },
        })
      } else {
        set({ session: null })
      }
    } catch {
      set({ session: null })
    }
  },
}))
