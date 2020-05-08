import {
  axisBottom,
  axisLeft,
  curveMonotoneX,
  forceCollide,
  forceSimulation,
  forceY,
  format,
  line,
  range,
  scaleLinear,
  scaleLog,
  scaleTime,
  select,
  timeWeek,
  timeFormat
} from 'd3';
import { interpolatePath } from 'd3-interpolate-path';
import React, { Component, createRef } from 'react';
import { KEY_PLACES, KEY_EUROPEAN_PLACES } from '../../constants';
import styles from '../CasesGraphic/styles.css'; // borrow styles from CasesGaphic (they're visually the same)

const IS_TRIDENT = navigator.userAgent.indexOf('Trident') > -1;
const ONE_DAY = 864e5;
const REM = 16;
const MARGIN = {
  top: 3 * REM,
  right: 4.5 * REM,
  bottom: 3 * REM,
  left: 2.5 * REM
};
const PLOT_LABEL_HEIGHT = (REM / 4) * 3;
const TICK_VALUES = {
  logarithmic: [0.01, 0.1, 1, 10, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9]
};
const FORMAT_S = format('~s');
const TRANSITION_DURATIONS = {
  opacity: 250,
  transform: 1000
};
const COLORS = [
  'teal',
  'orange',
  'cyan',
  'purple',
  'red',
  'blue',
  'brown',
  'green',
  'copy' /* copy = black/white, depending on preferred color scheme */
];
const COLOR_DIBS = {
  China: 'teal',
  Italy: 'orange',
  Singapore: 'cyan',
  'S. Korea': 'purple',
  UK: 'red',
  US: 'blue',
  Taiwan: 'brown',
  Japan: 'green',
  Australia: 'copy'
};
export const Y_SCALE_TYPES = ['logarithmic', 'linear'];
const Y_SCALE_TOTAL_PROPS = ['tests', 'testspcc']; // pcc props shouldn't have pmp added
const Y_SCALE_TOTAL_INCLUDING_PMP_PROPS = Y_SCALE_TOTAL_PROPS.concat(
  Y_SCALE_TOTAL_PROPS.filter(x => x.indexOf('pcc') === -1).map(x => `${x}pmp`)
);
export const Y_SCALE_PROPS = Y_SCALE_TOTAL_INCLUDING_PMP_PROPS.concat(
  Y_SCALE_TOTAL_INCLUDING_PMP_PROPS.map(x => `new${x}`)
);
export const DEFAULT_PROPS = {
  yScaleType: Y_SCALE_TYPES[0],
  yScaleProp: Y_SCALE_PROPS[0],
  places: KEY_PLACES,
  highlightedPlaces: KEY_PLACES
};
const KEYING_FN = d => d.key;

const calculateDoublingTimePeriods = increasePerPeriod => Math.log(2) / Math.log(increasePerPeriod + 1);
const calculateIncreasePerPeriod = doublingTimePeriods => Math.exp(Math.log(2) / doublingTimePeriods) - 1;
const calculatePeriodsToIncrease = (increasePerPeriod, startingValue, endingValue) =>
  Math.log(endingValue / startingValue) / Math.log(increasePerPeriod + 1);
const last = x => x[x.length - 1];
const inclusionCheckGenerator = (collection, itemPropName) => d =>
  typeof collection === 'boolean' ? collection : Array.isArray(collection) && collection.indexOf(d[itemPropName]) > -1;

function checkScaleTypes(yScaleType) {
  if (Y_SCALE_TYPES.indexOf(yScaleType) === -1) {
    throw new Error(`Unrecognised yScaleType: ${yScaleType}`);
  }
}

function checkScaleProps(yScaleProp) {
  if (Y_SCALE_PROPS.indexOf(yScaleProp) === -1) {
    throw new Error(`Unrecognised yScaleProp: ${yScaleProp}`);
  }
}

