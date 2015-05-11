/*
 * The matrix of information about the clusters
 *
 * @class
 */
Practice.Matrix = function( species ) {

	switch ( species ) {
		case 'anoph':
			this.species = 'Anopheles';
			break;
		case 'plasmo':
			this.species = 'Plasmodium';
	}

};

/*
 * Draw the circos diagram
 */
Practice.Matrix.prototype.drawCircos = function() {

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

	// For accessing this in the coloring functions
	var that = this;

	var colorGroup = function( x ) {

		if ( colorExpressionClusters ) {
			// Clusters with lower indices are black
			if ( x < that.numOrthologyClusters ) {
	    		return "#000000";
	    	} else {
	    		return fill( x - that.numOrthologyClusters );
	    	}
		} else {
			// Clusters with higher indices are black
			if ( x < that.numOrthologyClusters ) {
	    		return fill( x );
	    	} else {
	    		return "#000000";
	    	}
		}

	};

	var checkSignificance = function( d ) {
		// Do node chord analysis on d.target.index and d.source.index
		var o = Math.min( d.target.index, d.source.index );
		var e = Math.max( d.target.index, d.source.index ) - that.numOrthologyClusters;

		if ( that.pValuesOfChords[o][e]['direction'] === 'Over' ) {
			return 1;
		}
		return 0;
	};

	var colorChord = function( d ) {

		var x, significance;

		significance = checkSignificance( d );
		if ( significance === 1 ) {
			// Chords with over-representation
			return "#FFCC14";
		}
		if ( colorExpressionClusters ) {
			// Color the chords the same as the expression clusters
			x = Math.max( d.target.index, d.source.index ) - that.numOrthologyClusters;
		} else {
			// Color the chords the same as the orthology clusters
			x = Math.min( d.target.index, d.source.index );
		}
		return fill( x );

	};

	// The following is adapted from http://bl.ocks.org/mbostock/4062006
	var chord = d3.layout.chord()
	    .padding(.05)
	    .sortSubgroups(d3.descending)
	    .matrix(this.circosMatrix);

	var width = 200,
	    height = 200,
	    innerRadius = Math.min(width, height) * .41,
	    outerRadius = innerRadius * 1.1;

	var fill = d3.scale.ordinal()
	    .domain(d3.range(10))
	    //.range(["#CE6262", "#D89263", "#DFDA73", "#5ACC8f", "#7771C1"]);
	    //.range(["#D8DFE5"]);
	    .range(["#CBD4DA", "#BBD9EE"]);

	var svg = d3.select($svgInnerContainer[0]).append("svg")
	    .attr("viewBox", "0 0 " + width + " " + height)
	  .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	svg.append("g").selectAll("path")
	    .data(chord.groups)
	  .enter().append("path")
	    .style("fill", function(d) { return colorGroup(d.index); })
	    .style("stroke", function(d) { return colorGroup(d.index); })
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
	    .style("fill", function(d) { return colorChord(d); })
	    .style("stroke", function(d) { return colorChord(d); })
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
        var orthoLen = that.numOrthologyClusters,
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
                showInfoPanelOrtho(buckets, 'ortho');
            } else {
                var buckets = v1i.facets.conditions.buckets;
                showInfoPanelExpr(buckets, 'expr');
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
    function showInfoPanelExpr(buckets) {
        // TODO Test if we are in the enlarged display
        var conditionsExpressionValues = [],
            expressionValues = [],
            minExpressionValue = 10000;
        
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
        var valueline = d3.svg.line()
            .x(function(d) { return x(d.condition); })
            .y(function(d) { return y(d.value); });

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
        var data = conditionsExpressionValues;
        
        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.condition; }));
        y.domain([minExpressionValue, d3.max(data, function(d) { return d.value; })]);

        // Add the valueline path.
        infoPanelsvg.append("path")
            .attr("class", "line")
            .attr("d", valueline(data));

        // Add the dots 
        infoPanelsvg.selectAll("dot")
            .data(data)
        .enter().append("circle")
            .attr("r", 2.5)
            .attr("cx", function(d) { return x(d.condition); })
            .attr("cy", function(d) { return y(d.value); })
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
    function showInfoPanelOrtho(buckets) {
        // TODO Test if we are in the enlarged display
        var minSpeciesRatio = 10000,
            ogClusterStats = [];
        
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
        var data = ogClusterStats;
        
        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.evoRate; }));
        y.domain([minSpeciesRatio, d3.max(data, function(d) { return d.speciesRatio; })]);

        // Add the dots 
        infoPanelsvg.selectAll("dot")
            .data(data)
            .enter().append("circle")
            .attr("r", 1.5)
            .attr("cx", function(d) { return x(d.evoRate); })
            .attr("cy", function(d) { return y(d.speciesRatio); });
        
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
