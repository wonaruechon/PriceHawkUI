'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductDetailCard } from '@/components/products/ProductDetailCard';
import { MatchedProductCard } from '@/components/products/MatchedProductCard';
import { ProductComparisonDetailResponse } from '@/lib/types/price-comparison';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [data, setData] = useState<ProductComparisonDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/comparison/${productId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product details');
        }
        const result: ProductComparisonDetailResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* Breadcrumb skeleton */}
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left panel skeleton */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="aspect-square bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right panel skeleton */}
            <div className="lg:col-span-7 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-4 h-40 animate-pulse"
                >
                  <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/products" className="hover:text-gray-700">
              Products
            </Link>
            <span>/</span>
            <span className="text-gray-900">Error</span>
          </nav>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 mx-auto text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              {error}
            </h2>
            <p className="text-red-600 mb-4">
              Unable to load product details. Please try again.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/products"
              className="hover:text-gray-700 flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Products
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {data.product.name}
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to List
          </button>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Product Comparison Detail
          </h1>
          <p className="text-gray-600 mt-1">
            Compare prices and verify product matches across retailers
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Thai Watsadu Product (Primary) - 40% width */}
          <div className="lg:col-span-5">
            <ProductDetailCard product={data.product} />
          </div>

          {/* Right Panel - Matched Products - 60% width */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Matched Products
              </h2>
              <span className="text-sm text-gray-500">
                {data.matchedProducts.length} matches found
              </span>
            </div>

            {data.matchedProducts.length > 0 ? (
              <div className="space-y-4">
                {data.matchedProducts.map((match) => (
                  <MatchedProductCard
                    key={match.retailer}
                    retailer={match.retailer}
                    confidence={match.confidence}
                    matchType={match.matchType}
                    product={match.product}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-600">
                  No matched products found from other retailers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
