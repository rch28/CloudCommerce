"use client"

import { create } from "zustand"

interface AddressData {
  label: string
  line1: string
  line2: string
  city: string
  state: string
  zip: string
  country: string
}

interface CheckoutState {
  step: number
  address: AddressData | null
  shippingMethod: string | null
  notes: string
  setStep: (step: number) => void
  setAddress: (address: AddressData) => void
  setShippingMethod: (method: string) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initialAddress: AddressData = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 1,
  address: null,
  shippingMethod: null,
  notes: "",

  setStep: (step: number) => set({ step }),
  setAddress: (address: AddressData) => set({ address }),
  setShippingMethod: (method: string) => set({ shippingMethod: method }),
  setNotes: (notes: string) => set({ notes }),
  reset: () =>
    set({
      step: 1,
      address: null,
      shippingMethod: null,
      notes: "",
    }),
}))
