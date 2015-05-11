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
	var idSpecies = this.expressionClusters[0].analysis_id.split( '_' )[0];
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
			$( '.diagrams-container' ).append( $popupContainer );
			$diagramContainerBig.append( $( this ).parent() );

			bigDiagramExists = true;
			$( '.expand-button' ).css( 'pointer-events', 'none' );

			$minimiseButton.show();
			$expandButton.hide();
			$closeButton.hide();
		}

	};

	var minimise = function() {

		$popupContainer.detach();
		$diagramContainer.append( $( this ).parent() );

		bigDiagramExists = false;
		$( '.expand-button' ).css( 'pointer-events', '' );

		$minimiseButton.hide();
		$expandButton.show();
		$closeButton.show();

	};

	var $popupContainer = $( '<div>' ).addClass( 'popup-container' ),
	    $graphContainer = $( '<div>' ).addClass( 'graph-container' ),
	    $infoContainer = $( '<div>' ).addClass( 'info-container' ),
        $diagramContainerContainer = $( '<div>' ).addClass( 'diagram-container-container' ),
		$diagramContainer = $( '<div>' ).addClass( 'diagram-container' ),
		$diagramContainerBig = $( '<div>' ).addClass( 'diagram-container-big' ),
		$svgContainer = $( '<div>' ).addClass( 'svg-container' ),
		$svgInnerContainer = $( '<div>' ).addClass( 'svg-inner-container' ),
		$title = $( '<p>' ).addClass( 'diagram-title' ).text( this.species ),
		$infoTitle = $( '<p>' ).addClass( 'info-title' ).text( "hover over a cluster for information" ),

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
    $graphContainer.append( $diagramContainerBig );
