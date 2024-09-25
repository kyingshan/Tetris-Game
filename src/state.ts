// Functions and definitions of game state objects and state management.
export { allBlock, allColour, initialTetroPattern, initialNextTetroPattern, initialTetroStyle, initialNextTetroStyle }
export { initialCube, createTetro, initialTetro, initialState, Move, Tick, flatten }
export { rotateBlock, checkBounds, checkCollision, isCollide, handleCollision, moveDownRows, changeAtt, reduceState}
 
import { newFlatMap, not, isNotNullOrUndefined, naturalNumbers, randomNumber, initialDetails, transpose, reverse } from "./util"
import { Viewport, Constants, Block, Axis, Cube, Tetro, State, Action, allBlock, allColour } from "./types"

/////////////// INITIAL STATE SET UP////////////////////

/**
 * Some initial tetromino data
 * Get the initial and next tetromino block pattern and colour
 */
const initialTetroPattern = allBlock[initialDetails().initialRandNum]
const initialTetroStyle = allColour[initialDetails().initialRandNum]
const initialNextTetroPattern = allBlock[initialDetails().initialNextRandNum]
const initialNextTetroStyle = allColour[initialDetails().initialNextRandNum]

/**
 * Initialize a cube
 */
const initialCube: Cube = {
    id: "0_00",
    height: `${Block.HEIGHT}`,
    width: `${Block.WIDTH}`,
    x: `${Math.ceil(Viewport.CANVAS_WIDTH / 2)}`,
    y: "0",
    style: "fill: blue"
  };

/**
 * Creating a tetromino with 4 cubes
 * @param id Id of the tetromino
 * @param arr A 2d array of block pattern
 * @returns A 2d array of cubes
 */
const createTetro = (id: number, arr: number[][]): (Readonly<Cube>)[][] => {
    return arr.map((row, i) => {
        return row.map((col, j) => {
        if (col === 1) {
            return {
            ...initialCube,
            x: `${Block.WIDTH * j + Viewport.CANVAS_WIDTH / 2}`,
            y: `${Block.HEIGHT * i - Block.HEIGHT}`,
            id: `${id}_${i}${j}`,
            }as Cube
        }
        else return initialCube
        }).filter(cube => cube !== initialCube)
    });
  };

/**
 * Initialize a tetromino with details.
 * x, y: change of the coordinate of the cubes
 * style: colour of the tetro
 * pattern: block pattern of the tetro
 */
const initialTetro: Tetro = {
    id: "0",
    arr: flatten(createTetro(0, initialTetroPattern)),
    x: "0",
    y: `${-Block.HEIGHT}`,
    style: `${initialTetroStyle}`,
    pattern: initialTetroPattern
  };

/**
 * Initialize a game state
 */
const initialState: State = {
    gameEnd: false,
    activeTetro: initialTetro, 
    nextTetro: {...initialTetro, 
        id: String(Number(initialTetro.id)+1), 
        arr: flatten(createTetro(Number(initialTetro.id)+1, initialNextTetroPattern)),
        x: `${Block.WIDTH * 2}`,
        y: `${Block.HEIGHT}`,
        pattern: initialNextTetroPattern,
        style: `${initialNextTetroStyle}`},
    previous: [],
    score: 0,
    highscore: 0,
    delTetro: [],
    nextRandNum: naturalNumbers().next().next(),
    level: 1,
  };

//////////////// STATE UPDATES //////////////////////

// Action types that trigger game state transitions

class Move implements Action {
    constructor(public readonly change: {axis: Axis, amount: number} | null) {}

    /**
     * Update the coordinate of the tetromino regarding to the keypress
     * @param state current state
     * @returns updated state or current state
     */
  
