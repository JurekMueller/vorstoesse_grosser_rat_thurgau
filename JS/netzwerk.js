// Code adapted from https://gist.github.com/colbenkharrl/dcb5590173931bb594e195020aaa959d

//	data stores
// store holds all nodes, graph only the ones visualised
var graph, store;

//	svg selection and sizing
var svg = d3.select("#network-svg"),
    width = +svg.style("width").replace("px", ""), // the + is casting a string to a number
    height = +svg.style("height").replace("px", ""),
    radius = 10;

// checkboxes for type of vorstoss
var vor_types = [{name:"Parl. Initiative",code:"1"},
				 {name:"Motion",code:"2"},				 
				 {name:"Leistungsmotion",code:"3"},
				 {name:"Interpellation",code:"4"},
				 {name:"Einfache Anfrage",code:"5"},
				 {name:"Antrag nach § 52 GO",code:"7"}];

var typeWrapper = d3.select("#typeCheckbox");

var typeButton = typeWrapper
        .selectAll(".form-check")
        .data(vor_types)
        .enter()
        .append("div")
        .attr("class", "form-check form-check-inline form-switch");
typeButton.append("input")
	.attr("type", "checkbox")
	.attr("id", function(d) { return d.name; })
	.attr("value", function(d) { return d.code; })
	.attr("class", "form-check-input")
	.property('checked','true')
	.on("click", function() {
		var id = $(this).attr("value");
		if (this.checked && typeFilterList.includes(id)) {
			// if id is in list remove it
			typeFilterList.splice(typeFilterList.indexOf(id), 1)
		} else if (!this.checked && !typeFilterList.includes(id)) {
			// if id not in list add it
			typeFilterList.push(id);
		}
		filter_type();
		update();
	});
typeButton.append("label")
    .attr('for', function(d) { return d.name; })
    .text(function(d) { return d.name; })
    .attr("class", "form-check-label");

//	d3 color scales
var color = d3.scaleOrdinal(d3.schemeCategory10);

// node and link hold the DOMs
var link = svg.append("g").selectAll(".link"),
	node = svg.append("g").selectAll(".node");

//	force simulation initialization
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink()
		.id(function(d) { return d.id; })) // why id?
	.force("charge", d3.forceManyBody()
		.strength(-65))
	// .force("center", d3.forceCenter(width / 2, height / 2))
	// applying forceX and forceY instead of center leads to a more even distribution
	.force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
	.on("tick", ticked)
	.velocityDecay(0.1);
	// .alphaDecay(0.02);

//	filtered types
typeFilterList = [];

//	data read and store
d3.json("../Daten_Thurgau/netzwerk.json").then(function(g) {
	// if (err) throw err;
	
	var nodeByID = {};
    // nodeByID has then the form {id: node}
	g.nodes.forEach(function(n) {
		nodeByID[n.id] = n;
	});
    // adds ID for links
	g.links.forEach(function(l,idx) {
		l.id = idx;
	});

	graph = g;
	//the $ sign is used to acess jQuery functions
	// the extend function merges two objects. As the target is empty and deep is true,
	// this is basically just a deep copy of the array.
	store = $.extend(true, {}, g);

	update();
});


