// src/app/page.tsx

import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, BarChart, FilePlus } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<section className="px-4 py-20 text-center bg-gradient-to-b from-white to-gray-100">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
						<span className="block text-brand-primary">Document Comparison</span>
						<span className="block text-brand-secondary">Powered by AI</span>
					</h1>
					<p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
						Compare multiple documents easily using AI-driven analysis. Our platform evaluates clarity, relevance,
						thoroughness, and more to help you identify the best documents.
					</p>
					<div className="mt-10 flex justify-center gap-4">
						<Link href="/documents/compare">
							<Button size="lg" className="bg-brand-primary hover:bg-brand-dark">
								Start Comparing
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<Link href="/dashboard">
							<Button size="lg" variant="outline">
								View Dashboard
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 px-4 bg-white">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
					<div className="grid md:grid-cols-3 gap-8">
						<div className="p-6 bg-white rounded-lg shadow-md">
							<div className="rounded-full bg-brand-light p-3 w-12 h-12 flex items-center justify-center mb-4">
								<FilePlus className="h-6 w-6 text-brand-primary" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
							<p className="text-gray-600">
								Upload your PDFs, text files, or paste content directly. Our system handles various document formats.
							</p>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-md">
							<div className="rounded-full bg-brand-light p-3 w-12 h-12 flex items-center justify-center mb-4">
								<FileText className="h-6 w-6 text-brand-primary" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Set Criteria</h3>
							<p className="text-gray-600">
								Define custom evaluation criteria or use our defaults. Weight each criterion based on importance.
							</p>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-md">
							<div className="rounded-full bg-brand-light p-3 w-12 h-12 flex items-center justify-center mb-4">
								<BarChart className="h-6 w-6 text-brand-primary" />
							</div>
							<h3 className="text-xl font-semibold mb-2">Get Results</h3>
							<p className="text-gray-600">
								Our AI analyzes and ranks your documents, providing detailed insights on why certain documents perform better.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Use Cases Section */}
			<section className="py-16 px-4 bg-gray-50">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-3xl font-bold text-center mb-12">Use Cases</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="p-6 bg-white rounded-lg shadow-sm">
							<h3 className="text-xl font-semibold mb-2">Academic Research</h3>
							<p className="text-gray-600">
								Compare research papers, academic articles, or student submissions to identify the most thorough and relevant work.
							</p>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-sm">
							<h3 className="text-xl font-semibold mb-2">Business Documents</h3>
							<p className="text-gray-600">
								Evaluate contract versions, proposals, or policy documents to determine which ones are clearer and more comprehensive.
							</p>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-sm">
							<h3 className="text-xl font-semibold mb-2">Content Creation</h3>
							<p className="text-gray-600">
								Compare different drafts or versions of articles, blog posts, or marketing materials to select the best one.
							</p>
						</div>
						<div className="p-6 bg-white rounded-lg shadow-sm">
							<h3 className="text-xl font-semibold mb-2">Legal Documents</h3>
							<p className="text-gray-600">
								Assess legal briefs, agreements, or regulatory documents to identify strengths and weaknesses in different versions.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 px-4 bg-brand-primary text-white">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl font-bold mb-4">Ready to start comparing documents?</h2>
					<p className="text-xl mb-8">
						Our AI-powered platform makes it easy to compare and rank your documents.
					</p>
					<Link href="/documents/compare">
						<Button
							size="lg"
							variant="secondary"
							className="bg-white text-brand-primary hover:bg-gray-100"
						>
							Get Started Now
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>
			</section>
		</div>
	);
}
