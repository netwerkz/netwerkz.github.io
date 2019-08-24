const Vector2   = THREE.Vector2
const Vector3   = THREE.Vector3
const Vector4   = THREE.Vector4
const Color     = THREE.Color
const Group     = THREE.Group
const RADIANS   = Math.PI / 180
const TURN      = RADIANS * 90
const ORIGIN    = new Vector3(0, 0, 0)
const RIGHT     = new Vector3(1, 0, 0)
const LEFT      = new Vector3(-1, 0, 0)
const UP        = new Vector3(0, 1, 0)
const DOWN      = new Vector3(0, -1, 0)
const FRONT     = new Vector3(0, 0, -1)
const BACK      = new Vector3(0, 0, 1)
const FACE_COLORS = ['RED', 'ORANGE', 'GREEN', 'BLUE', 'WHITE', 'YELLOW']
const axes      = [RIGHT, FRONT, UP]
const transparent = new Color(0,0,0,0)
let gridX, gridY, gridZ
const buttons = new Group()

const colorsHexa = {
    RED: 0xff0000,
    GREEN: 0x00aa00,
    BLUE: 0x0033dd,
    WHITE: 0xffffff,
    YELLOW: 0xbbbb00,
    ORANGE: 0xff4400,
    BLACK: 0x000000,    
}
const materials = {
    // TODO: MeshStandardMaterial
    RED: new THREE.MeshPhongMaterial({ color: colorsHexa.RED, side: THREE.FrontSide }),
    GREEN: new THREE.MeshPhongMaterial({ color: colorsHexa.GREEN, side: THREE.FrontSide }),
    BLUE: new THREE.MeshPhongMaterial({ color: colorsHexa.BLUE, side: THREE.FrontSide }),
    WHITE: new THREE.MeshPhongMaterial({ color: colorsHexa.WHITE, side: THREE.FrontSide }),
    YELLOW: new THREE.MeshPhongMaterial({ color: colorsHexa.YELLOW, side: THREE.FrontSide }),
    ORANGE: new THREE.MeshPhongMaterial({ color: colorsHexa.ORANGE, side: THREE.FrontSide }),
    BLACK: new THREE.MeshPhongMaterial({ color: colorsHexa.BLACK, side: THREE.FrontSide }),
}

class Move {
    /**
     * @param {Vector3} axis normalized
     * @param {int} offset -1/+1
     * @param {int} direction -1/+1
     */
    constructor(axis, offset, direction) {
        this.axis = axis.clone()
        this.offset = offset
        this.direction = direction
        console.assert(offset == 1 || offset == -1, 'Offset value is invalid')
        console.assert(direction == 1 || direction == -1, 'Direction value is invalid')
    }
}

const LeftCW    = new Move(LEFT, 1, 1)
const LeftCCW   = new Move(LEFT, 1, -1)
const RightCW   = new Move(LEFT, -1, 1)
const RightCCW  = new Move(LEFT, -1, -1)
const FrontCW   = new Move(FRONT, -1, 1)
const FrontCCW  = new Move(FRONT, -1, -1)
const BackCW    = new Move(FRONT, 1, 1)
const BackCCW   = new Move(FRONT, 1, -1)
const TopCW     = new Move(UP, 1, 1)
const TopCCW    = new Move(UP, 1, -1)
const BottomCW  = new Move(UP, -1, 1)
const BottomCCW = new Move(UP, -1, -1)

const STATE_IDLE    = 'IDLE'
const STATE_SOLVE   = 'SOLVING'
const STATE_SCRAMBLE = "SCRAMBLING"

const state = {
    grid: [],
    onAxis: null,
    t: 0,
    is: STATE_IDLE,
    movesQueue: [],
    countMoves: 0,
    isInFinalStep: false,
    next: null
}

const SOLVER_PHASE = {    
    WHITE_CROSS_1_RED_WHITE: 'WHITE_CROSS_1_RED_WHITE',
    WHITE_CROSS_2_ORANGE_WHITE: 'WHITE_CROSS_2_ORANGE_WHITE',
    WHITE_CROSS_3_GREEN_WHITE: 'WHITE_CROSS_3_GREEN_WHITE',
    WHITE_CROSS_BLUE_WHITE: 'WHITE_CROSS_BLUE_WHITE',
    T_1_WHITE_RED_GREEN: 'T_1_WHITE_RED_GREEN',
    T_2_WHITE_RED_BLUE: 'T_2_WHITE_RED_BLUE',
    T_3_WHITE_ORANGE_GREEN: 'T_3_WHITE_ORANGE_GREEN',
    T_4_WHITE_ORANGE_BLUE: 'T_4_WHITE_ORANGE_BLUE',
    SECOND_LAYER_1_RED_GREEN: 'SECOND_LAYER_1_RED_GREEN', // if wrong orientation, do it twice
    SECOND_LAYER_2_RED_BLUE: 'SECOND_LAYER_2_RED_BLUE', // if wrong orientation, do it twice
    SECOND_LAYER_3_ORANGE_GREEN: 'SECOND_LAYER_3_ORANGE_GREEN', // if wrong orientation, do it twice
    SECOND_LAYER_4_ORANGE_BLUE: 'SECOND_LAYER_4_ORANGE_BLUE', // if wrong orientation, do it twice
    YELLOW_CROSS_L: 'YELLOW_CROSS_L',
    YELLOW_CROSS_I: 'YELLOW_CROSS_I',
    YELLOW_CROSS_X: 'YELLOW_CROSS_X',
    YELLOW_EDGES_1_RED_YELLOW: 'Y_E_1_RED_YELLOW',
    YELLOW_EDGES_2_GREEN_YELLOW: 'Y_E_2_GREEN_YELLOW',
    YELLOW_EDGES_3_ORANGE_YELLOW: 'Y_E_3_ORANGE_YELLOW',
    YELLOW_CORNERS_NO_CORRECT_PIECE: 'Y_C_NO_CORRECT_PIECE',
    YELLOW_CORNERS_AT_LEAST_ONE_CORRECT_PIECE: 'Y_C_AT_LEAST_ONE_CORRECT_PIECE',
    YELLOW_CORNERS_ALL_IN_CORRECT_PLACE: 'Y_C_ALL_IN_CORRECT_PLACE',
    FINAL_STEP: 'FINAL_STEP',
    COMPLETE: 'COMPLETE'
}

const clock = new THREE.Clock()
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x333333)

const mainCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000)
mainCamera.position.x = 2
mainCamera.position.y = 2.5
mainCamera.position.z = 5
mainCamera.viewport = new Vector4(0, 0, window.innerWidth, window.innerHeight)
mainCamera.updateMatrixWorld()

const topCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 1, 5)
topCamera.position.x = 0
topCamera.position.y = 3
topCamera.position.z = 0
topCamera.lookAt(0, 0, 0)
topCamera.updateMatrixWorld()
const cameraHelper = new THREE.CameraHelper(topCamera)
scene.add(cameraHelper)
scene.add(topCamera)

const bottomCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 1, 5)
bottomCamera.position.x = 0
bottomCamera.position.y = -3
bottomCamera.position.z = 0
bottomCamera.lookAt(0, 0, 0)
bottomCamera.updateMatrixWorld()
scene.add(bottomCamera)

const leftCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 1, 5)
leftCamera.position.x = -3
leftCamera.position.y = 0
leftCamera.position.z = 0
leftCamera.lookAt(0, 0, 0)
leftCamera.updateMatrixWorld()
scene.add(leftCamera)

const rightCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 1, 5)
rightCamera.position.x = 3
rightCamera.position.y = 0
rightCamera.position.z = 0
rightCamera.lookAt(0, 0, 0)
rightCamera.updateMatrixWorld()
scene.add(rightCamera)

const frontCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 1, 5)
frontCamera.position.x = 0
frontCamera.position.y = 0
frontCamera.position.z = 3
frontCamera.lookAt(0, 0, 0)
frontCamera.updateMatrixWorld()
scene.add(frontCamera)

const backCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 1, 5)
backCamera.position.x = 0
backCamera.position.y = 0
backCamera.position.z = -3
backCamera.lookAt(0, 0, 0)
backCamera.updateMatrixWorld()
scene.add(backCamera)

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.gammaInput = true
renderer.gammaOutput = true

const orbit = new THREE.OrbitControls(mainCamera, renderer.domElement)
orbit.update()
orbit.addEventListener('change', render)

const container = document.getElementById('canvas')
container.appendChild(renderer.domElement)
window.addEventListener('resize', onWindowResize, false)
document.querySelector('#randomize').addEventListener('click', function (e) { 
    pushRandomMoves(10)
    state.is = STATE_SCRAMBLE
    state.isInFinalStep = false
    state.countMoves = 0
    doNextMove()    
})
document.querySelector('#solve').addEventListener('click', function (e) { 
    state.movesQueue = [] // reset queue
    state.is = STATE_SOLVE
    state.isInFinalStep = false
    state.countMoves = 0
    doNextMove()
})
document.querySelector('#stop').addEventListener('click', function (e) { 
    state.movesQueue = [] // reset queue
    state.isInFinalStep = false
    state.countMoves = 0
    state.is = STATE_IDLE
})
const info = document.querySelector('#info')
const speedInputs = [...document.querySelectorAll('[name="speed"]')]
const debug = document.querySelector('#debug')

function startRotation(move) {
    if (state.t) return

    state.onAxis = move.axis.clone()
    state.onAxis.multiplyScalar(move.offset)
    state.t = 0.0
    state.direction = move.direction
    state.offset = move.offset

    // play a sound
    const i = Math.floor((Math.random() * 6) + 1)
    const filename = 'sounds/rubik-0'+i+'.wav'
    const audio = new Audio(filename)
    audio.play()
}

function animate() {
    const axis = state.onAxis
    let dt = clock.getDelta() * speedInputs.find(el => el.checked).value
    if (axis) {
        state.t += dt
        if (state.t >= 1) {
            dt -= state.t - 1.0 // clamp overflow
        }

        for (const piece of state.grid) {
            if ((axis.x && piece.positionBeforeAnimation.x == axis.x) ||
                (axis.y && piece.positionBeforeAnimation.y == axis.y) ||
                (axis.z && piece.positionBeforeAnimation.z == axis.z)) {
                piece.rotateOnWorldAxis(axis, TURN * dt * -state.direction)
                piece.dynamicPosition.applyAxisAngle(axis, TURN * dt * -state.direction)
            }
        }

        // On move stop
        if (state.t >= 1) {
            for (let piece of state.grid) {
                // correct rounding errors
                piece.positionBeforeAnimation = piece.dynamicPosition.round().clone()
                if ((axis.x && piece.positionBeforeAnimation.x == axis.x) || 
                    (axis.y && piece.positionBeforeAnimation.y == axis.y) || 
                    (axis.z && piece.positionBeforeAnimation.z == axis.z)) {
                    for(const faceColor of FACE_COLORS) {
                        if(piece.userData[faceColor]) {
                            piece.userData[faceColor].applyAxisAngle(axis, TURN * -state.direction).round()
                        }
                    }
                    
                    // this is needed so we also track the piece rotation for later checks
                    piece.userData.right.applyAxisAngle(axis, TURN * -state.direction).round()
                    piece.userData.up.applyAxisAngle(axis, TURN * -state.direction).round()
                    piece.userData.front.applyAxisAngle(axis, TURN * -state.direction).round()
                }
            }

            state.onAxis = null
            state.t = 0
            doNextMove()
        }
    }

    const onAxisText = state.onAxis ? '[' + state.onAxis.x + ',' + state.onAxis.y + ',' + state.onAxis.z + ']': null
    let infoText = 'STATE: ' + state.is 
    infoText += '<br> SPEED: ' + speedInputs.find(el => el.checked).value + '/s'
    infoText += '<br> AXIS: ' + onAxisText
    infoText += '<br> DELTA: ' + state.t.toFixed(2) + ' s'
    infoText += '<br> QUEUED: ' + state.movesQueue.length + ' moves'
    infoText += '<br> STEP: ' + state.next
    infoText += '<br> Solved in ' + state.countMoves + ' moves'
    info.innerHTML = infoText
    
    requestAnimationFrame(animate)
    render()
}

function isPieceInPlace(ref, x, y, z) {
    const name  = `${x},${y},${z}`
    ref.piece   = state.grid.find(piece => piece.name == name)
    const piece = ref.piece
    const isCorrectPosition         = piece.dynamicPosition.equals(piece.solvedPosition)
    const isCorrectRightOrientation = piece.userData.right.equals(RIGHT)
    const isCorrectUpOrientation    = piece.userData.up.equals(UP)
    const isCorrectFrontOrientation = piece.userData.front.equals(FRONT)
    ref.rotationOk = isCorrectRightOrientation && isCorrectUpOrientation && isCorrectFrontOrientation
    return isCorrectPosition && ref.rotationOk
}

