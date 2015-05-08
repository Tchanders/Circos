var matr = require( './nodegetmatrix' );

var clusterSizes = [5];//[2, 4, 5, 10, 15, 20, 25];
var i, j, length = clusterSizes.length;

for ( i = 0; i < length; i++ ) {
	for ( j = 0; j < length; j++ ) {
		results = matr.getMatrix(
			'analysis_id',
			'(anoph_expr_cluster_' + clusterSizes[i] + ' OR anoph_ortho_cluster_' + clusterSizes[j] + ')',
			'analysis_id,member_ids',
			true
		);
	}
}
