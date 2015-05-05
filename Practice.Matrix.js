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
    $infoContainer.append( $infoTitle );
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
            ids;
        
        if ( species === 'Anopheles') {
            species = 'Anopheles gambiae';
        } else {
            species = 'Plasmodium falciparum';
        }

        console.log(clusterIndex + species);
        if ( clusterIndex + 1 <= orthoLen ) {
            console.log("we are in ortho");
            ids = that.orthologyClusters[clusterIndex].member_ids;
        } else {
            console.log("we are in expr");
            ids = that.expressionClusters[clusterIndex - orthoLen].member_ids;
        }
            
        var idsString = '(' + ids[0];
        for ( var i = 1, ilen = ids.length; i < ilen; i++ ) {
            idsString += ' OR ' + ids[i];
        }
        idsString += ')';

        var promise;
        if ( clusterIndex + 1 <= orthoLen ) {
            promise = getFacetData( '',
                                    '',
                                    species,
                                    idsString );
        } else {
            // Construct the request
            promise = getFacetData( 'id',
                                    'condition_id',
                                    'type:condition AND species_s:"' + species + '"',
                                    idsString );
        }

        $.when( promise ).done( function( v1i ) {
            if ( clusterIndex + 1 <= orthoLen ) {
                var buckets = v1i.response.docs;
                showInfoPanel(buckets, 'ortho');
            } else {
                var buckets = v1i.facets.conditions.buckets;
                showInfoPanel(buckets, 'expr');
            }
        });
    }
    
    function getFacetData(from, to, initialParameter, filter) {
        var data;
        if ( from ) {
            var query = '{!join from=' + from + ' to=' + to + '} ' + initialParameter;
            data = {
                'q'		: query,
                'fq'    : 'gene_id:' + filter,
                'wt'	: 'json',
                'indent': 'true',
                'rows' 	: '0',
                'json.facet'    : "{" +
                    "conditions    : {" +
                        "terms : {" +
                            "field : 'condition_id'," +
                            "numBuckets    : true," +
                            "limit : 0," +
                            "sort  : { index: 'asc' }," +
                            "facet : {" +
                                "sum   : 'sum(expression_value_d)'," +
                                "sumsq : 'sumsq(expression_value_d)'," +
                                "avg   : 'avg(expression_value_d)'," +
                                "max   : 'max(expression_value_d)'," +
                                "min   : 'min(expression_value_d)'," +
                                "percentiles    : 'percentile(expression_value_d, 25, 50, 75, 99, 99.9)'" +
                            "}" +
                        "}" +
                    "}" +
                "}"
            };
        } else {
            var speciesFilter;
            if ( initialParameter.indexOf('gambiae') > -1 ) {
                speciesFilter = 'id:MZ*';
            } else {
                speciesFilter = 'id:PZ*';
            }
            
            data = {
                'q'     : 'type:og AND ' + speciesFilter,
                'fq'    : 'id:' + filter,
                'wt'    : 'json',
                'indent': 'true',
                'rows'  : '10000'
            }
        }

        return $.ajax({
            url: 'http://localhost:8983/solr/circos/query',
            method: "POST",
            dataType: 'jsonp',
            jsonp: 'json.wrf',
            data: data
        } );
    }

    // Display information about the cluster that you are hovering over.
    function showInfoPanel(buckets, dataset) {
        // TODO Test if we are in the enlarged display
        var conditionsExpressionValues = [],
            expressionValues = [],
            minExpressionValue = 10000,
            minSpeciesRatio = 10000,
//            evoRates = [],
//            speciesRatios = [],
            ogClusterStats = [];
        
        if ( dataset === 'expr' ) {
            for ( var i = 0, ilen = buckets.length; i < ilen; i++ ) {
                conditionsExpressionValues.push({
                    'condition': i + 1,
                    'value': buckets[i].avg,
                    'conditionId': buckets[i].val
                });
                
                if ( buckets[i].avg < minExpressionValue ) {
                    minExpressionValue = buckets[i].avg;
                }
            }
        } else {
            for ( var i = 0, ilen = buckets.length; i < ilen; i++ ) {
                ogClusterStats.push({
                    'evoRate': buckets[i].evo_rate_f,
                    'speciesRatio': buckets[i].frac_species_f,
                    'ogid': buckets[i].id
                });
                
                if ( buckets[i].frac_species_f < minSpeciesRatio ) {
                    minSpeciesRatio = buckets[i].frac_species_f;
                }
            }
        }
        console.log(ogClusterStats);

        /* From http://bl.ocks.org/d3noob/b3ff6ae1c120eea654b5* */
        
        // Set the dimensions of the canvas / graph
        var margin = {top: 30, right: 20, bottom: 30, left: 50},
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

        // Define the line
        var valueline;
        if ( dataset === 'expr' ) {
            valueline = d3.svg.line()
                .x(function(d) { return x(d.condition); })
                .y(function(d) { return y(d.value); });
        }
//        else {
//            valueline = d3.svg.line()
//                .x(function(d) { return x(d.evoRate); })
//                .y(function(d) { return y(d.speciesRatio); });
//        }

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
        var data;
        if ( dataset === 'expr' ) {
            data = conditionsExpressionValues;
        } else {
            data = ogClusterStats;
        }
        
        // Scale the range of the data
        if ( dataset === 'expr' ) {
            x.domain(d3.extent(data, function(d) { return d.condition; }));
            y.domain([minExpressionValue, d3.max(data, function(d) { return d.value; })]);
        } else {
            x.domain(d3.extent(data, function(d) { return d.evoRate; }));
            y.domain([minSpeciesRatio, d3.max(data, function(d) { return d.speciesRatio; })]);
        }

        // Add the valueline path.
        if ( dataset === 'expr' ) {
            infoPanelsvg.append("path")
                .attr("class", "line")
                .attr("d", valueline(data));
        }

        // Add the dots 
        if ( dataset === 'expr' ) {
            infoPanelsvg.selectAll("dot")
                .data(data)
            .enter().append("circle")
                .attr("r", 2.5)
                .attr("cx", function(d) { return x(d.condition); })
                .attr("cy", function(d) { return y(d.value); })
                .on("mouseover", function(d) {
                    var conditionId = d.conditionId,
                        promise = getConditionInfo(conditionId),
//                        promise = PostToSolr(conditionId, [], 1, false),
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
        } else {
            infoPanelsvg.selectAll("dot")
                .data(data)
            .enter().append("circle")
                .attr("r", 1.5)
                .attr("cx", function(d) { return x(d.evoRate); })
                .attr("cy", function(d) { return y(d.speciesRatio); });
        }
        
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
