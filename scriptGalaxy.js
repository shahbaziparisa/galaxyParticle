import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { gsap } from 'gsap';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as dat from 'dat.gui'

const myCanvas = document.querySelector("canvas.galaxy")
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

//this is for hdri file I use for better quality
const rgbLoader = new RGBELoader()
rgbLoader.load('brown_photostudio_02_1k.hdr', (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = hdr
})

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 5
scene.add(camera)


const gripHelper = new THREE.GridHelper(15, 15)
// scene.add(gripHelper)

const axeshelper = new THREE.AxesHelper(10)
// scene.add(axeshelper)

const directionaLight = new THREE.DirectionalLight(0xffffff, 1)
directionaLight.castShadow = true

scene.add(directionaLight)

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
// scene.add(ambientLight)


// Add sun and earth
const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32)
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xf6e781 })
const sun = new THREE.Mesh(sunGeometry, sunMaterial)
// scene.add(sun)

const earthGeometry = new THREE.SphereGeometry(0.3, 32, 32)
const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x00afda })
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
earth.position.set(3, 0, 0)
// scene.add(earth)


const gltfLoader = new GLTFLoader()

const renderer = new THREE.WebGLRenderer({
    canvas: myCanvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const myControl = new OrbitControls(camera, renderer.domElement)
myControl.minDistance = 0.1
myControl.maxDistance = 2000

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(window.devicePixelRatio)

const gui = new dat.GUI({ width: 360 })

const parameters = {}
parameters.count = 1000
parameters.size = 0.01
parameters.radius = 5
parameters.branches = 3
parameters.spin = 1
parameters.randomness = 0.2
parameters.randomnessPower = 3
parameters.insideColor = '#f6e781'
parameters.outsideColor = "#00afda"

let geometry, material, points = null;

const generateGalaxy = () => {

    //destroy
    if (points !== null) {
        //free the memory
        geometry?.dispose()
        material?.dispose()
        scene.remove(points)
    }

    //Geomtry
    geometry = new THREE.BufferGeometry()

    // 3000 numbers for 1000 vertices
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)
    //mix colors


    for (let index = 0; index < parameters.count; index++) {

        const index3 = index * 3
        //positions
        const radius = Math.random() * parameters.radius
        const branchAngle = (index % parameters.branches) / parameters.branches * Math.PI * 2
        const spinAngle = radius * parameters.spin

        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius

        positions[index3] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[index3 + 1] = randomY
        positions[index3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        //colors
        colors[index3] = mixedColor.r
        colors[index3 + 1] = mixedColor.g
        colors[index3 + 2] = mixedColor.b

    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    //Material

    const textureLoader = new THREE.TextureLoader()
    const particleTexture = textureLoader.load('/textures/particles/8.png')

    material = new THREE.PointsMaterial({
        map: particleTexture,
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true

    })

    //Ponits

    points = new THREE.Points(geometry, material)
    scene.add(points)

}

generateGalaxy()
//avoid on change)
gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.002).max(0.1).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)

gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)



//for hover effect I use raycaster and mouse move

const myRaycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()


function mouseMove(event) {
    mouse.x = (event.clientX / myCanvas.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / myCanvas.clientHeight) * 2 + 1;

    myRaycaster.setFromCamera(mouse, camera)

    const intersects = myRaycaster.intersectObjects(scene.children, true)
    // console.log('intersects',intersects)

    if (intersects.lenght > 0) {
        // console.log('intersected',intersects[0])
    }

}



window.addEventListener('mousemove', mouseMove)

const clock = new THREE.Clock()
function animate() {

    const elapsedTime = clock.getElapsedTime()

    // Rotate the galaxy
    if (points) {
        points.rotation.y = elapsedTime * 0.05
    }

    // Rotate the earth around the sun
    // earth.position.x =- Math.cos(elapsedTime * 0.2) * 3
    // earth.position.z = Math.sin(elapsedTime * 0.2) * 3

    // // Rotate the sun
    // sun.rotation.y = elapsedTime * 0.1
    requestAnimationFrame(animate)
    myControl.update()
    renderer.render(scene, camera)

}
animate()


