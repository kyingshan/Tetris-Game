/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 * 
 * Asteroids link:
 * https://stackblitz.com/edit/asteroids2023?file=src%2Fstate.ts,src%2Futil.ts,src%2Fmain.ts,src%2Ftypes.ts,src%2Fview.ts
 */

import "./style.css";

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";

import { Viewport, Constants, Block } from "./types"
import type { Key, Axis, Cube, State } from "./types"

import { initialState, reduceState, Move, Tick } from "./state"

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {}
) => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key, change: {axis: Axis, amount: number} | null) =>
  key$.pipe(
    filter(({ code }) => code === keyCode),
    map(()=> new Move(change)));

  const left$ = fromKey("KeyA", {axis: "x", amount: -Block.WIDTH});
  const right$ = fromKey("KeyD", {axis: "x", amount: Block.WIDTH});
  const down$ = fromKey("KeyS", {axis: "y", amount: Block.HEIGHT});
  const rotateCW$ = fromKey("KeyE", {axis: "cw", amount: 0});
  const rotateCCW$ = fromKey("KeyW", {axis: "ccw", amount: 0});
  const restart$ = fromKey("KeyR", null)
  const input$ = merge(left$, right$, down$, rotateCW$, rotateCCW$, restart$)

  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS/50).pipe(map((num) => new Tick(num)))

  /**
   * ////////////////// IMPURE FUNCTION ////////////////////
   * 
   * Update the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const updateView = (s: State) => {

    // Delete the rows that are full of cubes
    if(s.delTetro.length >= Constants.GRID_WIDTH){
      s.delTetro.forEach((cube: Cube) => svg.removeChild(document.getElementById(cube.id)!))
      s.previous.forEach((cube: Cube) => {
        const cubeElem = document.getElementById(cube.id)!;
        cubeElem.setAttribute("x", cube.x)
        cubeElem.setAttribute("y", cube.y)
      })
    }

    if (s.gameEnd) {
      show(gameover);

      // Update the highscore
      highScoreText.innerHTML = `${s.highscore}`

      // Delete all the cubes which has created for this round of game
      const allCubes = s.previous.concat(s.delTetro)
      
      allCubes.forEach((cube: Cube) => document.getElementById(cube.id) ? 
                                        svg.removeChild(document.getElementById(cube.id)!): 0) 
      s.activeTetro.arr.forEach((cube: Cube) => document.getElementById(cube.id) ? 
                                                  preview.removeChild(document.getElementById(cube.id)!) : 0)
    } 
    
    else {
      hide(gameover);

      // Update the score, highscore, level
      scoreText.innerHTML = `${s.score}`;
      highScoreText.innerHTML = `${s.highscore}`;
      levelText.innerHTML = `${s.level}`

      // Update the coordinates and colour of active tetromino (/active cubes)
      s.activeTetro.arr.forEach((cube: Cube) => {
        const cubeElem = document.getElementById(cube.id)!;
        if (!cubeElem) {
            const newCube = createSvgElement(svg.namespaceURI, "rect", cube)
            svg.appendChild(newCube)
            newCube.setAttribute("style", cube.style)
        }
        else {
          svg.appendChild(cubeElem)
          cubeElem.setAttribute("x", cube.x)
          cubeElem.setAttribute("y", cube.y)
        }
      })

      // Create the next tetromino (/next cubes) that is going to be added to the game
      // Show the next tetromino on preview canvas
      s.nextTetro.arr.forEach((cube: Cube) => {
        const nextCubeElem = document.getElementById(cube.id)!;
        if (!nextCubeElem) {
          const newCube = createSvgElement(svg.namespaceURI, "rect",  {
            ...cube, 
            x: String(Number(cube.x)-Block.WIDTH*2.5), 
            y: String(Number(cube.y)+Block.HEIGHT*2)})
          preview.appendChild(newCube)
          newCube.setAttribute("style", `fill: ${s.nextTetro.style}`)
        }
      })
    }
  };

  // Establishes a data flow that combines two observable streams (tick$ and input$), 
  // processes the data using a state-reduction function (reduceState), 
  // and updates the application's view based on the resulting state using updateView.
  const source$ = merge(tick$, input$)
    .pipe(
      scan(reduceState, initialState))
    .subscribe((s: State) => updateView(s));
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}


