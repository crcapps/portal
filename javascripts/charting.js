// Stuff to do on page load
$(function() {
  addRemoteDownloadEventListeners();
})

// Add the remote download link event listeners
var addRemoteDownloadEventListeners = function() {

  // Setup the graph download listener
  $("body").on('click', '.remote_download', function(e) {
    e.preventDefault();

    var download_link = $(this)
    var loading_div = download_link.next("div.loading_icon");
    // Hide the link to avoid repeated user clicks and
    // show a loading animation
    download_link.hide();
    loading_div.css('display', 'inline-block');

    if (download_link.hasClass('single_step')) {

      // download the file
      $.fileDownload(download_link.attr('href'));

      // set a time delay to re-display the link, since we don't
      // know how long it will take for fileDownload to actually
      // generate and initiate the file download dialog and we 
      // don't want the user to re-click.
      setTimeout(function() {
        loading_div.hide();
        download_link.show();
      }, 3000)


    } else {
      // Request the file to be generated
      $.ajax({
        url: download_link.attr('href'),
        success: function(data) {

          var interval = setInterval(function() {
            // Check the status of the file generation
            $.ajax({
              url: data.status_url,
              success: function(data2) {
                if (data2.exists == true) {
                  clearInterval(interval);
                  // Actually download the file
                  if (isIos()) {
                    // iOS is problematic with jquery.fileDownload?
                    window.location.href = data.download_url;
                  } else {
                    // https://github.com/johnculviner/jquery.fileDownload/issues/63
                    $.fileDownload(data.download_url);
                  }

                  loading_div.hide();
                  download_link.show();
                } else {}
              },
              error: function(xhr, ajaxOptions, thrownError) {
                loading_div.hide();
                download_link.show();
              },
              timeout: 15000
            })
          }, 3000);
        },
        error: function(xhr, ajaxOptions, thrownError) {
          console.log(thrownError);
          loading_div.hide();
          download_link.show();
        },
        timeout: 15000,
        dataType: "json"
      });

    }

  });
}

// The old ruby Graph#GRAPH_COLORS_ARRAY consumed by rrdgraph
var graph_colors = [
  '#29ABE2', // theme primary color
  '#626366', // theme secondary color
  '#ED1F24', // rgnets red
  '#636466', // rgnets gray
  '#0000FF', // blue
  '#006400', // green
  '#8B008B', // magenta
  '#D2691E', // chocolate
  '#FF69B4', // pink
  '#00FFFF', // cyan
  '#9400D3', // violet
  '#A9A9A9', // gray
  '#000080', // navy
  '#FF6347', // tomato
  '#FFD700', // gold
  '#4B0082', // indigo
];

// Store the interval ids used to update the graphs in a global variable.
// This allows us to perform a clearInterval when we reload the graphs 
// div via ajax.
var graphIntervals = [];

// Add support for new-line characters in line and bar chart labels
var honorLineBreaks = function(text) {
  text.each(function() {
    var text = d3.select(this),
      lines = text.text().split(/\n/),
      lineNumber = 0,
      lineHeight = 1.1,
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy"))

    text.text(null);

    for (var line in lines) {
      var tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", (line * lineHeight) + dy + "em");
      tspan.text(lines[line]);
    }
  });
};

// Update chart ticks
function updateChartTicks(target) {
  d3.selectAll(target + ' .tick text, ' + target + ' .nv-axisMaxMin text').call(honorLineBreaks)
}