function generateColorAllocator(placesData) {
  const colorAllocation = {};
  let colorsUnallocated = [].concat(COLORS);

  // Pre-allocate places with dibs, then allocate remaining.
  placesData
    .filter(({ key }) => {
      const preferredColor = COLOR_DIBS[key];

      if (preferredColor && colorsUnallocated.indexOf(preferredColor) > -1) {
        colorAllocation[key] = preferredColor;
        colorsUnallocated = colorsUnallocated.filter(color => color !== preferredColor);

        return false;
      }

      return true;
    })
    .forEach(({ key }) => {
      if (!colorsUnallocated.length) {
        return;
      }

      colorAllocation[key] = colorsUnallocated.shift();
    });

  return key => {
    return colorAllocation[key] || 'none';
  };
}

function setTruncatedLineDashArray(node) {
  const pathLength = node.getTotalLength();

  node.setAttribute('stroke-dasharray', `${pathLength - 32} 2 6 2 6 2 6 2 6`);
}

export default class TestingGraphic extends Component {
  constructor(props) {
    super(props);

    const { placesData, maxDate, yScaleType } = { ...DEFAULT_PROPS, ...props };

    checkScaleTypes(yScaleType);

    this.rootRef = createRef();
    this.svgRef = createRef();

    this.measureAndSetDimensions = this.measureAndSetDimensions.bind(this);
    this.nonOdysseyMeasureAndSetDimensions = this.nonOdysseyMeasureAndSetDimensions.bind(this);

    this.placesData = Object.keys(placesData)
      .map(place => {
        const placeDates = Object.keys(placesData[place].dates);
        const population = placesData[place].population || null;
        let dates = placeDates
          .reduce((memo_dates, placeDate, placeDatesIndex) => {
            const placeDatesTotals = placesData[place].dates[placeDate];
            const placeDatesTotalsProps = Object.keys(placeDatesTotals);
            const placeDatesTotalsIncludingPerMillionPeople =
              typeof population === 'number'
                ? {
                    ...placeDatesTotals,
                    ...placeDatesTotalsProps.reduce((memo_totals, prop) => {
                      if (prop.indexOf('pcc') > -1) {
                        return memo_totals;
                      }

                      memo_totals[`${prop}pmp`] = (placeDatesTotals[prop] / population) * 1e6;

                      return memo_totals;
                    }, {})
                  }
                : placeDatesTotals;
            const placeDatesTotalsIncludingPerMillionPeopleProps = Object.keys(
              placeDatesTotalsIncludingPerMillionPeople
            );

            return memo_dates.concat([
              {
                date: new Date(placeDate),
                ...placeDatesTotalsIncludingPerMillionPeople,
                ...placeDatesTotalsIncludingPerMillionPeopleProps.reduce((memo_totals, prop) => {
                  const newProp = `new${prop}`;

                  if (placeDatesIndex === 0) {
                    memo_totals[newProp] = placeDatesTotalsIncludingPerMillionPeople[prop];
                  } else {
                    const previousDateTotals = memo_dates[memo_dates.length - 1];

                    memo_totals[newProp] = Math.max(
                      0,
                      placeDatesTotalsIncludingPerMillionPeople[prop] - previousDateTotals[prop]
                    );
                  }

                  return memo_totals;
                }, {})
              }
            ]);
          }, [])
          .filter(({ tests, date }) => tests >= 1 && (!maxDate || date <= maxDate)); // should this be filtered on maxDate at render time?

        return {
          key: place,
          type: placesData[place].type,
          population,
          dates,
          ...Y_SCALE_PROPS.reduce((memo, propName) => {
            memo[`${propName}Max`] = Math.max.apply(null, [0].concat(dates.map(t => t[propName])));

            return memo;
          }, {})
        };
      })
      .sort((a, b) => b.tests - a.tests);

    this.earliestDate = this.placesData.reduce((memo, d) => {
      const candidate = d.dates[0].date;

      if (candidate < memo) {
        return candidate;
      }

      return memo;
    }, this.placesData[0].dates[0].date);
    this.latestDate = this.placesData.reduce((memo, d) => {
      const candidate = last(d.dates).date;

      if (candidate > memo) {
        return candidate;
      }

      return memo;
    }, last(this.placesData[0].dates).date);
    this.numDates = Math.round((this.latestDate - this.earliestDate) / ONE_DAY);

    this.state = {
      width: 0,
      height: 0
    };
  }

