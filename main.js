/**
 * CONSTANTS AND GLOBALS
 * */
// const width = window.innerWidth * 0.9,
// height = window.innerHeight * 0.7;

const countryLookup = [{}];
var importData = [];
var exportData = [];
/**
* APPLICATION STATE
* */
let state = {
 geojson: []
};


/**
* LOAD DATA
* Using a Promise.all([]), we can load more than one dataset at a time
* */
Promise.all([
 d3.json("./data/asia.geo.json"),
 d3.csv("./data/import.19.csv"),
 d3.csv("./data/export.19.csv"),
 d3.csv("./data/data.19.csv") // .json from https://geojson-maps.ash.ms
]).then(([geojson, importdata, exportdata, oildata]) => {
 state.geojson = geojson;
 state.oildata = oildata;
 importData = importdata;
 state.tabledata = importData;
 exportData = exportdata;

 console.log("state.geojson: ", state.geojson.features);
 console.log("oildata:",state.oildata)
 console.log("importData:", importData)
 init();
});

/**
* INITIALIZING FUNCTION
* this will be run *one time* when the data finishes loading in
* */
function init() {
    
    width = d3.select("#container").node().getBoundingClientRect().width - 30
    height = d3.select('#container').node().getBoundingClientRect().height
    
    console.log(width)
    console.log(height)

    state.oildata.map(function(d) {
        countryLookup[d.country] = [{"source":"Oil", "value": +d.oil },
                                   {"source":"Coal","value": +d.coal},
                                   {"source":"Nuclear", "value": +d.nuclear},
                                   {"source":"Renewables", "value": +d.renewables}]
    })

    svg = d3.select("#container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)    

    const projection = d3.geoMercator()
        .fitSize([width, height], state.geojson)

    const pathGen = d3.geoPath().projection(projection);

    const asia = svg.selectAll("path.asia")
        .data(state.geojson.features, d => d.properties.brk_name)
        .join("path")
        .attr("class", "asia")
        .attr("d", d => pathGen(d))
        .attr("fill","lightslategrey")
        .attr("stroke", "black")

    
    asia.on("mouseover", (ev, d) => {
        d3.select(ev.currentTarget)
            .attr("fill","rgb(155, 161, 167)")

        state.selected = d.properties.admin
        state.income = d.properties.income_grp
        state.economy= d.properties.economy
        state.gdp= d.properties.gdp_md_est

        console.log('CountryLookup :>> ', countryLookup[state.selected]);
        state.bardata = countryLookup[state.selected]
        draw_left()

        d3.select("#"+state.selected).attr("class","flash")
    })

    asia.on("mouseout", ev => {
        d3.select(ev.currentTarget)
            .attr("fill","lightslategrey")
        drawTable(table_container)
    })

    asia.on("click", (ev,d) => {
        state.selected = d.properties.admin
        state.income = d.properties.income_grp
        state.economy= d.properties.economy
        state.gdp= d.properties.gdp_md_est

        console.log('CountryLookup :>> ', countryLookup[state.selected]);
        state.bardata = countryLookup[state.selected]
        draw_left()

        d3.select("#"+state.selected).attr("class","flash")
        
    })

    table_container = d3.select("#col_right")
    exportButton = d3.select("#ExportButton")
    importButton = d3.select("#ImportButton")

    importButton.on("click", (ev,d) => {
            console.log("ImportSelected")
            importButton.style("background-color","rgb(41, 45, 49)")
            exportButton.style("background-color","black")
            state.tabledata = importData
            state.label = "Top 20 Import Countries in Asia"
            drawTable(table_container)
        })
    
    
    exportButton.on("click", (ev,d) => {
            console.log("ExportSelected")
            exportButton.style("background-color","rgb(41, 45, 49)")
            importButton.style("background-color","black")
            state.tabledata = exportData
            state.label = "Top 20 Export Countries in Asia"
            drawTable(table_container)
        })

    state.label="Top 20 Import Countries in Asia"
    drawTable(table_container)
}

/**
* DRAW FUNCTION
* we call this every time there is an update to the data/state
* */
function draw_left() {

    width_l = d3.select("#col_left").node().getBoundingClientRect().width 
    height_l = d3.select('#col_left').node().getBoundingClientRect().height / 2

    margin = 28
    d3.select("#col_left").selectAll("p").remove()
    d3.select("#col_left").selectAll("div.info").remove()
    d3.select("#col_left").selectAll("svg.barplot").remove()

    hoverBox = d3.select("#col_left")
        .append("div")
        .style("position", "absolute")
        .style("padding", "5px")
        .html(`<img src="tooltip-img.png" width="200" height="250">`)
        .style("visibility","hidden")
        
    info=d3.select("#col_left")
        .append("div")
        .attr("class","info")
        .on("mouseover", ev => {
            //state.x = ev.clientX
            //state.y = ev.clientY
            hoverBox
                .style("visibility", "visible")
            
        })
        .on("mousemove", ev=> {
            hoverBox
                .style("top",ev.clientY+"px")
                .style("left",ev.clientX+"px")
                .style("visibility", "visible")
        })
        .on("mouseout", ev=> {
            hoverBox
                .style("visibility","hidden")
                //.style("opacity",0)
            //.style("visibility","hidden")
        });

    info.append("h3")
        .text(state.selected)
        
    info.append("p")
        .text(state.income)
        
    info.append("p")
        .text(state.economy)
        
        
    svg_bar = d3.select("#col_left")
        .append("svg")
        .attr("width",width_l-50)
        .attr("height",height_l-5)
        .attr("class","barplot")
        
    console.log("width_l : >> ",width_l)


    yScale = d3.scaleLinear()
        .domain(d3.extent(state.bardata, d=>d.value))
        .range([height_l-margin, margin])
    
    xScale = d3.scaleBand()
        .domain(state.bardata.map(d=>d.source))
        .range([margin, width_l-50])
        .paddingInner(0.05);
    

    colorScale = d3.scaleOrdinal()
        .domain(state.bardata.map(d=>d.source))
        .range(["black","gray","#F7DC6F","#5FB404"])
        //.range(["black","#F7DC6F","#EC7063"])
        
    console.log("xScale bandwidth:>> ",xScale.bandwidth())

    svg_bar.selectAll(".bar")
        .data(state.bardata)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.source))
        .attr("y", d => yScale(0) )
        .attr("width", xScale.bandwidth())
        .attr("height", height_l - margin - yScale(0))

    svg_bar.selectAll("rect")
        .transition()
        .duration(1000)
        .attr("y", d => yScale(d.value) )
        .attr("fill",d => colorScale(d.source))
        .attr("height", d => height_l - margin - yScale(d.value))
        .delay(function(d, i){console.log(i); return(i*200)});

     //X-Axis tick   
    svg_bar.append("g")
        .attr("class", "x-axis")
        .style("transform", `translate(0px,${height_l - margin}px)`)
        .style("font-size","15px")
        .style("color","whitesmoke")
        .call(d3.axisBottom(xScale)) //const xAxis = d3.axisBottom(xScale)
        
    //Y-Axis tick 
    svg_bar.append("g")
        .attr("class", "y-axis")
        .style("transform", `translate(${margin}px,0px)`)
        .style("font-size","8px")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(yScale)) //const yAxis = d3.axisLeft(yScale)
        

    console.log("======",state.selected,"======")
    state.bardata.map(d=> console.log("yValue, Scale: ", d.value, yScale(d.value)))
    state.bardata.map(d=> console.log("xSource, Scale:", d.source, xScale(d.source)))

     
}

function drawTable(container) {
    container.selectAll("div").remove()
    container.append("div")
        .style("position","absolute")
        .style("width","100%")
        .append("p")
        .text(state.label)
        .style("text-align","center")
        .style("font-size","1.5em")

    table = container.select("div")
            .append("table")
            .style("width","100%")
    
    headers = table.selectAll(".header")
            .data(state.tabledata.columns)
            .join("th")
            .attr("class","header")
            .text(cols => cols)
            .style("border-bottom","solid whitesmoke")
            .style("text-align","left")

    rows = table.selectAll(".row")
            .data(state.tabledata)
            .join("tr")
            .attr("class","row")
            .attr("id",row => row.Country)

    cells = rows.selectAll(".cell")
            .data(row => Object.values(row))
            .join("td")
            .text(cell => cell)

}
