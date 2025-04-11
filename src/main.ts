import { Camera, ProjectionMode, Renderer, Scene } from "src/render"
import { Cube, Matrix4x4, Point3D, Vector3D } from "src/math"
import { CustomSlider } from "./slider"

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
				sliderX.setValue(camera.eye.x)
				sliderY.setValue(camera.eye.y)
				sliderZ.setValue(camera.eye.z)
				break
			case MouseMode.Zoom:
				let distance = y1 - y0
				camera.translateVec(new Vector3D(0, 0, -distance / 100))
				sliderX.setValue(camera.eye.x)
				sliderY.setValue(camera.eye.y)
				sliderZ.setValue(camera.eye.z)
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


camera.setPosition(new Point3D(0, 5, 5))

let aspectSlider = CustomSlider.createSlider("aspect", 0.1, 5.0, 0.1, 1.0)
aspectSlider.onChangeCallback = onSliderUpdate
document.body.appendChild(aspectSlider)

let fovXSlider = CustomSlider.createSlider("fovX", 0, 180, 1, 60)
fovXSlider.onChangeCallback = onSliderUpdate
document.body.appendChild(fovXSlider)


let fovYSlider = CustomSlider.createSlider("fovY", 0, 180, 1, 90)
fovYSlider.onChangeCallback = onSliderUpdate
document.body.appendChild(fovYSlider)

let sliderX = CustomSlider.createSlider("x", -5, 5, 0.1, camera.eye.x)
sliderX.onChangeCallback = onSliderUpdate
document.body.appendChild(sliderX)

let sliderY = CustomSlider.createSlider("y", -5, 5, 0.1, camera.eye.y)
sliderY.onChangeCallback = onSliderUpdate
document.body.appendChild(sliderY)

let sliderZ = CustomSlider.createSlider("z", 0, 20, 1, camera.eye.z)
sliderZ.onChangeCallback = onSliderUpdate
document.body.appendChild(sliderZ)

function onSliderUpdate(slider: CustomSlider, value: number) {
	if (slider === aspectSlider) {
		camera.setFovXWithAspect(fovXSlider.value, aspectSlider.value)
		fovXSlider.setValue(fovXSlider.value)
		fovYSlider.setValue(fovXSlider.value / aspectSlider.value)
	} else if (slider === fovXSlider || slider === fovYSlider) {
		camera.setFov(fovXSlider.value, fovYSlider.value)
		aspectSlider.setValue(fovXSlider.value / fovYSlider.value)
	} else if (slider == sliderX || slider == sliderY || slider == sliderZ) {
		camera.setPosition(new Point3D(sliderX.value, sliderY.value, sliderZ.value))
	}
}



camera.setNearFar(-0.2, -100)

camera2.setNearFar(-0.2, -10)
camera2.setFov(90, 90)

camera3.setNearFar(-0.2, -10)
camera3.setFov(90, 90)

let scene = new Scene()

scene.objects.push(new Cube(new Point3D(0, 0, -2), new Vector3D(0, 0, 0), 1, "green", false))
scene.objects.push(new Cube(new Point3D(0.5, -0.5, -0.5), new Vector3D(0, 0, 0), 1, "red", true))
// scene.objects.push(new Cube(new Point3D(-1, 0, -2), new Vector3D(0, 0, 0), 1, "blue", true))
// scene.objects.push(new Cube(new Point3D(1, -1, -1), new Vector3D(0, 0, 0), 2, "black", true))
// scene.objects.push(new Cube(new Point3D(0, 3, 0), new Vector3D(0, 0, 0), 2, "red", true))
// scene.objects.push(new Cube(new Point3D(0, 1, 0), new Vector3D(45, 0, 0), 1, "red", true))


// m = camera.lookAt.mulMat(m)
// m = camera.rotationMatrix.mulMat(m)

function drawViewFrustum(renderer: Renderer, camera: Camera, frustumCamera: Camera) {
	let corners = frustumCamera.viewFrustum.calculateCorners()
	let points = corners.map((corner) => {
		let p = frustumCamera.lookAtInv.mulVec(corner)
		return p
	})

	renderer.drawLine3D(camera, points[0], points[1], "green", 3)
	renderer.drawLine3D(camera, points[1], points[3], "green", 3)
	renderer.drawLine3D(camera, points[3], points[2], "green", 3)
	renderer.drawLine3D(camera, points[2], points[0], "green", 3)

	renderer.drawLine3D(camera, points[4], points[5], "red", 3)
	renderer.drawLine3D(camera, points[5], points[7], "red", 3)
	renderer.drawLine3D(camera, points[7], points[6], "red", 3)
	renderer.drawLine3D(camera, points[6], points[4], "red", 3)

	renderer.drawLine3D(camera, points[0], points[4], "purple", 2)
	renderer.drawLine3D(camera, points[1], points[5], "purple", 2)
	renderer.drawLine3D(camera, points[3], points[7], "purple", 2)
	renderer.drawLine3D(camera, points[2], points[6], "purple", 2)

	points.forEach((point) => {
		renderer.drawPoint3D(camera, point, "orange", 10)
	})

}


// TODO: replace with requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
renderer.setAnimation(() => {
	renderer.clear()
	renderer.drawGizmos(camera, new Point3D(0, 0, 0))
	renderer.drawScene(scene, camera);

	renderer.drawPoint3D(camera, camera.center, "blue", 10)

	drawViewFrustum(renderer, camera, camera3)
	drawViewFrustum(renderer, camera, camera2)
})

renderer.startRenderLoop()


renderer2.setAnimation(() => {
	renderer2.clear()
	renderer2.drawGizmos(camera2, new Point3D(0, 0, 0))
	renderer2.drawScene(scene, camera2);
})
renderer2.animationLoop()

renderer3.setAnimation(() => {
	renderer3.clear()
	renderer3.drawGizmos(camera3, new Point3D(0, 0, 0))
	renderer3.drawScene(scene, camera3);
})
renderer3.startRenderLoop()

console.log("Hello world!")
