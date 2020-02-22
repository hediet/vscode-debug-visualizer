import { getDataExtractorApi } from "@hediet/debug-visualizer-data-extraction";

getDataExtractorApi().registerDefaultExtractors();

// From https://github.com/AvraamMavridis/Algorithms-Data-Structures-in-Typescript/blob/master/algorithms/quickSort.md
const array = [1, 2, 33, 31, 1, 2, 63, 123, 6, 32, 943, 346, 24];
const sorted = quickSort(array, 0, array.length - 1);
console.log(sorted);

function swap(array: Array<number>, i: number, j: number) {
	[array[i], array[j]] = [array[j], array[i]];
}

/**
 * Split array and swap values
 *
 * @param {Array<number>} array
 * @param {number} [left=0]
 * @param {number} [right=array.length - 1]
 * @returns {number}
 */
function partition(
	array: Array<number>,
	left: number = 0,
	right: number = array.length - 1
) {
	const pivot = Math.floor((right + left) / 2);
	const pivotVal = array[pivot];
	let i = left;
	let j = right;

	while (i <= j) {
		while (array[i] < pivotVal) {
			i++;
		}

		while (array[j] > pivotVal) {
			j--;
		}

		if (i <= j) {
			swap(array, i, j);
			i++;
			j--;
		}
	}

	return i;
}

/**
 * Quicksort implementation
 *
 * @param {Array<number>} array
 * @param {number} [left=0]
 * @param {number} [right=array.length - 1]
 * @returns {Array<number>}
 */
function quickSort(
	array: Array<number>,
	left: number = 0,
	right: number = array.length - 1
) {
	let index;

	if (array.length > 1) {
		index = partition(array, left, right);

		if (left < index - 1) {
			quickSort(array, left, index - 1);
		}

		if (index < right) {
			quickSort(array, index, right);
		}
	}

	return array;
}
