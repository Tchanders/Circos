var chi = require( 'chi-squared' );

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
 * Calculates the sum of rows in a table
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
 * Calculates the sum of columns in a table
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
 * Calculate the sum of values in an array
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
 * Calculate a table containing the expected values
 *
 * @param {number[]} rowSums 	An array containing the sum of values in each row of the table
 * @param {number[]} colSums 	An array containing the sum of values in each column of the table
 * @param {number} total 		The sum of all values in a table
 * @return {Array[]} 			A table of expected values
 */
function calculateExpectedTable( rowSums, colSums, total ) {
	// Expected value for cell i, j is:
	// rowsum[i]/total * colsum[j]/total * total
	e = makeEmptyTable( rowSums.length );
	rowSums.forEach( function( rowValue, rowIndex ) {
		colSums.forEach( function( colValue, colIndex ) {
			e[rowIndex][colIndex] = ( rowValue / total ) * ( colValue / total ) * total;
		} );
	} );
	console.log( e );
	return e;
}

/**
 * Calculate the chi squared test statistic
 *
 * @param {Array[]} observed 	A table of values relating two categorical variables
 * @param {Array[]} expected 	A table of expected values
 * @return {number} 			The chi squared test statistic
 */
function calculateTestStatistic( observed, expected ) {
	// Test statistic is sum of:
	// (observed - expected)^2 / expected
	// for each cell
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
 * @param {Array[]} table 	A table of values relating two categorical variables
 * @return {number} 		The degrees of freedom
 */
function calculateDegreesOfFreedom( table ) {
	var numRows = table.length;
	var numCols = table[0].length;
	return ( numRows - 1 ) * ( numCols - 1 );
}

/**
 * The main function to calculate the chi squared statistic and the P-value
 *
 * @param {Array[]} table 	A table of values relating two categorical variables
 * @param {number} dF 		The degrees of freedom, if not equal to (rows - 1) * (columns - 1)
 * @return {number} 		The P-value
 */
function calculate( table, dF ) {
	var rowSums = calculateRowSums( table );
	var colSums = calculateColSums( table );
	var total = calculateTotal( rowSums );
	var expectedTable = calculateExpectedTable( rowSums, colSums, total );
	var testStatistic = calculateTestStatistic( table, expectedTable );

	// The degrees of freedom is not always equal to (rows - 1) * (columns - 1)
	// The user should provide it as a parameter if not
	// Otherwise it will be calculated from (rows - 1) * (columns - 1)
	dF = dF !== undefined ? dF : calculateDegreesOfFreedom( table );
	var p = 1 - chi.cdf( testStatistic, dF );
	return p;
}

// var table = [
// 	[ 617, 277, 127, 219, 144 ],
//  	[ 1281, 480, 273, 377, 280 ],
//  	[ 894, 569, 311, 560, 420 ],
//  	[ 952, 272, 192, 359, 165 ],
//  	[ 712, 755, 328, 1012, 531 ]
// ];

var table = [
	[3083, 2687],
	[3214, 3123]
];

calculate( table );
