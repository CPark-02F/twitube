function IntegratedChart(id = "integrated_chart",
                   margin = { top: 40, right: 40, bottom: 40, left: 40 }) {

    const dom = document.getElementById(id)

    const _utils = Utils()
    const _width = dom.clientWidth - margin.left - margin.right
    const _height = dom.clientHeight - margin.top - margin.bottom
    const _chart = _utils.CreateSVG(id, dom.clientWidth, dom.clientHeight, margin)
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    _chart.append("g")
          .attr("fill", "none")
          .attr("id", "bars")
    _chart.append("g")
          .attr("fill", "none")
          .attr("id", "lines")
    _chart.append("g")
          .attr("fill", "none")
          .attr("id", "dots")


    let xDomain = ["SUN", "MON", "TUE", "WEN", "THU", "FRI", "SAT"]
    let _xScale = _utils.ScaleLinear([0, 1], [0, _width])
    let _yScale = _utils.ScaleLinear([1, 0], [0, _height])

    let _line = d3.line()
                  .x(function(d){ return _xScale(d['date']) + _xScale.bandwidth() / 2 })
                  .y(function(d){ return _yScale(d['viewer']) })

    _utils.CreateAxis(_chart, _width, _height, 'xline', _xScale, 'yline', _yScale, 10, 10)
    _utils.CreateYAxis(_chart, _width, _height, 'ybar', _yScale, 10)

    const _select = (select) => {
        select.transition()
            .duration(500)
            .attr("d", d => _line(d.value))
            .attr("class", d => "line " + d.key)
            .style("opacity", 1)
            .attr("stroke", "black")
    }

    const _enter = (enter) => {
        enter.append("path")
            .style("mix-blend-mode", "multiply")
            .attr("stroke", "black")
            .attr("stroke-width", 1.0)
            .attr("class", d => "line " + d.key)
            .attr("d", d => _line(d.value))
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(500)
            .style("opacity", 1)
    }

    const _exit = (exit) => exit.remove()

    return {
        Update: (dataset, user) => {
            // Get data
            let data = {
                'key' : user,
                'value' : getIntegratedChartData(dataset, user)
            }

            /////////////////////////////////////////////////////////////////////////////////////
            // Line Chart

            // Calculate max/min value to create y domain of line chart
            let maxValue = data.value.reduce((max, R) => max > R['viewer'] ? max : R['viewer'], 0)
            let minValue = data.value.reduce((min, R) => min < R['viewer'] ? min : R['viewer'], maxValue)

            let yDomain = [0.9 * minValue, 1.1 * maxValue]

            
            _xScale = _utils.ScaleBand(xDomain, [0, _width])
            _yScale = _utils.ScaleLinear(yDomain, [_height, 0])
            _utils.UpdateAxis(_chart, _xScale, _yScale, 500, 1, 10)

            // Update line chart
            let target = _chart.select("#lines")
                               .selectAll(".line")
                               .data([data], d => d.key)
            _exit(target.exit())
            _select(target)
            _enter(target.enter())

            let dots = _chart.select("#dots")
                             .selectAll(".dot")
                             .data(data.value, d => d['date'])

            dots.exit().remove()
            dots.attr("cx", function(d) {
                    return _xScale(d['date']) + _xScale.bandwidth() / 2
                })
                .attr("cy", function(d) {
                    return _yScale(d['viewer'])
                })
                .style("opacity", 0)
                .transition()
                .duration(500)
                .delay(500)
                .style("opacity", 1)
                
            dots.enter()
                .append("circle")
                .attr("class", "dot")
                .attr("cx", function(d) {
                    return _xScale(d["date"]) + _xScale.bandwidth() / 2
                })
                .attr("cy", function(d) {
                    return _yScale(d["viewer"])
                })
                .attr("r", 5)
                .on("mouseover", function(d) {
                    d3.select(this)
                      .attr("r", 8)
                    tooltip.transition()
                       .duration(300)
                       .style("opacity", 0.9)
                    tooltip.html(`Day : ${d['date']} </br>
                                  Most Played Game : ${d['game']}</br>
                                  Average Viewer : ${d['viewer'].toFixed(0)}</br>
                                  Duration : ${d['duration']} h</br>`)	
                       .style("left", (d3.event.pageX) + "px")		
                       .style("top", (d3.event.pageY - 28) + "px")	
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                      .attr("r", 5)
                    tooltip.transition()
                       .duration(300)
                       .style("opacity",  0)
                })
                .style("opacity", 0)
                .transition()
                .duration(500)
                .delay(500)
                .style("opacity", 1)

            ////////////////////////////////////////////////////////////////////////////////
            // Bar Chart

            // Calculate max/min value to create y domain of bar chart
            maxValue = data.value.reduce((max, R) => max > R["duration"] ? max : R["duration"], 0)
            
            yDomain = [0 , 1.1 * maxValue]

            // Set y scale
            _yScale = _utils.ScaleLinear(yDomain, [_height, 0])

            // Update bar chart
            let bars = _chart.select("#bars")
                               .selectAll("rect")
                               .data(data.value)

            // Update right-side y axis
            _utils.UpdateYAxis(_chart, _yScale, 500, 10)
            
            bars.enter()
                .append("rect")
                .merge(bars)
                .attr("width", _xScale.bandwidth())
                .attr("height", (d) => _height - _yScale(d['duration']))
                .attr("transform", (d) => _utils.Translate(_xScale(d['date']), _yScale(d['duration'])))
                .attr("fill", (d) => {
                    let color = gameColorMap[d['game']]
                    return color ? color : gameColorMap['Others']
                })
                .attr("opacity", 0.9)
                .on("mouseover", function(d) {
                    tooltip.transition()
                       .duration(300)
                       .style("opacity", 0.9)
                    tooltip.html(`Day : ${d['date']} </br>
                                  Most Played Game : ${d['game']}</br>
                                  Average Viewer : ${d['viewer'].toFixed(0)}</br>
                                  Duration : ${d['duration']} h</br>`)	
                       .style("left", (d3.event.pageX) + "px")		
                       .style("top", (d3.event.pageY - 28) + "px")	
                })
                .on("mouseout", function(d) {
                    tooltip.transition()
                       .duration(300)
                       .style("opacity",  0)
                })
                .style("opacity", 0)
                .transition()
                .duration(500)
                .delay(500)
                .style("opacity", 1)
            bars.exit()
                .remove()

        }
    }
}