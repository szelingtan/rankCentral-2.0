"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { FileText, GitCompare, BarChart3, Settings, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const LearnMore = () => {
	return (
		<Layout>
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-brand-primary">rankCentral Guide</h1>

				<div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-brand-primary" />
								Step 1: Upload Documents
							</CardTitle>
							<CardDescription>Uploading your documents into rankCentral</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600 mb-4">
								Start by uploading the documents you want to compare and rank. You can:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-gray-600">
								<li>Upload PDF files directly from your computer</li>
								<li>Input text directly into the text area provided</li>
								<li>Upload multiple documents for comprehensive comparison</li>
							</ul>
							<p className="mt-4 text-gray-600">
								Please kindly note that only PDF documents are supported.
							</p>
							<div className="mt-6">
								<Button asChild variant="outline" size="sm">
									<Link href="/documents">
										Go to Document Upload <ExternalLink className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<GitCompare className="h-5 w-5 text-brand-primary" />
								Step 2: Define Comparison Criteria
							</CardTitle>
							<CardDescription>Setting up your evaluation parameters</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600 mb-4">
								Define the criteria by which you want your documents to be evaluated (3 options):
							</p>
							<ul className="list-disc pl-6 space-y-2 text-gray-600">
								<li>Use our pre-defined criteria for common document types</li>
								<li>Create custom ranking criteria and weightage specific to your needs</li>
								<li>Create a custom prompt for AI evaluation</li>
							</ul>
							<p className="mt-4 text-gray-600">
								Well-defined criteria lead to more accurate and useful comparison results.
							</p>
							<div className="mt-6">
								<Button asChild variant="outline" size="sm">
									<Link href="/documents">
										Set Evaluation Criteria <ExternalLink className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5 text-brand-primary" />
								Step 3: View and Interpret Results
							</CardTitle>
							<CardDescription>Understanding the comparison output</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600 mb-4">
								After analysis is complete, you can download comprehensive CSV file results from the Results page:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-gray-600">
								<li>Overall ranking of documents based on your criteria</li>
								<li>Detailed breakdown of scores for each criterion</li>
								<li>AI-generated justifications for rankings and scores</li>
								<li>Downloadable reports for sharing or archiving</li>
							</ul>
							<p className="mt-4 text-gray-600">
								You can rename the folders containing the comprehensive results for better organization.
							</p>
							<div className="mt-6">
								<Button asChild variant="outline" size="sm">
									<Link href="/results">
										View Results <ExternalLink className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-5 w-5 text-brand-primary" />
								Step 4: Adjust Settings (In Progress)
							</CardTitle>
							<CardDescription>Customizing your experience</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600 mb-4">
								Fine-tune your rankCentral experience by adjusting settings:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-gray-600">
								<li>Select the AI model used for evaluations</li>
								<li>Configure default criteria templates</li>
								<li>Set preferences for report generation</li>
								<li>Manage your account and projects</li>
							</ul>
							<p className="mt-4 text-gray-600">
								The Settings page allows you to customize the platform according to your specific needs and workflow.
							</p>
							<div className="mt-6">
								<Button asChild variant="outline" size="sm" disabled>
									<Link href="/settings">
										Settings <ExternalLink className="ml-2 h-4 w-4" />
									</Link>
								</Button>
								<span className="ml-2 text-xs text-muted-foreground">(Coming soon)</span>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="mt-12">
					<Card className="border-brand-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<HelpCircle className="h-5 w-5 text-brand-primary" />
								Need Additional Help?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-600">
								More information coming up soon!
							</p>
							<div className="mt-6 flex flex-wrap gap-4">
								<Button asChild variant="default">
									<Link href="/">
										Return to Home
									</Link>
								</Button>
								<Button asChild variant="secondary">
									<Link href="/documents">
										Start a New Comparison
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</Layout>
	);
};

export default LearnMore;