//    $infoContainer.append( $infoTitle );
    $popupContainer.append( $graphContainer, $infoContainer );
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
	    .on("mouseout", fade(1))
        .on("mousedown", function(a) { getFacets(a) });

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
    
    function getFacets (a) {
        var orthoLen = that.numorthologyClusters,
            exprLen = that.numexpressionClusters,
            clusterIndex = a.index,
            species = that.species,
            analysis_id,
            clusterId,
            ids;
        
        if ( species === 'Anopheles') {
            species = 'Anopheles gambiae';
        } else {
            species = 'Plasmodium falciparum';
        }

        console.log(clusterIndex + ' ' + species);
        if ( clusterIndex + 1 <= orthoLen ) {
            console.log("we are in ortho");
            analysis_id = that.orthologyClusters[clusterIndex].analysis_id
            ids = that.orthologyClusters[clusterIndex].member_ids;
            clusterId = analysis_id + '_' + ('000'+clusterIndex.toString()).slice(-3);
        } else {
            console.log("we are in expr");
            var exprIndex = clusterIndex - orthoLen;
            analysis_id = that.expressionClusters[exprIndex].analysis_id;
            ids = that.expressionClusters[exprIndex].member_ids;
            clusterId = analysis_id + '_' + ('000' + exprIndex.toString() ).slice(-3);
        }
            
        // Construct the request
        var promise1, promise2;
        
        if ( clusterIndex + 1 <= orthoLen ) {
            promise1 = getFacetData( 'member_ids',
                                     'og_id',
                                     'id:' + clusterId);
            promise2 = getFacetData( 'member_ids',
                                     'og_id',
                                     'analysis_id:' + analysis_id)
        } else {
            promise1 = getFacetData( 'member_ids',
                                     'gene_id',
                                     'id:' + clusterId );
            promise2 = getFacetData( 'member_ids',
                                     'gene_id',
                                     'analysis_id:' + analysis_id)
        }
        
        $.when( promise1, promise2 ).done( function( v1i, v2i ) {
            /* The response is an array with three elements:
             *   [0]: The actual response from solr.
             *   [1]: success or failure. Mayne check for this before proceeding?
             *   [2]: Info from Ajax. Useless.
             * So we always have to the 0th element of the response.
             */
//            console.log(v1i, v2i)
            if ( clusterIndex + 1 <= orthoLen ) {
                var clusterBuckets = v1i[0].facets,
                    genomeBuckets = v2i[0].facets;
                showInfoPanelOrtho(clusterBuckets, genomeBuckets);
            } else {
                var clusterBuckets = v1i[0].facets.conditions.buckets,
                    genomeBuckets = v2i[0].facets.conditions.buckets;
                showInfoPanelExpr(clusterBuckets, genomeBuckets);
            }
        });
    }
    
    function getFacetData(from, to, initialParameter, filter) {
        var query = '{!join from=' + from + ' to=' + to + '} ' + initialParameter,
            data = {
                'q'		: query,
                'wt'	: 'json',
                'indent': 'true',
                'rows' 	: '20000'};
        
        if ( initialParameter.indexOf('expr') > -1 ) {
            data['rows'] = 1;
            data['json.facet'] =  "{" +
                "conditions    : {" +
                    "terms : {" +
                        "field : 'condition_id'," +
                        "numBuckets    : true," +
                        "limit : 0," +
                        "sort  : { index: 'asc' }," +
                        "facet : {" +
                            "sumsq : 'sumsq(expression_value_d)'," +
                            "avg   : 'avg(expression_value_d)'" +
                        "}" +
                    "}" +
                "}" +
            "}";
        } else if ( initialParameter.indexOf('ortho') > -1 ) {
            data['rows'] = 1;
            data['json.nl'] = 'map';
            data['json.facet'] =  "{" +
                "evorMean : 'avg(evo_rate_f)'," +
                'evoPerc:"percentile(evo_rate_f,5,25,50,75,95)",' +
                'duplMean:"avg(avg_para_count_f)",' +
                'duplPerc:"percentile(avg_para_count_f,5,25,50,75,95)",' +
                'univMean:"avg(frac_species_f)",' +
                'univPerc:"percentile(frac_species_f,5,25,50,75,95)",' +
                'evor: {range : {field:evo_rate_f, start:0, end:4, gap:0.13}},' +
                'dupl: {range : {field:avg_para_count_f, start:1, end:31, gap:1.03}},' +
                'univ: {range : {field:frac_species_f, start:0, end:1, gap:0.033}}' +
            "}";
        }
        
        return $.ajax({
            url: 'http://localhost:8983/solr/circos/query',
            dataType: 'jsonp',
            jsonp: 'json.wrf',
            data: data
        } );
    }

    // Display information about the cluster that you are hovering over.
    function showInfoPanelExpr(clusterBuckets, genomeBuckets) {
        // TODO Test if we are in the enlarged display
        var clusters = [clusterBuckets, genomeBuckets],
            expressionValues = [],
            minYaxisValue = +Infinity,
            maxYaxisValue = -Infinity;
        
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
                    variance = ((clusters[i][j].sumsq / clusters[i][j].count) - Math.pow(clusters[i][j].avg, 2)),
                    minConfidenceInterval = mean - 2 * Math.sqrt(variance),
                    maxConfidenceInterval = mean + 2 * Math.sqrt(variance);
                
                if ( (i === 1 && $.inArray(conditionId, conditionIds) > -1) ||
                     ( i === 0 ) ) {
                    expressionValues[i].push({
                        'condition': condition,
                        'mean': mean,
                        'variance': variance,
                        'minConfidenceInterval': minConfidenceInterval,
                        'maxConfidenceInterval': maxConfidenceInterval,
                        'conditionId': conditionId
                    });

                    if ( minYaxisValue > minConfidenceInterval ) {
                        minYaxisValue = minConfidenceInterval
                    };

                    if ( maxYaxisValue < maxConfidenceInterval ) {
                        maxYaxisValue = maxConfidenceInterval
                    };
                } else if ( i === 1 ) {
                    nOfSkippedConditions++;
                }
            }
        }
        
        /* From http://bl.ocks.org/d3noob/b3ff6ae1c120eea654b5* */
        
        // Set the dimensions of the canvas / graph
        var margin = {top: 30, bottom: 30, left: 30, right: 20},
            // The line plot indide info panel gets its dimensions from graphContainer
            // maybe TODO ?
            width = $graphContainer.width() - margin.left - margin.right,
            height = $graphContainer.height() - margin.top - margin.bottom;

        // Set the ranges
        var x = d3.scale.linear().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);

        // Define the axes
        var xAxis = d3.svg.axis().scale(x)
            .orient("bottom").ticks(5);

        var yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(5);

        // Add the div for the hoverbox.
        var hoverDiv = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Adds the svg canvas
        var infoPanelsvg = d3.select($infoContainer[0])
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", 
                      "translate(" + margin.left + "," + margin.top + ")");

        // Get the data
        var data = expressionValues[0];
        
        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.condition; }));
        y.domain(d3.extent([minYaxisValue, maxYaxisValue], function(d) { return d; }));
        
        // First draw the red lines for the genome confidence interval in the background;
        data = expressionValues[1];
        infoPanelsvg.selectAll("line")
            .data(data)
            .enter().append("svg:line")
            .attr("class", "genome-line")
            .attr("y1", function (d) { return y(d.maxConfidenceInterval); })
            .attr("y2", function (d) { return y(d.minConfidenceInterval); })
            .attr("x1", function (d) { return x(d.condition); })
            .attr("x2", function (d) { return x(d.condition); })
            .attr("stroke", "red");
        
        data = expressionValues[0];
        
        infoPanelsvg.selectAll("dot")
            .data(data)
            .enter().append("svg:line")
            .attr("class", "cluster-line")
            .attr("y1", function (d) { return y(d.maxConfidenceInterval); })
            .attr("y2", function (d) { return y(d.minConfidenceInterval); })
            .attr("x1", function (d) { return x(d.condition); })
            .attr("x2", function (d) { return x(d.condition); })
            .attr("stroke", "grey")
            .attr("opacity", 0.8);

        // Add the dots 
        infoPanelsvg.selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("r", 2)
            .attr("cx", function(d) { return x(d.condition); })
            .attr("cy", function(d) { return y(d.mean); })
            .on("mouseover", function(d) {
                var conditionId = d.conditionId,
                    promise = getConditionInfo(conditionId),
//                    promise = PostToSolr(conditionId, [], 1, false),
                    conditionName,
                    xcoord = d3.event.pageX,
                    ycoord = d3.event.pageY;

                $.when(promise).done(function (reply) {
                    // The response json array always has length 1
                    conditionName = reply.response.docs[0].name;
                    console.log('inside' + conditionName);
                    hoverDiv.transition()
                        .duration(200)
                        .style("opacity", .9);

                    hoverDiv.html(conditionName + '<br/>' + d.value)
                        .style("left", xcoord + "px")
                        .style("top", ycoord + "px");
                });
                console.log('outside' + conditionName);

                // This should be inside the promise callback but then the
                // d3 events are lost. TODO.
            })
            .on("mouseout", function(d) {
                hoverDiv.transition()
                    .duration(500)
                    .style("opacity", 0)
            });
        
        // Add the X Axis
        infoPanelsvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        infoPanelsvg.append("g")
            .attr("class", "y axis")
            .call(yAxis);
    }
    
    // Display information about the cluster that you are hovering over.
    function showInfoPanelOrtho(clusterBuckets, genomeBuckets) {
        // TODO Test if we are in the enlarged display
        var minSpeciesRatio = 10000,
            clusters = [clusterBuckets, genomeBuckets],
            orthologyValues = [],
            ogClusterStats = [];
        
        for ( var i = 0, ilen = clusters.length; i < ilen; i++ ) {
//            orthologyValues.push([]);
            
            orthologyValues[i] = {
                'evorHist': clusters[i].evor.buckets,
                'evorMean': clusters[i].evorMean,
                'evorPerc': clusters[i].evoPerc,
                'duplHist': clusters[i].dupl.buckets,
                'duplMean': clusters[i].duplMean,
                'duplPerc': clusters[i].duplPerc,
                'univHist': clusters[i].univ.buckets,
                'univMean': clusters[i].univMean,
                'univPerc': clusters[i].univPerc
            };
        };
        
        console.log(orthologyValues)

        /* From vector-violin.js@ninjaviewer (mostly) */
        
        // Set the dimensions of the canvas / graph
        var margin = {top: 30, bottom: 30, left: 30, right: 20},
            width = $graphContainer.width() - margin.left - margin.right,
            height = $graphContainer.height() - margin.top - margin.bottom;
        
        console.log('dimensions', width, height, margin)

        var boxSpacing = 10;
        var boxWidth = width / 6 - boxSpacing;

        var domain = [0, 4];
        var resolution = 20;
        var d3ObjId = "violin";
        var interpolation = 'basis';
        
        var evoRateDiv = d3.select($infoContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "33.3%")
                .style("height", height + "px")

        var svg = evoRateDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        var yEvor = d3.scale.linear()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisEvor = d3.svg.axis()
            .scale(yEvor)
            .orient("left");

        svg.append("text")
            .attr("x", margin.left + boxWidth)
            .attr("y", 25)
            .style("text-anchor", "middle")
            .text("Evolutionary Rate");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", 335)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", 335)
            .style("text-anchor", "middle")
            .text("Cluster");
        
        // add the global chart
        var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[1].evorHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[1].evorPerc, orthologyValues[1].evorMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].evorHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[0].evorPerc, orthologyValues[0].evorMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxisEvor);
            
        // Duplicability
        var duplDiv = d3.select($infoContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "33.3%")
                .style("height", height + "px")

        svg = duplDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        domain = [1, 31];
        var yDupl = d3.scale.log()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisDupl = d3.svg.axis()
            .scale(yDupl)
            .orient("left")
            .ticks(3, ",.1s")
            .tickSize(6, 0);

        svg.append("text")
            .attr("x", margin.left + boxWidth)
            .attr("y", 25)
            .style("text-anchor", "middle")
            .text("Duplicability");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", 335)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", 335)
            .style("text-anchor", "middle")
            .text("Cluster");

        g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");
        //var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth + boxSpacing) + margin.left) + ",-" + margin.top + ")");

        addViolin(g, orthologyValues[1].duplHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, true);
        addBoxPlot(g, orthologyValues[1].duplPerc, orthologyValues[1].duplMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, true);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].duplHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, true);
        addBoxPlot(g, orthologyValues[0].duplPerc, orthologyValues[0].duplMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, true);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + (margin.left) + ",0)")
            .call(yAxisDupl);
