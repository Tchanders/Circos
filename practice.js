var selectedSpecies = 'anoph',
	colorExpressionClusters = true,
	bigDiagramExists = false,

	optionsDict = {
		'anoph': {
			'expr': {},
			'ortho': {}
		},
		'plasmo': {
			'expr': {},
			'ortho': {}
		}
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


function makeCircos( chosenExpressionOption, chosenOrthoOption, dict ) {

	var promise1 = getData( 'clustering_id', chosenExpressionOption );
	var promise2 = getData( 'clustering_id', chosenOrthoOption );

	$.when( promise1, promise2 ).done( function( v1i, v2i ) {

		var	expr = v1i[0].response.docs,
			ortho = v2i[0].response.docs,
			m = new Practice.Matrix( expr, ortho, dict, colorExpressionClusters );
			console.log( m );
		m.drawCircos();

	});

}

function showOptions( species ) {

	var i, key,
		dictLength,
		option,
		type,
		types = ['expr', 'ortho'];

	for ( i = 0; i < types.length; i++ ) {
		type = types[i];
		$( '.' + type  + '-cluster-select' ).empty();
		for ( key in optionsDict[species][type] ) {
			option = $( '<option>' ).text( optionsDict[species][type][key] );
			$( '.' + type + '-cluster-select' ).append( option );
		}
	}

	// Make draw button use selectedSpecies data
	$( '.btn-drawCircos' )
		.removeClass( 'btn-disabled' ) // Only necessary the first time
		.off() // Remove the old onclick function
		.on( 'click', function() {

			chosenExpressionOption = selectedSpecies + '_expr_cluster_' + $( '.expr-cluster-select' ).val();
			chosenOrthoOption = selectedSpecies + '_ortho_cluster_' + $( '.ortho-cluster-select' ).val();
			makeCircos( chosenExpressionOption, chosenOrthoOption, geneToOG ); // TODO sort out global geneToOG

		} );

}

var optionsPromise1 = getData( 'type', 'clustering' );

$.when( optionsPromise1 ).done( function( v1 ) {

	var chosenExpressionOption, chosenOrthoOption, // TODO Move these down
		options = v1.response.docs;

	function populateOptions( data ) {

		var i, idList, species, type, num;

		for ( i = 0, ilen = data.length; i < ilen; i++ ) {

			// WARNING!
			// The following relies on clutering_id being of the form: species_type_cluster_numClusters
			idList = data[i].id.split( '_' );
			species = idList[0];
			type = idList[1];
			num = idList[3];
			if ( !optionsDict[species][type][num] ) {
				optionsDict[species][type][num] = num;
			}

		}

	}

	populateOptions( options );

	// First show default species options
	showOptions( selectedSpecies );

	$( '.species-radio' )
		.on( 'change', function() {
			var species = $( '.species-radio:checked' ).val();

			selectedSpecies = species;
			showOptions( selectedSpecies );
		} );

	$( '.color-radio' )
		.on( 'change', function() {
			var type = $( '.color-radio:checked' ).val();

			if ( type === 'expression' ) {
				colorExpressionClusters = true;
			} else {
				colorExpressionClusters = false;
			}
		} );

});