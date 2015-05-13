var Big = require( './lib/js/big.js-master/big' );
// Perform GO term enrichment analysis

// Hypergeometric distribution

// Helper functions

function calculateStirling( n ) {
	// Stirling's approximation for n!
	// n! = ((2(pi)n)^1/2) * (e/n)^n
	// WARNING!
	// For large n, parts of this may become Infinity
	// console.log( 2 * Math.PI * n );
	// console.log( Math.pow( ( 2 * Math.PI * n ), 0.5 ) );
	// console.log( n / Math.E );
	// console.log( Math.pow( ( n / Math.E ), n ) );
	x = n / Math.E;
	console.log( Big( n / Math.E ).pow( n ) );
	return Math.pow( ( 2 * Math.PI * n ), 0.5 ) * Math.pow( ( n / Math.E ), n );
}

function calculateBinomial( n, r ) {
	// Formula for the binomial coefficient:
	// nCr = n!/(r!*(n-r)!)
	return calculateStirling( n ) / ( calculateStirling( r ) * calculateStirling( n - r ) );
}

// Hypergeometric distribution
// p(X = k) = (KCk)((N-K)C(n-k) / NCn
// N population size

//console.log( calculateBinomial( 500, 1 ) );

calculateStirling( 10000 );