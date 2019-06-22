// imports 
const Vector3 = THREE.Vector3
const Vector2 = THREE.Vector2
const Quaternion = THREE.Quaternion

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
const colors = {
    RED: 0xff0000,
    GREEN: 0x00aa00,
    BLUE: 0x0033dd,
    WHITE: 0xffffff,
    YELLOW: 0xbbbb00,
    ORANGE: 0xff4400,
    BLACK: 0x000000,
}
const materials = {
    RED: new THREE.MeshPhongMaterial({ color: colors.RED, side: THREE.DoubleSide }),
    GREEN: new THREE.MeshPhongMaterial({ color: colors.GREEN, side: THREE.DoubleSide }),
    BLUE: new THREE.MeshPhongMaterial({ color: colors.BLUE, side: THREE.DoubleSide }),
    WHITE: new THREE.MeshPhongMaterial({ color: colors.WHITE, side: THREE.DoubleSide }),
    YELLOW: new THREE.MeshPhongMaterial({ color: colors.YELLOW, side: THREE.DoubleSide }),
    ORANGE: new THREE.MeshPhongMaterial({ color: colors.ORANGE, side: THREE.DoubleSide }),
    BLACK: new THREE.MeshPhongMaterial({ color: colors.BLACK, side: THREE.DoubleSide }),
}

// const hue = Math.random();
// const saturation = 1;
// const luminance = .5;
// materials.WHITE.color.setHSL(hue, saturation, luminance);

const CubeGrid = []
const state = {
    speed: 10,
    axis: null,
    isMoving: false,
    hasReached: false,
    t: 0.0,
    randomMoves: 0
}


// class Face extends THREE.Mesh {
//     constructor(piece, position, direction, mat) {
//         super(planeGeometry, mat)
//         this.position.x = position.x
//         this.position.y = position.y
//         this.position.z = position.z
//         this.direction = direction

//         if (this.direction.y != 0) {
//             this.rotation.x = TURN
//             this.position.y += this.position.y / 2.0
//         }
//         if (this.direction.z != 0) {
//             this.position.z += this.position.z / 2.0
//         }
//         if (this.direction.x != 0) {
//             this.rotation.y = TURN
//             this.rotation.x = TURN
//             this.position.x += this.position.x / 2.0
//         }
//     }
// }

class Piece extends THREE.Mesh {
    constructor(geometry, position) {
        super(geometry, materials.BLACK)
        this.originalPosition = position.clone()
        this.positionBeforeAnimation = position.clone()
        this.dynamicPosition = position.clone()
        this.geometry.translateX(position.x)
        this.geometry.translateY(position.y)
        this.geometry.translateZ(position.z)
    }
}
let PieceGeometry = null

function init() {
    var loader = new THREE.GLTFLoader();
    loader.load('models/Piece.glb', function (gltf) {
        console.log('GLTF:', gltf)
        PieceGeometry = gltf.scene.children.find((child) => child.name == "PieceGeometry")
        console.log(PieceGeometry)
        // scene.add( gltf.scene );
        // default cube configuration: white is up, red facing us
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const position = new Vector3(x,y,z)
                    const piece = PieceGeometry.clone()
                    piece.originalPosition = position.clone()
                    piece.positionBeforeAnimation = position.clone()
                    piece.dynamicPosition = position.clone()
                    piece.translateX(position.x)
                    piece.translateY(position.y)
                    piece.translateZ(position.z)

                    // if (x == -1) { // left
                    //     piece.attach(new Face(piece, new Vector3(x, y, z), new Vector3(-1, 0, 0), materials.GREEN))
                    // }
                    // if (x == 1) { // right
                    //     piece.attach(new Face(piece, new Vector3(x, y, z), new Vector3(1, 0, 0), materials.BLUE))
                    // }
                    // if (z == 1) { // front
                    //     piece.attach(new Face(piece, new Vector3(x, y, z), new Vector3(0, 0, 1), materials.RED))
                    // }
                    // if (z == -1) { // back
                    //     piece.attach(new Face(piece, new Vector3(x, y, z), new Vector3(0, 0, -1), materials.ORANGE))
                    // }
                    // if (y == 1) { // up
                    //     piece.attach(new Face(piece, new Vector3(x, y, z), new Vector3(0, 1, 0), materials.WHITE))
                    // }
                    // if (y == -1) { // down
                    //     piece.attach(new Face(piece, new Vector3(x, y, z), new Vector3(0, -1, 0), materials.YELLOW))
                    // }
                    CubeGrid.push(piece)
                    scene.add(piece)
                }
            }
        }
        console.log(CubeGrid)

    }, undefined, function (error) {
        console.error(error)
    })
}