    apply = (state: State): State => {
  
      if(!state.gameEnd){ // not game end

        // Key R for restart
        // Just returning existing state as the game is not end
        if(!isNotNullOrUndefined(this.change)){
          return state
        }
  
        // Key E and Key W for rotation
        // Rotate the existing pattern block, if there is no collision
        if(isNotNullOrUndefined(this.change) && (this.change.axis === "cw" || this.change.axis === "ccw")){
          const newState = rotateBlock(state, this.change.axis)
          return isCollide(state, this.change.axis, this.change.amount) ? state : newState
        }
  
        // Key A, Key D, Key S for moving left, right and down
        // Check is it collide to the bound or collide with other cubes
        // If not collide, update new X or Y coordinate, otherwise remain same coordinate
        else{

          // For x axis
          if (this.change.axis === "x"){
            if (!isCollide(state, this.change.axis, this.change.amount)){
              const newX = Number(state.activeTetro.x) + this.change.amount
              return { ...state, activeTetro: {...state.activeTetro, x: `${String(newX)}`}}
            }
            else return { ...state, activeTetro: {...state.activeTetro, x: "0"}}
          }

          // For y axis
          else
          {
            if (!isCollide(state, this.change.axis, this.change.amount)){
              const newY = Number(state.activeTetro.y) + this.change.amount
              return { ...state, activeTetro: {...state.activeTetro, y: `${String(newY)}`}}
            }
            else return handleCollision(state)
          }
        }
      }

      // Game end
      else {
        // Key R for restart, return an initial state and updating the highscore
        if (!isNotNullOrUndefined(this.change)){
          return state.gameEnd ? {...initialState, highscore: state.highscore} : {...state, delTetro: []}
        }
        // Other key, remain unchanged
        else return state
      }
    }
  }
  
class Tick implements Action{
    constructor(public readonly tickCount: number) {}
  
     /**
     * A middleman to control speed of moving down tetromino
     * and the speed increase with the game level
     * @param state current state
     * @returns updated state or current state
     */
    apply = (state: State) => {
        const newState = new Move({axis: "y", amount: Block.HEIGHT}).apply(state)
        return this.tickCount % (Math.floor(100/state.level)) === 0 ? newState : state
    }
  }

/**
 * Return flat array cubes from 2d array tetromino
 * @param arr 2d array of tetromino / cubes
 * @returns An array of cubes
 */
function flatten(arr: (Readonly<Cube>)[][]): ReadonlyArray<Cube> {
    return newFlatMap(arr, (row => row))
  }

/**
 * Apply rotation for the tetromino, by rotating right 90 degree
 * @param state current state
 * @returns updated state
 */
const rotateBlock = (state: State, direction: string): State => {

    const Iblock = allBlock[6]
    const Oblock = allBlock[0]

    // handling I block rotation (0, 90, 180, 270 degree)
    if (JSON.stringify(state.activeTetro.pattern) === JSON.stringify(Iblock) ||
        JSON.stringify(state.activeTetro.pattern) === JSON.stringify(transpose(reverse(Iblock))) ||
        JSON.stringify(state.activeTetro.pattern) == JSON.stringify(reverse(Iblock)) ||
        JSON.stringify(state.activeTetro.pattern) == JSON.stringify(reverse(transpose(Iblock))))
        {
        // Find the lowest coordinate X and Y among the cubes
        const lowX = state.activeTetro.arr.reduce((acc, cube) => acc < Number(cube.x) ? 
                                                                  acc : Number(cube.x), Number(Viewport.CANVAS_WIDTH))
        const lowY = state.activeTetro.arr.reduce((acc, cube) => acc < Number(cube.y) ? 
                                                                  acc : Number(cube.y), Number(Viewport.CANVAS_HEIGHT))

        // Create rotated tetromino, either clockwise or counterclockwise
        // assign the same id of original tetromino to the rotated tetromino
        const rotateMatrix = direction === "cw" ? 
                              transpose(reverse(state.activeTetro.pattern)) 
                              : reverse(transpose(state.activeTetro.pattern))
        const createNewArr = flatten(createTetro(Number(state.activeTetro.id), rotateMatrix))
        const newArr = createNewArr.map((cube, index) =>({...cube, id: state.activeTetro.arr[index].id}))

        // Check it is horizontal or vertical block
        // To assign rotated tetromino in the correct coordinates
        const isHorizontal = rotateMatrix.reduce((bool, row) => bool || row[0] === 1, false)

        if (isHorizontal){
            // | --> ——
            const newY = lowY + Block.HEIGHT
            const newX = state.activeTetro.pattern[0][1] === 1 ?  
                Number(state.activeTetro.arr[0].x) - Viewport.CANVAS_WIDTH/2 - Block.WIDTH 
                : Number(state.activeTetro.arr[0].x) - Viewport.CANVAS_WIDTH/2 - Block.WIDTH*2
            return {...state, activeTetro: {...state.activeTetro, 
                                            arr: newArr, 
                                            pattern: rotateMatrix,
                                            y: String(newY), 
                                            x: String(newX)}}
        }
        else {
            // —— --> |
            const newX = lowX - Viewport.CANVAS_WIDTH/2
            const newY = state.activeTetro.pattern[1][0] === 1 ? 
                Number(state.activeTetro.arr[0].y) 
                : Number(state.activeTetro.arr[0].y) - Block.HEIGHT
            return {...state, activeTetro: {...state.activeTetro, 
                                            arr: newArr, 
                                            pattern: rotateMatrix, 
                                            y: String(newY), 
                                            x: String(newX)}}
        }
    }

    // handling O block rotation -- remain unchanged / no rotation
    if(state.activeTetro.pattern === Oblock){
        return state
    }

    // handling other types of block rotation
    else{

        // Find the center cube which is fixed no matter how they rotated (coordinate remain the same)
        const centralCube = state.activeTetro.arr.filter(cube => cube.id === `${state.activeTetro.id}_11`)[0]

        // Create rotated tetromino 
        const rotateMatrix = direction === "cw" ? 
                              transpose(reverse(state.activeTetro.pattern)) 
                              : reverse(transpose(state.activeTetro.pattern))
        const newArr = flatten(createTetro(Number(state.activeTetro.id), rotateMatrix))

        // Assign the same id of original tetromino to the rotated tetromino, except the center cube
        const filteredCube = newArr.filter(cube => cube.id !== centralCube.id)
        const filteredID = state.activeTetro.arr.map(cube => cube.id).filter(id => id !== centralCube.id)
        const renameIDCubes = filteredCube.map((cube, index) =>({...cube, id: filteredID[index]}))

        // Get the new rotated tetromino array with same ID as original tetromino
        const theCube = newArr.filter(cube => cube.id === centralCube.id)
        const newActiveTetroArr = renameIDCubes.concat(theCube)

        // Create new state with the new coordinate of the cubes
        const newX = Number(centralCube.x) - Viewport.CANVAS_WIDTH/2 - Block.WIDTH
        const newY = centralCube.y
        const newState = {...state, activeTetro: {...state.activeTetro, 
                                                  arr: newActiveTetroArr, 
                                                  pattern: rotateMatrix, 
                                                  y: newY, 
                                                  x: String(newX)}}
        return newState
    }
  }