//	general update pattern for updating the graph
function update() {
	//	UPDATE
	// The key function gives binds data to a specific DOM (e.g. not just the first one), I think...
	node = node.data(graph.nodes, function(d) { return d.id;});
	//	EXIT
	node.exit().remove();
	//	ENTER
	var newNode = node.enter().append("circle")
		.attr("class", "node")
		.attr("fill", function(d) {return color(d.Geschlecht);})
		// This adds drag listeners to the nodes
		.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
        );

    newNode.append("title");

	//	ENTER + UPDATE
	// Update radius
	node = node.merge(newNode)
			.attr("r", function(d) {
				if (d.geführt.length === 0) {
					return 2.5
				} else {
					return Math.max(d.geführt.length/1.5,3)
				}	
			});
	// Update title based on filtered number of lead vorstösse
	node.select('title').text(function(d) { return  "Name: " + d.Name + "\n" +
	  							  "Geschlecht: " + d.Geschlecht + "\n" +
								  "Geführte Vorst.: " + d.geführt.length; });

	//	UPDATE
	link = link.data(graph.links, function(d) { return d.id;});
	//	EXIT
	link.exit().remove();
	//	ENTER
	newLink = link.enter().append("line")
		.attr("class", "link");

	newLink.append("title")
      .text(function(d) { return "source: " + d.source + "\n" + "target: " + d.target; });
	//	ENTER + UPDATE
	link = link.merge(newLink)
	  .attr("stroke-width",function(d) {return d.value.length});

	//	update simulation nodes, links, and alpha
	simulation
		.nodes(graph.nodes)
		// I think this could also be at simulation declaration why

  	simulation.force("link")
  		.links(graph.links)
		.strength(function(d) {return Math.min(d.value.length/10,1);})
		.distance(function(d) {return Math.max(d.value.length*8,50);});
		// .distance(35);

  	// alpha is basically the "strength" or "temperature" of the simulation.
	// It decays over time. If it reaches 0 the simulation stops.
	// Default values are alpha=1 alphaTarget=0
	simulation.alpha(1).alphaTarget(0).restart();
}

//	drag event handlers
// why. might be rewritten by passing event
function dragstarted(event,d) {
	// event.active indicates how many other drag events are active (e.g. on multitouch)
	// if this is the only one event.active = 0
	// This part prevents the simulation from restarting if it is not the first drag event.
	if (!event.active) simulation.alphaTarget(0.3).restart();
	// fx and fy are fixed positions (not subject to forces)
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(event,d) {
	d.fx = event.x;
	d.fy = event.y;
}

function dragended(event,d) {
	// This part prevents the simulation from stopping if it is not the last drag event.
	if (!event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

//	tick event handler with bounded box
//  I think tick event happens every timestep
function ticked() {
	// keeps nodes within svg boundaries
	node
		.attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
		.attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
	// positions link line between source and target why
	link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}

//	filter function type
function filter_type() {
	// reduce/expand vorstösse in graph links && remove links with no vorstösse
	for (let l of store.links) {
		for (let v of l.value) {
			// if type not filtered anymore, add to value list
			if (!typeFilterList.includes(v.Type.toString()) && v.filtered) {
				v.filtered = false;
				graph.links.find(x => x.id === l.id).value.push($.extend(true, {}, v));
			// if type is newyl filtered add to value list
			} else if (typeFilterList.includes(v.Type.toString()) && !v.filtered) {
				v.filtered = true;
				let idx = graph.links.find(x => x.id === l.id).value.indexOf(v);
				// console.log(1,graph.links.find(x => x.id === l.id).value);
				graph.links.find(x => x.id === l.id).value.splice(idx,1);
				// console.log(2,graph.links.find(x => x.id === l.id).value);
			};
		};
	};

	// reduce/expand geführte vorstösse in graph nodes
	for (let n of store.nodes) {
		for (let v of n.geführt) {
			// if type not filtered anymore, add to value list
			if (!typeFilterList.includes(v.Type.toString()) && v.filtered) {
				v.filtered = false;
				graph.nodes.find(x => x.id === n.id).geführt.push($.extend(true, {}, v));
			// if type is newyl filtered add to value list
			} else if (typeFilterList.includes(v.Type.toString()) && !v.filtered) {
				v.filtered = true;
				let idx = graph.nodes.find(x => x.id === n.id).geführt.indexOf(v);
				// console.log(1,graph.links.find(x => x.id === l.id).value);
				graph.nodes.find(x => x.id === n.id).geführt.splice(idx,1);
				// console.log(2,graph.links.find(x => x.id === l.id).value);
			};
		};
	};
}