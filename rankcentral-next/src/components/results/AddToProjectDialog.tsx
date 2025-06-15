import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { projectsAPI, Project } from '@/lib/api/projects';

interface AddToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportName: string;
  onSuccess?: () => void;
}

export default function AddToProjectDialog({ 
  open, 
  onOpenChange, 
  reportId, 
  reportName,
  onSuccess 
}: AddToProjectDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await projectsAPI.getProjects({ status: 'active' });
      setProjects(response.projects);
      
      // If no projects exist, provide helpful guidance instead of showing an error
      if (response.projects.length === 0) {
        toast({
          title: "No projects yet",
          description: "Create your first project to organize your reports!",
        });
        // Automatically select "new project" option when no projects exist
        setIsCreatingNew(true);
      }
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      let projectId = selectedProjectId;
      
      // Create new project if needed
      if (isCreatingNew) {
        if (!newProjectName.trim()) {
          toast({
            title: "Project name required",
            description: "Please provide a name for the new project.",
            variant: "destructive",
          });
          return;
        }
        
        const newProject = await projectsAPI.createProject({
          name: newProjectName.trim(),
          description: `Project created for report: ${reportName}`,
        });
        
        projectId = newProject._id;
      }
      
      if (!projectId) {
        toast({
          title: "No project selected",
          description: "Please select a project or create a new one.",
          variant: "destructive",
        });
        return;
      }
      
      // Add report to project
      await projectsAPI.addReportToProject(projectId, reportId);
      
      toast({
        title: "Report added to project",
        description: `"${reportName}" has been added to the project successfully.`,
      });
      
      onOpenChange(false);
      onSuccess?.();
      
    } catch (error: any) {
      toast({
        title: "Error adding report to project",
        description: error.message || "Could not add the report to the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setSelectedProjectId('');
    setNewProjectName('');
    // If no projects exist, keep isCreatingNew as true for better UX
    setIsCreatingNew(projects.length === 0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Report to Project</DialogTitle>
          <DialogDescription>
            Add "{reportName}" to an existing project or create a new project
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : (
            <RadioGroup 
              value={isCreatingNew ? 'new' : selectedProjectId} 
              onValueChange={(value) => {
                if (value === 'new') {
                  setIsCreatingNew(true);
                  setSelectedProjectId('');
                } else {
                  setIsCreatingNew(false);
                  setSelectedProjectId(value);
                }
              }}
            >
              {projects.length > 0 ? (
                <>
                  <Label className="text-sm font-medium">Select Existing Project:</Label>
                  {projects.map((project) => (
                    <div key={project._id} className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value={project._id} id={project._id} />
                      <div className="flex-1">
                        <Label htmlFor={project._id} className="font-medium cursor-pointer">
                          {project.name}
                        </Label>
                        {project.description && (
                          <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span>{project.documents?.length || 0} documents</span>
                          <span>{project.reports?.length || 0} reports</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-2">
                    <Label className="text-sm font-medium">Or Create New Project:</Label>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    You don't have any projects yet. Create your first project to get started!
                  </p>
                  <Label className="text-sm font-medium">Create Your First Project:</Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value="new" id="new" />
                <div className="flex-1">
                  <Label htmlFor="new" className="font-medium cursor-pointer flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Project
                  </Label>
                </div>
              </div>
              
              {isCreatingNew && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Enter project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
              )}
            </RadioGroup>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading || (!selectedProjectId && !isCreatingNew)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <FolderOpen className="mr-2 h-4 w-4" />
                Add to Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
