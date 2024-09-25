// Common Tetris type definitions
export { Viewport, Constants, Block, allBlock, allColour }
export type { Key, Event, Axis, Colour, Cube, Tetro, State, Action, LazySequence }

/** Constants */

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 80,
  } as const;
  
const Constants = {
    TICK_RATE_MS: 500,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20,
} as const;

const Block = {
    WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
    HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyR" | "KeyE" | "KeyW";


/**
 * The only input events is keypress
*/
type Event = "keypress";


/** Axis of coordinate and Showing restart */

type Axis = "x" | "y" | "cw" | "ccw"


/** Block colouring */

type Colour = "red" | "blue" | "green" | "pink" | "yellow" | "aqua" | "white"


/**
 * State of Cube
 */
type Cube = Readonly<{
    id: string
    height: string,
    width: string,
    x: string,
    y: string,
    style: string,
  }>;

/** 
 * State of Tetro 
 */
type Tetro = Readonly<{
    id: string
    arr: ReadonlyArray<Cube>
    x: string,
    y: string,
    style: string,
    pattern: number[][],
  }>;

/**
 * Game state
*/
type State = Readonly<{
  gameEnd: boolean;
  activeTetro: Tetro
  previous: Cube[]
  nextTetro: Tetro
  level: number;
  score: number;
  highscore: number;
  delTetro: Cube[]
  nextRandNum: LazySequence<number>
}>;

/**
 * Actions modify state
 */
interface Action {
    apply(s: State): State;
  }

/**
 * Access next value
 */
interface LazySequence<T> {
    value: T;
    next():LazySequence<T>;
  }

const OBlock = [
    [1,1],
    [1,1]
]

const TBlock = [
    [0,1,0],
    [1,1,1],
    [0,0,0]
]

const ZBlock = [
    [1,1,0],
    [0,1,1],
    [0,0,0]
]

const SBlock = [
    [0,1,1],
    [1,1,0],
    [0,0,0]
]

const JBlock = [
    [1,0,0],
    [1,1,1],
    [0,0,0]
]

const LBlock = [
    [0,0,1],
    [1,1,1],
    [0,0,0]
]

const IBlock = [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0] 
]

const allBlock = [OBlock, TBlock, ZBlock, SBlock, JBlock, LBlock, IBlock]

const allColour: Colour[] = ["red", "blue", "green", "pink", "yellow", "aqua", "white"]