const checkBounds = (state: State, axis: Axis, amount: number): boolean => {
    /**
     * Check if the active tetromino collides to the bound
     * Return True if collides to the wall
     */
    if (axis === "x"){
      return state.activeTetro.arr
        .reduce((bool, cube) => {
          const newX = Number(cube.x) + amount
          return (newX < 0 || newX > (Viewport.CANVAS_WIDTH - Block.WIDTH)) || bool
          },false)
    }

    else{
      return state.activeTetro.arr
      .reduce((bool, cube) => {
        const newY = Number(cube.y) + amount
        return newY > (Viewport.CANVAS_HEIGHT - Block.HEIGHT) || bool
        },false)
    };
  };
  
const checkCollision = (state: State, axis: Axis, difference: number): boolean => {

    /**
     * Check if the active tetromino collides with other cubes
     * Return True if it collides
     */
  
    return state.activeTetro.arr.map(curCube => {

      // Find those previous cubes which lies on the same x (collide horizontally) or y axis (collide vertically) with those active cubes
      return state.previous.filter(prevCube => 
        axis === "x" ? Number(curCube.y) === Number(prevCube.y) 
                    : Number(curCube.x) === Number(prevCube.x))

        // Check if they are adjacent and collide with each others (previous cube coor = current cube coor + block height/width)
        .reduce((bool, prevCube) => {
            return axis === "x" ? 
            bool || (Number(prevCube.x) === (Number(curCube.x) + Block.WIDTH) && difference > 0) 
                || (Number(prevCube.x) === (Number(curCube.x) - Block.WIDTH) && difference < 0)
            : bool || ((Number(prevCube.y) === Number(curCube.y) + Block.HEIGHT))
        }, false)
    })
    .reduce((acc, bool) => acc || bool, false)
  };


/**
 * Check for bound to wall and collide with other cubes
 */
const isCollide = (state: State, axis: Axis, amount: number): boolean => {
    return checkBounds(state, axis, amount) || checkCollision(state, axis, amount)
  }
 
/**
 * Create a new state when handle collision
 * @param state current state
 * @returns new state
 */