// Plot a NVD3 bar chart (graph)
function plotBarChart(chart_options) {
  nv.addGraph(function() {
    var chart = nv.models.multiBarChart()
      .reduceXTicks(true)
      .stacked(true)
      .showControls(false)
      .useInteractiveGuideline(true)
      .duration(chart_options.duration);

    if (chart_options.subtitle) {
      var chart_top_margin = 100
      var legend_top_margin = 30
    } else {
      var chart_top_margin = 80
      var legend_top_margin = 20
    }

    chart.margin({
        top: chart_top_margin,
        left: 90,
        right: 20
      })
      .color(graph_colors);

    chart.legend
      .margin({
        top: legend_top_margin
      })
      .rightAlign(false);
    // .updateState(false);  // Don't enable/disable seies when clicking legend

    chart.controls.margin({
      top: 20
    });

    chart.xAxis.tickFormat(function(d) {
      return d;
    });
    chart.yAxis
      .axisLabel(chart_options.yaxis_label)
      .margin({
        left: 100
      })
      .tickFormat(function(d) {
        return (chart_options.value_prefix || '') + d3.format(chart_options.number_format)(d) + (chart_options.value_suffix || '')
      });

    d3.select(chart_options.target)
      .datum(chart_options.data)
      .transition().duration(chart_options.duration).call(chart);

    updateChartTicks(chart_options.target);

    var $svg = $(chart_options.target);
    d3.select(chart_options.target + "  a.chart_title").remove();
    var chart_width = $svg.width();
    if (d3.select(chart_options.target + "  a.chart_title").empty) {
      //create the <a> tag
      var title_anchor = d3.select(chart_options.target)
        .append("a")
        .attr("class", "chart_title")
        .attr("xlink:href", chart_options.title_url);

      //insert the title into the body of the <a> tag
      title_anchor
        .append("text")
        .attr("x", '50%')
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("class", "chart_title")
        .text(chart_options.title);
    }

    if (chart_options.subtitle) {
      d3.select(chart_options.target)
        .append("text")
        .attr("x", '50%')
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .attr("class", "chart_subtitle")
        .text(chart_options.subtitle);
    }

    interval = setInterval(function() {
      $.ajax(chart_options.data_url).done(function(data) {
        d3.select(chart_options.target) //Select the <svg> element you want to render the chart in.
          .data([data])
          .transition().duration(chart_options.duration).ease('back');
        chart.update();
        updateChartTicks(chart_options.target);
      });
    }, chart_options.refresh_interval_in_ms)

    // store the ID so we can clear it later
    graphIntervals.push(interval);

    nv.utils.windowResize(function() {
      chart.update();
      updateChartTicks(chart_options.target);
    });

    return chart;
  });
}

// Convert graph data from rrdxport into nvd3 format
function formatRrdXport(rrd_xport, area) {

  /* expected nvd3 data format:
    var myData = [
      {
        key: "<Series 1>",
        color: "#123456",
        values: [
          {x: 0, y: 10},
          {x: 1, y: 20},
          {x: 2, y: 30}
        ]
      },
      {...}
    ]
  */
  var nvd3_data = [];

  // Get the start epoch and step from the RRD
  var start_time = parseInt(rrd_xport.meta.start);
  var step = parseInt(rrd_xport.meta.step);

  // Get the series spec (number of plots) from the RRD legend
  var series = rrd_xport.meta.legend;

  // Convert RRD datapoints in each series
  for (var i = 0; i < series.length; i++) {

    // Display outbound data below the x axis (negate y value)
    // TODO: Ideally this behavior is configurable
    var negate_y = (area && /out$/.test(series[i])) ? -1 : 1;

    // Add the series to the nvd3_data array
    nvd3_data.push({
      key: series[i],
      area: area,
      values: rrd_xport.data.map(function(row, index) {
        return {
          // Compute the datapoint timestamp, which is intentionally not
          // provided in the RRD xport to save space
          x: ((start_time + (index * step)) * 1000),
          // Convert null (missing datapoints) to 0 and negate the value if
          // desired.
          //
          // Number() conversion was necessary to convert scientific notation in
          // the RRD xport XML format that was converted to JSON. Now we have
          // rrdxport convert to JSON directly which does not use scientific
          // notation strings and instead the actual number. Leave it here to
          // know that nvd3 requires a Number and not a String.
          y: Number(row[i] || 0) * negate_y
        }
      })
    });
  }

  return nvd3_data;
}

// Adjust the timestamp provided from the graph export to account for a
// difference between the rXg's local timezone and the timezone of the client.
function convertTimestampZone(d, sourceUtcOffset) {
  var date = new Date();

  // The getTimezoneOffset() javascript function returns the offset of the local
  // time to UTC in minutes, but a negative UTC offset ends up being a positive
  // TimezoneOffset value, and a positive UTC offset a negative value, so we
  // must invert it. Also convert the minutes to seconds.
  //
  // https://stackoverflow.com/questions/21102435/why-does-javascript-date-gettimezoneoffset-consider-0500-as-a-positive-off/21102476#21102476
  var localUtcOffset = (date.getTimezoneOffset() - (2 * date.getTimezoneOffset())) * 60;

  // Calculate the difference between the client's UTC offset and the rXg's UTC
  // offset. The given d3-format timestamp is in miliseconds, so first convert
  // the offset in seconds to ms.
  return new Date(d + ((sourceUtcOffset - localUtcOffset) * 1000));
}

