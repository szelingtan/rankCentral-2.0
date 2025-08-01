import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ScoringLevel = {
  level: number;
  description: string;
};

type Criterion = {
  id: string;
  name: string;
  description: string;
  weight: number;
  scoring_levels?: Record<number, string>;
};

type CriteriaFormProps = {
  criteria: Criterion[];
  setCriteria: React.Dispatch<React.SetStateAction<Criterion[]>>;
  defaultCriteria: Criterion[];
  useCustomCriteria: boolean;
  setUseCustomCriteria: React.Dispatch<React.SetStateAction<boolean>>;
};

const CriteriaForm = ({
  criteria,
  setCriteria,
  defaultCriteria,
  useCustomCriteria,
  setUseCustomCriteria,
}: CriteriaFormProps) => {
  const { toast } = useToast();
  const [detailLevel, setDetailLevel] = useState<'basic' | 'advanced'>('basic');

  const addCriterion = () => {
    const newId = (criteria.length + 1).toString();
    const defaultScoringLevels = {
      1: 'Poor - Does not meet the criterion requirements',
      2: 'Fair - Partially meets some requirements with significant gaps',
      3: 'Good - Meets most requirements with minor gaps',
      4: 'Very Good - Fully meets all requirements',
      5: 'Excellent - Exceeds requirements in meaningful ways'
    };

    setCriteria([
      ...criteria,
      { 
        id: newId, 
        name: '', 
        description: '', 
        weight: 20,
        scoring_levels: defaultScoringLevels
      },
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one criterion.",
        variant: "destructive",
      });
      return;
    }
    setCriteria(criteria.filter((c) => c.id !== id));
    normalizeWeights(criteria.filter((c) => c.id !== id));
  };

  const updateCriterion = (
    id: string,
    field: keyof Criterion,
    value: string | number | Record<number, string>
  ) => {
    setCriteria(
      criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    
    if (field === 'weight') {
      normalizeWeights(
        criteria.map((c) => (c.id === id ? { ...c, weight: value as number } : c))
      );
    }
  };

  const updateScoringLevel = (
    criterionId: string,
    level: number,
    description: string
  ) => {
    setCriteria(
      criteria.map((c) => {
        if (c.id === criterionId) {
          const updatedScoringLevels = { 
            ...(c.scoring_levels || {}), 
            [level]: description 
          };
          return { ...c, scoring_levels: updatedScoringLevels };
        }
        return c;
      })
    );
  };

  // In normalizeWeights, always normalize regardless of sum
  const normalizeWeights = (updatedCriteria: Criterion[]) => {
    const totalWeight = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight > 0) {
      const normalizedCriteria = updatedCriteria.map(c => ({
        ...c,
        weight: Math.round((c.weight / totalWeight) * 100)
      }));
      const calculatedTotal = normalizedCriteria.reduce((sum, c) => sum + c.weight, 0);
      if (calculatedTotal !== 100 && normalizedCriteria.length > 0) {
        const diff = 100 - calculatedTotal;
        const lastItem = normalizedCriteria[normalizedCriteria.length - 1];
        normalizedCriteria[normalizedCriteria.length - 1] = {
          ...lastItem,
          weight: lastItem.weight + diff
        };
      }
      setCriteria(normalizedCriteria);
    }
  };

  return (
    <div>
      {/* Removed the custom criteria toggle from CriteriaForm. The toggle is now only in the parent page. */}

      {/* Only show detail level tabs when using custom criteria */}
      {useCustomCriteria && (
        <div className="mb-6">
          <div className="mb-2 font-semibold text-base">Evaluation Method</div>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={detailLevel === 'basic' ? 'default' : 'outline'}
              className={`flex-1 py-3 text-base flex items-center justify-center gap-2 ${detailLevel === 'basic' ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setDetailLevel('basic')}
            >
              <span role="img" aria-label="basic">📝</span> Basic
            </Button>
            <Button
              type="button"
              variant={detailLevel === 'advanced' ? 'default' : 'outline'}
              className={`flex-1 py-3 text-base flex items-center justify-center gap-2 ${detailLevel === 'advanced' ? 'bg-green-600 text-white' : ''}`}
              onClick={() => setDetailLevel('advanced')}
            >
              <span role="img" aria-label="advanced">⚙️</span> Advanced
            </Button>
          </div>
        </div>
      )}

      {useCustomCriteria ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Custom Criteria</h3>
            <Button type="button" variant="outline" size="sm" onClick={addCriterion} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Criterion
            </Button>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            You can add, remove, and adjust the weights of your own criteria. The sum of weights does not need to be 100. Weights will be normalized automatically.
          </div>
          <div className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
            {criteria.map((criterion, idx) => (
              <div key={criterion.id} className="p-4 flex flex-col gap-2 relative group hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base">{idx + 1}.</span>
                    <Input
                      value={criterion.name}
                      onChange={(e) => updateCriterion(criterion.id, 'name', e.target.value)}
                      placeholder="Criterion name (e.g., Clarity, Relevance)"
                      className="w-48"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterion(criterion.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Remove criterion"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-2">
                  <Label htmlFor={`criterion-desc-${criterion.id}`}>Description</Label>
                  <Textarea
                    id={`criterion-desc-${criterion.id}`}
                    value={criterion.description}
                    onChange={(e) => updateCriterion(criterion.id, 'description', e.target.value)}
                    placeholder="Describe what this criterion measures..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="mb-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`criterion-weight-${criterion.id}`}>Weight</Label>
                    <span className="text-sm text-gray-500">{criterion.weight}%</span>
                  </div>
                  <Input
                    id={`criterion-weight-${criterion.id}`}
                    type="number"
                    min={1}
                    max={200}
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(criterion.id, 'weight', Number(e.target.value))}
                    className="mt-2 w-24"
                  />
                  <div className="text-xs text-gray-500 mt-1">{
                    'Assign any weight. Weights will be normalized to 100 for evaluation.'
                  }</div>
                </div>
                {detailLevel === 'advanced' && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="mb-2 block">Scoring Levels</Label>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div key={level} className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm w-6">{level}:</span>
                          <Input
                            value={criterion.scoring_levels?.[level] || ''}
                            onChange={(e) => updateScoringLevel(criterion.id, level, e.target.value)}
                            placeholder={`Description for level ${level}`}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <div className="text-xs text-gray-500">
              Total (pre-normalized) weights: {criteria.reduce((sum, c) => sum + c.weight, 0)}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-md font-medium">Default Criteria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="p-4 border rounded-md bg-gray-50"
              >
                <div className="flex justify-between mb-1">
                  <h4 className="font-medium">{criterion.name}</h4>
                  <span className="text-sm text-gray-500">
                    {criterion.weight}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {criterion.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaForm;
