function makeDictionary( value ) {

	function getData( field, value ) {

		var data = {
			'q'		: field + ':' + value,
			'fq'	: 'og_ids:*',
			'fl'	: 'gene_id,og_ids',
			'wt'	: 'json',
			'indent': 'true',
			'rows' 	: '20000'
		};

		return $.ajax( 'http://localhost:8983/solr/circos/select', {
			dataType: 'jsonp',
			jsonp: 'json.wrf',
			data: data
		} );

	};

	var promise1 = getData( 'species_s', value );

	return $.when( promise1 ).done( function( v1 ) {

		var i,
			dictData = v1.response.docs;

		for ( i = 0, ilen = dictData.length; i < ilen; i++ ) {
			// og_ids is always array of length 1
			geneToOG[dictData[i].gene_id] = dictData[i].og_ids[0];
		}

		console.log( Object.keys( geneToOG ).length );

	} );

}

var geneToOG = {};

makeDictionary( '\"Anopheles gambiae\"' );
makeDictionary( '\"Plasmodium falciparum\"' );
