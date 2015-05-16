var request = require( 'request' );
// var go = require( './hypergeometric' );

var facet = "{" +
    "conditions : {" +
		"terms: {" +
			"field: 'go_ids'," +
			"numBuckets: true," +
			"limit: 0" +
		"}" +
	"}" +
"}";

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

		// N number of back + white balls in the jar
		// 		total number GO terms for Anopheles gambiae genes in the analyses
		// n number of balls picked from the jar
		// 		number of GO terms in cluster of interest
		// K number of white balls in the jar
		// 		number of GO term of interest for Anopheles gambiae genes in the analyses
		// k number of white balls picked out
		// 		number of GO term of interest in cluster of interest
		var N, n, K, k;

		// do go enrichment analysis
		var buckets = body.facets.conditions.buckets;
		var bucket = buckets[0];
		console.log( 'first bucket:' );
		console.log( bucket );

		function calculateCountSum( buckets ) {
			var sum = buckets.reduce( function( prev, curr ) {
				return prev + curr.count;
			}, 0 );
			return sum;
		}
		N = calculateCountSum( buckets );
		console.log( 'N (total of counts of all buckets):' );
		console.log( N );

		// First GO term only
		K = bucket.count;
		geneK = bucket.val;
		console.log( 'K (count of first bucket):' );
		console.log( K );
		console.log( 'name of first bucket:' );
		console.log( geneK );

		data.q = '{!join from=member_ids to=id} id:anoph_expr_cluster_25_002';

		request( options, function( error, response, body ) {
			if ( error ) {
				console.log( error );
			} else {



				function calculateCountSum( buckets ) {
					var sum = buckets.reduce( function( prev, curr ) {
						return prev + curr.count;
					}, 0 );
					return sum;
				}
				n = calculateCountSum( body.facets.conditions.buckets );
				console.log( 'n (total of counts of buckets in this cluster):' );
				console.log( n );

				function findCountTermOfInterest( buckets ) {
					var count;
					buckets.some( function( b ) {
						if ( b.val === geneK ) {
							console.log( 'bucket with same name as first bucket' );
							console.log( b );
							count = b.count;
							return true;
						}
						return false;
					} );
					return count;
				}

				// First GO term only
				k = findCountTermOfInterest( body.facets.conditions.buckets );
				console.log( 'k (count of terms with same name as first bucket):' );
				console.log( k );
			}
		} );

	}
} );