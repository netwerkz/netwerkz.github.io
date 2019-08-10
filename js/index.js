// imports 
const Vector3 = THREE.Vector3
const Vector2 = THREE.Vector2
const Color = THREE.Color

// constants
const RADIANS = Math.PI / 180
const TURN = RADIANS * 90
const ORIGIN = new Vector3(0, 0, 0)
const RIGHT = new Vector3(1, 0, 0)
const LEFT = new Vector3(-1, 0, 0)
const UP = new Vector3(0, 1, 0)
const DOWN = new Vector3(0, -1, 0)
const FRONT = new Vector3(0, 0, -1)
const BACK = new Vector3(0, 0, 1)
const FACE_COLORS = ['RED', 'ORANGE', 'GREEN', 'BLUE', 'WHITE', 'YELLOW']
const axes = [RIGHT, FRONT, UP]
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
        this.axis = axis.clone();
        this.offset = offset;
        this.direction = direction;
    }
}

const STATE = {
    IDLE: 0,
    SOLVE: 1,
    SHUFFE: 2    
}

const state = {
    grid: [],
    speed: 8,
    isMoving: false,
    onAxis: null,
    t: 0.0, // infer float
    currently: STATE.STATE_IDLE,
    movesQueue: []
}

const SOLVER_PHASE = {
    COMPLETE: 'complete',
    WHITE_CROSS_1: 'red white',
    WHITE_CROSS_2: 'orange white',
    WHITE_CROSS_3: 'green white',
    WHITE_CROSS_4: 'blue white',
    T_1: 'white red green corner',
    T_2: 'white red blue corner',
    T_3: 'white orange green corner',
    T_4: 'white orange blue corner',
    SECOND_LAYER_1: 9, // if wrong orientation, do it twice
    SECOND_LAYER_2: 10, // if wrong orientation, do it twice
    SECOND_LAYER_3: 11, // if wrong orientation, do it twice
    SECOND_LAYER_4: 12, // if wrong orientation, do it twice
    YELLOW_CROSS_1: 13, // may be skipped
    YELLOW_CROSS_2: 14, // may be skipped
    YELLOW_CROSS_3: 15, // may be skipped
    YELLOW_CROSS_4: 16,
    YELLOW_EDGES_1: 17, // may be skipped
    YELLOW_EDGES_2: 18, // may be skipped
    YELLOW_EDGES_3: 19, // may be skipped
    YELLOW_EDGES_4: 20,
}

