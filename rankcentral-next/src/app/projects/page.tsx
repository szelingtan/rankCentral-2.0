'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Folder, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';

// Define the Project interface
interface Project {
	_id: string;
	name: string;
	description: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
}

const Projects = () => {
	const [projects, setProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newProject, setNewProject] = useState({ name: '', description: '' });
	const { data: session } = useSession();
	const router = useRouter();
	const { toast } = useToast();

	const fetchProjects = async () => {
		if (!session?.user?.id) return;

		setIsLoading(true);
		try {
			const response = await fetch('/api/projects');
			if (!response.ok) {
				throw new Error('Failed to fetch projects');
			}
			const data = await response.json();
			setProjects(data);
		} catch (error) {
			toast({
				title: "Failed to load projects",
				description: "Please try again later",
				variant: "destructive"
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchProjects();
	}, [session]);

	const handleCreateProject = async () => {
		if (!session?.user?.id) return;

		if (!newProject.name.trim()) {
			toast({
				title: "Missing project name",
				description: "Please enter a name for your project",
				variant: "destructive"
			});
			return;
		}

		try {
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newProject.name,
					description: newProject.description,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create project');
			}

			const createdProject = await response.json();
			setProjects([createdProject, ...projects]);
			setNewProject({ name: '', description: '' });
			setIsDialogOpen(false);
			toast({
				title: "Project created",
				description: "Your new project has been created successfully",
			});
		} catch (error) {
			toast({
				title: "Failed to create project",
				description: "Please try again later",
				variant: "destructive"
			});
		}
	};

	return (
		<Layout>
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button className="bg-brand-primary hover:bg-brand-dark flex items-center gap-2">
								<PlusCircle className="h-4 w-4" />
								New Project
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create a new project</DialogTitle>
								<DialogDescription>
									Add a new project to organize your documents and evaluations.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="project-name">Project Name</Label>
									<Input
										id="project-name"
										placeholder="Enter project name"
										value={newProject.name}
										onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="project-description">Description (optional)</Label>
									<Textarea
										id="project-description"
										placeholder="Enter project description"
										value={newProject.description}
										onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
									Cancel
								</Button>
								<Button
									onClick={handleCreateProject}
									className="bg-brand-primary hover:bg-brand-dark"
								>
									Create Project
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<Card key={i} className="shadow-sm opacity-50">
								<CardHeader className="pb-2">
									<div className="w-3/4 h-6 bg-gray-200 rounded mb-2"></div>
									<div className="w-1/2 h-4 bg-gray-200 rounded"></div>
								</CardHeader>
								<CardContent>
									<div className="w-full h-16 bg-gray-200 rounded"></div>
								</CardContent>
							</Card>
						))}
					</div>
				) : projects.length === 0 ? (
					<Card className="shadow-sm border-dashed border-2">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Folder className="h-16 w-16 text-gray-400 mb-4" />
							<h3 className="text-xl font-medium text-gray-700 mb-2">No projects yet</h3>
							<p className="text-gray-500 text-center mb-6 max-w-md">
								Create your first project to start uploading and ranking documents
							</p>
							<Button
								onClick={() => setIsDialogOpen(true)}
								className="bg-brand-primary hover:bg-brand-dark"
							>
								Create Your First Project
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{projects.map((project) => (
							<Link
								href={`/projects/${project._id}`}
								key={project._id}
								className="transition-transform hover:scale-[1.01]"
							>
								<Card className="shadow-sm h-full hover:shadow-md transition-shadow">
									<CardHeader className="pb-2">
										<CardTitle className="truncate">{project.name}</CardTitle>
										<CardDescription className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											<span>
												Created on {new Date(project.createdAt).toLocaleDateString()}
											</span>
										</CardDescription>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 line-clamp-3">
											{project.description || "No description provided."}
										</p>
									</CardContent>
									<CardFooter className="text-sm text-gray-500 pt-0">
										Click to view details
									</CardFooter>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
		</Layout>
	);
};

export default Projects;
