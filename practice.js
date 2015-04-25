var selectedSpecies = 'anoph',
	anophelesOptions = {
		'expr': {},
		'ortho': {}
	},

	plasmodiumOptions = {
		'expr': {},
		'ortho': {}
	};

function getData( field, value ) {

	var data = {
		'q'		: field + ':' + value,
		'wt'	: 'json',
		'indent': 'true',
		'rows' 	: '20000'
	};

	return $.ajax( 'http://localhost:8983/solr/circos/select', {
		dataType: 'jsonp',
		jsonp: 'json.wrf',
		data: data
	} );

}

var optionsPromise1 = getData( 'type', 'expr_cluster' );
var optionsPromise2 = getData( 'type', 'ortho_cluster' );

$.when( optionsPromise1, optionsPromise2 ).done( function( v1, v2 ) {

	var chosenExpressionOption, chosenOrthoOption, // TODO Move these down
		expressionOptions = v1[0].response.docs,
		orthologyOptions = v2[0].response.docs;

	function populateOptions( data ) {

		var i, idList, idSpecies, idType, idNumClusters;

		function addToOptions( species, type, num ) {

			var dict;

			switch ( species ) {
				case 'anoph':
					dict = anophelesOptions;
					break;
				case 'plasmo':
					dict = plasmodiumOptions;
					break;
			}

			if ( !dict[type][num] ) {
				dict[type][num] = 1;
			} else {
				dict[type][num] += 1;
			}

		}

		for ( i = 0, ilen = data.length; i < ilen; i++ ) {
			// WARNING!
			// The following relies on clutering_id being of the form: species_type_cluster_numClusters
			idList = data[i].clustering_id.split( '_' );
			idSpecies = idList[0];
			idType = idList[1];
			idNumClusters = idList[3];
			addToOptions( idSpecies, idType, idNumClusters );
		}

	}

	function showOptions( species ) {

		var i, key,
			dictLength,
			option,
			type,
			types = ['expr', 'ortho'];

		switch ( species ) {
			case 'anoph':
				dict = anophelesOptions;
				break;
			case 'plasmo':
				dict = plasmodiumOptions;
				break;
		}

		for ( i = 0; i < types.length; i++ ) {
			type = types[i];
			for ( key in dict[type] ) {
				option = $( '<option>' ).text( dict[type][key] );
				$( '.' + type + '-cluster-select' ).append( option );
			}
		}
	}

	function makeCircos( chosenExpressionOption, chosenOrthoOption, dict ) {

		var promise1 = getData( 'clustering_id', chosenExpressionOption );
		var promise2 = getData( 'clustering_id', chosenOrthoOption );

		$.when( promise1, promise2 ).done( function( v1i, v2i ) {

			var	expr = v1i[0].response.docs,
				ortho = v2i[0].response.docs,
				m = new Practice.Matrix( expr, ortho, dict );
				console.log( m );
			m.drawCircos();

		});

	}

	populateOptions( expressionOptions );
	populateOptions( orthologyOptions );

	// First show default species options
	showOptions( selectedSpecies );

	$( '.btn-drawCircos' )
		.removeClass( 'btn-disabled' )
		.on( 'click', function() {

			chosenExpressionOption = selectedSpecies + '_expr_cluster_' + $( '.expr-cluster-select' ).val();
			chosenOrthoOption = selectedSpecies + '_ortho_cluster_' + $( '.ortho-cluster-select' ).val();
			makeCircos( chosenExpressionOption, chosenOrthoOption, geneToOG ); // TODO sort out global geneToOG

		} );

});