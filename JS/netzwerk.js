// Code adapted from https://gist.github.com/colbenkharrl/dcb5590173931bb594e195020aaa959d

///////////// INITIAL SETUP ////////////////

//	svg selection and sizing
//  for some reason the bounding box does not properly work on the right and bottom
var svg = d3.select("#network-svg"),
    width = +svg.style("width").replace("px", "") - svg.style("border-width").replace("px", ""), // the + is casting a string to a number
    height = +svg.style("height").replace("px", "") - svg.style("border-width").replace("px", "");

// Add Legend
svg.append("g")
  .attr("class", "legendOrdinal")
  .attr("transform", "translate(20,20)");

///////////// DOM CREATION ////////////////

///////////// DOM CREATION: COLOR DIM SELECT ////////////////

//	colors for parties are picked to resemble oficcialy reported colors:
// https://statistik.tg.ch/themen-und-daten/staat-und-politik/wahlen-und-abstimmungen/grossratswahlen-2020-hauptseite.html/10545
// colors for service years were picked from a seaborn color palette (Purples_d)

var colors={
	'Partei':{'SP':'#cd3700','GP':'#a2c510','glp':'#b3ee3a','CVP':'#e39e00',
	'EVP':'#00b4e8','FDP':'#0064e6','EDU':'#27408b','SVP':'#3ca433','BDP':'#ffed00'},
	'Geschlecht':{'weiblich':d3.schemeTableau10[0],'männlich':d3.schemeTableau10[1]},
	'Dienstjahre':{'1':'#96c3df','2':'#81b5d8','3':'#6ca8d1', '4':'#569bca', '5':'#418ec4', '6':'#377fb4', '7':'#36709a', '8':'#35607f', '9':'#345166', '10':'#34424c'}
};

var colorDim = ['Partei','Geschlecht','Dienstjahre']

var colorWrapper = d3.select("#colorSelect")
			.append("select")
			.attr("class","form-select")
			.on("change", function() {
				var val = this.options[this.selectedIndex].value;
				selectColorDim = val;
				update();
			});

var colorOption = colorWrapper
		.selectAll(".color-option")
		.data(colorDim)
		.enter()
		.append("option")
		.attr("id",function(d) {return 'colSel'+d})
		.attr("value",function(d) {return d})
		.text(d => d==='Dienstjahre' ? 'Dienstjahre seit 2012' : d);

// Select Partei as default
var selectColorDim = 'Partei';
d3.select('#colSelPartei').property('selected',true);

///////////// DOM CREATION: #LINK SELECT ////////////////

var linkMin = ['1','2','3','4','5']

var linkWrapper = d3.select("#linkSelect")
			.append("select")
			.attr("class","form-select")
			.attr("id",'linkSel')
			.on("change", function() {
				var val = this.options[this.selectedIndex].value;
				selectLinkMin = parseInt(val,10);
				update();
			});

var linkOption = linkWrapper
		.selectAll(".link-option")
		.data(linkMin)
		.enter()
		.append("option")
		.attr("id",function(d) {return 'linkSel'+d})
		.attr("value",function(d) {return d})
		.text(function(d) {return d})

// Select linkstrength of 3 as default
var selectLinkMin = 3
d3.select('#linkSel3').property('selected',true)

///////////// DOM CREATION: TYPE CHECKBOX FILTER ////////////////

// checkboxes for type of vorstoss
var vor_types = [{id:"filtParlIni",name:"Parlamentarische Initiative",code:"1"},
				 {id:"filtMotion",name:"Motion",code:"2"},				 
				 {id:"filtLeisMotion",name:"Leistungsmotion",code:"3"},
				 {id:"filtInterp",name:"Interpellation",code:"4"},
				 {id:"filtEinfAnfr",name:"Einfache Anfrage",code:"5"},
				 {id:"filtAntrag52",name:"Antrag nach § 52 GO",code:"6"}];

var typeWrapper = d3.select("#typeCheckbox");

var typeButton = typeWrapper
        .selectAll(".form-check")
        .data(vor_types)
        .enter()
        .append("div")
        .attr("class", "form-check form-switch");
typeButton.append("input")
	.attr("type", "checkbox")
	.attr("id", function(d) { return d.id; })
	.attr("value", function(d) { return d.code; })
	.attr("class", "form-check-input")
	.property('checked',true)
	.on("click", function() {
		var val = $(this).attr("value");
		if (this.checked && typeFilterList.includes(val)) {
			// if val is in list remove it
			typeFilterList.splice(typeFilterList.indexOf(val), 1)
		} else if (!this.checked && !typeFilterList.includes(val)) {
			// if val not in list add it
			typeFilterList.push(val);
		}
		filterType();
		update();
	});
