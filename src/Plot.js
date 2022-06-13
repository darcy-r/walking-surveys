import React from 'react';
import { Group } from '@visx/group';
import { Circle } from '@visx/shape';
import { scaleLinear, scaleTime, scaleQuantize } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { schemeRdYlBu, interpolateRdYlBu } from 'd3-scale-chromatic';
import { useTooltip, withTooltip, Tooltip, defaultStyles } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';

// tooltip stuff
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(180,180,180,0.75)',
  color: 'rgba(30,30,30,1)',
  fontSize: '0.8rem',
};
let tooltipTimeout;

// Finally we'll embed it all in an SVG
function ScatterPlot(props) {
  // Define the graph dimensions and margins
  const width = 460;
  const height = 490;
  const margin = { top: 0, bottom: 30, left: 0, right: 20 };
  // Then we'll create some bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  // We'll make some helpers to get at the data we want
  const x = d => Date.parse("2022-09-11T" + d.time);
  const y = d => d.pph;
  const temperatureAccessor = d => d.temperature_apparent;
  // And then scale the graph by our data
  const xScale = scaleTime({
    range: [0, xMax],
    round: true,
    domain: [Date.parse("2022-09-11T07:00:00"), Date.parse("2022-09-11T22:00:00")], // Math.max(...data.map(x))
    padding: 0.4,
  });
  const yScale = scaleLinear({
    range: [yMax, 0],
    round: true,
    domain: [0, 2400], // Math.max(...data.map(y))] // change this to an API fetch for max PPH
  });
  const temperatureRescaler = scaleLinear({
    range: [1, 0],
    domain: [-2, 38], // again TODO: fetch min and max apparent temperatures over API
  })
  // Compose together the scale and accessor functions to get point functions
  const compose = (scale, accessor) => data => scale(accessor(data));
  const xPoint = compose(xScale, x);
  const yPoint = compose(yScale, y);
  const getTemperatureStandardised = compose(temperatureRescaler, temperatureAccessor);
  const temperatureColourScale = (d) => interpolateRdYlBu(getTemperatureStandardised(d))
  // set up tooltips
  const {
    showTooltip,
    hideTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip({
    // initial tooltip state
    tooltipOpen: false,
    tooltipLeft: width / 3,
    tooltipTop: height / 3,
    tooltipData: 'Move me with your mouse or finger',
  });
  // render
  return (
      <div>
        <svg width={width} height={height} className="scatter-plot-chart">
        <GridRows scale={yScale} width={xMax} height={yMax} stroke="#e0e0e0" />
        <GridColumns scale={xScale} width={xMax} height={yMax} stroke="#e0e0e0" />
        <AxisBottom top={yMax} scale={xScale} numTicks={width > 461 ? 12 : 6} />
        <AxisLeft scale={yScale} numTicks={height > 491 ? 12 : 8}/>
        <text x="-70" y="15" transform="rotate(-90)" fontSize={10}>
          People per hour
        </text>
        {props.data.map((d, i) => {
          return (
            <Group key={`circle-${i}`}>
              <Circle
                cx={xPoint(d)}
                cy={yPoint(d)} // {yMax - barHeight}
                r={6}
                fill={temperatureColourScale(d)}
                onMouseLeave={() => {
                  tooltipTimeout = window.setTimeout(() => {
                    hideTooltip();
                  }, 300);
                }}
                onMouseMove={() => {
                  if (tooltipTimeout) clearTimeout(tooltipTimeout);
                  showTooltip({
                    tooltipData: d,
                    tooltipTop: yPoint(d) + 30,
                    tooltipLeft: xPoint(d),
                  });
                }}
              />
            </Group>
          );
        })}
        </svg>

        {tooltipOpen && tooltipData && (
          <Tooltip top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
            <div className="tooltip-paragraph">
              PPH: {tooltipData.pph}
            </div>
            <div className="tooltip-paragraph">
              {tooltipData.time}<br/>
              {tooltipData.day_of_week}, {tooltipData.date}<br/>
              Apparent temp: {tooltipData.temperature_apparent}ºC
            </div>
          </Tooltip>
        )}
      </div>
  );
}

export default ScatterPlot;
