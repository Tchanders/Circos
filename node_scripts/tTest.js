var student = require( 'distributions' ).Studentt; // Necessary to get the pdf fot the t-test
var rstats = require( 'rstats' ); // Necessary to get the pdf fot the t-test

var calculateExpressionValues = function (clusters) {
    var expressionValues = [];
    for ( var i = 0, ilen = clusters.length; i < ilen; i++ ) {
        expressionValues.push([]);

        var conditionIds = [];
        if ( i === 1 ) {
            // Construct an array with all the condition ids so that they can
            // be used to filter the genome ids.
            for ( var k = 0, klen = expressionValues[0].length; k < klen; k++ ) {
                conditionIds.push(expressionValues[0][k].conditionId);
            }
        }

        var nOfSkippedConditions = 0;
        for ( var j = 0, jlen = clusters[i].length; j < jlen; j++ ) {
            var condition = j + 1 - nOfSkippedConditions,
                conditionId = clusters[i][j].val,
                mean = clusters[i][j].avg,
                count = clusters[i][j].count,
                variance = (clusters[i][j].sumsq - (Math.pow(clusters[i][j].sum, 2) / count)) / (count - 1);

            if ( (i === 1 && conditionIds.indexOf(conditionId) > -1) ||
                 (i === 0 ) ) {
                expressionValues[i].push({
                    'condition': condition,
                    'mean': mean,
                    'count': count,
                    'variance': variance,
                    'conditionId': conditionId
                });
            } else if ( i === 1 ) {
                nOfSkippedConditions++;
            }
        }
    }
    
    return expressionValues;
}

var calculateSignificant = function (clusters) {
    var significant = [];
//    var R = new rstats.session();
    
    // Go over the cluster and background values and do the test statistics.
    for ( var i = 0, ilen = clusters[0].length; i < ilen; i++ ) {
        var clusterCount = clusters[0][i].count,
            clusterMean = clusters[0][i].mean,
            clusterVar = clusters[0][i].variance,
            genomeCount = clusters[1][i].count,
            genomeMean = clusters[1][i].mean,
            genomeVar = clusters[1][i].variance;
        
        var varEstimate = Math.sqrt((clusterVar/clusterCount) + (genomeVar/genomeCount)),
            tStatistic = (clusterMean - genomeMean) / varEstimate;
        
        var dfEstNumerator = Math.pow((clusterVar/clusterCount) + (genomeVar/genomeCount), 2),
            dfEstDenominatorCluster = Math.pow((clusterVar / clusterCount), 2) / (clusterCount - 1),
            dfEstDenominatorGenome = Math.pow((genomeVar / genomeCount), 2) / (genomeCount - 1),
            df = dfEstNumerator / (dfEstDenominatorCluster + dfEstDenominatorGenome);
            // Multiply by two because this is a two tailed test.
            pValue = student(df).cdf(-Math.abs(tStatistic)) * 2;
//        
//        R.assign('x', tStatistic);
//        R.assign('df', df);
//        
//        var pValue = R.parseEval("2 * pt(-abs(x), df)")[0];
        
        console.log(i+1, clusterVar, genomeVar, tStatistic, df, pValue);
        
        significant.push({
            'pValue': pValue
        });
    }
    
    return significant;
}

module.exports.calculateExpressionValues = calculateExpressionValues;
module.exports.calculateSignificant = calculateSignificant;
