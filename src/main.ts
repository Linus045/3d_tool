import { Camera, ProjectionMode, Renderer, Scene } from "src/render"
import { Cube, Matrix4x4, Point3D, Vector3D } from "src/math"

let renderer = new Renderer("Front", 500, 500)
let renderer2 = new Renderer("Top", 500, 500)
let renderer3 = new Renderer("Right", 500, 500)

let camera = new Camera(new Point3D(0, 0, 4), new Point3D(0, 0, 0), new Vector3D(0, 1, 0), ProjectionMode.Perspective)
let camera2 = new Camera(new Point3D(0, 4, 0), new Point3D(0, 0, 0), new Vector3D(0, 0, -1), ProjectionMode.Perspective)
let camera3 = new Camera(new Point3D(4, 0, 0), new Point3D(0, 0, 0), new Vector3D(0, 1, 0), ProjectionMode.Perspective)

document.addEventListener("visibilitychange", onchange);


enum MouseMode {
	Rotate,
	Translate,
	Zoom
}

document.addEventListener("keydown", onKeyDown)
document.addEventListener("keyup", onKeyUp)

let shiftDown = false
let altDown = false
let ctrlDown = false

function onKeyDown(evt: KeyboardEvent) {
	if (evt.key == "Shift") {
		shiftDown = true
	} else if (evt.key == "Alt") {
		altDown = true
	} else if (evt.key == "Control") {
		ctrlDown = true
	}
}

function onKeyUp(evt: KeyboardEvent) {
	if (evt.key == "Shift") {
		shiftDown = false
	} else if (evt.key == "Alt") {
		altDown = false
	} else if (evt.key == "Control") {
		ctrlDown = false
	}
}


renderer.setMouseEventListener(onMouseDown, onMouseUp, onMouseMove)


let x0 = 0
let y0 = 0

let mouseDown = false
function onMouseDown(evt: MouseEvent) {
	mouseDown = true

	let { x: clientX, y: clientY } = getMousePositionInCanvas(renderer.canvas, evt)
	x0 = clientX - renderer.canvas.width / 2
	y0 = renderer.canvas.height / 2 - clientY
}

function getMouseMode(): MouseMode {
	if ((ctrlDown || shiftDown) && !altDown) {
		return MouseMode.Rotate
	} else if (!shiftDown && altDown) {
		return MouseMode.Zoom
	} else {
		return MouseMode.Translate
	}
}

function onMouseUp() {
	mouseDown = false
	x0 = 0
	y0 = 0
}

function getMousePositionInCanvas(canvas, evt): { x: number, y: number } {
	// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
	let bounds = renderer.canvas.getBoundingClientRect()
	let clientX = evt.clientX - bounds.left
	let clientY = evt.clientY - bounds.top

	return { x: clientX, y: clientY }
}

function onMouseMove(evt: MouseEvent) {
	if (mouseDown) {
		let { x: clientX, y: clientY } = getMousePositionInCanvas(renderer.canvas, evt)
		let x1 = clientX - renderer.canvas.width / 2
		let y1 = renderer.canvas.height / 2 - clientY
		let mode = getMouseMode()

		switch (mode) {
			case MouseMode.Rotate:
				let camZ = camera.eye.z
				let v0 = new Vector3D(x0, y0, renderer.canvas.width / camZ * 3)
				v0.normalize()
				let v1 = new Vector3D(x1, y1, renderer.canvas.height / camZ * 3)
				v1.normalize()

				let n = v0.cross(v1)
				n.normalize()

				let a = Math.acos(v0.dot(v1))

				// https://mathworld.wolfram.com/RodriguesRotationFormula.html
				let cosA = Math.cos(a)
				let sinA = Math.sin(a)

				if (v0.sub(v1).norm() > 0.001) {
					let R = new Matrix4x4(
						cosA + n.x * n.x * (1 - cosA),
						n.x * n.y * (1 - cosA) - n.z * sinA,
						n.y * sinA + n.x * n.z * (1 - cosA),
						0,

						n.z * sinA + n.x * n.y * (1 - cosA),
						cosA + n.y * n.y * (1 - cosA),
						-n.x * sinA + n.y * n.z * (1 - cosA),
						0,

						-n.y * sinA + n.x * n.z * (1 - cosA),
						n.x * sinA + n.y * n.z * (1 - cosA),
						cosA + n.z * n.z * (1 - cosA),
						0,

						0, 0, 0, 1
					)
					camera.rotateBy(R)
				}
				break;
			case MouseMode.Translate:
				let start = new Point3D(x0 / 100, y0 / 100, 0)
				let end = new Point3D(x1 / 100, y1 / 100, 0)
				camera.translateVec(end.subPoint(start).mul(-1))
				break
			case MouseMode.Zoom:
				let distance = y1 - y0
				camera.translateVec(new Vector3D(0, 0, -distance / 100))
				break

		}
		x0 = x1
		y0 = y1

	}
}

function onchange(_evt: Event) {
	console.log("TODO: ENABLE ME AGAIN")
	if (document.visibilityState === "visible") {
		renderer.renderLoopContinue()
	} else {
		renderer.renderLoopPause()
	}
}


// TODO: outsource the sliders to a separate file or use a library
let x = 0

let sliderX = document.createElement("input")
sliderX.type = "range"
sliderX.min = "-5"
sliderX.max = "5"
sliderX.value = "200"
sliderX.addEventListener("input", (_evt: Event) => {
	x = parseInt(sliderX.value)
})
document.body.appendChild(sliderX)

let y = 0

let sliderY = document.createElement("input")
sliderY.type = "range"
sliderY.min = "-5"
sliderY.max = "5"
sliderY.value = "150"
sliderY.addEventListener("input", (_evt: Event) => {
	y = parseInt(sliderY.value)
})
document.body.appendChild(sliderY)

let scene = new Scene()

scene.objects.push(new Cube(new Point3D(1, 0, -2), new Vector3D(0, 0, 0), 1, "green", true))
scene.objects.push(new Cube(new Point3D(-1, 0, -2), new Vector3D(0, 0, 0), 1, "blue", true))
scene.objects.push(new Cube(new Point3D(1, -1, -1), new Vector3D(0, 0, 0), 2, "black", true))
scene.objects.push(new Cube(new Point3D(0.5, -0.5, -0.5), new Vector3D(0, 0, 0), 1, "red", true))
scene.objects.push(new Cube(new Point3D(0, 3, 0), new Vector3D(0, 0, 0), 2, "red", true))
scene.objects.push(new Cube(new Point3D(0, 1, 0), new Vector3D(45, 0, 0), 1, "red", true))

// TODO: replace with requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
renderer.setAnimation(() => {
	renderer.clear()
	renderer.drawGizmos(camera, new Point3D(0, 0, 0))
	renderer.drawScene(scene, camera);
})

renderer.startRenderLoop()

renderer2.setAnimation(() => {
	renderer2.clear()
	renderer2.drawGizmos(camera2, new Point3D(0, 0, 0))
	renderer2.drawScene(scene, camera2);
})
renderer2.startRenderLoop()

renderer3.setAnimation(() => {
	renderer3.clear()
	renderer3.drawGizmos(camera3, new Point3D(0, 0, 0))
	renderer3.drawScene(scene, camera3);
})
renderer3.startRenderLoop()

console.log("Hello world!")
