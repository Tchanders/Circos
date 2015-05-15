var chi = require( 'chi-squared' );

var exports = module.exports = {};

/**
 * Makes an empty table with a specified number of rows
 *
 * @param {number} rows 	The number of rows in the table
 * @return {Array[]} 		An array containing an empty array for each row
 */
function makeEmptyTable( rows ) {
	var a = [];
	for ( i = 0; i < rows; i++ ) {
		a.push( [] );
	}
	return a;
}

/**
 * Calculates the sum of the values in each row of a table
 *
 * @param {Array[]} t 	A table of values relating two categorical variables
 * @return {number[]}	An array containing the sum of values in each row of the table
 */
function calculateRowSums( t ) {
	var sums = [];
	t.forEach( function( row ) {
		var sum = row.reduce( function( prev, curr ) {
			return prev + curr;
		} );
		sums.push( sum );
	} );
	return sums;
}

/**
 * Transposes a table, so the columns become the rows
 *
 * @param {Array[]} t 	A table of values relating two categorical variables
 * @return {Array[]} 	A transposed version of the table
 */
function transposeTable( t ) {
	var tT = makeEmptyTable( t[0].length );
	t.forEach( function( row ) {
		row.forEach( function( value, index ) {
			tT[index].push( value );
		} );
	} );
	return tT;
}

/**
 * Calculates the sum of the values in each column of a table
 *
 * @param {Array[]} t 	A table of values relating two categorical variables
 * @return {number[]}	An array containing the sum of values in each column of the table
 */
function calculateColSums( t ) {
	// The sum of column i in table t === the sum of row i in the transpose of table t
	var tT = transposeTable( t );
	return calculateRowSums( tT );
}

/**
 * Calculates the sum of the values in an array
 *
 * @param {number[]} sums	An array of numbers
 * @return {number}			The sum of the array
 */
function calculateTotal( sums ) {
	var sumTotal = 0;
	sums.forEach( function( num ) {
		sumTotal += num;
	} );
	return sumTotal;
}

/**
 * Calculates the expected values for each cell of a table
 *
 * @param {number[]} rowSums 	An array containing the sum of values in each row of the table
 * @param {number[]} colSums 	An array containing the sum of values in each column of the table
 * @param {number} total 		The sum of all values in the table
 * @return {Array[]} 			A table containing the expected values for each cell
 */
function calculateExpectedTable( rowSums, colSums, total ) {
	// The expected value for cell (i, j) is calculated using the formula:
	// (rowSums[i] / total) * (colSums[j] / total) * total
	e = makeEmptyTable( rowSums.length );
	rowSums.forEach( function( rowValue, rowIndex ) {
		colSums.forEach( function( colValue, colIndex ) {
			e[rowIndex][colIndex] = ( rowValue / total ) * ( colValue / total ) * total;
		} );
	} );
	return e;
}

/**
 * Calculates the chi-squared test statistic
 *
 * @param {Array[]} observed 	A table of values relating two categorical variables
 * @param {Array[]} expected 	A table of expected values for each cell
 * @return {number} 			The chi-squared test statistic
 */
function calculateTestStatistic( observed, expected ) {
	// The chi-squared test statistic is the sum of:
	// (observed - expected)^2 / expected
	// for each cell in the table
	var i, j,
		ilen = observed.length,
		jlen = observed[0].length,
		o, e,
		sum = 0;
	for ( i = 0; i < ilen; i++ ) {
		for ( j = 0; j < jlen; j++ ) {
			o = observed[i][j];
			e = expected[i][j];
			sum += ( ( o - e ) * ( o - e ) ) / e;
		}
	}
	return sum;
}

/**
 * Calculates the degrees of freedom of a table based on the folmula:
 * 		degrees of freedom = (rows - 1) * (columns - 1)
 *
 * In cases where this formula does not apply, the user should
 * provide the degrees of freedom, and this function will not be called
 *
 * @param {Array[]} table 	A table of values relating two categorical variables
 * @return {number} 		The degrees of freedom
 */
