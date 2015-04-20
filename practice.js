var clusterData = '',
	expr = '',
	evol = '';

var exprData = {
	'q'		: 'clustering_id:expr_cluster_5',
	'wt'	: 'json',
	'indent': 'true',
	'rows' 	: '20'
};

var orthoData = {
	'q'		: 'clustering_id:ortho_cluster_5',
	'wt'	: 'json',
	'indent': 'true',
	'rows' 	: '20'
};

var promise1 = $.ajax( "solr.php", {
	method: "POST",
	data: exprData,
	success: function( response ) {
		clusterData = response;
		expr = clusterData.response.docs;
	}
} );

var promise2 = $.ajax( "solr.php", {
	method: "POST",
	data: orthoData,
	success: function( response ) {
		clusterData = response;
		evol = clusterData.response.docs;
	}
} );

$.when( promise1, promise2 ).done( function( promise1Args, promise2Args ) {
	var	expr = promise1Args[0].response.docs,
		evol = promise2Args[0].response.docs;
	m = new Practice.Matrix( expr, evol, mapDict );
	m.makeElements();
	m.makeElementMatrix();
	m.makeSizeMatrix();
	m.drawCircos();
});