import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;
  private tokenGetter?: () => string | null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    console.log('DEBUG: NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL);

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setTokenGetter(getter: () => string | null) {
    this.tokenGetter = getter;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.tokenGetter?.();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log('[API CLIENT] Response interceptor - success:', response);
        return response;
      },
      (error: AxiosError) => {
        console.error('[API CLIENT] Response interceptor - error:', error);
        console.error('[API CLIENT] Error status:', error.response?.status);
        console.error('[API CLIENT] Error data:', error.response?.data);
        
        const status = error.response?.status;
        const url = (error.config as any)?.url as string | undefined;

        // Only redirect to login on 401 for protected API calls,
        // not for the auth endpoints themselves (login/register),
        // otherwise a failed login causa um refresh imediato da página.
        if (
          status === 401 &&
          url &&
          !url.includes('/auth/login') &&
          !url.includes('/auth/register')
        ) {
          console.log('[API CLIENT] 401 em rota protegida, redirecionando para /login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        console.log('[API CLIENT] Rejeitando promise com erro');
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    console.log('[API CLIENT] POST request:', { url, data, baseURL: this.client.defaults.baseURL });
    try {
      const response = await this.client.post<T>(url, data, config);
      console.log('[API CLIENT] POST response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API CLIENT] POST error:', error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // File upload
  async uploadFile<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
