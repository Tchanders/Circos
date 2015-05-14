var http = require( 'http' );
var request = require( 'request' );
var url = require( 'url' );

// Pre-made dictionary of genes to orthologous groups
var geneToGroup = require( './geneToOG.json' );

require( './init' );
require( './Practice.NodeMatrix' );

var server = http.createServer( function( request, response ) {
	//input from querystring
	var inputData = url.parse( request.url, true ).query;
	var jsonpCallback = inputData.callback;

	if ( !inputData.value ) {
		response.end();
		return;
	}

	//call async function, pass in callback that runs when complete and takes result as 1st arg
	getMatrix( inputData, function( result ) {
		// this is the callback, 1st arg result
		// here result will be matrix (see below)
	 	response.writeHead( 200, {"Content-Type": "application/json"} );
		response.end( jsonpCallback + '(' + JSON.stringify( result ) + ');' );
	} );
} );

server.listen( 8081 );

function getMatrix( inputData, callback ) {
	// Make data part of options
	var data = {
		'q': 'analysis_id:' + inputData.value,
		'fl': inputData.filter,
		'wt': 'json',
		'rows': '20000'
	};

	console.log( data );

	// Make the request and, if successful, make matrix and calculate chi squared
	request( {
		url: 'http://localhost:8983/solr/circos/select',
		json: true,
		qs: data
		},
		function( error, response, body ) {
			if ( error ) {
				console.log( error );
			} else {

				console.log( 'Success!' );

				var	m,
					clusterType,
					allResults,
					expressionClusters = [],
					orthologyClusters = [];

				// WARNING!
				// The following relies on analysis_id being of the form:
				// 		species_clusterType_cluster_numClusters
				// There is currently no neater way of distinguishing expression and orthology clusters
				// Ideally there would be a 'type of cluster' field in Solr
				body.response.docs.forEach( function( element ) {
					clusterType = element.analysis_id.split( '_' )[1];
					if ( clusterType === 'expr' ) {
						expressionClusters.push( element );
					} else if ( clusterType === 'ortho' ) {
						orthologyClusters.push( element );
					}
				} );

				m = new Practice.Matrix( expressionClusters, orthologyClusters, geneToGroup );

				allResults = {
					'pValue': m.pValue,
					'circosMatrix': m.circosMatrix,
					'numOrthologyClusters': m.numOrthologyClusters,
					'numExpressionClusters': m.numExpressionClusters,
					'pValuesOfChords': m.pValuesOfChords,
                    'expressionClusters': m.expressionClusters,
                    'orthologyClusters': m.orthologyClusters
				};

				console.log( allResults );
				callback( allResults );

			}
		}

	);
}