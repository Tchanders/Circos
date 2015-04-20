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
	for ( var i = 0, ilen = this.matrixSize; i < ilen; i++ ) { // Array for each row
		this.elementMatrix[i] = [];
		this.sizeMatrix[i] = [];
		for ( var j = 0, jlen = this.matrixSize; j < jlen; j++ ) { // Array for each col
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
	type2NameUndefinedCount = 0;
	for ( var i = 0, ilen = this.type1Clusters.length; i < ilen; i++ ) {
		var clusterMembers = this.type1Clusters[i].member_ids;
		console.log( 'Cluster ' + i + ' has ' + clusterMembers.length + ' elements' );
		for ( var j = 0, jlen = clusterMembers.length; j < jlen; j++ ) {
			// Set up variables for making new elements
			var type1Name = clusterMembers[j];
			var type2Name = this.type1ElementToType2Element[type1Name]; // TODO sort this out!
			if ( type2Name === undefined ) {
				type2NameUndefinedCount += 1;
			}
			var type2Coo = type2ElementToType2Cluster[type2Name];
			// Ignore any type 1 elements that do not map to type 2 elements
			// (Type 2 elements that do not map to type 1 elements are automatically ignored
			// because type 2 elements are never iterated over)
			if ( type2Name !== undefined && type2Coo !== undefined ) {
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
	console.log( 'No. type1 names not in dictionary: ' + type2NameUndefinedCount );
}

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
	for ( var i = 0, ilen = this.allElements.length; i < ilen; i++ ) {
		this.elementMatrix[+this.allElements[i].type2Coo][+this.allElements[i].type1Coo + this.numType2Clusters].push( this.allElements[i] );
		this.elementMatrix[+this.allElements[i].type1Coo + this.numType2Clusters][+this.allElements[i].type2Coo].push( this.allElements[i] );
	}
}

/*
* Create the size matrix
 */
Practice.Matrix.prototype.makeSizeMatrix = function() {
	for ( var i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		for ( var j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			this.sizeMatrix[i][j] = this.elementMatrix[i][j].length;
		}
		// Check matrix looks right
		console.log( this.sizeMatrix[i].toString() );
	}
	var matrixSum = 0;
	for ( var i = 0, ilen = this.matrixSize; i < ilen; i++ ) {
		for ( var j = 0, jlen = this.matrixSize; j < jlen; j++ ) {
			matrixSum += this.sizeMatrix[i][j];
		}
	}
	// Check all elements are in matrix
	console.log( matrixSum === 2 * this.allElements.length );
}