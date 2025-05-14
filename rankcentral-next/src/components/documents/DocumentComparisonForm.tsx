// src/components/documents/DocumentComparisonForm.tsx

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, FilePlus, XCircle, Info } from 'lucide-react';
import { CriteriaList } from './CriteriaList';
import { Criterion } from '@/lib/comparison/criteriaManager';
import { Document } from '@/lib/types';
import { readFileAsText, convertPdfToBase64 } from '@/lib/utils/file-utils';

interface DocumentComparisonFormProps {
	onComparisonComplete?: (result: any) => void;
}

export function DocumentComparisonForm({ onComparisonComplete }: DocumentComparisonFormProps) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [criteria, setCriteria] = useState<Criterion[]>([
		{ id: "1", name: "Clarity", description: "How clear and understandable is the document?", weight: 30 },
		{ id: "2", name: "Relevance", description: "How relevant is the content to the subject matter?", weight: 30 },
		{ id: "3", name: "Thoroughness", description: "How comprehensive and complete is the document?", weight: 20 },
		{ id: "4", name: "Structure", description: "How well-organized is the document?", weight: 20 }
	]);
	const [evaluationMethod, setEvaluationMethod] = useState<'criteria' | 'prompt'>('criteria');
	const [customPrompt, setCustomPrompt] = useState('');
	const [reportName, setReportName] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const { toast } = useToast();

	const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		setIsLoading(true);

		try {
			const files = Array.from(e.target.files);
			const newDocuments: Document[] = [];

			for (const file of files) {
				if (file.type === 'application/pdf') {
					try {
						const base64Content = await convertPdfToBase64(file);
						newDocuments.push({ name: file.name, content: base64Content, type: 'pdf' });
					} catch (error) {
						console.error('Error converting PDF:', error);
						toast({
							title: 'PDF Error',
							description: `Could not process ${file.name}. Please try another file.`,
							variant: 'destructive'
						});
					}
				} else {
					try {
						const textContent = await readFileAsText(file);
						newDocuments.push({ name: file.name, content: textContent, type: 'text' });
					} catch (error) {
						console.error('Error reading file:', error);
						toast({
							title: 'File Error',
							description: `Could not read ${file.name}. Please try another file.`,
							variant: 'destructive'
						});
					}
				}
			}

			setDocuments([...documents, ...newDocuments]);
			if (fileInputRef.current) fileInputRef.current.value = '';
		} catch (error) {
			console.error('Error uploading files:', error);
			toast({
				title: 'Upload Error',
				description: 'An error occurred while uploading files.',
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	const removeDocument = (index: number) => {
		setDocuments(documents.filter((_, i) => i !== index));
	};

	const addEmptyDocument = () => {
		setDocuments([...documents, { name: `Document ${documents.length + 1}`, content: '', type: 'text' }]);
	};

	const updateDocument = (index: number, field: 'name' | 'content', value: string) => {
		const updatedDocuments = [...documents];
		updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
		setDocuments(updatedDocuments);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (documents.length < 2) {
			toast({
				title: 'Not enough documents',
				description: 'Please add at least two documents to compare.',
				variant: 'destructive'
			});
			return;
		}
		if (evaluationMethod === 'criteria' && criteria.length === 0) {
			toast({
				title: 'No criteria defined',
				description: 'Please add at least one criterion for comparison.',
				variant: 'destructive'
			});
			return;
		}
		if (evaluationMethod === 'prompt' && !customPrompt.trim()) {
			toast({
				title: 'Custom prompt required',
				description: 'Please enter a custom prompt for evaluation.',
				variant: 'destructive'
			});
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch('/api/documents/compare', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					documents,
					criteria,
					evaluation_method: evaluationMethod,
					custom_prompt: customPrompt,
					report_name: reportName
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Comparison failed');
			}

			const result = await response.json();

			toast({ title: 'Comparison complete', description: 'Documents have been ranked successfully.' });

			if (onComparisonComplete) onComparisonComplete(result);
		} catch (error) {
			console.error('Comparison error:', error);
			toast({
				title: 'Comparison failed',
				description: error instanceof Error ? error.message : 'An error occurred during comparison.',
				variant: 'destructive'
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Document Comparison</CardTitle>
					<CardDescription>Upload or paste documents to compare them using AI</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Document upload and input */}
					{/* Tabs for criteria or prompt-based evaluation */}
					{/* Render criteria list or custom prompt textarea */}
				</CardContent>
				<CardFooter>
					<Button type="submit" disabled={isLoading || documents.length < 2} className="w-full">
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Comparing Documents...
							</>
						) : (
							'Compare Documents'
						)}
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
