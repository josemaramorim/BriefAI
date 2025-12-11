import { ApiProperty } from '@nestjs/swagger';

export interface BriefingMetrics {
  total: number;
  inProgress: number;
  completed: number;
  draft: number;
}

export interface TemplateMetrics {
  total: number;
  published: number;
  draft: number;
}

export interface CollaborationMetrics {
  totalCollaborators: number;
  activeCollaborators: number;
}

export interface StorageMetrics {
  totalAttachments: number;
  totalSize: number;
}

export interface MetricsDto {
  briefings: BriefingMetrics;
  templates: TemplateMetrics;
  collaborations: CollaborationMetrics;
  storage: StorageMetrics;
}
