var request = require( 'request' );
var rstats = require( 'rstats' );
// var go = require( './hypergeometric' );

var facet = JSON.stringify( {
	conditions: {
		terms: {
			field: 'go_ids',
			numBuckets: true,
			limit: 0
		}
	}
} );


// Make the data part of the options
var data = {
	//'q': '{!join from=member_ids to=id} id:' + species + '_expr_cluster_' + numExprClusters + '_' + clusterId,
	'q': '{!join from=member_ids to=id} analysis_id:anoph_expr_cluster_25',
	'fl': 'gene_id,go_ids',
	'wt': 'json',
	'rows': '1',
	'json.facet': facet
};

// Make options for the request
var options = {
	url: 'http://localhost:8983/solr/circos/select',
	json: true,
	qs: data
};

request( options, function( error, response, body ) {
	if ( error ) {
		console.log( error );
	} else {

		// N number of black + white balls in the jar
		// 		total number GO terms for Anopheles gambiae genes in the analyses
		// n number of balls picked from the jar
		// 		number of GO terms in cluster of interest
		// K number of white balls in the jar
		// 		number of GO term of interest for Anopheles gambiae genes in the analyses
		// k number of white balls picked out
		// 		number of GO term of interest in cluster of interest
		var N, n, K, k, term,
			significantTerms = [];

		var allBuckets = body.facets.conditions.buckets;
		var numBuckets = body.facets.conditions.numBuckets;

		function calculateCountSum( buckets ) {
			var sum = allBuckets.reduce( function( prev, curr ) {
				return prev + curr.count;
			}, 0 );
			return sum;
		}
		N = calculateCountSum( allBuckets );
		// console.log( 'N (no. GO terms for Anopheles / no. balls in the jar):' );
		// console.log( N );

		data.q = '{!join from=member_ids to=id} id:anoph_expr_cluster_15_010';

		request( options, function( error, response, body ) {
			if ( error ) {
				console.log( error );
			} else {

				var R = new rstats.session();

				var counter = 0;

				allBuckets.forEach( function( bucket ) {

					// console.log( 'GO term of interest / white:' );
					// console.log( bucket );

					// First GO term only
					K = bucket.count;
					term = bucket.val;
					// console.log( 'K (no. GO term of interest for anopheles / no. white balls in the jar):' );
					// console.log( K );
					// console.log( 'GO term of interest / colour of interest:' );
					// console.log( term );

					var clusterBuckets = body.facets.conditions.buckets;

					function calculateCountSum( buckets ) {
						var sum = buckets.reduce( function( prev, curr ) {
							return prev + curr.count;
						}, 0 );
						return sum;
					}
					n = calculateCountSum( clusterBuckets );
					// console.log( 'n (no. GO terms in cluster / no. balls picked out):' );
					// console.log( n );

					function findCountTermOfInterest( buckets ) {
						var count = 0;
						buckets.some( function( b ) {
							if ( b.val === term ) {
								// console.log( 'bucket for GO term of interest' );
								// console.log( b );
								count = b.count;
								return true;
							}
							return false;
						} );
						return count;
					}

					// First GO term only
					k = findCountTermOfInterest( clusterBuckets );
					// console.log( 'k (no. GO term of interest in cluster / no. white balls picked):' );
					// console.log( k );


					R.assign( 'x', k );
					R.assign( 'm', K );
					R.assign( 'n', N - K );
					R.assign( 'k', n );

					// console.log('R command:', "dhyper(x=, m=, n=, k=)");
					var hyperGeom = R.parseEval("dhyper(x, m, n, k)");
					if ( hyperGeom < 0.05 / numBuckets ) {
						// Add ID to an array to request descriptions later
						// Will probably be a maximum number added to the array
						significantTerms.push( {
							'term': term,
							'pValue': hyperGeom[0]
						} );
						//console.log(hyperGeom);
					}

				} );

				console.log( significantTerms, significantTerms.length );

				significantIDs = [];
				var q = significantTerms.forEach( function( value ) {
					significantIDs.push( 'id:"' + value.term + '"' );
				} );
				q = significantIDs.join( ' OR ' );
				console.log( q );

				// Make the data part of the options
				var data = {
					'q': q,
					'fl': 'name,description',
					'wt': 'json',
					'rows': significantTerms.length
				};

				// Make options for the request
				var options = {
					url: 'http://localhost:8983/solr/circos/select',
					json: true,
					qs: data
				};

				request( options, function( error, response, body ) {
					if ( error ) {
						console.log( error );
					} else {
						console.log( body.response.docs );
					}
				} );

			}
		} );

	}
} );