typeButton.append("label")
    .attr('for', function(d) { return d.name; })
    .text(function(d) { return d.name; })
    .attr("class", "form-check-label");

///////////// DOM CREATION:  SUBJECT SELECT FILTER ////////////////

// checkboxes for type of vorstoss
var vor_subjects;

d3.json("../Daten_Thurgau/subjects.json").then(function(s) {
	// vor_subjects.push(s)
	vor_subj = $.extend(true, s, {});
	
	var subjWrapper = d3.select("#subjectSelect")
			.append("select")
			.attr("class","form-select")
			.attr("id",'subjSel')
			.on("change", function() {
				var val = this.options[this.selectedIndex].value;
				filteredSubj = val;
				filterSubj();
				update();
			});

	subjWrapper.append("option")
			.property("selected",true)
			.attr("id","subjSelall")
		    .attr("value","all")
			.text("Alle Themen")

	var subjOption = subjWrapper
			.selectAll(".subj-option")
			.data(vor_subj)
			.enter()
			.append("option")
			.attr("id",function(d) {return "subjSel"+d.value.replace(/\s/g, '')})
			.attr("value",function(d) {return d.value})
			.text(function(d) {return d.name})
	});


///////////// DOM CREATION:  STORY FILTER ////////////////

function storyFilter(linkStrength=3,subj='all',color='Partei',typeFilter=[]) {
	typeFilterList = typeFilter;
	vor_types.forEach(d => typeFilter.includes(d.code) ? d3.select('#'+d.id).property('checked',false) : d3.select('#'+d.id).property('checked',true));
	
	selectLinkMin = linkStrength;
	d3.select('#linkSel'+selectLinkMin).property('selected',true);
	
	filteredSubj = subj;
	d3.select('#subjSel'+filteredSubj.replace(/\s/g, '')).property('selected',true);
	
	selectColorDim = color;
	d3.select('#colSel'+selectColorDim).property('selected',true);
	filterType();
	filterSubj();
	update();
};

/// Story Parties
d3.select("#storyPartyAll1").on("click", d => storyFilter(linkStrength=1));
d3.selectAll("#storyPartyAll3").on("click", d => storyFilter(linkStrength=3));
d3.select("#storyPartyAll4").on("click", d => storyFilter(linkStrength=4));
d3.select("#storyPartyLand1").on("click", d => storyFilter(linkStrength=1,subj='Landwirtschaft'));
d3.select("#storyPartyBesch1").on("click", d => storyFilter(linkStrength=1,subj='Beschäftigung und Arbeit'));

d3.select("#storyGenderAll3").on("click", d => storyFilter(linkStrength=3,sub='all',color='Geschlecht'));
d3.select("#storyGenderVerkehr1").on("click", d => storyFilter(linkStrength=1,sub='Verkehr',color='Geschlecht'));
d3.select("#storyGenderSoz1").on("click", d => storyFilter(linkStrength=1,sub='Soziale Fragen',color='Geschlecht'));

d3.select("#storyMostAll3").on("click", d => storyFilter(linkStrength=3,sub='all',color='Dienstjahre'));
d3.select("#storyMostAllAuftr3").on("click", d => storyFilter(linkStrength=2,sub='all',color='Partei',typeFilter=['4','5','6']));
d3.select("#storyMostAllAnfr3").on("click", d => storyFilter(linkStrength=2,sub='all',color='Partei',typeFilter=["1","2","3"]));
///////////// FILTER FUNCTIONS ////////////////

//	filtered types
var typeFilterList = [];

//	filter function for type
function filterType() {
	// reduce/expand Vorstösse in graph links
	for (let l of store.links) {
		for (let v of l.value) {
			// if type not filtered anymore, add to value list
			if (!typeFilterList.includes(v.Type.toString()) && v.filtered) {
				v.filtered = false;
				if (!v.unselected) {
					graph.links.find(x => x.id === l.id).value.push($.extend(true, {}, v));
				};
			// if type is newyl filtered add to value list
			} else if (typeFilterList.includes(v.Type.toString()) && !v.filtered) {
				v.filtered = true;
				if (!v.unselected) {
					let idx = graph.links.find(x => x.id === l.id).value.findIndex(x => x.id === v.id);
					graph.links.find(x => x.id === l.id).value.splice(idx,1);
				};
			};
		};
	};

	// reduce/expand Vorstösse in graph nodes
	for (let n of store.nodes) {
		for (let v of n.Vorstösse) {
			// if type not filtered anymore, add to value list
			if (!typeFilterList.includes(v.Type.toString()) && v.filtered) {
				v.filtered = false;
				if (!v.unselected) {
					graph.nodes.find(x => x.id === n.id).Vorstösse.push($.extend(true, {}, v));
				};
			// if type is newyl filtered add to value list
			} else if (typeFilterList.includes(v.Type.toString()) && !v.filtered) {
				v.filtered = true;
				if (!v.unselected) {
					let idx = graph.nodes.find(x => x.id === n.id).Vorstösse.findIndex(x => x.id === v.id);
					graph.nodes.find(x => x.id === n.id).Vorstösse.splice(idx,1);
				};
			};
		};
	};
}

