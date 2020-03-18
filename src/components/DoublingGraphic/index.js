import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
const d3 = { ...require('d3-selection'), ...require('d3-force') };
import { Fade } from 'react-reveal';

import scaleCanvas from './scaleCanvas';
import styles from './styles.scss';

const ANIMATION_TICK_LIMIT = 11000;

// Init these so we can unload them later on dismount
let canvas;
let ctx;
let simulation;
let render;
let animate;

let width = window.innerWidth;
let height = window.innerHeight;
let centerX = width / 2;
let centerY = height / 2;

let nodes = [];
let nodesToAdd = [];
const duration = 10000; // In milliseconds

let ticks = 0;
let startTime = false;
let animReqId = null;

export default props => {
  // Get a reference to our canvas
  const canvasEl = useRef(null);

  // Set up state
  const [pageTitle, setPageTitle] = useState(null);
  const [label1Ypos, setLabel1Ypos] = useState(height * 0.25);
  const [label2Ypos, setLabel2Ypos] = useState(height * 0.5);
  const [label3Ypos, setLabel3Ypos] = useState(height * 0.75);

  useLayoutEffect(() => {
    console.log('Mounting D3 vis...');
    // Add the canvas element to the page

    // Clear any pevious nodes on mount
    nodes = [];

    canvas = d3
      .select(canvasEl.current)
      .attr('width', width)
      .attr('height', height);

    // Get the canvas context to draw
    ctx = canvas.node().getContext('2d');

    // Fit to retina devices
    scaleCanvas(canvas.node(), ctx, width, height);

    // Setup our physics
    simulation = d3
      .forceSimulation([])
      .force(
        'x',
        d3
          .forceX()
          .strength(0.6)
          .x(d => d.targetX)
      )
      .force(
        'y',
        d3
          .forceY()
          .strength(0.6)
          .y(d => d.targetY)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(-20)
          .theta(0.1)
      )
      .alpha(1)
      .alphaDecay(0.2)
      .alphaMin(0.001)
      .velocityDecay(0.7)
      .stop();

    // Function that paints to canvas
    render = () => {
      const nodes = simulation.nodes();
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill();
      }

      return nodes;
    };

    // Animation frame
    animate = (time, nodesToAdd) => {
      if (!startTime) {
        startTime = time;
      }

      const progress = time - startTime;
      const nodes = render();
      const newNodes = [];

      for (let i = 0; i < nodesToAdd.length; i++) {
        const node = nodesToAdd[i];
        if (node.delay < progress) {
          newNodes.push(node);
          nodesToAdd.splice(i, 1);
          i--;
        }
      }

      simulation
        .nodes(nodes.concat(newNodes))
        .alpha(1)
        .tick();

      ticks++;

      if (ticks < ANIMATION_TICK_LIMIT || nodesToAdd.length > 0) {
        requestAnimationFrame(t => {
          animate(t, nodesToAdd);
        });
      }
    };

    // Add initial nodes to simulation
    for (let i = 0; i < 1; i++) {
      nodes.push({
        groupName: 'one',
        x: centerX,
        y:  height * 0.25,
        targetX: centerX,
        targetY: height * 0.25
      });
    }

    for (let i = 0; i < 1; i++) {
      nodes.push({
        groupName: 'two',
        x: centerX,
        y: centerY,
        targetX: centerX,
        targetY: centerY
      });
    }

    for (let i = 0; i < 1; i++) {
      nodes.push({
        groupName: 'three',
        x: centerX,
        y: height * 0.75,
        targetX: centerX,
        targetY: height * 0.75
      });
    }

    simulation.nodes(nodes).stop();

    // Tick over a few to get stable initial state
    // for (let i = 0; i < 100; i++) {
    //   simulation.tick();
    // }

    render();

    
    startTime = false;
    ticks = 0;

    
    let count = requestAnimationFrame(t => animate(t, nodesToAdd));
    

    // Run on unmount
    return () => {
      console.log('Unmounting doubling vis...');
      // canvas = null;
      // ctx = null;
      // simulation = null;
      // render = null;
      animate = null;

      // NOTE: THIS CAUSES AN ERROR ON UNMOUNT BECAUSE THE REQUESTANIMATIONFRAME FUNCTION IS
      // STILL TRYING TO CALL ANIMATE AFTER UNMOUNT BUT THAT'S KINDA GOOD BECAUSE IT MEANS
      // THAT THE INTERACTIVE STOPS TRYING TO ANIMATE
      // PLEASE FIX LATER DOWN THE TRACK
    };
  }, []);

  useEffect(() => {
    console.log(props);

    // Delay transitions to animate
    setPageTitle(null);

    switch (props.marker) {
      case 'doublinginit':
        setTimeout(() => setPageTitle('What is exponential growth?'), 100);
        break;
      case 'doublingweek1':
        setTimeout(() => {
          setPageTitle('Week 1');
        }, 100);
        break;
      case 'doublingweek2':
        setTimeout(() => {
          setPageTitle('Week 2');
        }, 1);
        break;
      case 'doublingmonth':
        setTimeout(() => {
          setPageTitle('1 month');
        }, 1);
        break;
      default:
        setTimeout(() => {
          setPageTitle('What is exponential growth?');
        }, 1);
    }
  }, [props]);

  // useEffect(() => {
  //   if (props.marker === 'doubling') {
  //     simulation.nodes([]).stop();
  //     return;
  //   }

  //   // Reset animation timers
  //   startTime = false;
  //   ticks = 0;

  //   for (let i = 0; i < 16; i++) {
  //     nodesToAdd.push({
  //       groupName: 'one',
  //       x: width * 0.25, //centerX,
  //       y: centerY, //height * 0.25,
  //       delay: Math.random() * duration,
  //       targetX: width * 0.25,
  //       targetY: height * 0.5
  //     });
  //   }

  //   for (let i = 0; i < 128; i++) {
  //     nodesToAdd.push({
  //       groupName: 'two',
  //       x: width * 0.5, //centerX,
  //       y: centerY, //height * 0.5,
  //       delay: Math.random() * duration,
  //       targetX: centerX,
  //       targetY: height * 0.5
  //     });
  //   }

  //   for (let i = 0; i < 645; i++) {
  //     nodesToAdd.push({
  //       groupName: 'three',
  //       x: width * 0.75, //centerX,
  //       y: centerY, //height * 0.75,
  //       delay: Math.random() * duration,
  //       targetX: width * 0.75, //centerX,
  //       targetY: height * 0.5
  //     });
  //   }
  // }, [props.marker]);

  return (
    <div className={styles.root}>
      <canvas className={styles.canvas} ref={canvasEl} />
      <Fade>
        {pageTitle ? <h1>{pageTitle}</h1> : ''}

        <div className={styles.label} style={{ top: `${label1Ypos}px` }}>
          <span className={`${styles.background}`}>When the number of cases doubles every week</span>
        </div>

        <div className={styles.label} style={{ top: `${label2Ypos}px` }}>
          <span className={`${styles.background}`}>...doubles every 3 days</span>
        </div>

        <div className={`${styles.label}`} style={{ top: `${label3Ypos}px` }}>
          <span className={`${styles.background}`}>...doubles every 2 days</span>
        </div>
      </Fade>
    </div>
  );
};
