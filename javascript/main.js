var mapSVG = null;
var radarSVG = null;
const width = 960
const height = 600
var selectedIndicator = ""; // Variable to store the selected indicator
var Year = true;
// let finaldata=null;
var accordionId = "accordion1";
let naturaldata=null;
let builtdata = null;
let map = null
let result= null
var legend = null;
let radardata = null;
let colors = ["red","yellow","black","green","purple","blue","orange","grey"];
let cityMatch = [
	"Chandler",
	"Gilbert",
	"Glendale",
	"Scottsdale",
	"Peoria",
	"Tempe",
	"Surprise"
]



function createMapSVG() {
  // create map SVG if it doesn't exist
  if (!mapSVG) {
    mapSVG = d3.select("#svg-container")
      .append("svg")
      .attr("width", 960)
      .attr("height", 600);
    drawMapChart();
  }
}

function drawMapChart(){
	// create a container for the Leaflet map
  var mapContainer = mapSVG.append("g")
    .attr("id", "map-container");

  // create a new SVG element to serve as the map container for Leaflet
  var leafletMap = mapContainer.append("foreignObject")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "map")
    .style("width", "100%")
    .style("height", "100%");

  // initialize Leaflet map with the "map" element as the scontainer
  map = L.map('map').setView([33.4484, -112.0740], 10); // Default Phoenix
  
	//very good
	// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // maxZoom: 19,
    // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// }).addTo(map);

	// good
	L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	  maxZoom: 13,
	  attribution: '&copy; <a href="https://carto.com/">Carto</a>'
	}).addTo(map);
	
}



function createRadarSVG() {
  // create radar SVG if it doesn't exist
  if (!radarSVG) {
    radarSVG = d3.select("#svg-container")
      .append("svg")
      .attr("width", 960)
      .attr("height", 600);
      drawRadarChart();
  }else{
  	radarSVG.selectAll("*").remove();
		drawRadarChart();  	
  }
}

