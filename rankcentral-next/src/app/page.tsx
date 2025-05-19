"use client";

import { Button } from "@/components/ui/button";
import { FileText, Settings, BarChart3, ArrowRight, LogIn, LogOut } from 'lucide-react';
import Link from "next/link";
import RankCentralLogo from "@/components/RankCentralLogo";
import { useRouter } from 'next/navigation'
import { useSession, signOut } from "next-auth/react";
import { ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Custom component for authenticated links
interface AuthenticatedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  requiresAuth?: boolean;
}

const AuthenticatedLink = ({ href, children, className, requiresAuth = true }: AuthenticatedLinkProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (session || !requiresAuth) {
      router.push(href);
    } else {
      toast({
        title: "Authentication required",
        description: "Please log in to access this feature",
        variant: "default",
      });
      router.push("/login");
    }
  };

  return (
    <a href="#" onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default function HomePage() {
	const router = useRouter();
	const { data: session } = useSession();
	const { toast } = useToast();

	const handleNavigateLogin = () => {
		router.push("/login");
	}

	const handleSignOut = () => {
		signOut({ redirect: false });
		toast({
			title: "Logged out",
			description: "You have been successfully logged out",
		});
		router.push("/");
	}

	return (
		<div className="flex flex-col min-h-screen">
			{/* Header with logo */}
			<header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
				<RankCentralLogo size={40} />
				<div className="flex space-x-4">
					{/* Check if user is logged in */}
					{!session ? (
						<Button 
							onClick={handleNavigateLogin} 
							size="sm"
							className="flex items-center gap-1.5 bg-gradient-to-r from-[#163b69] to-[#2563eb] text-white hover:shadow-md transition-all duration-300 hover:from-[#113050] hover:to-[#1e50c0]"
						>
							<LogIn className="h-3.5 w-3.5" />
							Login
						</Button>
					) : (
						<Button 
							onClick={handleSignOut} 
							variant="outline"
							size="sm"
							className="flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
						>
							<LogOut className="h-3.5 w-3.5" />
							Sign Out
						</Button>
					)}
				</div>
			</header>

			{/* Hero Section */}
			<section className="px-4 py-20 text-center bg-gradient-to-b from-white to-blue-100">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight font-inter">
						<span className="block text-[#163b69]">Document Ranking Made <span className="text-[#4299e1]">Simple</span></span>
					</h1>
					<p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto font-inter">
						Compare and rank documents based on customizable criteria or prompts with Artificial Intelligence
					</p>
					<Button 
						size="lg" 
						className="relative bg-[#163b69] text-white px-10 py-6 text-lg font-bold rounded-xl shadow-lg border-2 border-white group font-inter"
						asChild
						style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
					>
						<AuthenticatedLink href="/documents" className="flex items-center gap-3">
							Start Ranking <ArrowRight className="h-5 w-5 ml-1" />
						</AuthenticatedLink>
					</Button>
				</div>
			</section>

			{/* Features section */}
			<section className="py-16 px-4 bg-white">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How rankCentral Works</h2>
					<div className="grid md:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md flex flex-col h-full">
							<div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
								<FileText className="text-brand-primary h-6 w-6" />
							</div>
							<h3 className="text-xl font-semibold mb-2 text-gray-800">Upload Documents</h3>
							<p className="text-gray-600 mb-4 flex-grow">
								Input your documents directly or upload files in various formats for comparison
							</p>
							<Button variant="outline" size="sm" asChild>
								<AuthenticatedLink href="/documents" className="mt-2">
									Upload Now
								</AuthenticatedLink>
							</Button>
						</div>
						
						{/* Feature 2 */}
						<div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md flex flex-col h-full">
							<div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
								<Settings className="text-brand-primary h-6 w-6" />
							</div>
							<h3 className="text-xl font-semibold mb-2 text-gray-800">Define Criteria</h3>
							<p className="text-gray-600 mb-4 flex-grow">
								Set custom ranking criteria with specific weightage or use our default rubrics
							</p>
							<Button variant="outline" size="sm" asChild>
								<AuthenticatedLink href="/documents" className="mt-2">
									Set Criteria
								</AuthenticatedLink>
							</Button>
						</div>
						
						{/* Feature 3 */}
						<div className="bg-gray-50 rounded-lg p-6 shadow-sm transition-all hover:shadow-md flex flex-col h-full">
							<div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4">
								<BarChart3 className="text-brand-primary h-6 w-6" />
							</div>
							<h3 className="text-xl font-semibold mb-2 text-gray-800">View Results</h3>
							<p className="text-gray-600 mb-4 flex-grow">
								Get comprehensive results with detailed pairwise comparisons powered by AI
							</p>
							<Button variant="outline" size="sm" asChild>
								<AuthenticatedLink href="/results" className="mt-2">
									View Reports
								</AuthenticatedLink>
							</Button>
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
