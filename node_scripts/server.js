var http = require( 'http' );
var request = require( 'request' );
var url = require( 'url' );
var rstats = require( 'rstats' ); // If we use R
var go = require( './hypergeometric' ); // If we use nodejs
var tTest = require( './tTest' ); // Rename TODO

// Pre-made dictionary of genes to orthologous groups
var geneToGroup = require( '../static_files/geneToOG.json' );

require( './init' );
require( './ClusterAnalysis.DiagramData' );

var server = http.createServer( function( request, response ) {
	//input from querystring
	var inputData = url.parse( request.url, true ).query;
	var jsonpCallback = inputData.callback;

	// if ( !inputData.value ) {
	// 	response.end();
	// 	return;
	// }

	//call async function, pass in callback that runs when complete and takes result as 1st arg
	getData( inputData, function( result ) {
		// this is the callback, 1st arg result
		// here result will be matrix (see below)
	 	response.writeHead( 200, {"Content-Type": "application/json"} );
		response.end( jsonpCallback + '(' + JSON.stringify( result ) + ');' );
	} );
} );

server.listen( 8081 );

function getData( inputData, callback ) {
	console.log( 'inside getData' );
	handlers[inputData.mode]( inputData, callback );
}

var handlers = {};

handlers.draw = function( inputData, callback ) {
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

				m = new ClusterAnalysis.DiagramData( expressionClusters, orthologyClusters, geneToGroup );

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
};

handlers.goTerms = function( inputData, callback ) {
	// N number of black + white balls in the jar
	// 		total number GO terms for Anopheles gambiae genes in the analyses
	// n number of balls picked from the jar
	// 		number of GO terms in cluster of interest
	// K number of white balls in the jar
	// 		number of GO term of interest for Anopheles gambiae genes in the analyses
	// k number of white balls picked out
	// 		number of GO term of interest in cluster of interest

	console.log( 'inside goTerms' );
	console.log( 'inputData:', inputData );

	// Make the facet part of data
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
		'q': '{!join from=member_ids to=id} analysis_id:' + inputData.analysisId,
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

	// Calculate N
	request( options, function( error, response, body ) {
		if ( error ) {
			console.log( error );
		} else {

			var N, n, K, k, term;
			var significantTerms = [];
			var allBuckets = body.facets.conditions.buckets;
			var numBuckets = body.facets.conditions.numBuckets;
			console.log( numBuckets );

			function calculateCountSum( buckets ) {
				var sum = buckets.reduce( function( prev, curr ) {
					return prev + curr.count;
				}, 0 );
				return sum;
			}
			N = calculateCountSum( allBuckets );
			// console.log( 'Total number of GO terms for Anopheles:', N );

			// Calculate n
			data.q = '{!join from=member_ids to=id} id:' + inputData.clusterId;
			request( options, function( error, response, body ) {
				if ( error ) {
					console.log( error );
				} else {

					//var R = new rstats.session();

					var clusterBuckets = body.facets.conditions.buckets;
					n = calculateCountSum( clusterBuckets );
					// console.log( 'Number of GO terms in cluster:', n );

					// Calculate each K and k
					// Perform analysis for each term
					allBuckets.forEach( function( bucket ) {

						K = bucket.count;
						term = bucket.val;
						// console.log( 'GO term of interest:', term );
						// console.log( 'Total number of GO term of interest for Anopheles:', K );

						function findCountTermOfInterest( buckets ) {
							var count = 0;
							buckets.some( function( b ) {
								if ( b.val === term ) {
									count = b.count;
									return true;
								}
								return false;
							} );
							return count;
						}
						k = findCountTermOfInterest( clusterBuckets );
						// console.log( 'Number of GO term of interest in cluster:', k );


						// R.assign( 'x', k );
						// R.assign( 'm', K );
						// R.assign( 'n', N - K );
						// R.assign( 'k', n );

						//var hyperGeom = R.parseEval("dhyper(x, m, n, k)");
						var hyperGeom = go.logHypergeometric( K, k, N, n );
						if ( hyperGeom < 0.05 / numBuckets ) {
							significantTerms.push( {
								'term': term,
								'pValue': hyperGeom
								//'pValue': hyperGeom[0]
							} );
							//console.log(hyperGeom);
						}

					} );

					//console.log( significantTerms, significantTerms.length );

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

					// Find the names and descriptions of the significant terms
					request( options, function( error, response, body ) {
						if ( error ) {
							console.log( error );
						} else {
							// body.response.docs is an array of objects: {'name', 'description'}
							callback( body.response.docs );
						}
					} );

				}
			} );

		}
	} );
};

handlers.tTest = function (inputData, callback) {
    console.log('inside tTest');
    console.log(inputData);
    
    // First get the numbers for all of the clusters.    
    var facet = JSON.stringify({
        conditions    : {
            terms : {
                field : 'condition_id',
                numBuckets : true,
                limit : 0,
                sort  : { index: 'asc' },
                facet : {
                    sumsq : 'sumsq(expression_value_d)',
                    sum : 'sum(expression_value_d)',
                    avg   : 'avg(expression_value_d)'
                }
            }
        }
    });
    
    var data = {
        'q'     : '{!join from=member_ids to=gene_id} analysis_id:' + inputData.analysisId + ' NOT id:' + inputData.clusterId,
        'wt'    : 'json',
        'indent': 'true',
        'rows'  : '1',
        'json.facet': facet
    };
    
    console.log(data);
    
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
            var genomeBuckets = body.facets.conditions.buckets;
            
            // And now get the cluster data.
            data.q = '{!join from=member_ids to=gene_id} id:' + inputData.clusterId;

            request( options, function( error, response, body ) {
                if ( error ) {
                    console.log( error );
                } else {
                    var clusterBuckets = body.facets.conditions.buckets,
                        values = tTest.calculateExpressionValues([clusterBuckets, genomeBuckets]),
                        significantValues = tTest.calculateSignificant(values);
                    
                    var conditionsWithPvalues = [];
                    for ( var i = 0, ilen = values[0].length; i < ilen; i++ ) {
                        conditionsWithPvalues.push({
                            'condition': values[0][i].condition,
                            'conditionId': values[0][i].conditionId,
                            'mean': values[0][i].mean,
                            'pValue': significantValues[i].pValue,
                            'foldChange': significantValues[i].foldChange,
                            'pValueNegLog10': significantValues[i].pValueNegLog10
                        })
                    }
                    
                    callback(conditionsWithPvalues);
                }
            });
        }
    });
};