// API Types based on backend models

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'ARCHITECT' | 'CLIENT' | 'ADMIN' | 'USER';
  locale: string;
  tenantId: string | null;
  tenantSlug: string | null;
  membershipRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'PAUSED' | 'TRIAL';
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  jsonSchema: any;
  version: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface Briefing {
  id: string;
  tenantId: string;
  templateId: string;
  clientId?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  progress: number;
  answersJson: any;
  createdAt: string;
  updatedAt: string;
  template?: Template;
  client?: User;
}

export interface Collaboration {
  id: string;
  briefingId: string;
  userId: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Comment {
  id: string;
  briefingId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Attachment {
  id: string;
  tenantId: string;
  briefingId?: string;
  templateId?: string;
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageProvider: string;
  storageKey: string;
  previewUrl?: string;
  createdAt: string;
  user?: User;
}

export interface DashboardMetrics {
  briefings: {
    total: number;
    inProgress: number;
    completed: number;
    draft: number;
  };
  templates: {
    total: number;
    published: number;
    draft: number;
  };
  collaborations: {
    totalCollaborators: number;
    activeCollaborators: number;
  };
  storage: {
    totalAttachments: number;
    totalSize: number;
  };
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tenantName?: string;
  locale?: string;
}

export interface CreateTemplateRequest {
  title: string;
  jsonSchema: any;
  isPublic?: boolean;
}

export interface CreateBriefingRequest {
  templateId: string;
  clientId?: string;
}

export interface UpdateBriefingRequest {
  answersJson?: any;
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
}

export interface AddCollaboratorRequest {
  userId: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT';
}

export interface CreateCommentRequest {
  content: string;
}

export interface ExportOptions {
  format: 'PDF' | 'JSON' | 'ZIP';
  includeAttachments?: boolean;
  includeComments?: boolean;
  summarized?: boolean;
}

export interface AIGenerateRequest {
  briefingId: string;
  fieldKey: string;
  context?: string;
}

export interface AIRefineRequest {
  text: string;
  instructions?: string;
}