// Plot a NVD3 line chart (graph) from exported RRDtool data
function plotRrdGraph(chart_options) {
  plotLineChart(chart_options, formatRrdXport(chart_options.data, chart_options.area));
}

// Plot a NVD3 line chart (graph)
function plotLineChart(chart_options, data) {

  nv.addGraph(function() {
    if (chart_options.selector == true) {
      var chart = nv.models.lineWithFocusChart();
    } else {
      var chart = nv.models.lineChart();
    }

    if (chart_options.subtitle) {
      var chart_top_margin = 100
      var legend_top_margin = 30
    } else {
      var chart_top_margin = 80
      var legend_top_margin = 20
    }
    chart.margin({
        top: chart_top_margin,
        left: 65,
        right: 30
      }) //Adjust chart margins to give the x-axis some breathing room.
      .useInteractiveGuideline(true) //We want nice looking tooltips and a guideline!
      //.transitionDuration(350)  //how fast do you want the lines to transition?
      .showLegend(true) //Show the legend, allowing users to turn on/off line series.
      .showYAxis(true) //Show the y-axis
      .showXAxis(true) //Show the x-axis  
      .color(graph_colors)
      .duration(chart_options.duration);

    chart.legend
      .width(400)
      .height(50)
      .margin({
        top: legend_top_margin,
        left: 10,
        right: 10
      })
      .rightAlign(false);
    //.updateState(false);

    var $svg = $(chart_options.target);


    // Chart x-axis settings
    chart.xAxis
      .tickFormat(function(d) {
        return d3.time.format('%a %-m/%-d\n%-I:%M %p')(convertTimestampZone(d, chart_options.utc_offset));
      });

    // Chart x2-axis settings (range selector)
    if (chart_options.selector == true) {
      chart.x2Axis
        .tickFormat(function(d) {
          return d3.time.format('%a %-m/%-d\n%-I:%M %p')(convertTimestampZone(d, chart_options.utc_offset));
        });
    }

    // Chart y-axis settings
    chart.yAxis
      .axisLabel(chart_options.yaxis_label)
      .tickFormat(function(d) {
        return d3.format(chart_options.number_format)(Math.abs(d));
      });

    // Chart y2-axis settings
    // chart.y2Axis
    //   .axisLabel(chart_options.yaxis_label)
    //   .tickFormat(function(d) {
    //     return d3.format('.02f')(d / (1024 * 1024))
    //   });

    /* Done setting the chart up? Time to render it!*/

    d3.select(chart_options.target) //Select the <svg> element you want to render the chart in.   
      .datum(data) //Populate the <svg> element with chart data...
      .call(chart); //Finally, render the chart!

    updateChartTicks(chart_options.target);

    d3.select(chart_options.target + "  a.chart_title").remove();
    var chart_width = $svg.width();
    if (d3.select(chart_options.target + "  a.chart_title").empty) {
      //create the <a> tag
      var title_anchor = d3.select(chart_options.target)
        .append("a")
        .attr("class", "chart_title")
        .attr("xlink:href", chart_options.title_url);

      //insert the title into the body of the <a> tag
      title_anchor
        .append("text")
        .attr("x", '50%')
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("class", "chart_title")
        .text(chart_options.title);
    }

    if (chart_options.subtitle) {
      d3.select(chart_options.target)
        .append("text")
        .attr("x", '50%')
        .attr("y", 45)
        .attr("text-anchor", "middle")
        .attr("class", "chart_subtitle")
        .text(chart_options.subtitle);
    }

    interval = setInterval(function() {
      $.ajax(chart_options.data_url).done(function(data) {
        d3.select(chart_options.target) //Select the <svg> element you want to render the chart in.
          // FIXME: This assumes that plotLineChart() was called via plotRrdGraph(),
          // which currently is always the case, but may not be so one day.
          .data([formatRrdXport(data, chart_options.area)])
          .transition().duration(chart_options.duration).ease('back');
        chart.update();
        updateChartTicks(chart_options.target);
      });
    }, chart_options.refresh_interval_in_ms)

    // store the ID so we can clear it later
    graphIntervals.push(interval);

    //Update the chart when window resizes.
    nv.utils.windowResize(function() {
      chart.update();
      updateChartTicks(chart_options.target)
    });

    return chart;
  });
}