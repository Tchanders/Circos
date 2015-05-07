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
 * degrees of freedom = (rows - 1) * (columns - 1)
 *
 * NB In cases where this formula does not apply, the user should
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
 *                      	NB This should only be provided if not equal to
 *                      	(rows - 1) * (columns - 1)
 * @return {number[]} 		Array of length 2 containing the test statistic and the p-value
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
	return [testStatistic, p];
};

// Chord analysis

exports.chordAnalysis = function( table ) {

	var i, j, e, d;
	var smallTable = [[], []];
	var rowSums = calculateRowSums( table );
	var colSums = calculateColSums( table );
	var total = calculateTotal( rowSums );
	var numRows = rowSums.length;
	var numCols = colSums.length;
	var numberOfTests = numRows * numCols;

	for ( i = 0; i < numRows; i++ ) {
		for ( j = 0; j < numCols; j++ ) {

			smallTable[0][0] = table[i][j];
			smallTable[0][1] = rowSums[i] - table[i][j];
			smallTable[1][0] = colSums[j] - table[i][j];
			smallTable[1][1] = total + table[i][j] - rowSums[i] - colSums[j];

			results = exports.calculate( smallTable );

			console.log( '----------' );
			console.log( 'Expression cluster ' + i + ' against orthology cluster ' + j );
			console.log( 'chi-squared: ' + results[0] );
			console.log( 'p-value: ' + results[1] );

			// If the p value is significant, find out if it is an under- or over-representation
			if ( results[1] < 0.05 / numberOfTests ) {
				// Calculate expected value for smallTable[0][0]
				e = ( rowSums[i] / total ) * ( colSums[j] / total ) * total;
				// Find out if difference between observed and expected is positive or negative
				if ( e - table[i][j] > 0 ) {
					console.log( 'Overrepresentation' );
				} else if ( e - table[i][j] < 0 ) {
					console.log( 'Underrepresentation' );
				}
			}

		}
	}

}