var filteredSubj = 'all'; //

//	filter function for subject
function filterSubj() {
	// reduce/expand Vorstösse in graph links
	for (let l of store.links) {
		for (let v of l.value) {
			// If all select all that were not selected and are not filtered (by Type)
			if (filteredSubj==='all') {
				if (v.unselected) {
					v.unselected = false;
					if (!v.filtered) {
						graph.links.find(x => x.id === l.id).value.push($.extend(true, {}, v));
					};
				};
			// If select != all change selection on links that are not already filtered
			} else if (!v.Thema.includes(filteredSubj) && !v.unselected) {
				v.unselected = true;
				if (!v.filtered) {
					let idx = graph.links.find(x => x.id === l.id).value.findIndex(x => x.id === v.id);
					graph.links.find(x => x.id === l.id).value.splice(idx,1);
				};
			} else if (v.Thema.includes(filteredSubj) && v.unselected) {
				v.unselected = false;
				if (!v.filtered) {
					graph.links.find(x => x.id === l.id).value.push($.extend(true, {}, v));
				};
			};
		};
	};

	// reduce/expand Vorstösse in graph nodes
	for (let n of store.nodes) {
		for (let v of n.Vorstösse) {
			// If all select all that were not selected and are not filtered (by Type)
		    if (filteredSubj==='all') {
				if (v.unselected) {
					v.unselected = false;
					if (!v.filtered) {
						graph.nodes.find(x => x.id === n.id).Vorstösse.push($.extend(true, {}, v));
					};
				};
			// If select != all narrow selection
			} else if (!v.Thema.includes(filteredSubj) && !v.unselected) {
				v.unselected = true;
				if (!v.filtered) {
					let idx = graph.nodes.find(x => x.id === n.id).Vorstösse.findIndex(x => x.id === v.id);
					graph.nodes.find(x => x.id === n.id).Vorstösse.splice(idx,1);
				};
			} else if (v.Thema.includes(filteredSubj) && v.unselected) {
				v.unselected = false;
				if (!v.filtered) {
					graph.nodes.find(x => x.id === n.id).Vorstösse.push($.extend(true, {}, v));
				};
			};
		};
	};
}

///////////// SIMULATION SETUP ////////////////

//	force simulation initialization
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink()
		.id(function(d) { return d.id; })) // why id?
	.force("charge", d3.forceManyBody()
		// .strength(-65))
		.strength(d => charge_strength(d)))
	// .force("center", d3.forceCenter(width / 2, height / 2))
	// applying forceX and forceY instead of center leads to a more even distribution
	.force("x", d3.forceX(width / 2)
		.strength(d => center_strength_x(d)))
    .force("y", d3.forceY(height / 2)
		.strength(d => center_strength_y(d)))
	.force("circular", d3.forceRadial(250,width / 2, height / 2)
	 	.strength(d => circular_strength(d)))
	.force("collide", d3.forceCollide()
		.radius(radius)
		.strength(0.5))
	.on("tick", ticked)
	.velocityDecay(0.1);
	// .alphaDecay(0.02);

//	tick event handler with bounded box
//  I think tick event happens every timestep
function ticked() {
	// keeps nodes within svg boundaries
	node
		.attr("cx", function(d) { return d.x = Math.max(radius(d), Math.min(width - radius(d), d.x)); })
		.attr("cy", function(d) { return d.y = Math.max(radius(d), Math.min(height - radius(d), d.y)); });
	// positions link line between source and target how?
	link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}


///////////// DATA READIN ////////////////

//	data stores
// store holds all nodes, graph only the ones visualised
var graph, store;

// node and link hold the DOMs
var link = svg.append("g").selectAll(".link"),
	node = svg.append("g").selectAll(".node");

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

	// turn some off by default
	// d3.select('#filtInterp').property('checked',false);
	// typeFilterList.push("4");
	// d3.select('#filtEinfAnfr').property('checked',false);
	// typeFilterList.push("5");
	// filterSubj();
	// filterType();
	update();
});

