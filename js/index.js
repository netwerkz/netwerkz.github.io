const RADIANS = Math.PI / 180
const TURN = RADIANS * 90
const Vector3 = THREE.Vector3
const ORIGIN = new Vector3(0, 0, 0)
const RIGHT = new Vector3(1, 0, 0)
const LEFT = new Vector3(-1, 0, 0)
const UP = new Vector3(0, 1, 0)
const DOWN = new Vector3(0, -1, 0)
const FRONT = new Vector3(0, 0, -1)
const BACK = new Vector3(0, 0, 1)
// const AXIS_X = new THREE.Group()
// const AXIS_Y = new THREE.Group()
// const AXIS_Z = new THREE.Group()
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

const state = {
    axis: null,
    isMoving: false,
    hasReached: false,
    t: 0.0
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



let boxGeometry = new THREE.BoxGeometry(0.99, 0.99, 0.99)
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

const Face = function (piece, position, direction, mat) {
    this.position = position
    this.direction = direction
    const mesh = new THREE.Mesh(planeGeometry, mat)
    mesh.position.x = this.position.x
    mesh.position.y = this.position.y
    mesh.position.z = this.position.z

    if (this.direction.y != 0) {
        mesh.rotation.x = TURN
        mesh.position.y += mesh.position.y / 2.0
    }
    if (this.direction.z != 0) {
        mesh.position.z += mesh.position.z / 2.0
    }
    if (this.direction.x != 0) {
        mesh.rotation.y = TURN
        mesh.rotation.x = TURN
        mesh.position.x += mesh.position.x / 2.0
    }

    piece.obj.attach(mesh)
}
const Piece = function (position) {
    // this.object = new THREE.Object3D();
    // this.object.position = position    
    this.originalPosition = position
    this.positionBeforeAnimation = position
    this.faces = []
    this.obj = new THREE.Mesh(boxGeometry, materials.BLACK)
    this.obj.position.x = position.x
    this.obj.position.y = position.y
    this.obj.position.z = position.z
    // this.obj.scale.x = 0.99
    // this.obj.scale.y = 0.99
    // this.obj.scale.z = 0.99
}

// default cube configuration: white is up, red facing us
const CubeGrid = []
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            const piece = new Piece(new Vector3(x, y, z))
            if (x == -1) { // left
                piece.faces.push(new Face(piece, new Vector3(x, y, z), new Vector3(-1, 0, 0), materials.GREEN))
            }
            if (x == 1) { // right
                piece.faces.push(new Face(piece, new Vector3(x, y, z), new Vector3(1, 0, 0), materials.BLUE))
            }
            if (z == 1) { // front
                piece.faces.push(new Face(piece, new Vector3(x, y, z), new Vector3(0, 0, 1), materials.RED))
            }
            if (z == -1) { // back
                piece.faces.push(new Face(piece, new Vector3(x, y, z), new Vector3(0, 0, -1), materials.ORANGE))
            }
            if (y == 1) { // up
                piece.faces.push(new Face(piece, new Vector3(x, y, z), new Vector3(0, 1, 0), materials.WHITE))
            }
            if (y == -1) { // down
                piece.faces.push(new Face(piece, new Vector3(x, y, z), new Vector3(0, -1, 0), materials.YELLOW))
            }
            CubeGrid.push(piece)
            scene.add(piece.obj)
        }
    }
}
console.log(CubeGrid)

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


function rotate(axis, offset, direction) {
    if (state.isMoving) return

    state.isMoving = true
    state.axis = axis
    state.t = 0.0
    state.direction = direction
    state.offset = offset

    let pivot = new THREE.Object3D()
    for (const piece of CubeGrid) {
        if ((axis.x && piece.positionBeforeAnimation.x == axis.x) ||
            (axis.y && piece.positionBeforeAnimation.y == axis.y) ||
            (axis.z && piece.positionBeforeAnimation.z == axis.z)) {
            // pivot.add(piece.obj)
        }
        if (axis.x && piece.obj.position.x == axis.x) {
            // AXIS_X.add(piece.obj)
            // scene.add(AXIS_X)
        }
        if (axis.y && piece.obj.position.y == axis.y) {
            // AXIS_Y.add(piece.obj)
            // scene.add(AXIS_Y)
        }
        if (axis.z && piece.obj.position.z == axis.z) {
            // AXIS_Z.add(piece.obj)
            // scene.add(AXIS_Z)            
        }
    }
}

