/*
 * The matrix of information about the clusters
 *
 * @class
 *
 * @param {Array} expressionClusters 	Array of expression clusters
 * @param {Array} orthologyClusters		Array of orthology clusters
 *                                 	 	Each cluster is an object with:
 *                                 	  		* analysis_id
 *                                 	    	* member_ids
 * @param {Object} geneToGroup			Mapping of each gene to an orthologous group (OG)
 */
ClusterAnalysis.DiagramData = function( expressionClusters, orthologyClusters, geneToGroup ) {

	var ind = require( './chiSquaredIndependence' );

	this.expressionClusters = expressionClusters;
	this.orthologyClusters = orthologyClusters;
	this.numExpressionClusters = Object.keys( this.expressionClusters ).length;
	this.numOrthologyClusters = Object.keys( this.orthologyClusters ).length;
	this.geneToGroup = geneToGroup;

	// Set up empty matrices and populate them
	this.numberMatrix = [];
	this.populateNumberMatrix();
	this.circosMatrix = [];
	this.populateCircosMatrix();

	this.pValue = ind.calculate( this.numberMatrix );
	this.pValuesOfChords = ind.chordAnalysis( this.numberMatrix );

};

/*
 * Populates the numberMatrix for the overall chi-squared analysis
 *
 * E.g. matrix for 3 expression clusters and 2 orthology clusters:
 *
 * X X X
 * X X X
 *
 */
ClusterAnalysis.DiagramData.prototype.populateNumberMatrix = function() {

	var i, j,
		groupIDs, groupID,
		geneIDs, geneID,
		eIndex, oIndex,
		groupToOrthologyCluster = {};

	// Make the empty matrix the correct size
	for ( i = 0; i < this.numOrthologyClusters; i++ ) {
		this.numberMatrix[i] = [];
		for ( j = 0; j < this.numExpressionClusters; j++ ) {
			this.numberMatrix[i][j] = 0;
		}
	}

	// For each orthology cluster...
	for ( i = 0, ilen = this.orthologyClusters.length; i < ilen; i++ ) {
		groupIDs = this.orthologyClusters[i].member_ids;
		// ...for each orthologous group...
		for ( j = 0, jlen = groupIDs.length; j < jlen; j++ ) {
			// ...record which orthology cluster it is in
			groupID = groupIDs[j];
			groupToOrthologyCluster[groupID] = i;
		}
	}

	// For each expression cluster...
	for ( i = 0, ilen = this.expressionClusters.length; i < ilen; i++ ) {
		geneIDs = this.expressionClusters[i].member_ids;
		// ...for each gene...
		for ( j = 0, jlen = geneIDs.length; j < jlen; j++ ) {
			// ...if it has a corresponding orthologous group...
			geneID = geneIDs[j];
			if ( this.geneToGroup[geneID] ) {
				// ...then increment the relevant number in the number matrix
				groupID = this.geneToGroup[geneID];
				eIndex = i;
				oIndex = groupToOrthologyCluster[groupID];
				this.numberMatrix[oIndex][eIndex] += 1;
			}
		}
	}

};

/*
 * Populates the matrix for the Circos diagram
 *
 * E.g. matrix for 3 expression clusters and 2 orthology clusters:
 *
 * 0 0 X X X
 * 0 0 X X X
 * X X 0 0 0
 * X X 0 0 0
 * X X 0 0 0
 *
 */
ClusterAnalysis.DiagramData.prototype.populateCircosMatrix = function() {

	var i, row, col,
		size = this.numOrthologyClusters + this.numExpressionClusters;

	// Make the empty matrix the correct size
	for ( i = 0; i < size; i++ ) {
		this.circosMatrix[i] = [];
		for ( j = 0; j < size; j++ ) {
			this.circosMatrix[i][j] = 0;
		}
	}

	for ( i = 0; i < this.numOrthologyClusters; i++ ) {
		for ( j = 0; j < this.numExpressionClusters; j++ ) {

			// Populate top-right of circosMatrix
			this.circosMatrix[i][j + this.numOrthologyClusters] = this.numberMatrix[i][j];
			// Populate bottom-left of circosMatrix
			this.circosMatrix[j + this.numOrthologyClusters][i] = this.numberMatrix[i][j];

		}
	}

};
