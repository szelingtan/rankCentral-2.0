"use client";

import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { ArrowRight, FileText, BarChart3, Download, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
	return (
		<Layout>
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
					{/* Hero Section */}
					<div className="text-center mb-16">
						<h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
							Document Comparison
							<span className="block text-brand-primary">Made Simple</span>
						</h1>
						<p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
							Upload your documents and get instant AI-powered analysis. Compare multiple documents 
							across custom criteria and download comprehensive reports.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/documents">
								<Button size="lg" className="bg-brand-primary hover:bg-brand-dark">
									Start Comparing <ArrowRight className="ml-2 h-5 w-5" />
								</Button>
							</Link>
							<Link href="/results">
								<Button variant="outline" size="lg">
									View Past Reports
								</Button>
							</Link>
						</div>
					</div>

					{/* Features Section */}
					<div className="grid md:grid-cols-3 gap-8 mb-16">
						<Card className="text-center">
							<CardHeader>
								<FileText className="h-12 w-12 text-brand-primary mx-auto mb-4" />
								<CardTitle>Upload Documents</CardTitle>
								<CardDescription>
									Support for PDF files and text content. Upload multiple documents for comparison.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="text-center">
							<CardHeader>
								<BarChart3 className="h-12 w-12 text-brand-primary mx-auto mb-4" />
								<CardTitle>AI Analysis</CardTitle>
								<CardDescription>
									Powered by OpenAI's latest models for accurate document evaluation and ranking.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="text-center">
							<CardHeader>
								<Download className="h-12 w-12 text-brand-primary mx-auto mb-4" />
								<CardTitle>Export Reports</CardTitle>
								<CardDescription>
									Download detailed comparison reports as CSV files or ZIP archives.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>

					{/* Security Notice */}
					<Card className="border-amber-200 bg-amber-50 mb-16">
						<CardContent className="flex items-center gap-4 pt-6">
							<Shield className="h-8 w-8 text-amber-600 flex-shrink-0" />
							<div>
								<h3 className="font-semibold text-amber-800 mb-1">Security Notice</h3>
								<p className="text-amber-700">
									This application stores data in your browser session only. All uploaded documents 
									and generated reports are stored locally and are automatically cleared when you 
									close your browser session.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* How It Works */}
					<div className="text-center">
						<h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
						<div className="grid md:grid-cols-3 gap-8">
							<div className="flex flex-col items-center">
								<div className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
									1
								</div>
								<h3 className="text-xl font-semibold mb-2">Upload</h3>
								<p className="text-gray-600">Upload your documents or paste text content to compare.</p>
							</div>
							
							<div className="flex flex-col items-center">
								<div className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
									2
								</div>
								<h3 className="text-xl font-semibold mb-2">Configure</h3>
								<p className="text-gray-600">Choose evaluation criteria or provide custom prompts for analysis.</p>
							</div>
							
							<div className="flex flex-col items-center">
								<div className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
									3
								</div>
								<h3 className="text-xl font-semibold mb-2">Download</h3>
								<p className="text-gray-600">Get detailed comparison reports and rankings instantly.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default Home;