//        
//        // Universality
        var univDiv = d3.select($infoContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "33.3%")
                .style("height", height + "px")

        svg = univDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        domain = [0, 1];
        var yUniv = d3.scale.linear()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisUniv = d3.svg.axis()
            .scale(yUniv)
            .orient("left");

        svg.append("text")
            .attr("x", margin.left + boxWidth)
            .attr("y", 25)
            .style("text-anchor", "middle")
            .text("Universality");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", 335)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", 335)
            .style("text-anchor", "middle")
            .text("Cluster");


        g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");
        //var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth + boxSpacing) + margin.left) + ",-" + margin.top + ")");

        addViolin(g, orthologyValues[1].univHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[1].univPerc, orthologyValues[1].univMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].univHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[0].univPerc, orthologyValues[0].univMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxisUniv);
    }
    
    function getConditionInfo(conditionId) {
        var data = {
            'q'     : 'id:' + conditionId,
            'wt'    : 'json',
            'indent': 'true'
        }
        
        return $.ajax({
            url: 'http://localhost:8983/solr/circos/query',
            method: "POST",
            dataType: 'jsonp',
            jsonp: 'json.wrf',
            data: data
        } );
    }
    
	// Give diagramsContainer a minimum height
	$diagramContainer.css( 'min-height', $diagramContainerContainer.height() );
};

