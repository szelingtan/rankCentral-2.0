// src/components/documents/CriteriaList.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Info, Edit, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Criterion } from '@/lib/comparison/criteriaManager';

interface CriteriaListProps {
	criteria: Criterion[];
	setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
	disabled?: boolean;
}

interface CriterionFormData {
	name: string;
	description: string;
	weight: number;
	id?: string;
}

export function CriteriaList({ criteria, setCriteria, disabled = false }: CriteriaListProps) {
	const [isAddingCriterion, setIsAddingCriterion] = useState(false);
	const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
	const [formData, setFormData] = useState<CriterionFormData>({
		name: '',
		description: '',
		weight: 25
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { id, value } = e.target;
		setFormData({
			...formData,
			[id.replace('criterion-', '')]: id.includes('weight') ? Number(value) : value
		});
	};

	const addCriterion = () => {
		const newCriterion: Criterion = {
			id: String(criteria.length + 1),
			name: formData.name,
			description: formData.description,
			weight: formData.weight
		};

		setCriteria([...criteria, newCriterion]);
		setFormData({ name: '', description: '', weight: 25 });
		setIsAddingCriterion(false);
		normalizeWeights();
	};

	const updateCriterion = () => {
		if (!editingCriterionId) return;

		const updatedCriteria = criteria.map(criterion => {
			if (criterion.id === editingCriterionId) {
				return {
					...criterion,
					name: formData.name,
					description: formData.description,
					weight: formData.weight
				};
			}
			return criterion;
		});

		setCriteria(updatedCriteria);
		setEditingCriterionId(null);
		setFormData({ name: '', description: '', weight: 25 });
		normalizeWeights();
	};

	const deleteCriterion = (id: string) => {
		setCriteria(criteria.filter(criterion => criterion.id !== id));
		normalizeWeights();
	};

	const startEditing = (criterion: Criterion) => {
		setFormData({
			name: criterion.name,
			description: criterion.description,
			weight: criterion.weight,
			id: criterion.id
		});
		setEditingCriterionId(criterion.id);
	};

	const cancelEditing = () => {
		setEditingCriterionId(null);
		setFormData({ name: '', description: '', weight: 25 });
	};

	const normalizeWeights = () => {
		const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

		if (totalWeight !== 100 && totalWeight > 0) {
			const updatedCriteria = criteria.map(criterion => ({
				...criterion,
				weight: Math.round((criterion.weight / totalWeight) * 100)
			}));

			setCriteria(updatedCriteria);
		}
	};

	const moveCriterionUp = (index: number) => {
		if (index <= 0) return;

		const updatedCriteria = [...criteria];
		const temp = updatedCriteria[index];
		updatedCriteria[index] = updatedCriteria[index - 1];
		updatedCriteria[index - 1] = temp;

		setCriteria(updatedCriteria);
	};

	const moveCriterionDown = (index: number) => {
		if (index >= criteria.length - 1) return;

		const updatedCriteria = [...criteria];
		const temp = updatedCriteria[index];
		updatedCriteria[index] = updatedCriteria[index + 1];
		updatedCriteria[index + 1] = temp;

		setCriteria(updatedCriteria);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-base font-medium">Evaluation Criteria</h3>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled || isAddingCriterion || editingCriterionId !== null}
					onClick={() => setIsAddingCriterion(true)}
				>
					<Plus className="h-4 w-4 mr-2" />
					Add Criterion
				</Button>
			</div>

			{(criteria.length === 0 && !isAddingCriterion) ? (
				<div className="border border-dashed rounded-lg p-6 text-center">
					<Info className="h-10 w-10 text-gray-400 mx-auto mb-2" />
					<p className="text-gray-500">No criteria defined. Add criteria to evaluate documents.</p>
				</div>
			) : (
				<Accordion type="single" collapsible className="w-full">
					{criteria.map((criterion, index) => (
						<AccordionItem
							value={criterion.id}
							key={criterion.id}
							className={`${editingCriterionId === criterion.id ? 'border border-blue-300 rounded-lg mb-2' : ''}`}
						>
							<div className="flex items-center">
								<AccordionTrigger className="hover:bg-gray-50 px-3 rounded-md flex-grow">
									<div className="flex justify-between items-center w-full pr-2">
										<div className="font-medium">{criterion.name}</div>
										<Badge variant="outline">{criterion.weight}%</Badge>
									</div>
								</AccordionTrigger>
								<div className="flex space-x-1 mr-2">
									<Button
										variant="ghost"
										size="icon"
										disabled={disabled || index === 0}
										onClick={(e) => {
											e.stopPropagation();
											moveCriterionUp(index);
										}}
									>
										<ArrowUp className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										disabled={disabled || index === criteria.length - 1}
										onClick={(e) => {
											e.stopPropagation();
											moveCriterionDown(index);
										}}
									>
										<ArrowDown className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<AccordionContent className="px-3 pt-0 pb-2">
								{editingCriterionId === criterion.id ? (
									<div className="space-y-3 p-3 bg-gray-50 rounded-md">
										<div>
											<Label htmlFor="criterion-name">Name</Label>
											<Input
												id="criterion-name"
												value={formData.name}
												onChange={handleInputChange}
												placeholder="Enter criterion name"
												disabled={disabled}
											/>
										</div>
										<div>
											<Label htmlFor="criterion-description">Description</Label>
											<Textarea
												id="criterion-description"
												value={formData.description}
												onChange={handleInputChange}
												placeholder="Describe what this criterion evaluates"
												rows={3}
												disabled={disabled}
											/>
										</div>
										<div>
											<Label htmlFor="criterion-weight">Weight (%)</Label>
											<Input
												id="criterion-weight"
												type="number"
												min="1"
												max="100"
												value={formData.weight}
												onChange={handleInputChange}
												disabled={disabled}
											/>
										</div>
										<div className="flex justify-end space-x-2 pt-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={cancelEditing}
												disabled={disabled}
											>
												Cancel
											</Button>
											<Button
												type="button"
												size="sm"
												onClick={updateCriterion}
												disabled={disabled || !formData.name.trim()}
											>
												<Check className="h-4 w-4 mr-1" />
												Save
											</Button>
										</div>
									</div>
								) : (
									<div className="space-y-2">
										<div>
											<p className="text-sm text-gray-500 mb-1">Description:</p>
											<p className="text-sm">{criterion.description}</p>
										</div>
										<div className="flex justify-end space-x-2 pt-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => startEditing(criterion)}
												disabled={disabled || editingCriterionId !== null}
											>
												<Edit className="h-4 w-4 mr-1" />
												Edit
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														disabled={disabled || editingCriterionId !== null}
													>
														<Trash2 className="h-4 w-4 mr-1" />
														Delete
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Delete Criterion</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to delete "{criterion.name}"?
															This action cannot be undone.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction onClick={() => deleteCriterion(criterion.id)}>
															Delete
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</div>
								)}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			)}

			{isAddingCriterion && (
				<div className="p-4 border rounded-lg space-y-3 bg-gray-50">
					<h4 className="font-medium">Add New Criterion</h4>
					<div>
						<Label htmlFor="criterion-name">Name</Label>
						<Input
							id="criterion-name"
							value={formData.name}
							onChange={handleInputChange}
							placeholder="Enter criterion name"
							disabled={disabled}
						/>
					</div>
					<div>
						<Label htmlFor="criterion-description">Description</Label>
						<Textarea
							id="criterion-description"
							value={formData.description}
							onChange={handleInputChange}
							placeholder="Describe what this criterion evaluates"
							rows={3}
							disabled={disabled}
						/>
					</div>
					<div>
						<Label htmlFor="criterion-weight">Weight (%)</Label>
						<Input
							id="criterion-weight"
							type="number"
							min="1"
							max="100"
							value={formData.weight}
							onChange={handleInputChange}
							disabled={disabled}
						/>
					</div>
					<div className="flex justify-end space-x-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setIsAddingCriterion(false)}
							disabled={disabled}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={addCriterion}
							disabled={disabled || !formData.name.trim()}
						>
							<Plus className="h-4 w-4 mr-1" />
							Add
						</Button>
					</div>
				</div>
			)}

			{criteria.length > 0 && !isAddingCriterion && !editingCriterionId && (
				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={normalizeWeights}
						disabled={disabled}
					>
						Normalize Weights
					</Button>
				</div>
			)}
		</div>
	);
}
