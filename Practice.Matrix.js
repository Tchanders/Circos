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
	// sizeMatrix will contain numbers and be used to create the diagram
	this.elementMatrix = [];
	this.sizeMatrix = [];
	for ( i = 0, ilen = this.matrixSize; i < ilen; i++ ) { // Array for each row
		this.elementMatrix[i] = [];
		this.sizeMatrix[i] = [];
		for ( j = 0, jlen = this.matrixSize; j < jlen; j++ ) { // Array for each col
			this.elementMatrix[i][j] = []; // Will be populated with elements
		}
	}
};

/*
 * Create the elements
 */
Practice.Matrix.prototype.makeElements = function() {

	var i, j, clusterMembers, type1Name, type2Name, type2Coo, anElement,
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
			type2Name = this.type1ElementToType2Element[type1Name]; // TODO sort this out!
			type2Coo = type2ElementToType2Cluster[type2Name];

			// Ignore any type 1 elements that do not map to type 2 elements
			// (Type 2 elements that do not map to type 1 elements are automatically ignored
			// because type 2 elements are never iterated over)
			if ( type2Name !== undefined && type2Coo !== undefined ) {
				anElement = new Practice.Element(
					type1Name,
					type2Name,
					i, // Type 1 coordinate
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

	var i;

	for ( i = 0, ilen = this.allElements.length; i < ilen; i++ ) {
		this.elementMatrix[+this.allElements[i].type2Coo][+this.allElements[i].type1Coo + this.numType2Clusters].push( this.allElements[i] );
		this.elementMatrix[+this.allElements[i].type1Coo + this.numType2Clusters][+this.allElements[i].type2Coo].push( this.allElements[i] );
	}
};

/*
 * Create the size matrix
 */
Practice.Matrix.prototype.makeSizeMatrix = function() {

	var i, j, matrixSum;

	for ( i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		for ( j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			this.sizeMatrix[i][j] = this.elementMatrix[i][j].length;
		}
		// Check matrix looks right
		console.log( this.sizeMatrix[i].toString() );
	}
	matrixSum = 0;
	for ( i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		for ( j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			matrixSum += this.sizeMatrix[i][j];
		}
	}
	// Check all elements are in matrix
	console.log( matrixSum === 2 * this.allElements.length );
};

/*
 * Draw the circos diagram
 */
Practice.Matrix.prototype.drawCircos = function() {

	this.makeElements();
	this.makeElementMatrix();
	this.makeSizeMatrix();

	// For accessing this in the findColor function
	var that = this;

	var findColor = function(x) {
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
	    .matrix(this.sizeMatrix);

	var width = 300,
	    height = 300,
	    innerRadius = Math.min(width, height) * .41,
	    outerRadius = innerRadius * 1.1;

	var fill = d3.scale.ordinal()
	    .domain(d3.range(10))
	    .range(["#CE6262", "#D89263", "#DFDA73", "#5ACC8f", "#7771C1"]);

	var svg = d3.select(".diagram-container").append("svg")
	    .attr("width", width)
	    .attr("height", height)
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