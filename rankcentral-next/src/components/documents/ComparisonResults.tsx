// src/components/comparison/ComparisonResults.tsx

import React from 'react';
import {
	Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Share2 } from 'lucide-react';
import {
	Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { formatTimestamp, downloadFile } from '@/lib/utils/report-utils';
import { ComparisonResultResponse, ComparisonResult } from '@/lib/comparison/types';

interface ComparisonResultsProps {
	results: ComparisonResultResponse;
}

export function ComparisonResults({ results }: ComparisonResultsProps) {
	const { ranked_documents, comparison_details, report_id } = results;

	const handleDownload = async (): Promise<void> => {
		try {
			const response = await fetch(`/api/reports/download/${report_id}`);
			if (!response.ok) throw new Error('Failed to download report');

			const blob = await response.blob();
			const reportName = `document-comparison-${report_id.substring(0, 8)}.zip`;
			downloadFile(blob, reportName);
		} catch (error) {
			console.error('Error downloading report:', error);
		}
	};

	const getShortDocName = (fullName: string): string => {
		const baseName = fullName.split('/').pop() || fullName;
		return baseName.length > 25 ? `${baseName.substring(0, 22)}...` : baseName;
	};

	const getDocumentScore = (comparison: ComparisonResult, docName: string): number => {
		if (!comparison.evaluation_details) return 0;
		return comparison.document_a === docName
			? comparison.evaluation_details.overall_scores.document_a
			: comparison.evaluation_details.overall_scores.document_b;
	};

	const calculateAverageScore = (docName: string): number => {
		const scores = comparison_details
			.filter(comp => comp.document_a === docName || comp.document_b === docName)
			.map(comp => getDocumentScore(comp, docName));

		if (scores.length === 0) return 0;
		return scores.reduce((sum, score) => sum + score, 0) / scores.length;
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Comparison Results</CardTitle>
					<CardDescription>Documents ranked from best to worst based on the evaluation criteria</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<h3 className="text-lg font-medium">Ranking</h3>
						<div className="space-y-3">
							{ranked_documents.map((doc, index) => {
								const score = calculateAverageScore(doc);
								const scorePercentage = Math.min(Math.round((score / 100) * 100), 100);

								return (
									<div
										key={index}
										className={`
											p-4 rounded-lg
											${index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}
										`}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center space-x-3">
												<span className="text-xl font-bold">#{index + 1}</span>
												<div>
													<p className="font-medium">{getShortDocName(doc)}</p>
													{index === 0 && <Badge className="bg-green-500">Top Ranked</Badge>}
												</div>
											</div>
											<div className="text-right">
												<span className="text-sm text-gray-500">Score</span>
												<p className="text-lg font-bold">{score.toFixed(1)}</p>
											</div>
										</div>
										<Progress value={scorePercentage} className="h-2" />
									</div>
								);
							})}
						</div>

						<Tabs defaultValue="pairwise" className="mt-6">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="pairwise">Pairwise Comparisons</TabsTrigger>
								<TabsTrigger value="details">Detailed Analysis</TabsTrigger>
							</TabsList>

							<TabsContent value="pairwise" className="mt-4">
								<Accordion type="single" collapsible className="w-full">
									{comparison_details.map((comp, index) => {
										const docA = getShortDocName(comp.document_a);
										const docB = getShortDocName(comp.document_b);
										const winner = comp.winner
											? getShortDocName(comp.winner)
											: 'Tie';

										return (
											<AccordionItem value={`item-${index}`} key={index}>
												<AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-lg">
													<div className="flex justify-between items-center w-full pr-4">
														<div className="font-medium">
															{docA} vs {docB}
														</div>
														<Badge variant={winner === 'Tie' ? 'outline' : 'default'}>
															Winner: {winner}
														</Badge>
													</div>
												</AccordionTrigger>
												<AccordionContent className="px-4 pt-2 pb-4">
													{comp.evaluation_details && (
														<div className="space-y-3">
															<div className="grid grid-cols-2 gap-4">
																<div className="space-y-1">
																	<p className="text-sm font-medium">{docA}</p>
																	<p className="text-lg font-bold">
																		{comp.evaluation_details.overall_scores.document_a.toFixed(1)}
																	</p>
																</div>
																<div className="space-y-1">
																	<p className="text-sm font-medium">{docB}</p>
																	<p className="text-lg font-bold">
																		{comp.evaluation_details.overall_scores.document_b.toFixed(1)}
																	</p>
																</div>
															</div>
															<div className="pt-2">
																<p className="text-sm font-medium mb-1">Explanation</p>
																<p className="text-sm text-gray-700">
																	{comp.evaluation_details.explanation}
																</p>
															</div>
														</div>
													)}
												</AccordionContent>
											</AccordionItem>
										);
									})}
								</Accordion>
							</TabsContent>

							<TabsContent value="details" className="mt-4">
								<div className="space-y-4">
									{comparison_details.map((comp, index) => {
										if (!comp.evaluation_details?.criterion_evaluations) return null;

										const docA = getShortDocName(comp.document_a);
										const docB = getShortDocName(comp.document_b);

										return (
											<Card key={index}>
												<CardHeader className="pb-2">
													<CardTitle className="text-base">
														{docA} vs {docB}
													</CardTitle>
												</CardHeader>
												<CardContent>
													<Accordion type="single" collapsible className="w-full">
														{comp.evaluation_details.criterion_evaluations.map((eval, evalIndex) => (
															<AccordionItem value={`item-${index}-${evalIndex}`} key={evalIndex}>
																<AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-lg">
																	<div className="flex justify-between items-center w-full pr-4">
																		<div className="font-medium">
																			{eval.criterion_name}
																		</div>
																		<div className="flex space-x-4">
																			<span className="text-sm">{docA}: {eval.document_a_score}</span>
																			<span className="text-sm">{docB}: {eval.document_b_score}</span>
																		</div>
																	</div>
																</AccordionTrigger>
																<AccordionContent className="px-4 pt-2 pb-4">
																	<div className="space-y-4">
																		<div className="grid grid-cols-2 gap-4">
																			<div>
																				<h4 className="text-sm font-medium mb-1">{docA} Analysis</h4>
																				<p className="text-sm text-gray-700">{eval.document_a_analysis}</p>
																			</div>
																			<div>
																				<h4 className="text-sm font-medium mb-1">{docB} Analysis</h4>
																				<p className="text-sm text-gray-700">{eval.document_b_analysis}</p>
																			</div>
																		</div>
																		<div>
																			<h4 className="text-sm font-medium mb-1">Comparative Analysis</h4>
																			<p className="text-sm text-gray-700">{eval.comparative_analysis}</p>
																		</div>
																		<div>
																			<h4 className="text-sm font-medium mb-1">Reasoning</h4>
																			<p className="text-sm text-gray-700">{eval.reasoning}</p>
																		</div>
																	</div>
																</AccordionContent>
															</AccordionItem>
														))}
													</Accordion>
												</CardContent>
											</Card>
										);
									})}
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</CardContent>
				<CardFooter className="justify-between">
					<Button variant="outline" onClick={handleDownload}>
						<Download className="mr-2 h-4 w-4" />
						Download Full Report
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							navigator.clipboard.writeText(`${window.location.origin}/reports/${report_id}`);
							alert('Report link copied to clipboard!');
						}}
					>
						<Share2 className="mr-2 h-4 w-4" />
						Share Report
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