  measureAndSetDimensions(client) {
    if (client && !client.hasChanged) {
      return;
    }

    const { width, height } = this.rootRef.current.getBoundingClientRect();

    this.setState({ width, height });
  }

  nonOdysseyMeasureAndSetDimensions() {
    this.measureAndSetDimensions({ hasChanged: true });
  }

  componentDidMount() {
    this.measureAndSetDimensions();

    if (window.__ODYSSEY__) {
      window.__ODYSSEY__.scheduler.subscribe(this.measureAndSetDimensions);
    } else {
      window.addEventListener('resize', this.nonOdysseyMeasureAndSetDimensions);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const prevProps = this.props;
    const prevState = this.state;

    let { places, highlightedPlaces, preset, yScaleType, yScaleProp } = {
      ...DEFAULT_PROPS,
      ...nextProps
    };
    const { width, height } = nextState;

    const wasResize = width !== prevState.width || height !== prevState.height;

    if (preset === prevProps.preset && !wasResize) {
      return false;
    }

    this.rootRef.current.setAttribute('data-preset', preset);

    checkScaleTypes(yScaleType);
    checkScaleProps(yScaleProp);

    if (typeof places === 'function') {
      // Apply a filter
      places = this.placesData.filter(places).map(x => x.key);
    }

    // Filter placesData to just visible places, and create visible/highlighted comparison utils
    const isPlaceVisible = inclusionCheckGenerator(places, 'key');
    const isPlaceHighlighted = inclusionCheckGenerator(highlightedPlaces, 'key');
    const visiblePlacesData = this.placesData.filter(isPlaceVisible);

    const isDailyFigures = yScaleProp.indexOf('new') === 0;
    const isCasesFactoredIn = yScaleProp.indexOf('pcc') > -1;
    const isPerCapitaFigures = yScaleProp.indexOf('pmp') > -1;

    const logarithmicLowerExtent = 1 / (isDailyFigures ? 10 : 1) / (isCasesFactoredIn || isPerCapitaFigures ? 10 : 1);

    const yScaleCap = visiblePlacesData.reduce((memo, d) => {
      // TODO: factor in date window filtering once we implement it
      return Math.max.apply(null, [memo].concat(d.dates.map(t => t[yScaleProp])));
    }, 0);

    const opacityTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.opacity;
    const transformTransitionDuration = wasResize ? 0 : TRANSITION_DURATIONS.transform;
    const chartWidth = width - MARGIN.right - MARGIN.left;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;
    const xScale = scaleTime()
      .domain([new Date(this.earliestDate), new Date(this.latestDate)])
      .range([0, chartWidth]);
    const yScale = (yScaleType === 'logarithmic'
      ? scaleLog().domain([logarithmicLowerExtent, yScaleCap], true)
      : scaleLinear().domain([0, yScaleCap], true)
    ).range([chartHeight, 0]);
    const safe_yScale = x =>
      yScale(yScaleType === 'logarithmic' && x <= logarithmicLowerExtent ? logarithmicLowerExtent : x);
    const getUncappedDataCollection = d => d.dates;
    const getDataCollection = d => getUncappedDataCollection(d).filter(item => item[yScaleProp] <= yScaleCap);
    const generateLinePath = d =>
      line()
        .x(d => xScale(d.date))
        .y(d => safe_yScale(d[yScaleProp]))(getDataCollection(d));
    const isPlaceYCapped = d => last(getUncappedDataCollection(d))[yScaleProp] > yScaleCap;
    const generateLinePathLength = d => (isPlaceYCapped(d) ? 100 : 95.5);
    const plotPointTransformGenerator = d => `translate(${xScale(d.date)}, ${safe_yScale(d[yScaleProp])})`;
    const lineEndTransformGenerator = d => plotPointTransformGenerator(last(getDataCollection(d)));
    const labelForceClamp = (min, max) => {
      let forceNodes;

      const force = () => {
        forceNodes.forEach(n => {
          if (n.y > max) {
            n.y = max;
          }

          if (n.y < min) {
            n.y = min;
          }
        });
      };

      force.initialize = _ => (forceNodes = _);

      return force;
    };
    const getAllocatedColor = generateColorAllocator(visiblePlacesData);
    const xAxisGenerator = axisBottom(xScale)
      .ticks(timeWeek.every(2))
      .tickFormat(timeFormat('%-d/%-m'));
    const yAxisGeneratorBase = () =>
      yScaleType === 'linear'
        ? axisLeft(yScale).ticks(5)
        : axisLeft(yScale).tickValues(
            TICK_VALUES['logarithmic'].filter(value => value >= logarithmicLowerExtent && value <= yScaleCap)
          );
    // const yAxisGenerator = yAxisGeneratorBase().tickFormat(format('~s'));
    const yAxisGenerator = yAxisGeneratorBase().tickFormat(value => (value >= 1 ? FORMAT_S(value) : value));
    const yAxisGridlinesGenerator = yAxisGeneratorBase()
      .tickSize(-chartWidth)
      .tickFormat('');

    // Rendering > 1: Update SVG dimensions
    const svg = select(this.svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Rendering > 2: Add/update x-axis
    svg
      .select(`.${styles.xAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top + chartHeight})`)
      .call(xAxisGenerator);

    // Rendering > 3: Update x-axis label
    svg
      .select(`.${styles.xAxisLabel}`)
      .attr('transform', `translate(${MARGIN.left + chartWidth / 2} ${height - REM / 2})`)
      .text('Date');

    // Rendering > 4: Add/update y-axis
    svg
      .select(`.${styles.yAxis}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGenerator);

    // Rendering > 5. Update y-axis label
    svg
      .select(`.${styles.yAxisLabel}`)
      .attr('transform', `translate(${0} ${MARGIN.top / 2})`)
      .call(selection => {
        const valueText = `${isDailyFigures ? 'Daily' : 'Cumulative'} known ${yScaleProp
          .replace('new', 'new ')
          .replace('pcc', '')
          .replace('pmp', '')}`;
        const factorText = isPerCapitaFigures ? 'per million people' : isCasesFactoredIn ? 'per confirmed case' : '';
        const allText = `${valueText}${factorText ? ` ${factorText}` : ''}`;

        if (IS_TRIDENT) {
          selection.text(allText);
        } else {
          selection.html(
            factorText && chartWidth <= 640
              ? `<tspan x="0" dy="-0.75em">${valueText}</tspan><tspan x="0" dy="1.25em">${factorText}</tspan>`
              : `<tspan>${allText}</tspan>`
          );
        }
      });

    // Rendering > 6. Add/Update y-axis gridlines
    svg
      .select(`.${styles.yAxisGridlines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .transition()
      .duration(transformTransitionDuration)
      .call(yAxisGridlinesGenerator);

    // Rendering > 7. Add/remove/update plot lines
    const plotLines = svg // Bind
      .select(`.${styles.plotLines}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotLine}`)
      .data(visiblePlacesData, KEYING_FN);
    const plotLinesEnter = plotLines // Enter
      .enter()
      .append('path')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotLine, true)
      .classed(styles.highlighted, isPlaceHighlighted)
      .attr('d', generateLinePath)
      .attr('stroke-dasharray', function(d) {
        if (isPlaceYCapped(d)) {
          setTimeout(setTruncatedLineDashArray, 0, this);
        }

        return null;
      })
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', null);
    plotLines // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
      .style('stroke-opacity', null)
      .attr('stroke-dasharray', null)
      .transition()
      .duration(transformTransitionDuration)
      .attrTween('d', function(d) {
        const currentPath = generateLinePath(d);

        const previous = select(this);
        const previousPath = previous.empty() ? currentPath : previous.attr('d');

        if (isPlaceYCapped(d)) {
          setTimeout(setTruncatedLineDashArray, currentPath === previousPath ? 0 : 1000, this); // post transition
        }

        return interpolatePath(previousPath, currentPath);
      });
    plotLines // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('stroke-opacity', 0)
      .remove();

    // Rendering > 8. Add/remove/update plot dots (at ends of lines)
    const plotDots = svg // Bind
      .select(`.${styles.plotDots}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotDot}`)
      .data(visiblePlacesData, KEYING_FN);
    const plotDotsEnter = plotDots // Enter
      .enter()
      .append('circle')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotDot, true)
      .classed(styles.highlighted, isPlaceHighlighted)
      .classed(styles.yCapped, isPlaceYCapped)
      .attr('r', 2)
      .attr('transform', lineEndTransformGenerator)
      .style('fill-opacity', 0)
      .style('stroke-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null)
      .style('stroke-opacity', null);
    plotDots // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
      .classed(styles.yCapped, isPlaceYCapped)
      .style('fill-opacity', null)
      .style('stroke-opacity', null)
      .transition()
      .duration(transformTransitionDuration)
      .attr('transform', lineEndTransformGenerator);
    plotDots // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', 0)
      .style('stroke-opacity', 0)
      .remove();

    // Rendering > 9. Add/remove/update plot labels (near ends of lines)
    const labelledPlacesData = visiblePlacesData.filter(
      d =>
        isPlaceHighlighted(d) || KEY_PLACES.concat(preset === 'europe' ? KEY_EUROPEAN_PLACES : []).indexOf(d.key) > -1
    );
    const plotLabelForceNodes = labelledPlacesData.map(d => ({
      fx: 0,
      targetY: safe_yScale(last(getDataCollection(d))[yScaleProp])
    }));
    const plotLabelsForceSimulation = forceSimulation()
      .nodes(plotLabelForceNodes)
      .force('collide', forceCollide(PLOT_LABEL_HEIGHT / 2))
      .force('y', forceY(d => d.targetY).strength(1))
      .force('clamp', labelForceClamp(0, chartHeight))
      .stop();
    for (let i = 0; i < 300; i++) {
      plotLabelsForceSimulation.tick();
    }
    const plotLabelsData = labelledPlacesData.map((d, i) => ({
      key: d.key,
      text: d.key,
      x: 6 + xScale(last(getDataCollection(d)).date),
      y: plotLabelForceNodes[i].y || plotLabelForceNodes[i].targetY
    }));
    const plotLabels = svg // Bind
      .select(`.${styles.plotLabels}`)
      .attr('transform', `translate(${MARGIN.left} ${MARGIN.top})`)
      .selectAll(`.${styles.plotLabel}`)
      .data(plotLabelsData, KEYING_FN);
    const plotLabelsEnter = plotLabels // Enter
      .enter()
      .append('text')
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.plotLabel, true)
      .classed(styles.highlighted, isPlaceHighlighted)
      .attr('alignment-baseline', 'middle')
      .text(d => d.text)
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('fill-opacity', 0)
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', null);
    plotLabels // Update
      .attr('data-color', d => getAllocatedColor(d.key))
      .classed(styles.highlighted, isPlaceHighlighted)
      .style('fill-opacity', null)
      .text(d => d.text)
      .transition()
      .duration(transformTransitionDuration)
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
    plotLabels // Exit
      .exit()
      .transition()
      .duration(opacityTransitionDuration)
      .style('fill-opacity', 0)
      .remove();

    // Finally, stop React from updating the component (we've managed everything above)
    return false;
  }

  componentWillUnmount() {
    if (window.__ODYSSEY__) {
      window.__ODYSSEY__.scheduler.unsubscribe(this.measureAndSetDimensions);
    } else {
      window.removeEventListener('resize', this.nonOdysseyMeasureAndSetDimensions);
    }
  }

  render() {
    return (
      <div ref={this.rootRef} className={styles.root}>
        <svg ref={this.svgRef} className={styles.svg}>
          <g className={styles.yAxisGridlines} />
          <g className={styles.plotLines} />
          <g className={styles.plotDots} />
          <g className={styles.xAxis} />
          <text className={styles.xAxisLabel} />
          <g className={styles.yAxis} />
          <text className={styles.yAxisLabel} />
          <g className={styles.plotLabels} />
        </svg>
      </div>
    );
  }
}