function getNextPhase(ref = {}) {
    ref.piece = null
    // ref.rotationOk = false
    if(isCubeSolved()) {
        state.isInFinalStep = false
        return SOLVER_PHASE.COMPLETE
    }
    if(state.isInFinalStep) return SOLVER_PHASE.FINAL_STEP
    if(!isPieceInPlace(ref, 0, 1, 1)) return SOLVER_PHASE.WHITE_CROSS_1_RED_WHITE
    if(!isPieceInPlace(ref, 0, 1,-1)) return SOLVER_PHASE.WHITE_CROSS_2_ORANGE_WHITE
    if(!isPieceInPlace(ref,-1, 1, 0)) return SOLVER_PHASE.WHITE_CROSS_3_GREEN_WHITE
    if(!isPieceInPlace(ref, 1, 1, 0)) return SOLVER_PHASE.WHITE_CROSS_BLUE_WHITE
    if(!isPieceInPlace(ref,-1, 1, 1)) return SOLVER_PHASE.T_1_WHITE_RED_GREEN
    if(!isPieceInPlace(ref, 1, 1, 1)) return SOLVER_PHASE.T_2_WHITE_RED_BLUE
    if(!isPieceInPlace(ref,-1, 1,-1)) return SOLVER_PHASE.T_3_WHITE_ORANGE_GREEN
    if(!isPieceInPlace(ref, 1, 1,-1)) return SOLVER_PHASE.T_4_WHITE_ORANGE_BLUE
    if(!isPieceInPlace(ref,-1, 0, 1)) return SOLVER_PHASE.SECOND_LAYER_1_RED_GREEN
    if(!isPieceInPlace(ref, 1, 0, 1)) return SOLVER_PHASE.SECOND_LAYER_2_RED_BLUE
    if(!isPieceInPlace(ref,-1, 0,-1)) return SOLVER_PHASE.SECOND_LAYER_3_ORANGE_GREEN
    if(!isPieceInPlace(ref, 1, 0,-1)) return SOLVER_PHASE.SECOND_LAYER_4_ORANGE_BLUE
    
    // get all down facing yellow pieces, except center middle one
    const yellowCrossPieces = state.grid.filter(el => el.userData.YELLOW && el.userData.YELLOW.equals(DOWN) && ((el.dynamicPosition.x + el.dynamicPosition.z) == -1 || (el.dynamicPosition.x + el.dynamicPosition.z) == 1)) 
    
    // solve for yellow L
    if(yellowCrossPieces.length == 0) return SOLVER_PHASE.YELLOW_CROSS_L

    // solve for yellow I
    if(yellowCrossPieces.length == 2 && yellowCrossPieces[0].dynamicPosition.x != yellowCrossPieces[1].dynamicPosition.x && yellowCrossPieces[0].dynamicPosition.z != yellowCrossPieces[1].dynamicPosition.z) return SOLVER_PHASE.YELLOW_CROSS_I

    // solve for yellow cross
    if(yellowCrossPieces.filter(el => el.userData.YELLOW.equals(DOWN)).length == 2) return SOLVER_PHASE.YELLOW_CROSS_X

    if(!isPieceInPlace(ref, 0, -1, 1)) return SOLVER_PHASE.YELLOW_EDGES_1_RED_YELLOW
    if(!isPieceInPlace(ref,-1, -1, 0)) return SOLVER_PHASE.YELLOW_EDGES_2_GREEN_YELLOW
    if(!isPieceInPlace(ref, 0, -1,-1)) return SOLVER_PHASE.YELLOW_EDGES_3_ORANGE_YELLOW
    if(!isPieceInPlace(ref, 1, -1, 0)) return SOLVER_PHASE.YELLOW_EDGES_4_BLUE_YELLOW
    
    const leftFrontCorner = state.grid.find(el => el.dynamicPosition.x == -1 && el.dynamicPosition.z == 1 &&  el.dynamicPosition.y == -1)
    const isFrontLeftCornerInPosition = leftFrontCorner.userData.RED && leftFrontCorner.userData.GREEN

    const rightFrontCorner = state.grid.find(el => el.dynamicPosition.x == 1 && el.dynamicPosition.z == 1 &&  el.dynamicPosition.y == -1)
    const isFrontRightCornerInPosition = rightFrontCorner.userData.RED && rightFrontCorner.userData.BLUE

    const leftBackCorner = state.grid.find(el => el.dynamicPosition.x == -1 && el.dynamicPosition.z == -1 &&  el.dynamicPosition.y == -1)
    const isBackLeftCornerInPosition = leftBackCorner.userData.ORANGE && leftBackCorner.userData.GREEN

    const rightBackCorner = state.grid.find(el => el.dynamicPosition.x == 1 && el.dynamicPosition.z == -1 &&  el.dynamicPosition.y == -1)
    const isBackRightCornerInPosition = rightBackCorner.userData.ORANGE && rightBackCorner.userData.BLUE
    
    ref.cornerBottomFrontLeft = isFrontLeftCornerInPosition
    ref.cornerBottomFrontRight = isFrontRightCornerInPosition
    ref.cornerBottomBackLeft = isBackLeftCornerInPosition
    ref.cornerBottomBackRight = isBackRightCornerInPosition

    if(!isFrontLeftCornerInPosition && !isFrontRightCornerInPosition && !isBackLeftCornerInPosition && !isBackRightCornerInPosition) return  SOLVER_PHASE.YELLOW_CORNERS_NO_CORRECT_PIECE

    if(!isFrontLeftCornerInPosition || !isFrontRightCornerInPosition || !isBackLeftCornerInPosition || !isBackRightCornerInPosition) return  SOLVER_PHASE.YELLOW_CORNERS_AT_LEAST_ONE_CORRECT_PIECE

    if(isFrontLeftCornerInPosition && isFrontRightCornerInPosition && isBackLeftCornerInPosition && isBackRightCornerInPosition) return  SOLVER_PHASE.YELLOW_CORNERS_ALL_IN_CORRECT_PLACE
}

