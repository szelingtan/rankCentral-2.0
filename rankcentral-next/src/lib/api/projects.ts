/**
 * @fileoverview API client for project-related operations
 * Handles all HTTP requests to project endpoints
 */

export interface Project {
  _id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'completed' | 'archived';
  documents: string[];
  reports: string[];
  documentsCount?: number;
  reportsCount?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export class ProjectsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all projects for the current user
   */
  async getProjects(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ProjectsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/projects?${searchParams}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }

    return response.json();
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project');
    }

    return response.json();
  }

  /**
   * Create a new project
   */
  async createProject(project: CreateProjectRequest): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }

    return response.json();
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, project: UpdateProjectRequest): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }

    return response.json();
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  }

  /**
   * Add a report to a project
   */
  async addReportToProject(projectId: string, reportId: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ reportId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add report to project');
    }

    return response.json();
  }

  /**
   * Get reports for a project
   */
  async getProjectReports(projectId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/reports`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project reports');
    }

    return response.json();
  }

  /**
   * Add documents to a project
   */
  async addDocumentsToProject(projectId: string, documentPaths: string[]): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ documents: documentPaths }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add documents to project');
    }

    return response.json();
  }
}

// Create a default instance
export const projectsAPI = new ProjectsAPI();
