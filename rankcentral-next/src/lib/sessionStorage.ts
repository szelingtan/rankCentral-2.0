/**
 * @fileoverview Session storage utilities for managing user data without a database.
 * Handles documents, reports, and user preferences in browser session storage.
 */

export interface SessionDocument {
  id: string;
  content: string;
  displayName?: string;
  fileSize?: string;
  uploadDate: string;
}

export interface SessionReport {
  _id: string;
  report_id: string;
  timestamp: string;
  documents: string[];
  top_ranked: string;
  csv_files: Array<{ filename: string; content: string }>;
  criteria_count: number;
  evaluation_method: string;
  custom_prompt?: string;
  report_name: string;
  api_key_status: string;
  ranking: string[];
}

export interface SessionProject {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'completed' | 'archived';
  documents: string[];
  reports: string[];
}

const STORAGE_KEYS = {
  DOCUMENTS: 'rankcentral_documents',
  REPORTS: 'rankcentral_reports',
  PROJECTS: 'rankcentral_projects',
  PREFERENCES: 'rankcentral_preferences'
};

/**
 * Session storage manager for RankCentral data
 */
export class SessionStorageManager {
  /**
   * Save documents to session storage
   */
  static saveDocuments(documents: SessionDocument[]): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    }
  }

  /**
   * Get documents from session storage
   */
  static getDocuments(): SessionDocument[] {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  /**
   * Save a single report to session storage
   */
  static saveReport(report: SessionReport): void {
    if (typeof window !== 'undefined') {
      const reports = this.getReports();
      const existingIndex = reports.findIndex(r => r.report_id === report.report_id);
      
      if (existingIndex >= 0) {
        reports[existingIndex] = report;
      } else {
        reports.unshift(report); // Add to beginning
      }

      // Keep only the last 50 reports
      const limitedReports = reports.slice(0, 50);
      sessionStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(limitedReports));
    }
  }

  /**
   * Get all reports from session storage
   */
  static getReports(): SessionReport[] {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEYS.REPORTS);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  /**
   * Get a specific report by ID
   */
  static getReport(reportId: string): SessionReport | null {
    const reports = this.getReports();
    return reports.find(r => r.report_id === reportId) || null;
  }

  /**
   * Save projects to session storage
   */
  static saveProjects(projects: SessionProject[]): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }
  }

  /**
   * Get projects from session storage
   */
  static getProjects(): SessionProject[] {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEYS.PROJECTS);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  /**
   * Save a single project to session storage
   */
  static saveProject(project: SessionProject): void {
    if (typeof window !== 'undefined') {
      const projects = this.getProjects();
      const existingIndex = projects.findIndex(p => p._id === project._id);
      
      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }

      this.saveProjects(projects);
    }
  }

  /**
   * Get a specific project by ID
   */
  static getProject(projectId: string): SessionProject | null {
    const projects = this.getProjects();
    return projects.find(p => p._id === projectId) || null;
  }

  /**
   * Delete a project
   */
  static deleteProject(projectId: string): void {
    if (typeof window !== 'undefined') {
      const projects = this.getProjects();
      const filteredProjects = projects.filter(p => p._id !== projectId);
      this.saveProjects(filteredProjects);
    }
  }

  /**
   * Clear all session data
   */
  static clearAll(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
      sessionStorage.removeItem(STORAGE_KEYS.REPORTS);
      sessionStorage.removeItem(STORAGE_KEYS.PROJECTS);
      sessionStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    }
  }

  /**
   * Export all session data
   */
  static exportData(): Record<string, any> {
    return {
      documents: this.getDocuments(),
      reports: this.getReports(),
      projects: this.getProjects()
    };
  }

  /**
   * Import session data
   */
  static importData(data: Record<string, any>): void {
    if (data.documents) this.saveDocuments(data.documents);
    if (data.reports && Array.isArray(data.reports)) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
      }
    }
    if (data.projects) this.saveProjects(data.projects);
  }
} 