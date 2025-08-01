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
	
	// Determine if this is a prompt-based evaluation by checking the first comparison
	const isPromptBased = comparison_details.length > 0 && 
		((comparison_details[0] as any)?.evaluationMethod === 'prompt' || 
		(comparison_details[0] as any)?.evaluation_method === 'prompt');

	const handleDownload = async (): Promise<void> => {
		try {
			const response = await fetch(`/api/reports/download/${report_id}`);
			if (!response.ok) {
				throw new Error('Failed to download report');
			}

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
		if (!comparison.evaluationDetails && !comparison.evaluation_details) {
			return 0;
		}
		
		const docA = comparison.documentA || comparison.document_a || '';
		const docB = comparison.documentB || comparison.document_b || '';
		
		if (docA === docName) {
			return comparison.evaluationDetails?.overallScores?.documentA || 
			       comparison.evaluation_details?.overall_scores?.document_a || 0;
		} else if (docB === docName) {
			return comparison.evaluationDetails?.overallScores?.documentB || 
			       comparison.evaluation_details?.overall_scores?.document_b || 0;
		}
		return 0;
	};

	const calculateAverageScore = (docName: string): number => {
		if (isPromptBased) {
			return 0; // Don't calculate scores for prompt-based evaluation
		}
		
		const scores = comparison_details
			.filter((comp: ComparisonResult) => {
				const docA = comp.documentA || comp.document_a || '';
				const docB = comp.documentB || comp.document_b || '';
				return docA === docName || docB === docName;
			})
			.map((comp: ComparisonResult) => getDocumentScore(comp, docName));

		if (scores.length === 0) {
			return 0;
		}
		return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
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
							{ranked_documents.map((doc: {name: string; score: number; rank: number}, index: number) => {
								const score = calculateAverageScore(doc.name);
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
													<p className="font-medium">{getShortDocName(doc.name)}</p>
													{index === 0 && <Badge className="bg-green-500">Top Ranked</Badge>}
												</div>
											</div>
											{!isPromptBased && (
												<div className="text-right">
													<span className="text-sm text-gray-500">Score</span>
													<p className="text-lg font-bold">{score.toFixed(1)}</p>
												</div>
											)}
										</div>
										{!isPromptBased && <Progress value={scorePercentage} className="h-2" />}
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
									{comparison_details.map((comp: ComparisonResult, index: number) => {
										const docA = getShortDocName(comp.documentA || comp.document_a || '');
										const docB = getShortDocName(comp.documentB || comp.document_b || '');
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
													{(comp.evaluation_details || comp.evaluationDetails) && (
														<div className="space-y-3">
															{!isPromptBased && (
																<div className="grid grid-cols-2 gap-4">
																	<div className="space-y-1">
																		<p className="text-sm font-medium">{docA}</p>
																		<p className="text-lg font-bold">
																			{(comp.evaluation_details?.overall_scores?.document_a || 
																			comp.evaluationDetails?.overallScores?.documentA || 0).toFixed(1)}
																		</p>
																	</div>
																	<div className="space-y-1">
																		<p className="text-sm font-medium">{docB}</p>
																		<p className="text-lg font-bold">
																			{(comp.evaluation_details?.overall_scores?.document_b || 
																			comp.evaluationDetails?.overallScores?.documentB || 0).toFixed(1)}
																		</p>
																	</div>
																</div>
															)}
															<div className="pt-2">
																<p className="text-sm font-medium mb-1">Explanation</p>
																<p className="text-sm text-gray-700">
																	{comp.evaluation_details?.explanation || 
																	comp.evaluationDetails?.explanation || 'No explanation provided'}
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
									{comparison_details.map((comp: ComparisonResult, index: number) => {
										const evaluationDetails = comp.evaluationDetails || comp.evaluation_details;
										let criterionEvaluations: any[] | undefined;
										
										if (comp.evaluationDetails) {
											criterionEvaluations = comp.evaluationDetails.criterionEvaluations;
										} else if (comp.evaluation_details) {
											criterionEvaluations = comp.evaluation_details.criterion_evaluations;
										}
										
										if (!criterionEvaluations) {
											return null;
										}

										const docA = getShortDocName(comp.documentA || comp.document_a || '');
										const docB = getShortDocName(comp.documentB || comp.document_b || '');

										return (
											<Card key={index}>
												<CardHeader className="pb-2">
													<CardTitle className="text-base">
														{docA} vs {docB}
													</CardTitle>
												</CardHeader>
												<CardContent>
													<Accordion type="single" collapsible className="w-full">
														{criterionEvaluations.map((evaluation: any, evalIndex: number) => (
															<AccordionItem value={`item-${index}-${evalIndex}`} key={evalIndex}>
																<AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-lg">
																	<div className="flex justify-between items-center w-full pr-4">
																		<div className="font-medium">
																			{evaluation.criterionName || evaluation.criterion_name}
																		</div>
																		{!isPromptBased && (
																			<div className="flex space-x-4">
																				<span className="text-sm">{docA}: {evaluation.documentAScore || evaluation.document_a_score}</span>
																				<span className="text-sm">{docB}: {evaluation.documentBScore || evaluation.document_b_score}</span>
																			</div>
																		)}
																	</div>
																</AccordionTrigger>
																<AccordionContent className="px-4 pt-2 pb-4">
																	<div className="space-y-4">
																		<div className="grid grid-cols-2 gap-4">
																			<div>
																				<h4 className="text-sm font-medium mb-1">{docA} Analysis</h4>
																				<p className="text-sm text-gray-700">{evaluation.documentAAnalysis || evaluation.document_a_analysis}</p>
																			</div>
																			<div>
																				<h4 className="text-sm font-medium mb-1">{docB} Analysis</h4>
																				<p className="text-sm text-gray-700">{evaluation.documentBAnalysis || evaluation.document_b_analysis}</p>
																			</div>
																		</div>
																		<div>
																			<h4 className="text-sm font-medium mb-1">Comparative Analysis</h4>
																			<p className="text-sm text-gray-700">{evaluation.comparativeAnalysis || evaluation.comparative_analysis}</p>
																		</div>
																		<div>
																			<h4 className="text-sm font-medium mb-1">Reasoning</h4>
																			<p className="text-sm text-gray-700">{evaluation.reasoning}</p>
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
