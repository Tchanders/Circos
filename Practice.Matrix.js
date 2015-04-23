/*
 * The matrix of information about the clusters
 *
 * @class
 */
Practice.Matrix = function( type1Clusters, type2Clusters, elementDict ) {

	var i, j;

	// An "element" is the basic data unit, e.g. a gene or an orthologous group
	// A "cluster" contains elements
	// A "clustering" is the particular set of clusters into which the elements are split
	this.type1Clusters = type1Clusters;
	this.type2Clusters = type2Clusters;
	this.type1ElementToType2Element = elementDict;
	this.allElements = [];

	// Size of matrices is determined by size of clusters
	this.numType1Clusters = Object.keys( this.type1Clusters ).length;
	this.numType2Clusters = Object.keys( this.type2Clusters ).length;
	this.matrixSize = this.numType1Clusters + this.numType2Clusters;

	// Set up empty matrices
	// elementMatrix will contain elements
	// numMatrix will contain numbers and be used to create the diagram
	this.elementMatrix = [];
	this.numMatrix = [];
	for ( i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		this.elementMatrix[i] = [];
		this.numMatrix[i] = [];
		for ( j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			this.elementMatrix[i][j] = [];
		}
	}

};

/*
 * Create the elements
 */
Practice.Matrix.prototype.makeElements = function() {

	var i, j, clusterMembers, type1Name, type2Name, type1Coo, type2Coo, anElement,
		// Reverse dictionary of type 2 clusters and elements
		type2ElementToType2Cluster = {};

	for ( i = 0, ilen = this.type2Clusters.length; i < ilen; i++ ) {
		clusterMembers = this.type2Clusters[i].member_ids;
		for ( j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {
			type2ElementToType2Cluster[clusterMembers[j]] = i;
		}
	}

	// Create new elements and first give them type 1 names and type 1 coordinates
	type2NameUndefinedCount = 0;
	for ( i = 0, ilen = this.type1Clusters.length; i < ilen; i++ ) {
		clusterMembers = this.type1Clusters[i].member_ids;
		console.log( 'Cluster ' + i + ' has ' + clusterMembers.length + ' elements' );
		for ( j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {

			// Set up variables for making new elements
			type1Name = clusterMembers[j];
			type1Coo = i;
			type2Name = this.type1ElementToType2Element[type1Name]; // TODO sort this out!
			type2Coo = type2ElementToType2Cluster[type2Name];

			// Ignore any type 1 elements that do not map to type 2 elements
			// (Type 2 elements that do not map to type 1 elements are automatically ignored
			// because type 2 elements are never iterated over)
			if ( type2Name !== undefined && type2Coo !== undefined ) {
				anElement = new Practice.Element(
					type1Name,
					type2Name,
					type1Coo,
					type2Coo
				);
				this.allElements.push( anElement );
			}

		}
	}

};

/*
 * Create the matrix of elements
 *
 * E.g. matrix for 3 type 1 clusters and 2 type 2 clusters:
 *
 * 0 0 X X X
 * 0 0 X X X
 * X X 0 0 0
 * X X 0 0 0
 * X X 0 0 0
 *
 */
Practice.Matrix.prototype.makeElementMatrix = function() {

	var i, row, col;

	for ( i = 0, ilen = this.allElements.length; i < ilen; i++ ) {

		row = this.allElements[i].type2Coo;
		col = this.allElements[i].type1Coo + this.numType2Clusters;

		this.elementMatrix[row][col].push( this.allElements[i] );
		this.elementMatrix[col][row].push( this.allElements[i] );

	}

};

/*
 * Create the size matrix
 */
Practice.Matrix.prototype.makenumMatrix = function() {

	var i, j, count;

	for ( i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		for ( j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			this.numMatrix[i][j] = this.elementMatrix[i][j].length;
		}
		// Check matrix looks right
		console.log( this.numMatrix[i].toString() );
	}

	// Check all elements are in matrix
	count = 0;
	for ( i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		for ( j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			count += this.numMatrix[i][j];
		}
	}
	console.log( count === 2 * this.allElements.length );

};

/*
 * Draw the circos diagram
 */
Practice.Matrix.prototype.drawCircos = function() {

	this.makeElements();
	this.makeElementMatrix();
	this.makenumMatrix();

	var expand = function() {
		$( '.diagrams-container' ).append( $diagramContainerBig );
		$diagramContainerBig.append( $( this ).parent() );
		$svgContainer.append( $minimiseButton );
	};

	var $diagramContainer = $( '<div>' ).addClass( 'diagram-container' ),
		$diagramContainerBig = $( '<div>' ).addClass( 'diagram-container-big' ),
		$svgContainer = $( '<div>' ).addClass( 'svg-container' ),
		$closeButton = $( '<div>' )
			.addClass( 'small-button close-button' )
			.text( '×' )
			.on( 'click', function() {
				$diagramContainer.remove();
				$diagramContainerBig.remove();
			} ),
		$expandButton = $( '<div>' )
			.addClass( 'small-button expand-button' )
			.text( '+' )
			.on( 'click', expand ),
		$minimiseButton = $( '<div>' )
			.addClass( 'small-button minimise-button' )
			.text( '-' )
			.on( 'click', function() {
				$diagramContainerBig.detach();
				$diagramContainer.append( $( this ).parent() );
				$minimiseButton.detach();
			} );

	$diagramContainer.append( $svgContainer );
	$svgContainer.append( $closeButton, $expandButton );
	$( '.diagrams-container' ).append( $diagramContainer );

	// For accessing this in the findColor function
	var that = this;

	var findColor = function( x ) {
		if ( x < that.numType2Clusters ) {
    		return "#000000";
    	} else {
    		return fill( x - that.numType2Clusters );
    	}
	}

	// The following is adapted from http://bl.ocks.org/mbostock/4062006
	var chord = d3.layout.chord()
	    .padding(.05)
	    .sortSubgroups(d3.descending)
	    .matrix(this.numMatrix);

	var width = 200,
	    height = 200,
	    innerRadius = Math.min(width, height) * .41,
	    outerRadius = innerRadius * 1.1;

	var fill = d3.scale.ordinal()
	    .domain(d3.range(10))
	    .range(["#CE6262", "#D89263", "#DFDA73", "#5ACC8f", "#7771C1"]);

	var svg = d3.select($svgContainer[0]).append("svg")
	    .attr("viewBox", "0 0 " + width + " " + height)
	  .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	svg.append("g").selectAll("path")
	    .data(chord.groups)
	  .enter().append("path")
	    .style("fill", function(d) { return findColor(d.index); })
	    .style("stroke", function(d) { return findColor(d.index); })
	    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
	    .on("mouseover", fade(.1))
	    .on("mouseout", fade(1));

	svg.append("g")
	    .attr("class", "chord")
	  .selectAll("path")
	    .data(chord.chords)
	  .enter().append("path")
	    .attr("d", d3.svg.chord().radius(innerRadius))
	    .style("fill", function(d) { return findColor(Math.max(d.target.index,d.source.index)); })
	    .style("stroke", function(d) { return findColor(Math.max(d.target.index,d.source.index)); })
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