// Utility functions and definitions.
// Nothing here is specific to tetris.
// Everything is designed to be as reusable as possible in many different contexts.
export { RNG, newFlatMap, not, isNotNullOrUndefined, naturalNumbers, randomNumber, initialDetails, transpose, reverse }

import { LazySequence } from "./types"

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes.
 * Source: FIT2102, tutorial4
 */
abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;
  
    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;
  
    /**
     * Takes hash value and scales it to the range [0, 6]
     */
    public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) * 7/2;
}

/**
 * apply f to every element of a and return the result in a flat array
 * @param a an array
 * @param f a function that produces an array
 * 
 * Source: Tim's code stuff, FRP Asteroids
 * Source Link: https://stackblitz.com/edit/asteroids2023?file=src%2Futil.ts 
 */
const newFlatMap = <T, U>(
    a: ReadonlyArray<T>, 
    f: (a: T) => ReadonlyArray<U>
): ReadonlyArray<U> =>
    Array.prototype.concat(...a.map(f));

/**
 * Composable not: invert boolean result of given function
 * @param f a function returning boolean
 * @param x the value that will be tested with f
 * 
 * Source: Tim's code stuff, FRP Asteroids
 * Source Link: https://stackblitz.com/edit/asteroids2023?file=src%2Futil.ts 
 */
const not = <T>(f: (x: T) => boolean) => (x: T) => !f(x)

/**
 * Type guard for use in filters
 * @param input something that might be null or undefined
 * 
 * Source: Tim's code stuff, FRP Asteroids
 * Source Link: https://stackblitz.com/edit/asteroids2023?file=src%2Futil.ts 
 */
function isNotNullOrUndefined<T extends object>(input: null | undefined | T): input is T {
    return input != null;
}

/**
 * Access next value by calling the next function in this function
 * @returns a lazy sequence of number
 * 
 *  * Source: Tim's code stuff, Lazy Evaluation
 * Source Link: https://tgdwyer.github.io/lazyevaluation/ 
 */
function naturalNumbers() {
    return function _next(v:number):LazySequence<number> {
        return {
            value: v,
            next: ()=>_next(RNG.hash(v))
        }
    }(17)
  }

/**
 * Scale the input number within ideal range and make it into integer
 */
const randomNumber = (num: number): number => Math.floor(RNG.scale(num))

/**
 * Access the initial and next random number
 * @returns an object with attributes of initial random number and next random number
 */
const initialDetails = (): {initialRandNum: number, initialNextRandNum: number} => {
    const initialRandNum = randomNumber(naturalNumbers().value)
    const initialNextRandNum = randomNumber(naturalNumbers().next().value)
    return {initialRandNum: initialRandNum, initialNextRandNum: initialNextRandNum}
}

/**
 * Transpose the matrix in the diagonal
 * @param matrix Current matrix/2d array
 * @returns Updated matrix
 */
const transpose = ((matrix: number[][]): number[][] => 
                    matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex])))

/**
 * Flip the matrix left and right
 * @param matrix Current matrix
 * @returns Flipped matrix
 */
const reverse = (matrix: number[][]): number[][] => 
                matrix.map((item,index) => matrix[matrix.length - index - 1])