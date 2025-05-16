'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, PlusCircle, FileText, BarChart3, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Define the Project interface
interface Project {
  _id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  documents: any[];
  comparisons: any[];
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;

  const fetchProjectDetails = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Project not found",
            description: "The project you're looking for doesn't exist",
            variant: "destructive"
          });
          router.push('/projects');
          return;
        }
        throw new Error('Failed to fetch project details');
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast({
        title: "Error loading project",
        description: "Unable to load project details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id, session]);

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully"
      });
      router.push('/projects');
    } catch (error) {
      toast({
        title: "Failed to delete project",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6 text-gray-400">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Loading project details...</span>
          </div>
          <div className="h-12 w-1/3 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 w-1/2 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Link href="/projects" className="text-brand-primary hover:underline flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-medium text-gray-700 mb-2">Project not found</h3>
              <p className="text-gray-500 text-center mb-6">
                The project you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href="/projects">
                <Button>Go back to Projects</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/projects" className="text-brand-primary hover:underline flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the project
                  and all associated documents and comparisons.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
          <p className="text-gray-600 mb-2">
            {project.description || "No description provided."}
          </p>
          <div className="text-sm text-gray-500">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="comparisons" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Comparisons
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Documents</CardTitle>
                  <Link href={`/documents?projectId=${project._id}`}>
                    <Button className="bg-brand-primary hover:bg-brand-dark flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Document
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.documents && project.documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {project.documents.map((doc: any) => (
                      <Card key={doc._id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-gray-500">{doc.type}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No documents yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Add documents to this project to start comparing them
                    </p>
                    <Link href={`/documents?projectId=${project._id}`}>
                      <Button className="bg-brand-primary hover:bg-brand-dark">
                        Upload Document
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparisons">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Comparisons</CardTitle>
                  <Link href={`/documents/compare?projectId=${project._id}`}>
                    <Button className="bg-brand-primary hover:bg-brand-dark flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      New Comparison
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.comparisons && project.comparisons.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {project.comparisons.map((comparison: any) => (
                      <Card key={comparison._id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <h3 className="font-medium">{comparison.name}</h3>
                          <p className="text-sm text-gray-500">
                            Created on {new Date(comparison.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No comparisons yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Start comparing documents to see results here
                    </p>
                    <Link href={`/documents/compare?projectId=${project._id}`}>
                      <Button className="bg-brand-primary hover:bg-brand-dark">
                        Start Comparison
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}