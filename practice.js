// To populate the selects
var responseData = {},
	exprOptions = {},
	orthoOptions = {};

var exprOptionsData = {
	'q'		: 'type:expr_cluster',
	'wt'	: 'json',
	'indent': 'true',
	'rows' 	: '200'
};

var orthoOptionsData = {
	'q'		: 'type:ortho_cluster',
	'wt'	: 'json',
	'indent': 'true',
	'rows' 	: '200'
}

var optionsPromise1 = $.ajax( 'solr.php', {
	method: 'POST',
	data: exprOptionsData,
	success: function( response ) {
		var responseData = response.response.docs;
		for ( var i = 0, ilen = responseData.length; i < ilen; i++ ) {
			exprOptions[responseData[i].clustering_id[0]] = true;
		}
		for ( var key in exprOptions ) {
			if ( exprOptions.hasOwnProperty( key ) ) {
				var option = $( '<option>' ).text( key );
				$( '.expr-cluster-select' ).append( option );
			}
		}
	}
} );

var optionsPromise2 = $.ajax( 'solr.php', {
	method: 'POST',
	data: orthoOptionsData,
	success: function( response ) {
		var responseData = response.response.docs;
		for ( var i = 0, ilen = responseData.length; i < ilen; i++ ) {
			orthoOptions[responseData[i].clustering_id[0]] = true;
		}
		for ( var key in orthoOptions ) {
			if ( orthoOptions.hasOwnProperty( key ) ) {
				var option = $( '<option>' ).text( key );
				$( '.ortho-cluster-select' ).append( option );
			}
		}
	}
} );

// Once the selects have been populated
$.when( optionsPromise1, optionsPromise2 ).done( function() {
	//var response1 = v1[0];
	$( '.btn-drawCircos' )
		.removeClass( 'btn-disabled' )
		.on( 'click', function() {
			var exprOption = $( '.expr-cluster-select' ).val();
			var orthoOption = $( '.ortho-cluster-select' ).val();
			getData( exprOption, orthoOption );
		} );
});

function getData( exprOption, orthoOption ) {

	var	clusterData = '',
		expr = '',
		ortho = '';

	// function getPromiseFromOption( options ) {
	// 	var data = {
	// 		q:option
	// 	};

	// 	retrun $.ajxj( solr, data, succes)
	// }

	var exprData = {
		'q'		: 'clustering_id:' + exprOption,
		'wt'	: 'json',
		'indent': 'true',
		'rows' 	: '20'
	};

	var orthoData = {
		'q'		: 'clustering_id:' + orthoOption,
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
			ortho = clusterData.response.docs;
		}
	} );

	$.when( promise1, promise2 ).done( function( promise1Args, promise2Args ) {
		var	expr = promise1Args[0].response.docs,
			ortho = promise2Args[0].response.docs,
			m = new Practice.Matrix( expr, ortho, mapDict );

		m.makeElements();
		m.makeElementMatrix();
		m.makeSizeMatrix();
		m.drawCircos();
	});
}