function drawRadarChart(){
	const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("stroke-width",5)
  .style("opacity", 0);


	let data = [];
	let features = ["Natural", "Built", "Organizational", "Political", "Financial", "Cultural", "Human", "Relational"];

	const keyToDelete = "city";

	const newData = radardata.map(obj => {
	  const newObj = { ...obj };
	  delete newObj[keyToDelete];
	  return newObj;
	});

	var regions = $('#regions').val();
	if(regions==null){
		alert("Select a Region to show Radar");
	} else{
			var regions = $('#regions').val();
			const resultCity = radardata.filter(obj => regions.includes(obj.city));

			data = resultCity.map(({ ["city"]: removedKey, ...rest }) => rest);

			let radialScale = d3.scaleLinear()
		    					.domain([0, 10])
							    .range([0,250 ]);
			let ticks = [2, 4, 6, 8, 10];

			radarSVG.selectAll("circle")
			    .data(ticks)
		    	.join(
		        enter => enter.append("circle")
		            .attr("cx", width / 2)
		            .attr("cy", height / 2)
		            .attr("fill", "none")
		            .attr("stroke", "black")
		            .attr("stroke-width",2.5)
		            .attr("r", d => radialScale(d))
		    	);


			radarSVG.selectAll(".ticklabel")
			    .data(ticks)
			    .join(
			        enter => enter.append("text")
			            .attr("class", "ticklabel")
			            .attr("x", width / 2 + 5)
			            .attr("y", d => height / 2 - radialScale(d))
			            .text(d => (d/10).toString()) // Shown on a scale from 0 to 1
			    );

			let featureData=[]
			featureData = features.map((f, i) => {
				    let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
				    return {
				        "name": f,
				        "angle": angle,
				        "line_coord": angleToCoordinate(angle, 10),
				        "label_coord": angleToCoordinate(angle, 10.5)
				    };
			});

			// draw axis line
			radarSVG.selectAll("line")
			    .data(featureData)
			    .join(
			        enter => enter.append("line")
			            .attr("x1", width / 2)
			            .attr("y1", height / 2)
			            .attr("x2", d => d.line_coord.x)
			            .attr("y2", d => d.line_coord.y)
			            .attr("stroke","black")
			            .attr("stroke-width",2.5)
			    );

			// draw axis label
			radarSVG.selectAll(".axislabel")
		    		.data(featureData)
		    		.join(
		        		enter => enter.append("text")
			            .attr("x", d => {
			                if (d.angle > 2.3 && d.angle<4 && d.angle!=Math.PI) {
			                    return d.label_coord.x - 50;
			                } else if (d.angle == Math.PI){
			                	return d.label_coord.x - 90
			                }
			                 else if(d.angle == Math.PI/2 || d.angle == 1.5*Math.PI){
			                	return d.label_coord.x
			                } else {
			                    return d.label_coord.x + 10;
			                }
			            })
		            .attr("y", d => d.label_coord.y)
		            .text(d => d.name)
		    );

			let line = d3.line()
			    .x(d => d.x)
			    .y(d => d.y);

			function getPathCoordinates(data_point){
			    let coordinates = [];
			    for (var i = 0; i < features.length; i++){
			        let ft_name = features[i];
			        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
			        coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
			    }
			    return coordinates;
			}


			radarSVG.selectAll("path")
			    .data(data)
			    .join(
			        enter => enter.append("path")
			            .datum(d => getPathCoordinates(d))
			            .attr("d", line)
			            .attr("stroke-width", 2)
			            .attr("stroke", (index, i) => {
			                index = newData.findIndex(obj => JSON.stringify(obj) === JSON.stringify(data[i]));
			                return colors[index];
			            })
			            .attr("fill", (index, i) => {
			                index = newData.findIndex(obj => JSON.stringify(obj) === JSON.stringify(data[i]));
			                return colors[index];
			            })
			            .attr("stroke-opacity", 1)
			            .attr("opacity", 0.4)
									.on("mouseover", function(d, i) {
										index = newData.findIndex(obj => JSON.stringify(obj) === JSON.stringify(data[i]))
									  tooltip.transition()
									    .duration(20)
									    .style("opacity", .9);
									  tooltip.html(cityMatch[index])
									    .style("left", (d3.event.pageX) + "px")
									    .style("top", (d3.event.pageY - 28) + "px");
									})
					.on("mouseout", function(d) { // Add the tooltip to the mouseout event
					        tooltip.transition()
					          .duration(500)
					          .style("opacity", 0);
					      })
					    );


			legenda(data,newData);
			
			function angleToCoordinate(angle, value){
			    let x = Math.cos(angle) * radialScale(value);
			    let y = Math.sin(angle) * radialScale(value);
			    return {"x": width / 2 + x, "y": height / 2 - y};
			}
			}

}



