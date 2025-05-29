/**
 * @fileoverview Merge sort implementation with custom comparator support for document ranking.
 * Provides stable sorting algorithms and a ranking class for document comparison systems.
 * Used primarily in prompt-based evaluation systems for final ranking generation.
 */

// src/lib/comparison/mergesortRanking.ts

/**
 * Sorts a list of items using the merge sort algorithm with a custom comparator function.
 * Provides O(n log n) time complexity with stable sorting behavior, making it ideal
 * for document ranking where order consistency is important.
 * 
 * @template T - The type of items being sorted
 * @param {T[]} items - Array of items to sort
 * @param {(a: T, b: T) => number} comparator - Comparison function returning positive for a > b, negative for a < b, zero for equal
 * @returns {T[]} New sorted array with items in descending order (highest first)
 */
export function mergesortWithComparator<T>(
	items: T[],
	comparator: (a: T, b: T) => number
): T[] {
	if (items.length <= 1) {
		return items;
	}

	const mid = Math.floor(items.length / 2);
	const leftHalf = mergesortWithComparator(items.slice(0, mid), comparator);
	const rightHalf = mergesortWithComparator(items.slice(mid), comparator);

	return mergeWithComparator(leftHalf, rightHalf, comparator);
}

/**
 * Merges two sorted arrays using a custom comparator function.
 * Helper function for the merge sort algorithm that combines two pre-sorted
 * arrays while maintaining the sorting order defined by the comparator.
 * 
 * @template T - The type of items being merged
 * @param {T[]} left - First sorted array to merge
 * @param {T[]} right - Second sorted array to merge
 * @param {(a: T, b: T) => number} comparator - Comparison function for determining order
 * @returns {T[]} New merged array maintaining sorted order
 */
export function mergeWithComparator<T>(
	left: T[],
	right: T[],
	comparator: (a: T, b: T) => number
): T[] {
	const result: T[] = [];
	let i = 0;
	let j = 0;

	while (i < left.length && j < right.length) {
		const comparisonResult = comparator(left[i], right[j]);

		if (comparisonResult >= 0) {
			result.push(left[i]);
			i++;
		} else {
			result.push(right[j]);
			j++;
		}
	}

	return [...result, ...left.slice(i), ...right.slice(j)];
}

/**
 * Generic ranking class that uses merge sort with custom comparators.
 * Provides a reusable interface for ranking any type of items based on
 * custom comparison logic, particularly useful for document ranking systems.
 * 
 * @template T - The type of items to be ranked
 * @class MergesortRanker
 */
export class MergesortRanker<T> {
	/**
	 * @type {(a: T, b: T) => number} Comparison function for ranking items
	 * @private
	 */
	private comparator: (a: T, b: T) => number;

	/**
	 * Creates a new MergesortRanker instance with the specified comparator.
	 * 
	 * @param {(a: T, b: T) => number} comparator - Function that compares two items and returns a number
	 */
	constructor(comparator: (a: T, b: T) => number) {
		this.comparator = comparator;
	}

	/**
	 * Ranks items using merge sort with the configured comparator.
	 * Returns a new array with items sorted according to the comparison function,
	 * typically in descending order (highest ranked first).
	 * 
	 * @param {T[]} items - Array of items to rank
	 * @returns {T[]} New array with items sorted by rank
	 */
	rankItems(items: T[]): T[] {
		return mergesortWithComparator(items, this.comparator);
	}
}