///////////// UPDATE FUNKTION ////////////////

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
		// This adds drag listeners to the nodes
		.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
        );

    newNode.append("title");

	//	ENTER + UPDATE
	// Update colorscale
	colorScale = d3.scaleOrdinal()
					.domain(Object.keys(colors[selectColorDim]))
					.range(Object.values(colors[selectColorDim]));
	
					// Update legend
	var legendOrdinal = d3.legendColor()
	.shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
		.shapePadding(10)
		.scale(colorScale);

	svg.select(".legendOrdinal")
		.call(legendOrdinal);
	
	// Update radius and color
	node = node.merge(newNode)
			.attr("r", radius)
			.attr("fill", function(d) {
				return colors[selectColorDim][d[selectColorDim]];});
	// Update title based on filtered number of lead vorstösse
	node.select('title').text(function(d) { 
		let vor = '';
		d.Vorstösse.forEach(v => vor = vor + '* ' + v.Name + '\n');
		return  "Name: " + d.Name + "\n" +
				"Geschlecht: " + d.Geschlecht + "\n" +
				"Partei: " + d.Partei + "\n" +
				"Dienstjahre seit 2012: " + + d.Dienstjahre + "\n" +
				"Vorstösse ("+ d.Vorstösse.length +"):\n" +
				vor;});

	//	UPDATE
	link = link.data(graph.links, function(d) { return d.id;});
	//	EXIT
	link.exit().remove();
	//	ENTER
	newLink = link.enter().append("line")
		.attr("class", "link");

	newLink.append("title");
	//	ENTER + UPDATE
	link = link.merge(newLink)
	  .attr("stroke-width",function(d) {
			if (d.value.length>=selectLinkMin) {  
				return d.value.length;
			} else {
				return 0;	
			}
		});

	//	update simulation nodes, links, and alpha
	simulation
		.nodes(graph.nodes)
		// I think this could also be at simulation declaration why

  	simulation.force("link")
  		.links(graph.links)
		// Use the standard function but turn off if value is empty
		.strength(function(d) {
			if (d.value.length >= selectLinkMin) {
				return 1/Math.min(count(d.source),count(d.target));
			} else {
				return 0;
			}
		})
		// .distance(function(d) {return Math.max(d.value.length*8,50);});

  	// alpha is basically the "strength" or "temperature" of the simulation.
	// It decays over time. If it reaches 0 the simulation stops.
	// Default values are alpha=1 alphaTarget=0
	simulation.alpha(1).alphaTarget(0).restart();

	// continue UPDATE (only when simulation is running the links have access to the source/target node)
	link.select('title').text(function(d) { 
		let commonVor = '';
		d.value.forEach(v => commonVor = commonVor + v.Name + '\n');
		return d.source.Name + ' ('+ d.source.Partei + ')' + " - " + d.target.Name + ' ('+ d.target.Partei + ')' + "\n" +
		"Gemeinsame Vorstösse ("+ d.value.length +"):\n" +
		commonVor;
	});
}

///////////// DRAGGING ////////////////

//	drag event handlers
// why. might be rewritten by passing event
function dragstarted(event,d) {
	// event.active indicates how many other drag events are active (e.g. on multitouch)
	// if this is the only one event.active = 0
	// This part prevents the simulation from restarting if it is not the first drag event.
	if (!event.active) simulation.alphaTarget(0.1).restart();
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

///////////// HELPER FUNCTIONS ////////////////

function radius(abg) {
	if (abg.Vorstösse.length === 0) {
		return 2.5;
	} else {
		return abg.Vorstösse.length/1.5+2.5;
	};
}

function count(d) {
	return link.filter(function(l) {
		return l.source.index == d.index || l.target.index == d.index
	  }).size();
}

function center_strength_y(d) {
	if (d.Vorstösse.length===0) {
		return 0.05;
	} else {
		return 0.13;
	}
}

function center_strength_x(d) {
	if (d.Vorstösse.length===0) {
		return 0.025;
	} else {
		return 0.1;
	}
}

function circular_strength(d) {
	if (d.Vorstösse.length===0) {
		return 0.15;
	} else {
		return 0;
	}
}

function charge_strength(d) {
	if (d.Vorstösse.length===0) {
		return Math.min(-1 * radius(d)**1.8,-40)*1.6;
	} else {
		return Math.min(-1 * radius(d)**1.8,-40);
	}
}