function legenda(data,newData) {
	const legend = radarSVG.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 100}, 30)`);

	legend.selectAll("rect")
	    .data(data)
	    .enter()
	    .append("rect")
	    .attr("x", -10)
	    .attr("y", (_, i) => i * 20)
	    .attr("width", 10)
	    .attr("height", 10)
	    .attr("fill", (_, i) => colors[newData.findIndex(obj => JSON.stringify(obj) === JSON.stringify(data[i]))]);

	legend.selectAll("text")
	    .data(data)
	    .enter()
	    .append("text")
	    .attr("x", 10)
	    .attr("y", (_, i) => i * 20 + 9)
	    .text((d, i) => cityMatch[newData.findIndex(obj => JSON.stringify(obj) === JSON.stringify(data[i]))])
	    .style("font-size", "14px")
	    .attr("alignment-baseline", "middle");

}

function mapToggle() {
  createMapSVG();
  // show map SVG and hide radar SVG
  mapSVG.style("display","block");
  if (radarSVG) {
    radarSVG.style("display", "none");
  }
}

function radarToggle() {
  createRadarSVG();
  // show radar SVG and hide map SVG
  radarSVG.style("display", "block");
  if (mapSVG) {
    mapSVG.style("display", "none");
  }
}

// create and show the map SVG element by default
document.addEventListener("DOMContentLoaded", function() {
  createMapSVG();
  mapSVG.style("display", "block");

	var showYear = document.querySelectorAll('.year input[type="radio"][name="accordion1-option"]') 
	showYear.forEach(function(input){
		input.addEventListener('change', function(){

			document.querySelectorAll('.year').forEach(function(label) {
				label.classList.remove('active');
			});

			const selected = document.querySelector('input[type="radio"][name="accordion1-option"]:checked');
			
			if(selected){
				const label = selected.parentElement.parentElement;
				label.classList.add('active');
			}

		});
	});

  	var accordionHeaders = document.querySelectorAll('.accordion-header');
	accordionHeaders.forEach(function(header) {
		
	  header.addEventListener('click', function()
	  {
		this.classList.toggle('active');

	    let panel = this.nextElementSibling;
	    if (panel.style.display === 'block') {
	      panel.style.display = 'none';
	    } else {
	      panel.style.display = 'block';
	    }

	  });
	  
	});

	// var radioButtons = document.querySelectorAll('.accordion-header-2 input[type="radio"]');
	// radioButtons.forEach(function(radioButton) {
	// 	radioButton.addEventListener('change', function() {
	// 		selectedOption = document.querySelector('.accordion-header-2 input[name="accordionV"]:checked');

	// 		// Remove the special CSS class from all labels
	// 		document.querySelectorAll('.accordion-header-2 label').forEach(function(label) {
	// 		label.parentElement.classList.remove('active');
	// 		});

	// 		// Add the special CSS class to the label of the selected option
	// 		if (selectedOption) {
	// 			const label = selectedOption.parentElement.parentElement;
	// 			label.classList.add('active');

	// 			// selectedIndicator = label.textContent.trim(); // Store the text in the selectedIndicator variable
	// 			// updateSelectedIndicator();
	// 		}
	// 	});
	// });

	function preprocess_natural(d){
		return {
			year: d["Year"],
			city: d["city"],
			capital: "Natural",			
			sustainability: "Environmental",
			accordion1: d["# acres urban green space per 1,000 residents"],
			accordion2: d["# Brownfields and Superfund sites"],
			accordion3: d["# drinking water violations per year"],
			accordion4: d["# poor air quality days per year"],
			accordion5: d["% properties with recycling services"],
			accordion6: d["# microgrids or district energy systems"],
			accordion7: d["# KW produced by renewables"]
		}
	}


	function preprocess_built(d){
		return {
			year: d["Year"],
			city: d["city"],
			capital: "Built",			
			sustainability: "Environmental",
			accordion8: d["% substandard buildings"],
			accordion9: d["% LEED-certified (green) buildings by square footage"],
			accordion10: d["landscape design regulations"],
			accordion11: d["% blue/green infrastructure area"],
			accordion12: d["transit availability"],
			accordion13: d["# miles bicycle lanes"],
			accordion14: d["# miles pedestrian travelways"]
		}
	}

	function preprocess_organizational(d){
		return {
					year: d["Year"],
					city: d["city"],
					capital: "Organizational",			
					sustainability: "Economic",
					accordion15: d["municipal financial rating"],
					accordion16: d["% residents satisfied with municipal services (survey)"],
					accordion17: d["# non-profit organizations per 10,000 residents"],
					accordion18: d["# full-service grocery stores per 10,000 residents"],
					accordion19: d["# civic organizations per 10,000 residents"]
				}		
	}


	function preprocess_radar(d){
		return {
					city: d["City"],
					Natural: Number(d["Natural Capital Index"])*10,
					Built: Number(d["Built Capital Index"])*10,			
					Organizational: Number(d["Organizational Capital Index"])*10,
					Political: Number(d["Political Capital Index"])*10,
					Financial: Number(d["Financial Capital Index"])*10,
					Cultural: Number(d["Cultural Capital Index"])*10,
					Human: Number(d["Human Capital Index"])*10,
					Relational: Number(d["Relational Capital Index"])*10
					}
	}

	   Promise.all([d3.csv('../data/natural.csv',preprocess_natural),d3.csv('../data/built.csv',preprocess_built), d3.csv('../data/organizational.csv',preprocess_organizational), d3.csv('../data/radar.csv',preprocess_radar) ])
        .then(function (values) {
                    naturaldata = values[0];
                    builtdata = values[1];
                    organizationaldata = values[2]
                    radardata = values[3]
                 });


});





function updateIndicator(){
	var selectedIndicator = document.getElementById("dropdown-menu").value;
}



var markers = []; // Create an empty array to store the markers

function cityChanged(finaldata){

	// Remove all the existing markers from the map
	for (var i = 0; i < markers.length; i++) {
		map.removeLayer(markers[i]);
	}
	markers = []; // Clear the markers array

	// Mapping of city with the value of the indicator
	result = finaldata.reduce((acc, finaldata) => {
		  acc[finaldata.city] = finaldata.value;
		  return acc;
	}, {});

	var regions = $('#regions').val();

	cities = [  {    "city": "Chandler",    "lat": 33.3062,    "lon": -111.8413  },  {    "city": "Gilbert",    "lat": 33.3528,    "lon": -111.789  },  {    "city": "Glendale",    "lat": 33.5387,    "lon": -112.186  },  {    "city": "Scottsdale",    "lat": 33.4942,    "lon": -111.9261  },  {    "city": "Peoria",    "lat": 33.5806,    "lon": -112.2363  },  {    "city": "Tempe",    "lat": 33.4255,    "lon": -111.9400  },  {    "city": "Surprise",    "lat": 33.6292,    "lon": -112.3677  }]

	if (regions === null) {
		alert("You need to select a city for the "+ finaldata[0].capital+" capital's indicator to be compared");
	} else {

			// Reducing the data of the selected cities into the cityData variable in a desirable format.
			const cityData = [];
			for (let i = 0; i < regions.length; i++) {
			  const region = regions[i];
			  const city = cities.find(c => c.city === region);
			  cityData.push(city.city);
			}


			resultf = cityData.reduce((obj, key) => {
			  if (result.hasOwnProperty(key)) {
			    obj[key] = result[key];
				  }
			  return obj;
			}, {});



			const values = Object.values(resultf);
			const minVal = Math.min(...values);
			const maxVal = Math.max(...values);
			
			// Define the minimum and maximum sizes for the circles
			const minSize = 20; // Minimum size of the circle
			const maxSize = 20; // Maximum size of the circle
			
			// Calculate the size and color of the circle for each key in the data object
			const newData = {}; // contains size and color of the circle
			for (const key in resultf) {
			  const value = resultf[key];
			  const size = ((value - minVal) / (maxVal - minVal)) * (maxSize - minSize) + minSize;
			  const normalizedValue = (value - minVal) / (maxVal - minVal);
			  const color = interpolateColor([255, 255, 0], [128, 0, 0], normalizedValue);
			  newData[key] = { size, color };
			}
			
			for (let i = 0; i < cityData.length; i++) {
			  const cityObject = cities.find(city => city.city === cityData[i]);
			  const cityLat = cityObject.lat;
			  const cityLon = cityObject.lon;
			
			  const { size, color } = newData[cityData[i]];
			
			  var myIcon = L.icon({
				iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(getSvgString(color)),
				iconSize: [30, 30],
				
			  });
			
			  var marker = L.marker([cityLat, cityLon], { icon: myIcon }).addTo(map);
			  markers.push(marker);
			
			  marker.bindPopup(`<h4>${cityData[i]}</h4><h4>Value: ${resultf[cityData[i]]}</h4>`);
			
			  marker.on('mouseover', function (e) {
				this.openPopup();
			  });
			
			  marker.on('mouseout', function (e) {
				this.closePopup();
			  });
			}
			
			function interpolateColor(color1, color2, value) {
			  const r = Math.round(color1[0] + (color2[0] - color1[0]) * value);
			  const g = Math.round(color1[1] + (color2[1] - color1[1]) * value);
			  const b = Math.round(color1[2] + (color2[2] - color1[2]) * value);
			  return `rgb(${r}, ${g}, ${b})`;
			}
			
			function getSvgString(color) {
			  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r="50" fill="${color}" opacity="0.7" />
			  </svg>`;
			}
						


				
				// const values = Object.values(resultf);
				// const minVal = Math.min(...values);
				// const maxVal = Math.max(...values);

				// // Define the minimum and maximum sizes for the circles
				// const minSize = 5; // Minimum size of the circle
				// const maxSize = 30; // Maximum size of the circle

				// // Calculate the size of the circle for each key in the data object
				// const newData = {}; //contains size of the circle
				// for (const key in resultf) {
				//   const value = resultf[key];
				//   const size = ((value - minVal) / (maxVal - minVal)) * (maxSize - minSize) + minSize;
				//   newData[key] = size;
				// }
				

				// for (let i = 0; i < cityData.length; i++) {

				// 		const cityObject = cities.find(city => city.city === cityData[i]);
				// 		const cityLat = cityObject.lat;
				// 		const cityLon = cityObject.lon;

				// 		var myIcon = L.icon({
				// 			iconUrl: '../data/images/red-dot.png',
				// 			iconSize: [newData[cityData[i]], newData[cityData[i]]],
				// 	 	});

				// 	  var marker = L.marker([cityLat,cityLon], {icon: myIcon}).addTo(map);
				// 	  markers.push(marker);

				// 	  marker.on('mouseover', function(e) {
				// 	    const popupHtml = `<h3><b>${cityData[i]}</b></h3><br><h3>Value: ${resultf[cityData[i]]}</h3>`;
				// 	    this.bindPopup(popupHtml).openPopup();
				// 	  });

				// 	  marker.on("mouseout", function(e) {
				// 	    this.closePopup();
				// 	  });

				// }

	}
}


