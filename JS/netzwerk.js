// Code adapted from https://gist.github.com/colbenkharrl/dcb5590173931bb594e195020aaa959d

//	data stores
// store holds all nodes, graph only the ones visualised
var graph, store;

//	svg selection and sizing
var svg = d3.select("#network-svg"),
    width = +svg.style("width").replace("px", ""), // the + is casting a string to a number
    height = +svg.style("height").replace("px", ""),
    radius = 10;

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
	.on("tick", ticked);

//	filtered types
typeFilterList = [];

//	filter button event handlers
// The $ sign is a shorthand for the function socument.getElementById()
// it is used here first to access all filter buttons and then to acess the specific button with $(this)
$(".filter-btn").on("click", function() {
	var id = $(this).attr("value");
	if (typeFilterList.includes(id)) {
		// if id is in list remove it
        typeFilterList.splice(typeFilterList.indexOf(id), 1)
	} else {
		// if id not in list add it
        typeFilterList.push(id);
	}
	filter();
	update();
});

//	data read and store
d3.json("../Daten_Thurgau/netzwerk.json").then(function(g) {
	// if (err) throw err;
	
	var nodeByID = {};
    // nodeByID has then the form {id: node}
	g.nodes.forEach(function(n) {
		nodeByID[n.id] = n;
	});
    // adds info about source and target groups to links. why?
	g.links.forEach(function(l) {
		l.sourceGroup = nodeByID[l.source].Geschlecht.toString(); // why to string?
		l.targetGroup = nodeByID[l.target].Geschlecht.toString();
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
		.attr("r", radius)
		.attr("fill", function(d) {return color(d.Geschlecht);})
		// This adds drag listeners to the nodes
		.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
        )

    newNode.append("title")
      .text(function(d) { return  "Name: " + d.Name + "\n" + "Geschlecht: " + d.Geschlecht; });
	//	ENTER + UPDATE
	node = node.merge(newNode);

	//	UPDATE
	link = link.data(graph.links, function(d) { return d.id;});
	//	EXIT
	link.exit().remove();
	//	ENTER
	newLink = link.enter().append("line")
		.attr("class", "link")
		.attr("stroke-width",function(d) {return d.value.length});

	newLink.append("title")
      .text(function(d) { return "source: " + d.source + "\n" + "target: " + d.target; });
	//	ENTER + UPDATE
	link = link.merge(newLink);

	//	update simulation nodes, links, and alpha
	simulation
		.nodes(graph.nodes)
		// I think this could also be at simulation declaration why

  	simulation.force("link")
  		.links(graph.links);

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
	console.log(d);
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

//	filter function
function filter() {
	//	add and remove nodes from data based on type filters
	store.nodes.forEach(function(n) {
		if (!typeFilterList.includes(n.Geschlecht) && n.filtered) {
			n.filtered = false;
			graph.nodes.push($.extend(true, {}, n));
		} else if (typeFilterList.includes(n.Geschlecht) && !n.filtered) {
			n.filtered = true;
			graph.nodes.forEach(function(d, i) {
				if (n.id === d.id) {
					graph.nodes.splice(i, 1);
				}
			});
		}
	});

	//	add and remove links from data based on availability of nodes
	// can this be done smarter (without source/target Group?) why
	store.links.forEach(function(l) {
		if (!(typeFilterList.includes(l.sourceGroup) || typeFilterList.includes(l.targetGroup)) && l.filtered) {
			l.filtered = false;
			graph.links.push($.extend(true, {}, l));
		} else if ((typeFilterList.includes(l.sourceGroup) || typeFilterList.includes(l.targetGroup)) && !l.filtered) {
			l.filtered = true;
			graph.links.forEach(function(d, i) {
				if (l.id === d.id) {
					graph.links.splice(i, 1);
				}
			});
		}
	});			
}