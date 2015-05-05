/*
 * The matrix of information about the clusters
 *
 * @class
 */
Practice.Matrix = function( expressionClusters, orthologyClusters, elementDict ) {

	var i, j;

	// An "element" is the basic data unit, e.g. a gene or an orthologous group
	// A "cluster" contains elements
	// A "clustering" is the particular set of clusters into which the elements are split
	this.expressionClusters = expressionClusters;
	this.orthologyClusters = orthologyClusters;
	this.geneToOG = elementDict;
	this.allElements = [];

	// Size of matrices is determined by size of clusters
	this.numexpressionClusters = Object.keys( this.expressionClusters ).length;
	this.numorthologyClusters = Object.keys( this.orthologyClusters ).length;
	this.matrixSize = this.numexpressionClusters + this.numorthologyClusters;

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

	// For labels
	// WARNING!
	// The following relies on clutering_id being of the form: species_type_cluster_numClusters
	var idSpecies = this.expressionClusters[0].clustering_id.split( '_' )[0];
	switch ( idSpecies ) {
		case 'anoph':
			this.species = 'Anopheles';
			break;
		case 'plasmo':
			this.species = 'Plasmodium';
	}

};

/*
 * Create the elements
 */
Practice.Matrix.prototype.makeElements = function() {

	// TODO Make use of the id field to get coordinates

	var i, j, clusterMembers, type1Name, type2Name, type1Coo, type2Coo, anElement,
		// Reverse dictionary of type 2 clusters and elements
		type2ElementToType2Cluster = {};

	for ( i = 0, ilen = this.orthologyClusters.length; i < ilen; i++ ) {
		clusterMembers = this.orthologyClusters[i].member_ids;
		for ( j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {
			type2ElementToType2Cluster[clusterMembers[j]] = i;
		}
	}

	// Create new elements and first give them type 1 names and type 1 coordinates
	type2NameUndefinedCount = 0;
	for ( i = 0, ilen = this.expressionClusters.length; i < ilen; i++ ) {
		clusterMembers = this.expressionClusters[i].member_ids;
		console.log( 'Cluster ' + i + ' has ' + clusterMembers.length + ' elements' );
		for ( j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {

			// Set up variables for making new elements
			type1Name = clusterMembers[j];
			type1Coo = i;
			type2Name = this.geneToOG[type1Name]; // TODO sort this out!
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
		col = this.allElements[i].type1Coo + this.numorthologyClusters;

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

		// Don't run if another diagram is already maximised
		if ( !bigDiagramExists ) {
			$( '.diagrams-container' ).append( $diagramContainerBig );
			$diagramContainerBig.append( $( this ).parent() );

			bigDiagramExists = true;
			$( '.expand-button' ).css( 'pointer-events', 'none' );

			$minimiseButton.show();
			$expandButton.hide();
			$closeButton.hide();
		}

	};

	var minimise = function() {

		$diagramContainerBig.detach();
		$diagramContainer.append( $( this ).parent() );

		bigDiagramExists = false;
		$( '.expand-button' ).css( 'pointer-events', '' );

		$minimiseButton.hide();
		$expandButton.show();
		$closeButton.show();

	};

	var $diagramContainerContainer = $( '<div>' ).addClass( 'diagram-container-container' ),
		$diagramContainer = $( '<div>' ).addClass( 'diagram-container' ),
		$diagramContainerBig = $( '<div>' ).addClass( 'diagram-container-big' ),
		$svgContainer = $( '<div>' ).addClass( 'svg-container' ),
		$svgInnerContainer = $( '<div>' ).addClass( 'svg-inner-container' ),
		$title = $( '<p>' ).addClass( 'diagram-title' ).text( this.species ),

		$closeButton = $( '<div>' )
			.addClass( 'button small-button close-button' )
			.text( '×' )
			.on( 'click', function() {
				$diagramContainerContainer.remove();
				$diagramContainerBig.remove();
			} ),

		$expandButton = $( '<div>' )
			.addClass( 'button small-button expand-button' )
			.text( '+' )
			.on( 'click', expand ),

		$minimiseButton = $( '<div>' )
			.addClass( 'button small-button minimise-button' )
			.text( '−' )
			.on( 'click', minimise )
			.hide();

	$svgContainer.append( $title, $minimiseButton, $expandButton, $closeButton, $svgInnerContainer );
	$diagramContainer.append( $svgContainer );
	$diagramContainerContainer.append( $diagramContainer );
	$( '.diagrams-container' ).append( $diagramContainerContainer );

	// For accessing this in the findColor function
	var that = this;

	var findColor = function( x ) {
		if ( colorExpressionClusters ) {
			if ( x < that.numorthologyClusters ) {
	    		return "#000000";
	    	} else {
	    		return fill( x - that.numorthologyClusters );
	    	}
		} else {
			if ( x < that.numorthologyClusters ) {
	    		return fill( x - that.numorthologyClusters );
	    	} else {
	    		return "#000000";
	    	}
		}
	};

	var findIndex = function( d ) {
		if ( colorExpressionClusters ) {
			return Math.max( d.target.index, d.source.index );
		} else {
			return Math.min( d.target.index, d.source.index );
		}
	};

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

	var svg = d3.select($svgInnerContainer[0]).append("svg")
	    .attr("viewBox", "0 0 " + width + " " + height)
	  .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	svg.append("g").selectAll("path")
	    .data(chord.groups)
	  .enter().append("path")
	    .style("fill", function(d) { return findColor(d.index); })
	    .style("stroke", function(d) { return findColor(d.index); })
	    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
	    .on("mouseover", fade(0))
	    .on("mouseout", fade(1));

	svg.append("g")
	    .attr("class", "chord")
	  .selectAll("path")
	    .data(chord.chords)
	  .enter().append("path")
	    .attr("d", d3.svg.chord().radius(innerRadius))
	    .style("fill", function(d) { return findColor(findIndex(d)); })
	    .style("stroke", function(d) { return findColor(findIndex(d)); })
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

	// Give diagramsContainer a minimum height
	$diagramContainer.css( 'min-height', $diagramContainerContainer.height() );

};