function calculateDegreesOfFreedom( table ) {
	var numRows = table.length;
	var numCols = table[0].length;
	return ( numRows - 1 ) * ( numCols - 1 );
}

/**
 * The main function to calculate the chi-squared statistic and the p-value
 *
 * @param {Array[]} table 	A table of values relating two categorical variables
 * @param {number} dF 		The degrees of freedom
 *                      	This should only be provided if not equal to:
 *                      		(rows - 1) * (columns - 1)
 * @return {number} 		The p-value
 */
exports.calculate = function( table, dF ) {

	// Calculate the sum of the values in each row, in each column, and in total
	var rowSums = calculateRowSums( table );
	var colSums = calculateColSums( table );
	var total = calculateTotal( rowSums );

	// Calculate the expected value for each cell of the table
	var expectedTable = calculateExpectedTable( rowSums, colSums, total );

	// Calculate the chi-squared test statistic
	var testStatistic = calculateTestStatistic( table, expectedTable );

	// The degrees of freedom is not always equal to (rows - 1) * (columns - 1)
	// The user should provide it as a parameter if this is the case
	// Otherwise it will be calculated from (rows - 1) * (columns - 1)
	dF = dF !== undefined ? dF : calculateDegreesOfFreedom( table );

	// Calculate the p-value from the chi-squared statistic and the degrees of freedom
	var p = 1 - chi.cdf( testStatistic, dF ); // TODO Cater for when p is too small
	return p;
};

/**
 * Runs a chi-squared analysis on each chord
 *
 * @param {Array[]} table	A table of values relating two categorical variables
 * @return {Array{}} 		2-d array of objects containing information about each chord:
 *                        		* p-value, and if the p-value is significant,
 *                        	 	* whether the clusters are over- or under-represented
 *                          E.g. information about the chord linking orthology cluster 1 and
 *                          expression cluster 2 is in the object located at allResults[1][2]
 */
exports.chordAnalysis = function( table ) {

	var i, j, e, p, direction, thisResult;
	var allResults = [];
	var smallTable = [[], []];
	var rowSums = calculateRowSums( table );
	var colSums = calculateColSums( table );
	var total = calculateTotal( rowSums );
	var numRows = rowSums.length;
	var numCols = colSums.length;
	var numberOfTests = numRows * numCols;

	for ( i = 0; i < numRows; i++ ) {

		allResults[i] = [];

		for ( j = 0; j < numCols; j++ ) {

			// Make a new 2x2 table comparing one expression cluster and
			// one orthology cluster against all other clusters as follows:
			//
			// 					E(i) 	E(o)
			// 			O(i)	[[X,	X],
			// 			O(o)	 [X,	X]]
			//
			// E(i) is the expression cluster of interest
			// E(o) is all other expression clusters
			// O(i) is the orthology cluster of interest
			// O(o) is all other orthology clusters

			smallTable[0][0] = table[i][j];
			smallTable[0][1] = rowSums[i] - table[i][j];
			smallTable[1][0] = colSums[j] - table[i][j];
			smallTable[1][1] = total + table[i][j] - rowSums[i] - colSums[j];

			p = exports.calculate( smallTable );

			// The Bonferroni correction will be used to correct for multiple testing
			// If the p-value is significant...
			if ( p < ( 0.05 / numberOfTests ) ) {
				// ...calculate the expected number of elements in the clusters of interest...
				e = ( rowSums[i] / total ) * ( colSums[j] / total ) * total;
				// ...and find out if it is greater or smaller than the observed value...
				if ( table[i][j] > e ) {
					// ...if observedis greater than expected then there is an over-representation
					direction = 'Over';
				} else if ( table[i][j] < e ) {
					// ...if observedis smaller than expected then there is an under-representation
					direction = 'Under';
				}
			} else {
				direction = null;
			}

			// Create the information object and put it at the correct location in allResults
			thisResult = {
				'p-value': p,
				'direction': direction
			};
			allResults[i][j] = thisResult;

		}
	}

	return allResults;

}