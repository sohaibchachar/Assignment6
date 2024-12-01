import React, { Component } from "react";
import * as d3 from "d3";

class StreamGraph extends Component {
  componentDidMount() {
    if (this.props.data) {
      this.createStreamGraph(this.props.data);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.createStreamGraph(this.props.data);
    }
  }

  createStreamGraph(data) {
    d3.select(".container").selectAll("*").remove();
    d3.select(".tooltip").remove();

    if (!data || data.length === 0) return;

    const keys = Object.keys(data[0]).filter((key) => key !== "Date");
    const margin = { top: 20, right: 100, bottom: 50, left: 50 },
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const xScale = d3.scaleTime().domain(d3.extent(data, (d) => d.Date)).range([0, width]);
    const yMax = d3.max(data, (d) => keys.reduce((sum, key) => sum + d[key], 0));
    const yScale = d3.scaleLinear().domain([0, yMax]).range([height, 0]);
    const colorScale = d3.scaleOrdinal().domain(keys).range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]);


    const stackGen = d3.stack().keys(keys).offset(d3.stackOffsetWiggle);
    const stackedSeries = stackGen(data);
    const yMin = d3.min(stackedSeries, (layer) => {
      return d3.min(layer, (d) => d[0]);
    });

    const areaGen = d3.area().x((d) => xScale(d.data.Date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveCardinal);


    const svg = d3.select(".container").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);

    const chartGroup = svg.selectAll(".chart-group").data([null]).join("g")
      .attr("class", "chart-group")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    chartGroup.selectAll(".areas").data(stackedSeries).join("path")
      .attr("class", "areas")
      .attr("d", (d) => areaGen(d))
      .attr("fill", (d) => colorScale(d.key))
      .on("mousemove", (event, d) => {
        d3.select(".tooltip")
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
        this.createTooltipBarChart(d.key, data, colorScale(d.key));
      })
      .on("mouseout", () => {
        d3.select(".tooltip").style("opacity", 0);
      });

    chartGroup.selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${yScale(yMin - 10)})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(d3.timeMonth.every(1))
          .tickFormat(d3.timeFormat("%b"))
      );

    const legend = svg.selectAll(".legend-group").data([null]).join("g")
      .attr("class", "legend-group")
      .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);

    const reversedKeys = [...keys].reverse();
    reversedKeys.forEach((key, index) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", index * 20 + ((yMax-yMin) /4))
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(key));

      legend.append("text")
        .attr("x", 20)
        .attr("y", index * 20 +8+((yMax-yMin)/4))
        .text(key)
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });
    d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background-color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.5)");
  }

  createTooltipBarChart(key, data, barColor) {
    const tooltipWidth = 300;
    const tooltipHeight = 200;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const w = tooltipWidth - margin.left - margin.right;
    const h = tooltipHeight - margin.top - margin.bottom;

    d3.select(".tooltip").selectAll("svg").remove();
    const tooltipSvg = d3.select(".tooltip")
      .append("svg")
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const avgData = data.map(d => [d3.timeFormat("%b")(d.Date), d[key]]);

    const xScale = d3.scaleBand()
      .domain(avgData.map(d => d[0]))
      .range([0, w])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(avgData, d => d[1])])
      .range([h, 0]);

    tooltipSvg.selectAll(".x_axis_g").data([0]).join("g")
      .attr("class", "x_axis_g")
      .attr("transform", `translate(0, ${h})`)
      .call(d3.axisBottom(xScale));

    tooltipSvg.selectAll(".y_axis_g").data([0]).join("g")
      .attr("class", "y_axis_g")
      .call(d3.axisLeft(yScale));

    tooltipSvg.selectAll(".bar").data(avgData).join("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d[0]))
      .attr("y", d => yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("height", d => h - yScale(d[1]))
      .style("fill", barColor)
      .on("mousemove", (event, d) => {
        d3.select(".tooltip")
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        d3.select(".tooltip")
          .html(`${d[0]}: ${d[1]}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => d3.select(".tooltip").transition().duration(200).style("opacity", 0));
  }

  render() {
    return (
      <svg style={{ width: 700, height: 500 }}>
        <g className="container"></g>
      </svg>
    );
  }
}

export default StreamGraph;