function addViolin(svg, results, range, width, domain, resolution, interpolation, imposeMax, log) {


    var dx = (domain[1] / resolution) / 2;
    // for x axis
    var y = d3.scale.linear()
        .range([width / 2, 0])
        .domain([0, Math.max(d3.max(results, function (d) {
            return d.count * 1.5;
        }))]); //0 -  max probability


    if (log) {
        var x = d3.scale.log()
            .range(range)
            .domain(domain)
            .nice();
        console.log('Printing log in violin');
    } else {
        // for y axis
        var x = d3.scale.linear()
            .range(range)
            .domain(domain)
            .nice();
    }


    console.log("Now printing scaled violin area data");
    var area = d3.svg.area()
        .interpolate(interpolation)
        .x(function (d) {
            if (interpolation == "step-before") {
                //console.log(x(d.x + d.dx / 2));
                return x(d.val + dx)
            }
//            console.log('*' + d.val + ':' + x(d.val));
            return x(d.val);
        })
        .y0(width / 2)
        .y1(function (d) {
            return y(d.count);
        });

    var line = d3.svg.line()
        .interpolate(interpolation)
        .x(function (d) {
            if (interpolation == "step-before")
                return x(d.val + dx);
            return x(d.val);
        })
        .y(function (d) {
            return y(d.count);
        });

    var gPlus = svg.append("g");
    var gMinus = svg.append("g");

    gPlus.append("path")
        .datum(results)
        .attr("class", "area")
        .attr("d", area);

    gPlus.append("path")
        .datum(results)
        .attr("class", "violin")
        .attr("d", line);


    gMinus.append("path")
        .datum(results)
        .attr("class", "area")
        .attr("d", area);

    gMinus.append("path")
        .datum(results)
        .attr("class", "violin")
        .attr("d", line);

    var x = width;

    gPlus.attr("transform", "rotate(90,0,0)  translate(0,-" + width + ")");//translate(0,-200)");
    gMinus.attr("transform", "rotate(90,0,0) scale(1,-1)");


}