const handleCollision = (state: State): State => {

    // Combine all existing cubes
    const allCubes: ReadonlyArray<Cube> = state.previous.concat(state.activeTetro.arr)
  
    // Find the rows of cubes that is going to be clear
    // Condition: whole row is full with cubes
    const rowsToClear = state.activeTetro.arr.map((curCube) => allCubes.filter((cube) => curCube.y === cube.y))
                      .filter(arr => arr.length === Viewport.CANVAS_WIDTH / Block.WIDTH)
  
    // Check the cube that is not going to be clear
    const toStay = (cube: Cube): boolean => rowsToClear.reduce(
                                            (bool, cubesInSameRow) => bool && cubesInSameRow[0].y != cube.y
                                            , true)
  
    // Get the cubes that should be stayed in the state (in both active tetro and previous tetro)
    const filteredActiveCubes = state.activeTetro.arr.filter(toStay)
    const filteredPrevCubes = state.previous.filter(toStay)
    const filteredCubes = filteredActiveCubes.concat(filteredPrevCubes)

    // Get the cubes that should be cleared (in both active tetro and previous tetro)
    const delCubes = state.activeTetro.arr.filter(not(toStay)).concat(state.previous.filter(not(toStay)))
  
    // Check if any cube reach the top (coordinate y = 0)
    const reachTopCubes = state.activeTetro.arr.reduce((bool, cube) => bool || cube.y === "0", false)
  
    // Create new state with updated active and previous cubes
    const newPattern = allBlock[randomNumber(state.nextRandNum.value)]
    const newStyle = allColour[randomNumber(state.nextRandNum.value)]
    const newTetroArr = flatten(createTetro(Number(state.nextTetro.id)+1, newPattern))
    const newState: State = {
      ...state,
      previous: filteredCubes,
      activeTetro: {...state.activeTetro, id: state.nextTetro.id, 
                                        arr: state.nextTetro.arr, 
                                        x: "0", 
                                        y: "0", 
                                        pattern: state.nextTetro.pattern, 
                                        style: state.nextTetro.style},
      nextTetro: {...state.nextTetro, id: String(Number(state.nextTetro.id)+1),
                                    arr: newTetroArr, 
                                    pattern: newPattern, 
                                    style: newStyle},
      score: state.score + delCubes.length,
      delTetro: delCubes,
      gameEnd: reachTopCubes,
      highscore: reachTopCubes ? 
                (state.highscore < state.score ? state.score : state.highscore) 
                : state.highscore,
      nextRandNum: state.nextRandNum.next(),
      level: (state.score + delCubes.length) >= 50*state.level ? state.level + 1 : state.level,
    } as State

    return newState
  };

/**
 * Applied the change of details of tetromino to all of the cubes in the tetromino
 */
const changeAtt = (state: State): State => {
    const newTetroArr = 
      state.activeTetro.arr.map(cube => ({
        ...cube,
        x: `${Number(cube.x) + Number(state.activeTetro.x)}`,
        y: `${Number(cube.y) + Number(state.activeTetro.y)}`,
        style: `fill: ${state.activeTetro.style}`
      }))
    const newState = {...state, activeTetro: {...state.activeTetro, arr: newTetroArr, x: "0", y: "0"}}
    return newState
}

/**
 * Drop all the cubes which is above the rows that has been cleared
 */
const moveDownRows = (state: State): State => {

    if(state.delTetro.length >= Constants.GRID_WIDTH){ // there are some rows need to be cleared

        // Find the number of rows to be delete
        const delRowsNum = state.delTetro.length / 10

        // Find the y coordinate of the hightest cleared row
        const highestY = state.delTetro.reduce((acc, cube) => Number(cube.y) <= acc ? 
                                                              Number(cube.y) : acc, Viewport.CANVAS_HEIGHT - Block.HEIGHT)

        // A function to drop the cubes (change y coordinate)
        const drop = (cube: Cube) => Number(cube.y) + delRowsNum * Block.HEIGHT

        // A function to find the cubes above the cleared rows, and change their coordinates
        const dropRows = (cube: Cube) => Number(cube.y) < highestY ? {...cube, y: String(drop(cube))} as Cube : cube

        // Create new state with new active and previous cubes after some cubes is cleared
        const newActiveTetroArr = state.activeTetro.arr.map(dropRows)
        const newPreviousArr = state.previous.map(dropRows)
        return {...state, activeTetro: {...state.activeTetro, arr: newActiveTetroArr}, previous: newPreviousArr}
    }
    else return state
  }

/**
 * Apply a list of function to the incoming state, to output the updated state, that is going to be update to the html
 */
const reduceState = (state: State, action: Action): State => {

    // Return a new empty delTetro if some rows is cleared
    const newState = state.delTetro.length >= Constants.GRID_WIDTH ? {...state, delTetro: []} : state

    return moveDownRows(changeAtt(action.apply(newState)))
  }