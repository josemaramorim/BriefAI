import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';
import { apiClient } from '@/lib/api/client';
import type { User, LoginRequest, RegisterRequest } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        console.log('[AUTH STORE] login() chamado com:', credentials);
        set({ isLoading: true, error: null });
        try {
          console.log('[AUTH STORE] Chamando authApi.login...');
          const response = await authApi.login(credentials);
          console.log('[AUTH STORE] Resposta recebida:', response);
          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Set token getter for API client
          apiClient.setTokenGetter(() => get().token);
          console.log('[AUTH STORE] Login concluído com sucesso');
        } catch (error: any) {
          console.error('[AUTH STORE] Erro no login:', error);
          console.error('[AUTH STORE] Error response:', error?.response);
          set({
            error: error.response?.data?.message || 'Erro ao fazer login',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Set token getter for API client
          apiClient.setTokenGetter(() => get().token);
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Erro ao registrar',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadUser: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          apiClient.setTokenGetter(() => get().token);
          const user = await authApi.me();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
