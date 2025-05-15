"use client";

import { Button } from "@/components/ui/button";
import { FileText, Settings, BarChart3, ArrowRight } from 'lucide-react';
import Link from "next/link";
import RankCentralLogo from "@/components/RankCentralLogo";
import { useRouter } from 'next/navigation'

export default function HomePage() {
	const router = useRouter();

	const handleNavigateLogin = () => {
		router.push("/login");
	}

	return (
		<div className="flex flex-col min-h-screen">
			{/* Header with logo */}
			<header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
				<RankCentralLogo size={40} />
				<div className="flex space-x-4">
					<Button variant="outline" onClick={handleNavigateLogin}>
						Login
					</Button>
					<Button>
					Get Started
					</Button>
				</div>
			</header>

			{/* Hero Section */}
			<section className="px-4 py-20 text-center bg-gradient-to-b from-white to-blue-100">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-brand-dark tracking-tight">
						<span className="block text-brand-primary">Document Ranking Made Simple</span>
					</h1>
					<p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
						Compare and rank documents based on customizable criteria or prompts with Artificial Intelligence
					</p>
					<div className="mt-10 flex justify-center gap-4">
						<Link href="/documents">
							<Button size="lg" variant="outline">
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

			{/* Features section */}
			<section className="py-16 px-4 bg-white">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How rankCentral Works</h2>
					<div className="grid md:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
						<div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
							<FileText className="text-brand-primary h-6 w-6" />
						</div>
						<h3 className="text-xl font-semibold mb-2 text-gray-800">Upload Documents</h3>
						<p className="text-gray-600">
							Input your documents directly or upload files in various formats for comparison
						</p>
						</div>
						
						{/* Feature 2 */}
						<div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
						<div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
							<Settings className="text-brand-primary h-6 w-6" />
						</div>
						<h3 className="text-xl font-semibold mb-2 text-gray-800">Define Criteria</h3>
						<p className="text-gray-600">
							Set custom ranking criteria with specific weightage or use our default rubrics
						</p>
						</div>
						
						{/* Feature 3 */}
						<div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md">
						<div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
							<BarChart3 className="text-brand-primary h-6 w-6" />
						</div>
						<h3 className="text-xl font-semibold mb-2 text-gray-800">View Results</h3>
						<p className="text-gray-600">
							Get comprehensive results with detailed pairwise comparisons powered by AI
						</p>
						</div>
					</div>
				</div>
			</section>

			{/* Use Cases Section
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
			</section> */}

			{/* Footer */}
			<footer className="bg-gray-800 text-white py-8 px-4">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
					<div className="mb-4 md:mb-0">
						<RankCentralLogo className="text-white" />
						<p className="text-gray-400 mt-2">© 2025 rankCentral. Central Provident Fund Board.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
