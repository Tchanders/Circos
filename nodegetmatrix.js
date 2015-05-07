var request = require( 'request' );
var ind = require( './nodechisquaredindependence' );
var geneToOG = require( './geneToOG.json' );

require( './init' );
require( './Practice.NodeMatrix' );
require( './Practice.Element' );

var exports = module.exports = {};

// Get data function
exports.getMatrix = function( field, value, filter, doChordAnalysis ) {

	var m, matrix;

	// Make data part of options
	var data = {
		'q': field + ':' + value,
		'fl': filter,
		'wt': 'json',
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
				clusterType = element.analysis_id.split( '_' )[1];
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
			results = ind.calculate( matrix );

			console.log( value );
			console.log( 'chi-squared: ' + results[0] );
			console.log( 'p-value: ' + results[1] );

			if ( doChordAnalysis ) {
				ind.chordAnalysis( matrix );
			}

		}
	} );

};