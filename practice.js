var clusterData = '',
	expr = '',
	evol = '';

var exprData = {
	'q'		: 'clustering_id:expr_cluster_10',
	'wt'	: 'json',
	'indent': 'true',
	'rows' 	: '20'
};

var orthoData = {
	'q'		: 'clustering_id:ortho_cluster_10',
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
	drawCircos( m.sizeMatrix );
});

// Adapted from http://bl.ocks.org/mbostock/4062006
function drawCircos(matrix) {
	// var matrix = m.sizeMatrix;
	console.log('drawing...');

	var chord = d3.layout.chord()
	    .padding(.05)
	    .sortSubgroups(d3.descending)
	    .matrix(matrix);

	var width = 500,
	    height = 500,
	    innerRadius = Math.min(width, height) * .41,
	    outerRadius = innerRadius * 1.1;

	var fill = d3.scale.ordinal()
	    .domain(d3.range(20))
	    .range(["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#FF0000", "#DD3333", "#FF5000", "#FFF200", "#8BFF00", "#3F7103", "#00FFF1", "#0000FF", "#FF00EE", "#8B2584"]);

	var svg = d3.select(".diagram-container").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	  .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	svg.append("g").selectAll("path")
	    .data(chord.groups)
	  .enter().append("path")
	    .style("fill", function(d) { return fill(d.index); })
	    .style("stroke", function(d) { return fill(d.index); })
	    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
	    .on("mouseover", fade(.1))
	    .on("mouseout", fade(1));

	svg.append("g")
	    .attr("class", "chord")
	  .selectAll("path")
	    .data(chord.chords)
	  .enter().append("path")
	    .attr("d", d3.svg.chord().radius(innerRadius))
	    .style("fill", function(d) { return fill(Math.max(d.target.index,d.source.index).toString()); })
	    .style("stroke", function(d) { return fill(Math.max(d.target.index,d.source.index).toString()); })
	    .style("opacity", 1);

	// Returns an event handler for fading a given chord group.
	function fade(opacity) {
	  return function(g, i) {
	    svg.selectAll(".chord path")
	        .filter(function(d) { return d.source.index != i && d.target.index != i; })
	      .transition()
	        .style("opacity", opacity);
	  };
	}
};