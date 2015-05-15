var Big = require( './lib/js/big.js-master/big' );

// Perform GO term enrichment analysis

// Helper functions

var logFactorial = function( n ) {
	// Stirling's approximation: log(n!) ~= nlog(n)

	// Special case: 	0! = 1
	// 					log(0!) = 0
	if ( n === 0 ) {
		return 0;
	}
	x = ( n + 0.5 ) * Math.log( n ) - n + 0.5 * Math.log( 2 * Math.PI );

	console.log( 'log of ' + n + ' factorial is:' );
	console.log( x );
	return x;
};

var logBinomial = function( n, r ) {
	// Formula for the binomial coefficient:
	// nCr = n! / (r! * (n-r)!)
	// i.e. log(nCr) = log(n! / (r! * (n-r)!))
	// i.e. log(nCr) = log(n!) - (log(r!) + log((n-r)!))
	x = logFactorial( n ) - ( logFactorial( r ) + logFactorial( n - r ) );

	console.log( 'log of ' + n + 'C' + r + ' is' );
	console.log( x );
	return x;
};

// Hypergeometric distribution
// p(X = k) = (KCk)((N-K)C(n-k)) / NCn
// K number of GO term of interest for Anopheles
// k number of GO term of interest in cluster of interest
// N population size (total number GO terms for Anopheles gambiae)
// n number of GO terms in cluster of interest

module.exports.logHypergeometric = function( K, k, N, n ) {
	// log(p(X = k)) = log(KCk) + log((N - K)C(n - k)) - log(NCn)
	x = logBinomial( K, k ) + logBinomial( N - K, n - k ) - logBinomial( N, n );
	console.log( 'log of hypergeometric is' );
	console.log( x );
	y = Math.pow( Math.E, x )
	console.log( 'hypergeometric is ');
	console.log( y );
	return x;
};

module.exports.logBinomial = logBinomial;
module.exports.logFactorial = logFactorial;

module.exports.logHypergeometric( 10, 1, 10000, 5000 );

// var c = require( './nodeGoEnrichment' );