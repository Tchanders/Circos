var request = require( 'request' );
var geneToOG = require( './geneToOG.json' );
require( './init' );
require( './Practice.NodeMatrix' );
require( './Practice.Element' );


// Get data function
function getData( field, value, filter ) {

	var m, matrix;

	// Make data part of options
	var data = {
		'q': field + ':' + value,
		'fl': filter,
		'wt': 'json',
		'indent': 'true',
		'rows': '20000'
	};

	// Make options for the request
	var options = {
		url: 'http://localhost:8983/solr/circos/select',
		json: true,
		qs: data
	};

	// Make the request and, if successful, make matrix and calculate chi squared
	request( options, function( error, response, body ) {
		if ( error ) {
			console.log( error );
		} else {

			var	expressionClusters = [],
				orthologyClusters = [];

			body.response.docs.forEach( function( element ) {
				clusterType = element.clustering_id.split( '_' )[1];
				if ( clusterType === 'expr' ) {
					expressionClusters.push( element );
				} else if ( clusterType === 'ortho' ) {
					orthologyClusters.push( element );
				}
			} );

			m = new Practice.Matrix( expressionClusters, orthologyClusters, geneToOG );
			m.makeElements();
			m.makeElementMatrix();
			m.makenumMatrix();
			matrix = m.numMatrix;
			console.log( matrix );

		}
	} );

}

getData( 'clustering_id', '(anoph_expr_cluster_5 OR anoph_ortho_cluster_5)', 'clustering_id,member_ids' );