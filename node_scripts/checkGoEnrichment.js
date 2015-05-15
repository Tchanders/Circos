var request = require( 'request' );
var go = require( './nodeGoEnrichment' );

// Make the data part of the options
var data = {
	'q': 'type:go',
	'filter': 'id,description,gene_ids',
	'wt': 'json',
	'rows': '20000'
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
		// do go enrichment analysis
		console.log( body.response.docs.length );
		
	}
} );