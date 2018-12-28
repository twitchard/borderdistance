'use strict'
const NUM_ITERS = 15
const STEP_SIZE = 0.01
const CONVERGENCE_MARGIN = 0.001

/**
 * Newton minimization using default tunable values
 * @param f
 *   univariate, real-valued function to minimize
 * @param initialGuess
 *   point in domain at which to start estimation
 */
exports.minimize = tunableMinimize.bind(null,
    NUM_ITERS,
    STEP_SIZE,
    CONVERGENCE_MARGIN
)

// For debugging
function graph (f, l) {
    l.map((x) => {
        console.log(`f(${x}) = ${f(x)}`)
    })
}

/**
 * @param numIters
 *   Maximum number of times to iterate.
 * @param stepSize
 *   Estimate f'(x) by f(x + stepSize / 2) - f(x - stepSize / 2) / stepSize
 * @param convergenceMargin
 *   Consider the function to have converged if the absolute value of the
 *   difference between successive iterations is smaller than this value.
 * @param f
 *   univariate, real-valued function to minimize
 * @param initialGuess
 *   point in domain at which to start estimation
 */
function tunableMinimize (numIters, stepSize, convergenceMargin, f, initialGuess) {
    //graph(f, [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    let cur = initialGuess
    const points = [initialGuess]
    for (let i = 1; i <= numIters; i++) {
        try {
            const next = cur - estimateFirstDerivative(f, cur, stepSize) / estimateSecondDerivative(f, cur, stepSize)
            if (Math.abs(cur-next) < convergenceMargin) {
                return next
            }
            cur = next
            points.push(next)
        }
        catch (err) {
            return false
        }
    }
    return false
}
exports.tunableMinimize = tunableMinimize

function estimateFirstDerivative(f, x, stepSize) {
    const ret = (f(x + stepSize) - f(x - stepSize)) / (2 * stepSize)


    return ret
}

function estimateSecondDerivative(f, x, stepSize) {
    const ret = (estimateFirstDerivative(f, x + stepSize, x) - estimateFirstDerivative(f, x - stepSize, x)) / (2 * stepSize)
    return ret
}
