// src/lib/comparison/mergesortRanking.ts

/**
 * Sorts a list of items using mergesort with a custom comparator function.
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
 * Merges two sorted lists using a custom comparator function.
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

export class MergesortRanker<T> {
	private comparator: (a: T, b: T) => number;

	constructor(comparator: (a: T, b: T) => number) {
		this.comparator = comparator;
	}

	/**
	 * Rank items using mergesort with the provided comparator
	 */
	rankItems(items: T[]): T[] {
		return mergesortWithComparator(items, this.comparator);
	}
}
