'use client';

import { useState, useCallback } from 'react';
import {
  ThaiWatsuduInput,
  CompetitorRetailer,
} from '@/lib/types/manual-comparison';
import {
  ThaiWatsuduInputCard,
  CompetitorInputCard,
} from '@/components/comparison';
import { ReviewConfirmPanel } from '@/components/comparison/ReviewConfirmPanel';
import { AppleStyleComparisonTable } from '@/components/comparison/AppleStyleComparisonTable';
import { StageIndicator } from '@/components/comparison/StageIndicator';
import { CollapsibleStepCard } from '@/components/comparison/CollapsibleStepCard';
import { Toast, ToastVariant } from '@/components/ui/Toast';
import { LoadingOverlay } from '@/components/comparison/LoadingOverlay';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, RotateCcw } from 'lucide-react';

// Stage type for the 3-stage flow
type ComparisonStage = 'input' | 'review' | 'results';

// Competitor entry structure
interface CompetitorEntry {
  id: string;
  retailer: CompetitorRetailer | '';
  url: string;
}

// Comparison product structure
interface ComparisonProduct {
  sku: string;
  name: string;
  price: number;
  discountPercentage?: number;
  unitPrice?: number;
  imageUrl?: string;
  productUrl: string;
  brand?: string;
  category?: string;
  stockStatus?: string;
  retailer: string;
  retailerLogo?: string;
}

// Comparison response structure
interface ComparisonResponse {
  thaiWatsadu: ComparisonProduct;
  competitors: ComparisonProduct[];
}

// Validation error types
interface ValidationErrors {
  thaiWatsadu?: {
    sku?: string;
    url?: string;
  };
  competitors?: Record<string, string>;
  general?: string;
}