function checkDataRange(data,accordionId,year){
			  	filteredData1 = data.filter(obj => obj.year === year[0])
				  	.map(obj => ({ city: obj.city, value: Number(obj[accordionId]), capital: obj.capital }));
			  	filteredData2 = data.filter(obj => obj.year === year[1])
				  	.map(obj => ({ city: obj.city, value: Number(obj[accordionId]), capital: obj.capital }));

					filteredData = filteredData1.map((obj1, index) => {
					  const obj2 = filteredData2[index];
					  const percentageChange = ((obj2.value - obj1.value) / obj1.value) * 100;
					  return { city: obj1.city, value: percentageChange, capital: obj1.capital };
					});

					return filteredData;
}

function checkDataAlone(data,accordionId,year){
		filteredData = data.filter(obj => obj.year === year[0])
		  	.map(obj => ({ city: obj.city, value: Number(obj[accordionId]), capital: obj.capital }));
		return filteredData;
}

function finalPreprocessing(accordionId,year){
	const match = accordionId.match(/accordion(\d+)/);

	if (match) {
			  const number = parseInt(match[1]);
			  if (number >= 1 && number <= 7) {
			  	if(year.length==1){
			  		filteredData = checkDataAlone(naturaldata,accordionId,year);
			  	} else{
			  		filteredData = checkDataRange(naturaldata,accordionId,year)
			  	}
			  } else if (number >= 8 && number <= 14) {
			  	if(year.length==1){
			  		filteredData = checkDataAlone(builtdata,accordionId,year);
			  	} else{
			  		filteredData = checkDataRange(builtdata,accordionId,year)
			  	}
			  } else if( number >=15 && number <=19){
			  	if(year.length==1){
			  		filteredData = checkDataAlone(organizationaldata,accordionId,year);
			  	} else{
			  		filteredData = checkDataRange(organizationaldata,accordionId,year);
			  	}			  	
			  }
			}

	return filteredData;

}

