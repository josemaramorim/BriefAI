import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Tenant,
  Template,
  CreateTemplateRequest,
  Briefing,
  CreateBriefingRequest,
  UpdateBriefingRequest,
  Collaboration,
  AddCollaboratorRequest,
  Comment,
  CreateCommentRequest,
  Attachment,
  ExportOptions,
  DashboardMetrics,
  AIGenerateRequest,
  AIRefineRequest,
} from './types';

// Auth
export const authApi = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post<LoginResponse>('/auth/register', data),
  me: () => apiClient.get<User>('/auth/me'),
};

// Templates
export const templatesApi = {
  getAll: (tenantId: string) => apiClient.get<Template[]>(`/templates?tenantId=${tenantId}`),
  getById: (id: string, tenantId: string) => 
    apiClient.get<Template>(`/templates/${id}?tenantId=${tenantId}`),
  create: (data: CreateTemplateRequest, tenantId: string) => 
    apiClient.post<Template>(`/templates?tenantId=${tenantId}`, data),
  update: (id: string, data: Partial<CreateTemplateRequest>, tenantId: string) =>
    apiClient.patch<Template>(`/templates/${id}?tenantId=${tenantId}`, data),
  delete: (id: string, tenantId: string) =>
    apiClient.delete<void>(`/templates/${id}?tenantId=${tenantId}`),
  publish: (id: string, tenantId: string, isPublic: boolean) =>
    apiClient.patch<Template>(`/templates/${id}/publish?tenantId=${tenantId}`, { isPublic }),
};

// Briefings
export const briefingsApi = {
  getAll: (tenantId: string, filters?: { status?: string; templateId?: string }) => {
    const params = new URLSearchParams({ tenantId });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.templateId) params.append('templateId', filters.templateId);
    return apiClient.get<Briefing[]>(`/briefs?${params}`);
  },
  getById: (id: string, tenantId: string) =>
    apiClient.get<Briefing>(`/briefs/${id}?tenantId=${tenantId}`),
  create: (data: CreateBriefingRequest, tenantId: string) =>
    apiClient.post<Briefing>(`/briefs?tenantId=${tenantId}`, data),
  update: (id: string, data: UpdateBriefingRequest, tenantId: string) =>
    apiClient.patch<Briefing>(`/briefs/${id}?tenantId=${tenantId}`, data),
  delete: (id: string, tenantId: string) =>
    apiClient.delete<void>(`/briefs/${id}?tenantId=${tenantId}`),
};

// Collaborations
export const collaborationsApi = {
  getByBriefing: (briefingId: string, tenantId: string) =>
    apiClient.get<Collaboration[]>(`/collaborations/${briefingId}?tenantId=${tenantId}`),
  add: (briefingId: string, data: AddCollaboratorRequest, tenantId: string) =>
    apiClient.post<Collaboration>(`/collaborations/${briefingId}?tenantId=${tenantId}`, data),
  update: (briefingId: string, collaborationId: string, permission: string, tenantId: string) =>
    apiClient.patch<Collaboration>(
      `/collaborations/${briefingId}/${collaborationId}?tenantId=${tenantId}`,
      { permission }
    ),
  remove: (briefingId: string, collaborationId: string, tenantId: string) =>
    apiClient.delete<void>(`/collaborations/${briefingId}/${collaborationId}?tenantId=${tenantId}`),
};

// Comments
export const commentsApi = {
  getByBriefing: (briefingId: string, tenantId: string) =>
    apiClient.get<Comment[]>(`/collaborations/${briefingId}/comments?tenantId=${tenantId}`),
  create: (briefingId: string, data: CreateCommentRequest, tenantId: string) =>
    apiClient.post<Comment>(`/collaborations/${briefingId}/comments?tenantId=${tenantId}`, data),
  delete: (briefingId: string, commentId: string, tenantId: string) =>
    apiClient.delete<void>(`/collaborations/${briefingId}/comments/${commentId}?tenantId=${tenantId}`),
};

// Attachments
export const attachmentsApi = {
  getByBriefing: (briefingId: string, tenantId: string) =>
    apiClient.get<Attachment[]>(`/attachments?tenantId=${tenantId}&briefingId=${briefingId}`),
  upload: (file: File, tenantId: string, briefingId?: string, templateId?: string) =>
    apiClient.uploadFile<Attachment>('/attachments', file, {
      tenantId,
      briefingId,
      templateId,
    }),
  delete: (id: string, tenantId: string) =>
    apiClient.delete<void>(`/attachments/${id}?tenantId=${tenantId}`),
};

// Exports
export const exportsApi = {
  exportBriefing: (briefingId: string, options: ExportOptions, tenantId: string) =>
    apiClient.post<Blob>(
      `/exports/${briefingId}?tenantId=${tenantId}`,
      options,
      { responseType: 'blob' }
    ),
};

// Dashboard
export const dashboardApi = {
  getMetrics: (tenantId: string) =>
    apiClient.get<DashboardMetrics>(`/dashboard/metrics?tenantId=${tenantId}`),
};

// AI
export const aiApi = {
  generateSuggestions: (data: AIGenerateRequest, tenantId: string) =>
    apiClient.post<{ suggestions: string[] }>(`/ai/generate?tenantId=${tenantId}`, data),
  refineText: (data: AIRefineRequest, tenantId: string) =>
    apiClient.post<{ refinedText: string }>(`/ai/refine?tenantId=${tenantId}`, data),
};

// Billing
export const billingApi = {
  upgradePlan: (plan: string) => apiClient.post<{ message: string; tenant: any }>(`/billing/upgrade`, { plan }),
};