const clock = new THREE.Clock();
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x333333);

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
let renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: false })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.gammaInput = true
renderer.gammaOutput = true

const container = document.getElementById('canvas')
container.appendChild(renderer.domElement)
window.addEventListener('resize', onWindowResize, false)
document.querySelector('#randomize').addEventListener('click', function (e) {
    addToQueue(30)
})

let planeGeometry = new THREE.PlaneGeometry(1, 1);

{ // make axis
    const length = 100
    makeLine(new Vector3(-length, 0, 0), new Vector3(length, 0, 0), new Vector3(1, 0, 0)) // x
    makeLine(new Vector3(0, -length, 0), new Vector3(0, length, 0), new Vector3(0, 1, 0)) // y
    makeLine(new Vector3(0, 0, -length), new Vector3(0, 0, length), new Vector3(0, 0, 1)) // z
}

camera.position.x = 2.5
camera.position.y = 3
camera.position.z = 5


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
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
}
{
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(1, -2, -4);
    scene.add(light);
}

orbit = new THREE.OrbitControls(camera, renderer.domElement)
orbit.update()
orbit.addEventListener('change', render)

animate()

function startRotation(axis, offset, direction) {
    if (state.isMoving) return

    state.isMoving = true
    state.axis = axis.clone()
    state.axis.multiplyScalar(offset)
    state.t = 0.0
    state.direction = direction
    state.offset = offset
}

function animate() {
    const axis = state.axis
    let dt = clock.getDelta() * state.speed
    if (axis) {
        state.t += dt
        if (state.t >= 1) {
            dt -= state.t - 1.0
        }

        for (const piece of CubeGrid) {
            if ((axis.x && piece.positionBeforeAnimation.x == axis.x) ||
                (axis.y && piece.positionBeforeAnimation.y == axis.y) ||
                (axis.z && piece.positionBeforeAnimation.z == axis.z)) {
                piece.rotateOnWorldAxis(axis, TURN * dt * -state.direction)
                piece.dynamicPosition.applyAxisAngle(axis, TURN * dt * -state.direction)
            }
        }

        // On move stop
        if (state.t >= 1 && state.isMoving) {
            state.axis = null
            state.isMoving = false

            for (const piece of CubeGrid) {
                // correct rounding errors
                piece.positionBeforeAnimation = piece.dynamicPosition.clone().round()
            }

            onMoveEnd()
        }
    }

    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function checkForMovesLeft() {
    if (state.randomMoves) {
        state.randomMoves--
        console.log('moves left ', state.randomMoves)

        let axis = null
        const randAxis = Math.floor((Math.random() * 3) + 1)
        switch (randAxis) {
            case 1:
                axis = RIGHT
                break;
            case 2:
                axis = FRONT
                break;
            case 3:
                axis = UP
                break;
        }

        let offset = Math.floor((Math.random() * 2) + 1) == 1 ? 1 : -1
        const direction = Math.floor((Math.random() * 2) + 1) == 1 ? 1 : -1
        startRotation(axis, offset, direction)
    }
}

function onMoveEnd() {
    console.log('onMoveEnd')
    checkForMovesLeft()
}

function addToQueue(moves) {
    state.randomMoves += moves
    checkForMovesLeft()
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function render() {
    renderer.render(scene, camera)
}

{
    const spriteMapCW = new THREE.TextureLoader().load("cw.png");
    const spriteMapCCW = new THREE.TextureLoader().load("ccw.png");
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
                    startRotation(RIGHT, 1, 1)
                    break;
                case 'right_ccw':
                    startRotation(RIGHT, 1, -1)
                    break;
                case 'left_cw':
                    startRotation(RIGHT, -1, 1)
                    break;
                case 'left_ccw':
                    startRotation(RIGHT, -1, -1)
                    break;
                case 'top_cw':
                    startRotation(UP, 1, 1)
                    break;
                case 'top_ccw':
                    startRotation(UP, 1, -1)
                    break;
                case 'bottom_cw':
                    startRotation(UP, -1, 1)
                    break;
                case 'bottom_ccw':
                    startRotation(UP, -1, -1)
                    break;
                case 'front_cw':
                    startRotation(FRONT, 1, 1)
                    break;
                case 'front_ccw':
                    startRotation(FRONT, 1, -1)
                    break;
                case 'back_cw':
                    startRotation(FRONT, -1, 1)
                    break;
                case 'back_ccw':
                    startRotation(FRONT, -1, -1)
                    break;
            }
        }
    }
}

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

init()