function updateSelectedIndicator() {
	
	// Update the selected indicator element with the selected indicator text
	var selectedIndicatorElement = document.getElementById("selected-indicator");
	selectedIndicatorElement.textContent = "Selected Indicator: " + selectedIndicator;
}
  

function update(element) {
	
	document.querySelectorAll('.accordion-header-2 label').forEach(function(label) {
	label.parentElement.classList.remove('active') });

	element.parentElement.parentElement.classList.add('active');

	selectedIndicator = element.parentElement.parentElement.textContent.trim();
	updateSelectedIndicator();

	accordionId = element.value;

	if(Year){
		applyYear();
		
	}else{
		applyYearRange();
	}
}

function showYearInput() {
	Year = true;
  document.getElementById("year-input-container").style.display = "block";
  document.getElementById("year-range-input-container").style.display = "none";
}

function showYearRangeInput() {
	Year = false;
  document.getElementById("year-input-container").style.display = "none";
  document.getElementById("year-range-input-container").style.display = "block";
}

function applyYear() {
  var year = document.getElementById("year-input").value;
  finaldata = finalPreprocessing(accordionId,[year]);
  cityChanged(finaldata);
}

function applyYearRange() {
  var startYear = document.getElementById("start-year").value;
  var endYear = document.getElementById("end-year").value;
  finaldata = finalPreprocessing(accordionId,[startYear,endYear]);
  cityChanged(finaldata);
}
