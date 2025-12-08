import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (schoolId: string, password: string) => Promise<void>;
  signup: (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    schoolId: string;
  }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (schoolId: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ schoolId, password });
          localStorage.setItem('accessToken', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (data) => {
        set({ isLoading: true });
        try {
          const user = await authService.signup(data);
          set({ isLoading: false });
          // After signup, user needs to login
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      loadUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('accessToken');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      isAdmin: () => {
        const { user } = get();
        return user?.roleName === 'ADMIN';
      },

      isStaff: () => {
        const { user } = get();
        return user?.roleName === 'STAFF';
      },

      isCustomer: () => {
        const { user } = get();
        return user?.roleName === 'CUSTOMER';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