function init() {
    { // setup buttons    
        const spriteMapCW = new THREE.TextureLoader().load("images/cw.png");
        const spriteMapCCW = new THREE.TextureLoader().load("images/ccw.png");
        const buttons = new THREE.Group()
        addButtons(new Vector3(3, 0, 0), 'right')
        addButtons(new Vector3(-3, 0, 0), 'left')
        addButtons(new Vector3(0, 3, 0), 'top')
        addButtons(new Vector3(0, -3, 0), 'bottom')
        addButtons(new Vector3(0, 0, 3), 'back')
        addButtons(new Vector3(0, 0, -3), 'front')
        window.addEventListener("mousemove", onDocumentMouseMove, false);
    
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
    
        let selectedObject = null;
        function onDocumentMouseMove(event) {
            event.preventDefault();
            if (selectedObject) {
                selectedObject.material.color.set('#ffffff')
                selectedObject = null
            }
            let intersects = getIntersects(event.layerX, event.layerY)
            if (intersects.length > 0) {
                let res = intersects.filter(function (res) {
                    return res && res.object;
                })[0];
    
                if (res && res.object && res.object.userData.isBtn) {
                    selectedObject = res.object
                    selectedObject.material.color.set('#ff0000')
                }
            }
        }
        let raycaster = new THREE.Raycaster();
        let mouseVector = new Vector2();
        function getIntersects(x, y) {
            x = (x / window.innerWidth) * 2 - 1;
            y = - (y / window.innerHeight) * 2 + 1;
            mouseVector.set(x, y, 0.5);
            raycaster.setFromCamera(mouseVector, camera);
            return raycaster.intersectObjects(buttons.children, true);
        }
    
        document.onclick = function (e) {
            if (selectedObject) {
                switch (selectedObject.name) {
                    case 'right_cw':
                        startRotation(new Move(RIGHT, 1, 1))
                        break;
                    case 'right_ccw':
                        startRotation(new Move(RIGHT, 1, -1))
                        break;
                    case 'left_cw':
                        startRotation(new Move(RIGHT, -1, 1))
                        break;
                    case 'left_ccw':
                        startRotation(new Move(RIGHT, -1, -1))
                        break;
                    case 'top_cw':
                        startRotation(new Move(UP, 1, 1))
                        break;
                    case 'top_ccw':
                        startRotation(new Move(UP, 1, -1))
                        break;
                    case 'bottom_cw':
                        startRotation(new Move(UP, -1, 1))
                        break;
                    case 'bottom_ccw':
                        startRotation(new Move(UP, -1, -1))
                        break;
                    case 'front_cw':
                        startRotation(new Move(FRONT, 1, 1))
                        break;
                    case 'front_ccw':
                        startRotation(new Move(FRONT, 1, -1))
                        break;
                    case 'back_cw':
                        startRotation(new Move(FRONT, -1, 1))
                        break;
                    case 'back_ccw':
                        startRotation(new Move(FRONT, -1, -1))
                        break;
                }
            }
        }
    }

    { // make 3D axis
        const length = 100
        makeLine(new Vector3(-length, 0, 0), new Vector3(length, 0, 0), new Vector3(1, 0, 0)) // x
        makeLine(new Vector3(0, -length, 0), new Vector3(0, length, 0), new Vector3(0, 1, 0)) // y
        makeLine(new Vector3(0, 0, -length), new Vector3(0, 0, length), new Vector3(0, 0, 1)) // z

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
            geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertexPosition, 3));
            geometry.addAttribute('color', new THREE.Float32BufferAttribute(vertexColor, 3));
            geometry.computeBoundingSphere();
            const line = new THREE.Line(geometry, mat)
            scene.add(line)
        }
    }
    
    // Lights
    {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9);
        hemiLight.color.setHSL(0.6, 1, 1);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        scene.add(hemiLight);
    
        // const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        // dirLight.color.setHSL( 0.1, 1, 0.95 );
        // dirLight.position.set( - 1, 1.75, 1 );
        // dirLight.position.multiplyScalar( 30 );
        // scene.add( dirLight );
        // dirLight.castShadow = true;
        // dirLight.shadow.mapSize.width = 2048;
        // dirLight.shadow.mapSize.height = 2048;
        // let d = 50;
        // dirLight.shadow.camera.left = - d;
        // dirLight.shadow.camera.right = d;
        // dirLight.shadow.camera.top = d;
        // dirLight.shadow.camera.bottom = - d;
        // dirLight.shadow.camera.far = 3500;
        // dirLight.shadow.bias = - 0.0001;
    }
    {
        const intensity = 1;
        const light = new THREE.DirectionalLight(0xFFFFFF, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }
    {
        const intensity = 1;
        const light = new THREE.DirectionalLight(0xFFFFFF, intensity);
        light.position.set(1, -2, -4);
        scene.add(light);
    }
    
    var loader = new THREE.GLTFLoader();
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

const clock = new THREE.Clock();
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.x = 2.5
camera.position.y = 3
camera.position.z = 6

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.gammaInput = true
renderer.gammaOutput = true

const orbit = new THREE.OrbitControls(camera, renderer.domElement)
orbit.update()
orbit.addEventListener('change', render)

const container = document.getElementById('canvas')
container.appendChild(renderer.domElement)
window.addEventListener('resize', onWindowResize, false)
document.querySelector('#randomize').addEventListener('click', function (e) { 
    pushRandomMoves(5)
    state.currently = STATE.SHUFFE
    doNextMove()
 })
document.querySelector('#solve').addEventListener('click', function (e) { 
    state.movesQueue = [] // reset queue
    state.currently = STATE.SOLVE
    doNextMove()
})

function startRotation(move) {
    if (state.isMoving) return
    // console.log('startRotation: ', axis, offset, direction)

    state.isMoving = true
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
    let dt = clock.getDelta() * state.speed
    if (axis) {
        state.t += dt
        if (state.t >= 1) {
            dt -= state.t - 1.0
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
        if (state.t >= 1 && state.isMoving) {
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
            state.isMoving = false
            doNextMove()
        }
    }

    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function isPieceInPlace(x, y, z) {
    const name = `${x},${y},${z}`
    const piece = state.grid.find(piece => piece.name == name)
    const isCorrectPosition         = piece.dynamicPosition.equals(piece.solvedPosition)
    const isCorrectRightOrientation = piece.userData.right.equals(RIGHT)
    const isCorrectUpOrientation    = piece.userData.up.equals(UP)
    const isCorrectFrontOrientation = piece.userData.front.equals(FRONT)
    return isCorrectPosition && isCorrectRightOrientation && isCorrectUpOrientation && isCorrectFrontOrientation;
}

function getNextPhase() {
    if(!isPieceInPlace( 0, 1, 1)) return SOLVER_PHASE.WHITE_CROSS_1;
    if(!isPieceInPlace( 0, 1,-1)) return SOLVER_PHASE.WHITE_CROSS_2;
    if(!isPieceInPlace(-1, 1, 0)) return SOLVER_PHASE.WHITE_CROSS_3;
    if(!isPieceInPlace( 1, 1, 0)) return SOLVER_PHASE.WHITE_CROSS_4;
    if(!isPieceInPlace(-1, 1, 1)) return SOLVER_PHASE.T_1;
    if(!isPieceInPlace( 1, 1, 1)) return SOLVER_PHASE.T_2;
    if(!isPieceInPlace(-1, 1,-1)) return SOLVER_PHASE.T_3;
    if(!isPieceInPlace( 1, 1,-1)) return SOLVER_PHASE.T_4;

    return SOLVER_PHASE.COMPLETE;
}

function doNextMove() {
    const next = getNextPhase()
    console.log('PHASE:', next)

    if (state.currently == STATE.SHUFFE) {
        if (state.movesQueue.length) {
            console.log('moves left ', state.movesQueue.length)
            // pop move from queue and perform it
            startRotation(state.movesQueue.pop())
        } else {
            state.currently = STATE.IDLE
        }
    } else if (next == SOLVER_PHASE.COMPLETE) {
        state.currently = STATE.IDLE
        // do nothing
    } else if (state.currently == STATE.SOLVE) {
        if (state.movesQueue.length) {
            // pop move from queue and perform it
            startRotation(state.movesQueue.pop())
        } else {
            // pump moves onto queue if queue is empty
            switch (next) {
                case SOLVER_PHASE.WHITE_CROSS_1:

                    break
                case SOLVER_PHASE.WHITE_CROSS_2:

                    break
                case SOLVER_PHASE.WHITE_CROSS_3:

                    break
                case SOLVER_PHASE.WHITE_CROSS_4:

                    break
            }
        }
    }
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
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function render() {
    renderer.render(scene, camera)
}

function pushRandomMoves(num) {
    for(let i = 0; i < num; i++) {
        const axis = axes[Math.floor((Math.random() * 3))]
        const offset = Math.floor((Math.random() * 2) + 1) == 1 ? 1 : -1
        const dir = Math.floor((Math.random() * 2) + 1) == 1 ? 1 : -1        
        state.movesQueue.push(new Move(axis, offset, dir))
    }
}

init()