function doNextMove() {
    const ref = { piece: null, rotationOk: false }
    state.next = getNextPhase(ref)
    const piece = ref.piece

    if (state.is == STATE_SCRAMBLE) {
        if (state.movesQueue.length == 0) { // done scrambling
            state.is = STATE_IDLE
        }
    } else if (state.next == SOLVER_PHASE.COMPLETE) { // done solving
        state.is = STATE_IDLE
    } else if (state.is == STATE_SOLVE) {
        if (state.movesQueue.length == 0) { // pump moves onto queue if queue is empty
            switch (state.next) {
                case SOLVER_PHASE.WHITE_CROSS_1_RED_WHITE:
                    {
                        if(piece.dynamicPosition.y == 1) { // top
                            if(piece.dynamicPosition.z == -1) { // back
                                rotate(TopCCW) // bring to side
                            } else if(piece.dynamicPosition.z == 0) {
                                rotate(new Move(UP, 1, piece.dynamicPosition.x)) // bring to front
                            } else if(!ref.rotationOk) {
                                rotate(FrontCW) // bring to front
                            }
                        } else if (piece.dynamicPosition.y == 0) { // middle
                            if(piece.dynamicPosition.z == 1) {
                                if(piece.userData.RED.equals(FRONT)) {
                                    rotate(new Move(FRONT, -1, -piece.dynamicPosition.x))
                                } else {
                                    rotate(new Move(FRONT, -1, piece.dynamicPosition.x))
                                    rotate(BottomCW)
                                    rotate(RightCW)
                                }
                            } else {
                                rotate(new Move(RIGHT, piece.dynamicPosition.x, 1))
                                rotate(new Move(RIGHT, piece.dynamicPosition.x, 1))
                            }
                        } else { // bottom
                            if(piece.userData.RED.equals(FRONT)) {
                                rotate(FrontCCW)
                            } else {
                                if(piece.dynamicPosition.z == -1 || piece.dynamicPosition.z == 0) {
                                    rotate(BottomCW)
                                } else if(!ref.rotationOk) {
                                    rotate(FrontCW)
                                }
                            }
                        }
                    }                    
                    break
                case SOLVER_PHASE.WHITE_CROSS_2_ORANGE_WHITE:
                    {
                        if(piece.dynamicPosition.y == 1) { // top
                            if(piece.dynamicPosition.z == 0) { // middle
                                rotate(new Move(RIGHT, piece.dynamicPosition.x, piece.dynamicPosition.x))
                            } else if(!ref.rotationOk) { // fix rotation
                                rotate(BackCW)
                                rotate(BackCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BackCCW)
                            }
                        } else if (piece.dynamicPosition.y == 0) { // middle
                            if(piece.dynamicPosition.z == -1) { // back
                                if(piece.userData.ORANGE.equals(BACK)) {
                                    rotate(new Move(BACK, -1, piece.dynamicPosition.x))
                                } else {
                                    rotate(new Move(RIGHT, piece.dynamicPosition.x, piece.dynamicPosition.x))
                                    rotate(new Move(DOWN, 1, piece.dynamicPosition.x))
                                }
                            } else { // front
                                rotate(new Move(RIGHT, piece.dynamicPosition.x, piece.dynamicPosition.x))
                            }
                        } else { // bottom
                            if(piece.dynamicPosition.z != -1) { // bring to back
                                rotate(BottomCW)
                            } else if (!piece.userData.ORANGE.equals(BACK)) { // fix rotation
                                rotate(BackCW)
                                rotate(RightCW)
                                rotate(BottomCW)
                            } else { // bring up
                                rotate(BackCW)
                                rotate(BackCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.WHITE_CROSS_3_GREEN_WHITE:
                    {
                        if(piece.dynamicPosition.y == 1) { // top
                            rotate(new Move(RIGHT, piece.dynamicPosition.x, piece.dynamicPosition.x))
                            rotate(new Move(RIGHT, piece.dynamicPosition.x, piece.dynamicPosition.x))
                        } else if (piece.dynamicPosition.y == 0) { // middle
                            if(piece.userData.GREEN.equals(LEFT)) {
                                rotate(new Move(RIGHT, piece.dynamicPosition.x, -piece.dynamicPosition.z))
                            } else {
                                rotate(new Move(RIGHT, piece.dynamicPosition.x, piece.dynamicPosition.x))
                            }                            
                        } else { // bottom
                            if(piece.userData.GREEN.equals(LEFT)) { // bring to top
                                rotate(LeftCW)
                                rotate(LeftCW)
                            } else if(piece.dynamicPosition.x ==  1) { // bring to left
                                rotate(BottomCW)
                                rotate(BottomCW)
                            } else { // fix rotation
                                rotate(BottomCW)
                                rotate(FrontCW)
                                rotate(LeftCCW)
                                rotate(FrontCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.WHITE_CROSS_BLUE_WHITE:
                    {
                        if(piece.dynamicPosition.y == 1) { // top
                            // fix rotation
                            rotate(RightCW)
                            rotate(RightCW)
                            rotate(BottomCCW)
                            rotate(FrontCCW)
                            rotate(RightCW)
                            rotate(FrontCW)
                        } else if (piece.dynamicPosition.y == 0) { // middle
                            if(piece.dynamicPosition.x == -1) { // bring down
                                rotate(new Move(RIGHT, -1, piece.dynamicPosition.z))
                                rotate(BottomCW)
                            } else if(piece.userData.BLUE.equals(RIGHT)) { // bring up
                                rotate(new Move(RIGHT, 1, piece.dynamicPosition.z))
                            } else { // bring down
                                rotate(new Move(RIGHT, 1, -piece.dynamicPosition.z))
                            }
                        } else { // bottom
                            if(piece.dynamicPosition.x == -1) { // bring to front
                                rotate(BottomCW)
                            } else if(piece.dynamicPosition.x == 0) { // bring to right
                                rotate(new Move(UP, -1, piece.dynamicPosition.z))
                            } else if(piece.userData.BLUE.equals(RIGHT)) { // bring up
                                rotate(RightCW)
                            } else { // fix rotation
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                                rotate(RightCW)
                                rotate(FrontCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.T_1_WHITE_RED_GREEN: // -1, 1, 1
                    {
                        if(piece.dynamicPosition.y == -1) {
                            if(piece.dynamicPosition.z != 1 || piece.dynamicPosition.x != -1) {
                                rotate(BottomCW) // bring under correct position
                            } else { // bring up in correct position
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                            }
                        } else {
                            if(piece.dynamicPosition.equals(new Vector3(1, 1, 1))) { // top front right
                                rotate(RightCCW)
                                rotate(BottomCCW)
                                rotate(RightCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(1, 1, -1))) { // top back right
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(-1, 1, -1))) { // top back left
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(LeftCW)
                            } else { // fix rotation
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.T_2_WHITE_RED_BLUE: // 1, 1, 1
                    {
                        if(piece.dynamicPosition.y == -1) {
                            if(piece.dynamicPosition.z != 1 || piece.dynamicPosition.x != 1) {
                                rotate(BottomCW) // bring under correct position
                            } else { // bring up in correct position
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                            }
                        } else {
                            if(piece.dynamicPosition.equals(new Vector3(-1, 1, 1))) { // top front left
                                rotate(LeftCW)
                                rotate(BottomCW)
                                rotate(LeftCCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(1, 1, -1))) { // top back right
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(-1, 1, -1))) { // top back left
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(LeftCW)
                            } else { // fix rotation
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.T_3_WHITE_ORANGE_GREEN: // -1, 1, -1
                    {
                        if(piece.dynamicPosition.y == -1) {
                            if(piece.dynamicPosition.z != -1 || piece.dynamicPosition.x != -1) {
                                rotate(BottomCW) // bring under correct position
                            } else { // bring up in correct position
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            }
                        } else {
                            if(piece.dynamicPosition.equals(new Vector3(-1, 1, 1))) { // top front left
                                rotate(LeftCW)
                                rotate(BottomCW)
                                rotate(LeftCCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(1, 1, -1))) { // top back right
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(1, 1, 1))) { // top front right
                                rotate(RightCCW)
                                rotate(BottomCCW)
                                rotate(RightCW)
                            } else { // fix rotation
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            }                            
                        }
                    }
                    break
                case SOLVER_PHASE.T_4_WHITE_ORANGE_BLUE: // 1, 1, -1
                    {
                        if(piece.dynamicPosition.y == -1) {
                            if(piece.dynamicPosition.z != -1 || piece.dynamicPosition.x != 1) {
                                rotate(BottomCW) // bring under correct position
                            } else { // bring up in correct position
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            }
                        } else { 
                            if(piece.dynamicPosition.equals(new Vector3(-1, 1, -1))) { // top back left
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(LeftCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(-1, 1, 1))) { // top front left
                                rotate(LeftCW)
                                rotate(BottomCW)
                                rotate(LeftCCW)
                            } else if(piece.dynamicPosition.equals(new Vector3(1, 1, 1))) { // top front right
                                rotate(RightCCW)
                                rotate(BottomCCW)
                                rotate(RightCW)
                            } else { // fix rotation
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            }                            
                        }
                    }
                    break
                case SOLVER_PHASE.SECOND_LAYER_1_RED_GREEN: // -1, 0, 1
                    {
                        if(piece.dynamicPosition.y == 0) { // middle
                            // bring to bottom
                            if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == -1) { // left back. bring down
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            } else if(piece.dynamicPosition.x == 1 && piece.dynamicPosition.z == -1) { // right back. bring down
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == 1) { // left front. bring down
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                            } else { // right front. bring down
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                            }
                        } else { // bottom
                            if(piece.dynamicPosition.z != 1) {
                                rotate(BottomCW)
                            } else { // left front. bring down
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.SECOND_LAYER_2_RED_BLUE: // 1, 0, 1
                    {
                        if(piece.dynamicPosition.y == 0) { // middle
                            // bring to bottom
                            if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == -1) { // left back. bring down
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            } else if(piece.dynamicPosition.x == 1 && piece.dynamicPosition.z == -1) { // right back. bring down
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == 1) { // left front. bring down
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                            } else { // right front. bring down
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                            }
                        } else { // bottom
                            if(piece.dynamicPosition.z != 1) {
                                rotate(BottomCW)
                            } else { // right front. bring down
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.SECOND_LAYER_3_ORANGE_GREEN: // -1, 0, -1
                    {
                        if(piece.dynamicPosition.y == 0) { // middle
                            // bring to bottom
                            if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == -1) { // left back. bring down
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            } else if(piece.dynamicPosition.x == 1 && piece.dynamicPosition.z == -1) { // right back. bring down
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == 1) { // left front. bring down
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                            } else { // right front. bring down
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                            }
                        } else { // bottom
                            if(piece.dynamicPosition.x != -1) {
                                rotate(BottomCW)
                            } else { // right front. bring down
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.SECOND_LAYER_4_ORANGE_BLUE: // 1, 0, -1
                    {
                        if(piece.dynamicPosition.y == 0) { // middle
                            // bring to bottom
                            if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == -1) { // left back. bring down
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCW)
                                rotate(LeftCW)
                            } else if(piece.dynamicPosition.x == 1 && piece.dynamicPosition.z == -1) { // right back. bring down
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            } else if(piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == 1) { // left front. bring down
                                rotate(BottomCW)
                                rotate(LeftCW)
                                rotate(BottomCCW)
                                rotate(LeftCCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                            } else { // right front. bring down
                                rotate(BottomCCW)
                                rotate(RightCCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCW)
                                rotate(FrontCW)
                                rotate(BottomCCW)
                                rotate(FrontCCW)
                            }
                        } else { // bottom
                            if(piece.dynamicPosition.x != 1) {
                                rotate(BottomCW)
                            } else { // back front. bring down
                                rotate(BottomCCW)
                                rotate(BackCCW)
                                rotate(BottomCW)
                                rotate(BackCW)
                                rotate(BottomCW)
                                rotate(RightCW)
                                rotate(BottomCCW)
                                rotate(RightCCW)
                            }
                        }
                    }
                    break
                case SOLVER_PHASE.YELLOW_CROSS_L:
                    {
                        // solve for L
                        rotate(BackCW)
                        rotate(LeftCW)
                        rotate(BottomCW)
                        rotate(LeftCCW)
                        rotate(BottomCCW)
                        rotate(BackCCW)
                    }
                    break
                case SOLVER_PHASE.YELLOW_CROSS_I:
                    {
                        const bottomLeft = state.grid.find(piece => piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == 0 && piece.dynamicPosition.y == -1)
                        const bottomFront = state.grid.find(piece => piece.dynamicPosition.x == 0 && piece.dynamicPosition.z == 1 && piece.dynamicPosition.y == -1)
                        if(bottomLeft.userData.YELLOW && bottomLeft.userData.YELLOW.equals(DOWN) && bottomFront.userData.YELLOW && bottomFront.userData.YELLOW.equals(DOWN)) {
                            // solve for I
                            rotate(BackCW)
                            rotate(RightCW)
                            rotate(BottomCW)
                            rotate(RightCCW)
                            rotate(BottomCCW)
                            rotate(BackCCW)
                        } else {
                            // bring in position for algo
                            rotate(BottomCW)
                        }
                    }
                    break
                case SOLVER_PHASE.YELLOW_CROSS_X:
                    {
                        const bottomLeft = state.grid.find(piece => piece.dynamicPosition.x == -1 && piece.dynamicPosition.z == 0 && piece.dynamicPosition.y == -1)
                        if(bottomLeft.userData.YELLOW && bottomLeft.userData.YELLOW.equals(DOWN)) { // solve for cross
                            rotate(BackCW)
                            rotate(RightCW)
                            rotate(BottomCW)
                            rotate(RightCCW)
                            rotate(BottomCCW)
                            rotate(BackCCW)
                        } else {
                            // bring in position for algo
                            rotate(BottomCW)
                        }
                    }
                    break
                case SOLVER_PHASE.YELLOW_EDGES_1_RED_YELLOW: // 0, -1, 1
                    {
                        rotate(BottomCW)
                    }
                    break
                case SOLVER_PHASE.YELLOW_EDGES_2_GREEN_YELLOW: // -1, -1, 0
                    {
                        if(piece.dynamicPosition.x == 1) { // bring to back
                            rotate(LeftCW)
                            rotate(BottomCW)
                            rotate(LeftCCW)
                            rotate(BottomCW)
                            rotate(LeftCW)
                            rotate(BottomCW)
                            rotate(BottomCW)
                            rotate(LeftCCW)
                            rotate(BottomCW)
                        } else { // bring to left
                            rotate(RightCW)
                            rotate(BottomCW)
                            rotate(RightCCW)
                            rotate(BottomCW)
                            rotate(RightCW)
                            rotate(BottomCW)
                            rotate(BottomCW)
                            rotate(RightCCW)
                            rotate(BottomCW)
                        }
                    }
                    break
                case SOLVER_PHASE.YELLOW_EDGES_3_ORANGE_YELLOW: // 0, -1, -1
                    {
                        rotate(LeftCW)
                        rotate(BottomCW)
                        rotate(LeftCCW)
                        rotate(BottomCW)
                        rotate(LeftCW)
                        rotate(BottomCW)
                        rotate(BottomCW)
                        rotate(LeftCCW)
                        rotate(BottomCW)
                    }
                    break
                case SOLVER_PHASE.YELLOW_CORNERS_NO_CORRECT_PIECE: // get at least one correct corner in place
                    { 
                        rotate(BottomCW)
                        rotate(RightCW)
                        rotate(BottomCCW)
                        rotate(LeftCCW)
                        rotate(BottomCW)
                        rotate(RightCCW)
                        rotate(BottomCCW)
                        rotate(LeftCW)
                    }
                    break
                case SOLVER_PHASE.YELLOW_CORNERS_AT_LEAST_ONE_CORRECT_PIECE: // get all corners into correct place
                    {
                        // only one check will pass:
                        if(ref.cornerBottomFrontLeft) {
                            rotate(BottomCW)
                            rotate(LeftCW)
                            rotate(BottomCCW)
                            rotate(RightCCW)
                            rotate(BottomCW)
                            rotate(LeftCCW)
                            rotate(BottomCCW)
                            rotate(RightCW)
                        } else if (ref.cornerBottomFrontRight) {
                            rotate(BottomCW)
                            rotate(FrontCW)
                            rotate(BottomCCW)
                            rotate(BackCCW)
                            rotate(BottomCW)
                            rotate(FrontCCW)
                            rotate(BottomCCW)
                            rotate(BackCW)
                        } else if (ref.cornerBottomBackLeft) {                            
                            rotate(BottomCW)
                            rotate(BackCW)
                            rotate(BottomCCW)
                            rotate(FrontCCW)
                            rotate(BottomCW)
                            rotate(BackCCW)
                            rotate(BottomCCW)
                            rotate(FrontCW)
                        } else if (ref.cornerBottomBackRight) {
                            rotate(BottomCW)
                            rotate(RightCW)
                            rotate(BottomCCW)
                            rotate(LeftCCW)
                            rotate(BottomCW)
                            rotate(RightCCW)
                            rotate(BottomCCW)
                            rotate(LeftCW)
                        }                        
                    }
                    break
                case SOLVER_PHASE.YELLOW_CORNERS_ALL_IN_CORRECT_PLACE:
                    state.isInFinalStep = true
                case SOLVER_PHASE.FINAL_STEP:
                    {
                        // detect which corner we need to rotate and how many times
                        let frontLeftTimes = 0
                        let frontRightTimes = 0
                        let backLeftTimes = 0
                        let backRightTimes = 0
                        
                        const frontLeftPiece = state.grid.find(piece => piece.name == '-1,-1,1')
                        if(frontLeftPiece.userData.YELLOW.equals(BACK)) {
                            frontLeftTimes = 4
                        } else if (frontLeftPiece.userData.YELLOW.equals(LEFT)) {
                            frontLeftTimes = 2
                        }

                        const frontRightPiece = state.grid.find(piece => piece.name == '1,-1,1')
                        if(frontRightPiece.userData.YELLOW.equals(RIGHT)) {
                            frontRightTimes = 4
                        } else if (frontRightPiece.userData.YELLOW.equals(BACK)) {
                            frontRightTimes = 2
                        }

                        const leftBackPiece = state.grid.find(piece => piece.name == '-1,-1,-1')
                        if(leftBackPiece.userData.YELLOW.equals(LEFT)) {
                            backLeftTimes = 4
                        } else if (leftBackPiece.userData.YELLOW.equals(FRONT)) {
                            backLeftTimes = 2
                        }

                        const rightBackPiece = state.grid.find(piece => piece.name == '1,-1,-1')
                        if(rightBackPiece.userData.YELLOW.equals(FRONT)) {
                            backRightTimes = 4
                        } else if (rightBackPiece.userData.YELLOW.equals(RIGHT)) {
                            backRightTimes = 2
                        }

                        // rotate the front left corner for how many times we need to
                        for(let i = 0; i < frontLeftTimes; i++) {
                            rotate(LeftCCW)
                            rotate(TopCCW)
                            rotate(LeftCW)
                            rotate(TopCW)                            
                        }

                        // bring left back corner in place and repeat
                        rotate(BottomCW)

                        // rotate the corner for how many times we need to
                        for(let i = 0; i < backLeftTimes; i++) {
                            rotate(LeftCCW)
                            rotate(TopCCW)
                            rotate(LeftCW)
                            rotate(TopCW)
                        }

                        // bring back right corner in place and repeat
                        rotate(BottomCW) 

                        // rotate the back right corner for how many times we need to
                        for(let i = 0; i < backRightTimes; i++) {
                            rotate(LeftCCW)
                            rotate(TopCCW)
                            rotate(LeftCW)
                            rotate(TopCW)
                        }

                        // bring front right corner in place and repeat 
                        rotate(BottomCW)

                        // rotate the corner for how many times we need to
                        for(let i = 0; i < frontRightTimes; i++) {
                            rotate(LeftCCW)
                            rotate(TopCCW)
                            rotate(LeftCW)
                            rotate(TopCW)
                        }

                        // fix final bottom rotation
                        rotate(BottomCW)
                    }
                    break
            }
        }
    }

    if(state.movesQueue.length > 0) {
        // count solve moves
        if(state.is == STATE_SOLVE) { state.countMoves++ }
        // deque next move and start it
        startRotation(state.movesQueue.shift())
    }
}

function rotate(move) { // wrapper
    state.movesQueue.push(move)
}

function isCubeSolved() {
    const faces = {}
    for (const piece of state.grid) {        
        for(const faceColor of FACE_COLORS) {
            if(piece.userData[faceColor]) {
                 // init cache:
                if(!faces[faceColor]) {
                    faces[faceColor] = piece.userData[faceColor].clone()
                }
                
                // compare with cache:
                if (!faces[faceColor].equals(piece.userData[faceColor])) {
                    return false
                }
            }
        }
    }
    
    return true
}

function onWindowResize() {
    mainCamera.aspect = window.innerWidth / window.innerHeight
    mainCamera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function render() {
    const aspect = window.innerWidth / window.innerHeight
    const PADDING = 10
    const ORTHO_SIZE = 150

    gridX.visible = debug.checked
    gridY.visible = debug.checked
    gridZ.visible = debug.checked
    buttons.visible = debug.checked

    // show camera helper
    cameraHelper.visible = debug.checked
    { // main camera
        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
        renderer.setScissor(0, 0, window.innerWidth, window.innerHeight)
        renderer.setScissorTest(true)
        // renderer.setClearColor( view.background )
        mainCamera.aspect = aspect
        mainCamera.updateProjectionMatrix()
        renderer.render(scene, mainCamera)
    }

    // hide camera helper
    cameraHelper.visible = false
    { // ortho camera top
        renderer.setViewport(PADDING, window.innerHeight - ORTHO_SIZE - PADDING , ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissor(PADDING, window.innerHeight - ORTHO_SIZE - PADDING, ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissorTest(true)
        topCamera.aspect = aspect
        topCamera.updateProjectionMatrix()
        renderer.render(scene, topCamera)

        // ortho camera bottom
        renderer.setViewport(ORTHO_SIZE + PADDING * 2, window.innerHeight - ORTHO_SIZE - PADDING , ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissor(ORTHO_SIZE + PADDING * 2, window.innerHeight - ORTHO_SIZE - PADDING, ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissorTest(true)
        bottomCamera.aspect = aspect
        bottomCamera.updateProjectionMatrix()
        renderer.render(scene, bottomCamera)

        // ortho camera left
        renderer.setViewport(ORTHO_SIZE * 2 + PADDING * 3, window.innerHeight - ORTHO_SIZE - PADDING , ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissor(ORTHO_SIZE * 2 + PADDING * 3, window.innerHeight - ORTHO_SIZE - PADDING, ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissorTest(true)
        leftCamera.aspect = aspect
        leftCamera.updateProjectionMatrix()
        renderer.render(scene, leftCamera)

        // ortho camera right
        renderer.setViewport(ORTHO_SIZE * 3 + PADDING * 4, window.innerHeight - ORTHO_SIZE - PADDING , ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissor(ORTHO_SIZE * 3 + PADDING * 4, window.innerHeight - ORTHO_SIZE - PADDING, ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissorTest(true)
        rightCamera.aspect = aspect
        rightCamera.updateProjectionMatrix()
        renderer.render(scene, rightCamera)

        // ortho camera front
        renderer.setViewport(ORTHO_SIZE * 4 + PADDING * 5, window.innerHeight - ORTHO_SIZE - PADDING , ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissor(ORTHO_SIZE * 4 + PADDING * 5, window.innerHeight - ORTHO_SIZE - PADDING, ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissorTest(true)
        frontCamera.aspect = aspect
        frontCamera.updateProjectionMatrix()
        renderer.render(scene, frontCamera)

        // ortho camera back
        renderer.setViewport(ORTHO_SIZE * 5 + PADDING * 6, window.innerHeight - ORTHO_SIZE - PADDING , ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissor(ORTHO_SIZE * 5 + PADDING * 6, window.innerHeight - ORTHO_SIZE - PADDING, ORTHO_SIZE, ORTHO_SIZE)
        renderer.setScissorTest(true)
        backCamera.aspect = aspect
        backCamera.updateProjectionMatrix()
        renderer.render(scene, backCamera)
    }
}

function pushRandomMoves(num) {
    for(let i = 0; i < num; i++) {
        const moves = [RightCW, RightCCW, LeftCW, LeftCCW, FrontCW, FrontCCW, BackCW, BackCCW, TopCW, TopCCW, BottomCW, BottomCCW]
        rotate(moves[Math.floor(Math.random() * moves.length)])
    }
}

function init() {
    { // setup buttons    
        const spriteMapCW = new THREE.TextureLoader().load("images/cw.png")
        const spriteMapCCW = new THREE.TextureLoader().load("images/ccw.png")
        
        addButtons(new Vector3(3, 0, 0), 'right')
        addButtons(new Vector3(-3, 0, 0), 'left')
        addButtons(new Vector3(0, 3, 0), 'top')
        addButtons(new Vector3(0, -3, 0), 'bottom')
        addButtons(new Vector3(0, 0, 3), 'back')
        addButtons(new Vector3(0, 0, -3), 'front')
        window.addEventListener("mousemove", onDocumentMouseMove, false)
    
        function addButtons(pos, name) {
            const spriteMaterialCW = new THREE.SpriteMaterial({ map: spriteMapCW, color: 0xffffff })
            const spriteRightCW = new THREE.Sprite(spriteMaterialCW)
            spriteRightCW.position.x = pos.x
            spriteRightCW.position.y = pos.y - 0.3
            spriteRightCW.position.z = pos.z
            spriteRightCW.scale.x = 0.5
            spriteRightCW.scale.y = 0.5
            spriteRightCW.name = name + "_cw"
            spriteRightCW.userData.isBtn = true
            buttons.add(spriteRightCW)
    
            const spriteMaterialCCW = new THREE.SpriteMaterial({ map: spriteMapCCW, color: 0xffffff })
            const spriteRightCCW = new THREE.Sprite(spriteMaterialCCW)
            spriteRightCCW.position.x = pos.x
            spriteRightCCW.position.y = pos.y + 0.3
            spriteRightCCW.position.z = pos.z
            spriteRightCCW.scale.x = 0.5
            spriteRightCCW.scale.y = 0.5
            spriteRightCCW.name = name + "_ccw"
            spriteRightCCW.userData.isBtn = true
            buttons.add(spriteRightCCW)
    
            scene.add(buttons)
        }
    
        let selectedObject = null
        function onDocumentMouseMove(event) {
            event.preventDefault()
            if (selectedObject) {
                selectedObject.material.color.set('#ffffff')
                selectedObject = null
            }
            let intersects = getIntersects(event.layerX, event.layerY)
            if (intersects.length > 0) {
                let res = intersects.filter(function (res) {
                    return res && res.object
                })[0]
    
                if (res && res.object && res.object.userData.isBtn) {
                    selectedObject = res.object
                    selectedObject.material.color.set('#ff0000')
                }
            }
        }
        let raycaster = new THREE.Raycaster()
        let mouseVector = new Vector2()
        function getIntersects(x, y) {
            x = (x / window.innerWidth) * 2 - 1
            y = - (y / window.innerHeight) * 2 + 1
            mouseVector.set(x, y, 0.5)
            raycaster.setFromCamera(mouseVector, mainCamera)
            return raycaster.intersectObjects(buttons.children, true)
        }
    
        document.onclick = function (e) {
            if(!debug.checked) return // disable if no debug

            if (selectedObject) {
                switch (selectedObject.name) {
                    case 'right_cw':
                        startRotation(new Move(RIGHT, 1, 1))
                        break
                    case 'right_ccw':
                        startRotation(new Move(RIGHT, 1, -1))
                        break
                    case 'left_cw':
                        startRotation(new Move(RIGHT, -1, 1))
                        break
                    case 'left_ccw':
                        startRotation(new Move(RIGHT, -1, -1))
                        break
                    case 'top_cw':
                        startRotation(new Move(UP, 1, 1))
                        break
                    case 'top_ccw':
                        startRotation(new Move(UP, 1, -1))
                        break
                    case 'bottom_cw':
                        startRotation(new Move(UP, -1, 1))
                        break
                    case 'bottom_ccw':
                        startRotation(new Move(UP, -1, -1))
                        break
                    case 'front_cw':
                        startRotation(new Move(FRONT, 1, 1))
                        break
                    case 'front_ccw':
                        startRotation(new Move(FRONT, 1, -1))
                        break
                    case 'back_cw':
                        startRotation(new Move(FRONT, -1, 1))
                        break
                    case 'back_ccw':
                        startRotation(new Move(FRONT, -1, -1))
                        break
                }
            }
        }
    }

    { // make 3D axis
        const length = 100
        gridX = makeLine(new Vector3(-length, 0, 0), new Vector3(length, 0, 0), new Vector3(1, 0, 0)) // x
        gridY = makeLine(new Vector3(0, -length, 0), new Vector3(0, length, 0), new Vector3(0, 1, 0)) // y
        gridZ = makeLine(new Vector3(0, 0, -length), new Vector3(0, 0, length), new Vector3(0, 0.3, 1)) // z

        function makeLine(v1, v2, colorNormalized) {
            
            const geometry = new THREE.BufferGeometry()
            const mat = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors })
            const vertexPosition = []
            const vertexColor = []
            vertexPosition.push(v1.x, v1.y, v1.z)
            vertexColor.push(colorNormalized.x)
            vertexColor.push(colorNormalized.y)
            vertexColor.push(colorNormalized.z)
            vertexPosition.push(v2.x, v2.y, v2.z)
            vertexColor.push(colorNormalized.x)
            vertexColor.push(colorNormalized.y)
            vertexColor.push(colorNormalized.z)
            geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertexPosition, 3))
            geometry.addAttribute('color', new THREE.Float32BufferAttribute(vertexColor, 3))
            geometry.computeBoundingSphere()
            const line = new THREE.Line(geometry, mat)
            scene.add(line)
            return line
        }
    }
    
    // Lights
    {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9)
        hemiLight.color.setHSL(0.6, 1, 1)
        hemiLight.groundColor.setHSL(0.095, 1, 0.75)
        hemiLight.position.set(0, 50, 0)
        scene.add(hemiLight)
    
        // const dirLight = new THREE.DirectionalLight( 0xffffff, 1 )
        // dirLight.color.setHSL( 0.1, 1, 0.95 )
        // dirLight.position.set( - 1, 1.75, 1 )
        // dirLight.position.multiplyScalar( 30 )
        // scene.add( dirLight )
        // dirLight.castShadow = true
        // dirLight.shadow.mapSize.width = 2048
        // dirLight.shadow.mapSize.height = 2048
        // let d = 50
        // dirLight.shadow.camera.left = - d
        // dirLight.shadow.camera.right = d
        // dirLight.shadow.camera.top = d
        // dirLight.shadow.camera.bottom = - d
        // dirLight.shadow.camera.far = 3500
        // dirLight.shadow.bias = - 0.0001
    }
    {
        const intensity = 1
        const light = new THREE.DirectionalLight(0xFFFFFF, intensity)
        light.position.set(-1, 2, 4)
        scene.add(light)
    }
    {
        const intensity = 1
        const light = new THREE.DirectionalLight(0xFFFFFF, intensity)
        light.position.set(1, -2, -4)
        scene.add(light)
    }
    
    var loader = new THREE.GLTFLoader()
    loader.load('models/Piece.glb', function (gltf) {
        const PieceGeometry = gltf.scene.children.find((child) => child.name == "PieceGeometry")
        // default cube configuration: white is up, red facing us
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if(x == 0 && y == 0 && z == 0) continue

                    const position = new Vector3(x,y,z)
                    const piece = PieceGeometry.clone()
                    piece.originalPosition = position.clone()
                    piece.positionBeforeAnimation = position.clone()
                    piece.dynamicPosition = position.clone()
                    piece.name = `${position.x},${position.y},${position.z}`
                    piece.solvedPosition = new Vector3(x, y, z)
                    piece.userData.right = RIGHT.clone()
                    piece.userData.up = UP.clone()
                    piece.userData.front = FRONT.clone()
                    
                    for(let child of piece.children) {
                        child.translateX(position.x*2)
                        child.translateY(position.y*2)
                        child.translateZ(position.z*2)
                    }
                    // clear all materials to black color
                    piece.children.map(material => material.material.color = new Color(colorsHexa.BLACK))
                    
                    if (x == -1) { // left, green
                        let face = piece.children.find((el)=>el.material.name == 'LeftMat')
                        face.material = materials.GREEN
                        piece.userData.GREEN = LEFT.clone()
                    }
                    if (x == 1) { // right, blue
                        let face = piece.children.find((el)=>el.material.name == 'RightMat')
                        face.material = materials.BLUE
                        piece.userData.BLUE = RIGHT.clone()
                    }
                    if (z == 1) { // front, red
                        let face = piece.children.find((el)=>el.material.name == 'FrontMat')
                        face.material = materials.RED
                        piece.userData.RED = FRONT.clone()
                    }
                    if (z == -1) { // back, orange
                        let face = piece.children.find((el)=>el.material.name == 'BackMat')
                        face.material = materials.ORANGE
                        piece.userData.ORANGE = BACK.clone()
                    }
                    if (y == 1) { // top, white
                        let face = piece.children.find((el)=>el.material.name == 'TopMat')
                        face.material = materials.WHITE
                        piece.userData.WHITE = UP.clone()
                    }
                    if (y == -1) { // bottom, yellow
                        let face = piece.children.find((el)=>el.material.name == 'BottomMat')
                        face.material = materials.YELLOW
                        piece.userData.YELLOW = DOWN.clone()
                    }
                    state.grid.push(piece)
                    scene.add(piece)
                }
            }
        }
        animate()
        doNextMove()
    }, undefined, function (error) {
        console.error(error)
    })
}

init()