function animate() {
    const speed = 4.0
    const axis = state.axis
    let dt = clock.getDelta() * speed
    if (axis) {
        state.t += dt
        if (state.t >= 1) {
            dt -= state.t - 1.0
        }

        // if (state.axis == RIGHT) AXIS_X.rotateOnWorldAxis(axis, 90 * RADIANS * dt)
        // else if (state.axis == UP) AXIS_Y.rotateOnWorldAxis(axis, 90 * RADIANS * dt)
        // else if (state.axis == FRONT) AXIS_Z.rotateOnWorldAxis(axis, 90 * RADIANS * dt)

        for (const piece of CubeGrid) {
            if ((axis.x && piece.positionBeforeAnimation.x == axis.x) ||
                (axis.y && piece.positionBeforeAnimation.y == axis.y) ||
                (axis.z && piece.positionBeforeAnimation.z == axis.z)) {
                    const mat4 = new THREE.Matrix4()
                    const offset = new Vector3(
                        piece.positionBeforeAnimation.x * 1,
                        piece.positionBeforeAnimation.y * 1,
                        piece.positionBeforeAnimation.z * 1
                    )
                    const q = new THREE.Quaternion();
                    q.setFromRotationMatrix(piece.obj.matrix)
                    q.rotateTowards(new THREE.Quaternion(axis.x,axis.y,axis.z, 1), TURN * dt)
                    console.log(q)

                    piece.obj.matrix.multiply(mat4.makeTranslation(-offset.x, -offset.y, -offset.z))
                    piece.obj.matrix.multiply(mat4.makeRotationFromQuaternion(q))                    
                    piece.obj.matrix.multiply(mat4.makeTranslation(offset.x, offset.y, offset.z))
                    piece.obj.matrixAutoUpdate = false
            }
            if (axis.x && piece.obj.position.x == axis.x) {
                
            }
            if (axis.y && piece.obj.position.y == axis.y) {
                // AXIS_Y.add(piece.obj)
                // scene.add(AXIS_Y)
            }
            if (axis.z && piece.obj.position.z == axis.z) {
                // AXIS_Z.add(piece.obj)
                // scene.add(AXIS_Z)            
            }
        }

        if (state.t >= 1) {
            state.axis = null
            state.isMoving = false

            for (const piece of CubeGrid) {
                // correct rounding errors
                piece.positionBeforeAnimation.x = Math.round(piece.obj.position.x)
                piece.positionBeforeAnimation.y = Math.round(piece.obj.position.y)
                piece.positionBeforeAnimation.z = Math.round(piece.obj.position.z)
                // piece.obj.matrixAutoUpdate = false
                // scene.add(piece.obj)
                // piece.obj.attachTo(scene)
                // piece.obj.position = piece.positionBeforeAnimation
            }
            // scene.remove(AXIS_X, AXIS_Y, AXIS_Z)            
        }
    }

    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function render() {
    renderer.render(scene, camera)
}

// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
// function rotateAroundPoint(obj, point, axis, theta, pointIsWorld) {
//     // console.log("before rotation", obj.position)
//     pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;

//     if (pointIsWorld) {
//         obj.parent.localToWorld(obj.position); // compensate for world coordinate
//     }

//     obj.position.sub(point); // remove the offset
//     obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
//     obj.position.add(point); // re-add the offset

//     if (pointIsWorld) {
//         obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
//     }

//     obj.rotateOnAxis(axis, theta); // rotate the OBJECT
//     obj.updateMatrix()
//     obj.updateMatrixWorld(true)
//     // console.log("after rotation",obj.position)
// }

{
    const spriteMapCW = new THREE.TextureLoader().load("cw.png");
    const spriteMapCCW = new THREE.TextureLoader().load("ccw.png");
    const buttons = new THREE.Group()
    addButtons(new Vector3(3, 0, 0), 'right')
    addButtons(new Vector3(-3, 0, 0)), 'left'
    addButtons(new Vector3(0, 3, 0), 'top')
    addButtons(new Vector3(0, -3, 0), 'bottom')
    addButtons(new Vector3(0, 0, 3), 'back')
    addButtons(new Vector3(0, 0, -3), 'front')
    window.addEventListener( "mousemove", onDocumentMouseMove, false );

    function addButtons(pos, name) {
        const spriteMaterialCW = new THREE.SpriteMaterial({ map: spriteMapCW, color: 0xffffff })        
        const spriteRightCW = new THREE.Sprite(spriteMaterialCW)
        spriteRightCW.position.x = pos.x
        spriteRightCW.position.y = pos.y - 0.3
        spriteRightCW.position.z = pos.z
        spriteRightCW.scale.x = 0.5
        spriteRightCW.scale.y = 0.5
        spriteRightCW.name = name+"_cw"
        buttons.add(spriteRightCW)

        const spriteMaterialCCW = new THREE.SpriteMaterial({ map: spriteMapCCW, color: 0xffffff })
        const spriteRightCCW = new THREE.Sprite(spriteMaterialCCW)
        spriteRightCCW.position.x = pos.x
        spriteRightCCW.position.y = pos.y + 0.3
        spriteRightCCW.position.z = pos.z
        spriteRightCCW.scale.x = 0.5
        spriteRightCCW.scale.y = 0.5
        spriteRightCCW.name = name+"_ccw"
        buttons.add(spriteRightCCW)

        scene.add(buttons)
    }

    let selectedObject = null;
    function onDocumentMouseMove( event ) {
        event.preventDefault();
        if ( selectedObject ) {
            selectedObject.material.color.set( '#ffffff' )
            selectedObject = null
        }
        let intersects = getIntersects( event.layerX, event.layerY )
        if ( intersects.length > 0 ) {
            let res = intersects.filter( function ( res ) {
                return res && res.object;
            } )[ 0 ];
            if ( res && res.object ) {
                selectedObject = res.object
                selectedObject.material.color.set( '#ff0000' )
            }
        }
    }
    let raycaster = new THREE.Raycaster();
    let mouseVector = new THREE.Vector3();
    function getIntersects( x, y ) {
        x = ( x / window.innerWidth ) * 2 - 1;
        y = - ( y / window.innerHeight ) * 2 + 1;
        mouseVector.set( x, y, 0.5 );
        raycaster.setFromCamera( mouseVector, camera );
        return raycaster.intersectObject( buttons, true );
    }
    document.onclick = function(e) {
        if(selectedObject) {
            // console.log(selectedObject)
            switch(selectedObject.name) {
                case 'right_cw':
                    rotate(RIGHT, 1, 1)
                break;
                case 'right_ccw':
                    rotate(RIGHT, 1, -1)
                break;
                case 'left_cw':
                    rotate(RIGHT, -1, 1)
                break;
                case 'left_ccw':
                    rotate(RIGHT, -1, -1)
                break;
                case 'top_cw':
                    rotate(UP, 1, 1)
                break;
                case 'top_ccw':
                    rotate(UP, 1, -1)
                break;
                case 'bottom_cw':
                    rotate(UP, -1, 1)
                break;
                case 'bottom_ccw':
                    rotate(UP, -1, -1)
                break;
                case 'front_cw':
                    rotate(FRONT, 1, 1)
                break;
                case 'front_ccw':
                    rotate(FRONT, 1, -1)
                break;
                case 'back_cw':
                    rotate(FRONT, -1, 1)
                break;
                case 'back_ccw':
                    rotate(FRONT, -1, -1)
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

// THREE.Object3D.prototype.attachTo = function () {
//     // adds this as a child of object, without changing the child's world transform
//     let m = new THREE.Matrix4()
//     return function attachTo(object) {
//         object.updateWorldMatrix(true, false) // bubble up
//         m.getInverse(object.matrixWorld)
//         if (this.parent !== null) {
//             this.parent.updateWorldMatrix(true, false) // bubble up
//             m.multiply(this.parent.matrixWorld)
//         }
//         if (this.matrixAutoUpdate) this.updateMatrix()
//         this.applyMatrix(m)
//         this.updateWorldMatrix(false, false)
//         object.add(this)
//     }
// }()