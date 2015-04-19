/*
* The matrix of information about the clusters
*
* @class
 */
Practice.Matrix = function( type1Clusters, type2Clusters, elementDict ) {
	// An "element" is the basic data unit, e.g. a gene or an orthologous group
	// A "cluster" contains elements
	// A "clustering" is the particular set of clusters into which the elements are split
	this.type1Clusters = type1Clusters;
	this.type2Clusters = type2Clusters;
	this.type1ElementToType2Element = elementDict;
	this.elementMatrixSize = Object.keys( this.type2Clusters ).length * 2;
	this.numCols = Object.keys( this.type1Clusters ).length * 2;
	this.numRows = Object.keys( this.type2Clusters ).length * 2;
	this.allElements = [];
	this.elementMatrix = [];
	this.sizeMatrix = [];
	for ( var i = 0, ilen = this.numRows; i < ilen; i++ ) { // Array for each row
		this.elementMatrix[i] = [];
		this.sizeMatrix[i] = [];
		for ( var j = 0, jlen = this.numCols; j < jlen; j++ ) { // Array for each col
			this.elementMatrix[i][j] = []; // Will be populated with elements
		}
	}
};

/*
* Create the elements
 */
Practice.Matrix.prototype.makeElements = function() {
	// Reverse dictionary of type 2 clusters and elements
	var type2ElementToType2Cluster = {};
	for ( var i = 0, ilen = this.type2Clusters.length; i < ilen; i++ ) {
		var clusterMembers = this.type2Clusters[i].member_ids;
		for ( var j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {
			type2ElementToType2Cluster[clusterMembers[j]] = i;
		}
	}
	// Create new elements and first give them type 1 names and type 1 coordinates
	for ( var i = 0, ilen = this.type1Clusters.length; i < ilen; i++ ) {
		var clusterMembers = this.type1Clusters[i].member_ids;
		for ( var j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {
			// Set up variables for making new elements
			var type1Name = clusterMembers[i];
			var type2Name = this.type1ElementToType2Element[type1Name]; // TODO sort this out!
			var type2Coo = type2ElementToType2Cluster[type2Name];
			// Ignore any type 1 elements that do not map to type 2 elements
			// (Type 2 elements that do not map to type 1 elements are automatically ignored
			// because type 2 elements are never iterated over)
			if ( type2Name !== undefined ) {
				var anElement = new Practice.Element(
					type1Name,
					type2Name,
					i, // Type 1 coordinate
					type2Coo
				);
				this.allElements.push( anElement );
			}
		}
	}
}

Practice.Matrix.prototype.makeElementMatrix = function() {
	for ( var i = 0, ilen = this.allElements.length; i < ilen; i++ ) {
		this.elementMatrix[+this.allElements[i].type2Coo + this.numRows / 2][+this.allElements[i].type1Coo].push( this.allElements[i] );
		this.elementMatrix[+this.allElements[i].type2Coo][+this.allElements[i].type1Coo + this.numCols / 2].push( this.allElements[i] );
	}
}

Practice.Matrix.prototype.makeSizeMatrix = function() {
	for ( var i = 0, ilen = this.numRows; i < ilen; i++ ) {
		for ( var j = 0, jlen = this.numCols; j < jlen; j++ ) {
			this.sizeMatrix[i][j] = this.elementMatrix[i][j].length;
		}
	}
}