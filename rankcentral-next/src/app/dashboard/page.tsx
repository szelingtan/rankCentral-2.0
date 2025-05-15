// src/app/dashboard/page.tsx

import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db/mongodb';
import { formatTimestamp } from '@/lib/utils/report-utils';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ReportsList } from '@/components/dashboard/ReportsList';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { NewComparisonCard } from '@/components/dashboard/NewComparisonCard';

export const metadata: Metadata = {
	title: 'Dashboard | Document Comparison',
	description: 'View your document comparison reports and start new comparisons'
};

async function getReports(userId: string) {
	// Get database connection
	const db = await getDb();

	// Get reports for this user, sorted by timestamp (newest first)
	const reports = await db
		.collection('reports')
		.find({ user_id: userId })
		.sort({ timestamp: -1 })
		.limit(5)
		.project({
			_id: 0,
			timestamp: 1,
			documents: 1,
			top_ranked: 1,
			report_name: 1,
			criteria_count: 1,
			evaluation_method: 1,
			custom_prompt: 1,
			report_id: 1
		})
		.toArray();

	// Format timestamps and other data for display
	return reports.map(report => ({
		...report,
		formatted_timestamp: formatTimestamp(report.timestamp),
		document_count: report.documents?.length || 0,
		report_id: report.report_id,
		report_name: report.report_name,
		timestamp: report.timestamp,
		evaluation_method: report.evaluation_method
	}));
}

async function getStats(userId: string) {
	// Get database connection
	const db = await getDb();

	// Count total reports
	const totalReports = await db
		.collection('reports')
		.countDocuments({ user_id: userId });

	// Get all documents ever compared
	const reports = await db
		.collection('reports')
		.find({ user_id: userId })
		.project({ documents: 1 })
		.toArray();

	// Count unique documents
	const uniqueDocuments = new Set();
	reports.forEach(report => {
		if (report.documents && Array.isArray(report.documents)) {
			report.documents.forEach((doc: string) => uniqueDocuments.add(doc));
		}
	});

	// Get last comparison date
	const latestReport = await db
		.collection('reports')
		.find({ user_id: userId })
		.sort({ timestamp: -1 })
		.limit(1)
		.project({ timestamp: 1 })
		.toArray();

	const lastComparisonDate = latestReport.length > 0
		? formatTimestamp(latestReport[0].timestamp)
		: 'Never';

	return {
		totalReports,
		uniqueDocuments: uniqueDocuments.size,
		lastComparisonDate
	};
}

export default async function DashboardPage() {
	// Check if user is authenticated
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		// Redirect to login if not authenticated
		redirect('/login');
	}

	// Get user ID
	const userId = session.user.id;

	// Fetch user's reports and stats
	const reports = await getReports(userId);
	const stats = await getStats(userId);

	return (
		<div className="container py-6 space-y-6">
			<DashboardHeader
				username={session.user.name || session.user.email || 'User'}
			/>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<DashboardStats stats={stats} />
				<div className="md:col-span-2">
					<NewComparisonCard />
				</div>
			</div>

			<div className="space-y-4">
				<h2 className="text-2xl font-bold">Recent Reports</h2>
				<ReportsList reports={reports} />
			</div>
		</div>
	);
}
