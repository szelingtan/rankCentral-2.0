"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  FileText, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  Edit, 
  BarChart3,
  Search,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { projectsAPI, Project } from '@/lib/api/projects';

export default function ProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreating, setIsCreating] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    if (session?.user) {
      loadProjects();
    }
  }, [session]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await projectsAPI.getProjects({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
      });
      
      // Add computed fields for display
      const projectsWithCounts = response.projects.map(project => ({
        ...project,
        documentsCount: project.documents?.length || 0,
        reportsCount: project.reports?.length || 0,
      }));
      
      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error loading projects",
        description: "Could not load your projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects based on search query and active tab
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || project.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please provide a name for your project.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const newProject = await projectsAPI.createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });
      
      // Add to local state with computed fields
      setProjects([{
        ...newProject,
        documentsCount: 0,
        reportsCount: 0,
      }, ...projects]);
      
      setShowNewProjectDialog(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      toast({
        title: "Project created",
        description: `"${newProjectName}" has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message || "Could not create your project. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    try {
      await projectsAPI.deleteProject(projectId);
      setProjects(projects.filter(p => p._id !== projectId));
      
      toast({
        title: "Project deleted",
        description: `"${projectName}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message || "Could not delete the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add search functionality with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (session?.user) {
        loadProjects();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  // Add report to a project
  const handleAddReportToProject = (projectId: string) => {
    // Navigate to results page with project context
    router.push(`/results?projectId=${projectId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Projects (In Progress)</h1>
            <p className="text-gray-600">Manage and organize your document comparison projects</p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => setShowNewProjectDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Guide Section (moved here) */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">How Projects Work</h2>
          <ul className="list-disc pl-6 text-blue-900 text-sm space-y-1">
            <li>Projects help you organize document comparisons and reports under a single category.</li>
            <li>You can create a new project for each use case (e.g., research, policy review, contracts).</li>
            <li>After running a document comparison, you can add the resulting report to a project for easy access and tracking.</li>
            <li>Example projects below show how you might use this feature.</li>
          </ul>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeleton loaders for projects
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="mt-6 flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <Card key={project._id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <div className="text-xl font-semibold truncate pr-2 flex items-center gap-2">
                      {project.name}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-gray-500 hover:text-red-500"
                        onClick={() => handleDeleteProject(project._id, project.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 h-10">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>Created: {formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-brand-primary" />
                      <span>{project.documentsCount} Documents</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5 text-brand-primary" />
                      <span>{project.reportsCount} Reports</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <div className="text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      project.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/documents?projectId=${project._id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        View Project
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1" 
                      onClick={() => handleAddReportToProject(project._id)}
                    >
                      Add Report
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                {searchQuery 
                  ? `No projects match your search query "${searchQuery}"`
                  : "You haven't created any projects yet"}
              </p>
              <Button onClick={() => setShowNewProjectDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>

        {/* New Project Dialog */}
        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your document comparisons and reports
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">
                  Project Description <span className="text-gray-400 text-sm">(optional)</span>
                </Label>
                <Input
                  id="project-description"
                  placeholder="Enter project description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleCreateProject} 
                disabled={!newProjectName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}