function addBoxPlot(svg, elmProbs, elmMean, range, width, domain, boxPlotWidth, log) {
    if (log) {
        var y = d3.scale.log()
            .range(range)
            .domain(domain)
            .nice();
        console.log('Printing log in boxplot');

    } else {

        var y = d3.scale.linear()
            .range(range)
            .domain(domain)
            .nice();
    }

    var x = d3.scale.linear()
        .range([0, width]);

    var left = 0.5 - boxPlotWidth / 2;
    var right = 0.5 + boxPlotWidth / 2;

    var probs = [0.05, 0.25, 0.5, 0.75, 0.95];
    for (var i = 0; i < probs.length; i++) {
        probs[i] = y(elmProbs[i]);
    }

    var gBoxPlot = svg.append("g")


    gBoxPlot.append("rect")
        .attr("class", "boxplot fill")
        .attr("x", x(left))
        .attr("width", x(right) - x(left))
        .attr("y", probs[3])
        .attr("height", -probs[3] + probs[1]);

    var iS = [0, 2, 4];
    var iSclass = ["", "median", ""];
    for (var i = 0; i < iS.length; i++) {
        gBoxPlot.append("line")
            .attr("class", "boxplot " + iSclass[i])
            .attr("x1", x(left))
            .attr("x2", x(right))
            .attr("y1", probs[iS[i]])
            .attr("y2", probs[iS[i]])
    }

    iS = [[0, 1], [3, 4]];
    for (i = 0; i < iS.length; i++) {
        gBoxPlot.append("line")
            .attr("class", "boxplot")
            .attr("x1", x(0.5))
            .attr("x2", x(0.5))
            .attr("y1", probs[iS[i][0]])
            .attr("y2", probs[iS[i][1]]);
    }

    gBoxPlot.append("rect")
        .attr("class", "boxplot")
        .attr("x", x(left))
        .attr("width", x(right) - x(left))
        .attr("y", probs[3])
        .attr("height", -probs[3] + probs[1]);

    gBoxPlot.append("circle")
        .attr("class", "boxplot mean")
        .attr("cx", x(0.5))
        .attr("cy", y(elmMean))
        .attr("r", x(boxPlotWidth / 5));

    gBoxPlot.append("circle")
        .attr("class", "boxplot mean")
        .attr("cx", x(0.5))
        .attr("cy", y(elmMean))
        .attr("r", x(boxPlotWidth / 10));


}
