/**
 * Onboarding store — tracks whether the user has completed onboarding
 * and which step they're currently on.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasCompleted: boolean;
  currentStep: number;
  completeOnboarding: () => void;
  setStep: (step: number) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompleted: false,
      currentStep: 0,

      completeOnboarding: () => set({ hasCompleted: true, currentStep: 0 }),
      setStep: (step) => set({ currentStep: step }),
      resetOnboarding: () => set({ hasCompleted: false, currentStep: 0 }),
    }),
    {
      name: 'promptgallery-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