export default function ManualComparisonPage() {
  // Stage management
  const [stage, setStage] = useState<ComparisonStage>('input');

  // Form state
  const [thaiWatsuduInput, setThaiWatsuduInput] = useState<ThaiWatsuduInput>({
    sku: '',
    url: '',
  });
  const [competitorEntries, setCompetitorEntries] = useState<CompetitorEntry[]>([
    { id: `competitor-${Date.now()}`, retailer: '', url: '' },
  ]);

  // Results state
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    variant: ToastVariant;
  }>({
    isVisible: false,
    message: '',
    variant: 'success',
  });

  // Add new competitor entry
  const handleAddCompetitor = useCallback(() => {
    const newEntry: CompetitorEntry = {
      id: `competitor-${Date.now()}-${Math.random()}`,
      retailer: '',
      url: '',
    };
    setCompetitorEntries((prev) => [...prev, newEntry]);
  }, []);

  // Remove competitor entry
  const handleRemoveCompetitor = useCallback((id: string) => {
    setCompetitorEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // Update competitor retailer
  const handleCompetitorRetailerChange = useCallback(
    (id: string, retailer: CompetitorRetailer) => {
      setCompetitorEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, retailer } : entry
        )
      );
    },
    []
  );

  // Update competitor URL
  const handleCompetitorUrlChange = useCallback((id: string, url: string) => {
    setCompetitorEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, url } : entry))
    );
  }, []);

  // Get list of used retailers
  const getUsedRetailers = useCallback((): CompetitorRetailer[] => {
    return competitorEntries
      .map((entry) => entry.retailer)
      .filter((retailer): retailer is CompetitorRetailer => retailer !== '');
  }, [competitorEntries]);

  // Validate input stage
  const validateInputStage = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate Thai Watsadu
    if (!thaiWatsuduInput.sku.trim()) {
      newErrors.thaiWatsadu = { ...newErrors.thaiWatsadu, sku: 'SKU is required' };
    }
    if (!thaiWatsuduInput.url.trim()) {
      newErrors.thaiWatsadu = { ...newErrors.thaiWatsadu, url: 'URL is required' };
    }

    // Validate competitors
    const competitorErrors: Record<string, string> = {};
    let hasAtLeastOneCompetitor = false;

    competitorEntries.forEach((entry) => {
      if (entry.retailer && entry.url.trim()) {
        hasAtLeastOneCompetitor = true;
      }

      if (entry.retailer && !entry.url.trim()) {
        competitorErrors[entry.id] = 'URL is required';
      }
      if (!entry.retailer && entry.url.trim()) {
        competitorErrors[entry.id] = 'Retailer selection is required';
      }
    });

    if (!hasAtLeastOneCompetitor) {
      newErrors.general = 'Please add at least one competitor with retailer and URL';
    }

    if (Object.keys(competitorErrors).length > 0) {
      newErrors.competitors = competitorErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [thaiWatsuduInput, competitorEntries]);

  // Handle Input -> Review transition
  const handleGoToReview = useCallback(() => {
    if (validateInputStage()) {
      setStage('review');
    }
  }, [validateInputStage]);

  // Handle Review -> Input (Edit)
  const handleEditInputs = useCallback(() => {
    setStage('input');
  }, []);

  // Handle Review -> Results (Submit)
  const handleConfirmAndCompare = useCallback(async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Filter valid competitor entries
      const validCompetitors = competitorEntries.filter(
        (entry) => entry.retailer && entry.url.trim()
      );

      const response = await fetch('/api/comparison/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thaiWatsadu: thaiWatsuduInput,
          competitors: validCompetitors.map((entry) => ({
            retailer: entry.retailer,
            url: entry.url,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process comparison');
      }

      const result: ComparisonResponse = await response.json();
      setComparisonData(result);
      setStage('results');

      setToast({
        isVisible: true,
        message: 'Comparison completed successfully!',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error submitting comparison:', err);
      setToast({
        isVisible: true,
        message: 'Failed to process comparison. Please try again.',
        variant: 'error',
      });
      setErrors({ general: 'Failed to process comparison. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [thaiWatsuduInput, competitorEntries]);

  // Start new comparison
  const handleStartNewComparison = useCallback(() => {
    setStage('input');
    setThaiWatsuduInput({ sku: '', url: '' });
    setCompetitorEntries([{ id: `competitor-${Date.now()}`, retailer: '', url: '' }]);
    setComparisonData(null);
    setErrors({});
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">Manual Comparison</span>
        </nav>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manual Comparison</h1>
          <p className="mt-1 text-gray-600">
            Compare products across retailers with Apple-style elegance
          </p>
        </div>

        {/* Stage Indicator */}
        <StageIndicator currentStage={stage} />

        {/* STAGE 1: INPUT */}
        {stage === 'input' && (
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Thai Watsadu Input */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-md">
                  1
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Thai Watsadu Product
                </h2>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Enter the details of the product you want to compare from Thai Watsadu
              </p>
              <ThaiWatsuduInputCard
                value={thaiWatsuduInput}
                onChange={setThaiWatsuduInput}
                disabled={false}
                errors={errors.thaiWatsadu}
              />
            </div>

            {/* Competitor Inputs */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold shadow-md">
                  2
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Competitor Products
                </h2>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Add up to 5 competitor products to compare against
              </p>
              <div className="space-y-4">
                {competitorEntries.map((entry) => (
                  <CompetitorInputCard
                    key={entry.id}
                    id={entry.id}
                    retailer={entry.retailer}
                    url={entry.url}
                    onRetailerChange={(retailer) =>
                      handleCompetitorRetailerChange(entry.id, retailer)
                    }
                    onUrlChange={(url) => handleCompetitorUrlChange(entry.id, url)}
                    onRemove={() => handleRemoveCompetitor(entry.id)}
                    disabled={false}
                    error={errors.competitors?.[entry.id]}
                    usedRetailers={getUsedRetailers()}
                  />
                ))}

                {/* Add Competitor Button */}
                {competitorEntries.length < 5 ? (
                  <button
                    type="button"
                    onClick={handleAddCompetitor}
                    className="group flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-cyan-400 bg-gradient-to-r from-cyan-50 to-cyan-100 px-6 py-5 text-cyan-700 transition-all duration-200 hover:border-cyan-500 hover:from-cyan-100 hover:to-cyan-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="rounded-full bg-cyan-500 p-1.5 group-hover:bg-cyan-600 transition-colors shadow-md">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-base">
                      Add Competitor ({competitorEntries.length}/5)
                    </span>
                  </button>
                ) : (
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-gray-400">
                    <span className="font-semibold">Maximum competitors reached (5/5)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 p-5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Error</p>
                    <p className="text-sm font-medium text-red-600">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGoToReview}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-10 py-4 font-bold text-white text-lg shadow-lg transition-all hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: REVIEW */}
        {stage === 'review' && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Collapsible Input Stage Summary */}
            <CollapsibleStepCard
              stepNumber={1}
              stepTitle="Input Stage"
              isCompleted={true}
              isActive={false}
              summaryContent={
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Thai Watsadu SKU:</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {thaiWatsuduInput.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Competitors:</span>
                    <span>
                      {competitorEntries.filter((entry) => entry.retailer && entry.url.trim()).length} selected
                    </span>
                  </div>
                </div>
              }
              onEdit={handleEditInputs}
            >
              {/* Full input content (shown when expanded) */}
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Thai Watsadu Product</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">{thaiWatsuduInput.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">URL:</span>
                      <a
                        href={thaiWatsuduInput.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 hover:underline truncate max-w-md"
                      >
                        {thaiWatsuduInput.url}
                      </a>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Competitor Products</h4>
                  <div className="space-y-2">
                    {competitorEntries
                      .filter((entry) => entry.retailer && entry.url.trim())
                      .map((entry, idx) => (
                        <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-700">
                              Competitor {idx + 1}:
                            </span>
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                              {entry.retailer}
                            </span>
                          </div>
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 hover:underline text-xs truncate block"
                          >
                            {entry.url}
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CollapsibleStepCard>

            {/* Review Confirm Panel */}
            <ReviewConfirmPanel
              thaiWatsuduInput={thaiWatsuduInput}
              competitorEntries={competitorEntries.filter(
                (entry) => entry.retailer && entry.url.trim()
              ).map(entry => ({
                id: entry.id,
                retailer: entry.retailer as string,
                url: entry.url
              }))}
              onEdit={handleEditInputs}
              onConfirm={handleConfirmAndCompare}
            />
          </div>
        )}

        {/* STAGE 3: RESULTS */}
        {stage === 'results' && comparisonData && (
          <div className="space-y-6">
            <AppleStyleComparisonTable
              thaiWatsuduProduct={comparisonData.thaiWatsadu}
              competitorProducts={comparisonData.competitors}
            />

            {/* Start New Comparison Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleStartNewComparison}
                className="flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <RotateCcw className="h-5 w-5" />
                Start New Comparison
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isSubmitting && <LoadingOverlay message="Processing comparison..." />}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        variant={toast.variant}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </MainLayout>
  );
}
