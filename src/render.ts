import { Matrix4x4, Point3D, Vector3D, WorldObject } from "src/math"

export class Scene {
	objects: WorldObject[] = []

	constructor() {
	}

}

export enum ProjectionMode {
	Parallel,
	Perspective
}

export class Camera {
	lookAt: Matrix4x4
	projectionMatrix: Matrix4x4
	right: Vector3D;
	up: Vector3D;
	dir: Vector3D;
	projectionMode: ProjectionMode;
	rotationMatrix: Matrix4x4;
	eye: Point3D

	constructor(eye: Point3D, center: Point3D, up: Vector3D, projectionMode: ProjectionMode) {
		this.up = up
		this.up.normalize()

		this.dir = Vector3D.fromPoint(eye).sub(Vector3D.fromPoint(center))
		this.dir.normalize()

		this.right = this.dir.cross(up)
		this.right.normalize()

		this.projectionMode = projectionMode
		this.eye = eye

		this.rotationMatrix = new Matrix4x4()

		this.calculateMatrix()
	}

	calculateMatrix() {

		// let alpha = this.transform.getRotation().z * Math.PI / 180
		// let beta = this.transform.getRotation().y * Math.PI / 180
		// let gamma = this.transform.getRotation().x * Math.PI / 180

		// this.rotationMatrix = new Matrix4x4( // rotation z
		// 	Math.cos(alpha), -Math.sin(alpha), 0, 0,
		// 	Math.sin(alpha), Math.cos(alpha), 0, 0,
		// 	0, 0, 1, 0,
		// 	0, 0, 0, 1
		// ).mulMat(new Matrix4x4( // rotation y
		// 	Math.cos(beta), 0, Math.sin(beta), 0,
		// 	0, 1, 0, 0,
		// 	-Math.sin(beta), 0, Math.cos(beta), 0,
		// 	0, 0, 0, 1
		// )).mulMat(new Matrix4x4( // rotation x
		// 	1, 0, 0, 0,
		// 	0, Math.cos(gamma), -Math.sin(gamma), 0,
		// 	0, Math.sin(gamma), Math.cos(gamma), 0,
		// 	0, 0, 0, 1
		// ))

		this.lookAt = new Matrix4x4(
			this.right.x, this.right.y, this.right.z, -this.right.dot(this.eye),
			this.up.x, this.up.y, this.up.z, -this.up.dot(this.eye),
			-this.dir.x, -this.dir.y, -this.dir.z, this.dir.dot(this.eye),
			0, 0, 0, 1
		)


		if (this.projectionMode == ProjectionMode.Parallel) {
			let pParallelProjection = new Matrix4x4(
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 0, 1,
				0, 0, 0, this.eye.z
			)
			this.projectionMatrix = pParallelProjection
		} else if (this.projectionMode == ProjectionMode.Perspective) {
			// http://learnwebgl.brown37.net/08_projections/projections_perspective.html
			let aspect = 1.0
			let near = 2.0
			let far = 40
			let fov = 90

			// fov 90 = 45 degrees => t~=2 and r ~= 2
			let t = near * Math.tan((fov * Math.PI / 180) / 2)
			let b = -t

			let r = t * aspect
			let l = -r


			let mid_x = (l + r) / 2
			let mid_y = (t + b) / 2
			// yellow matrix
			let moveToFrustumApex = new Matrix4x4(
				1, 0, 0, -mid_x,
				0, 1, 0, -mid_y,
				0, 0, 1, 0,
				0, 0, 0, 1)

			// mapping depth z values to -1 to 1
			// purple matrix
			let c1 = 2 * far * near / (near - far)
			let c2 = (far + near) / (far - near)
			let mapZmatrix = new Matrix4x4(
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, -c2, c1,
				0, 0, -1, 0
			)

			// gray matrix
			let mFrustum = new Matrix4x4(
				near, 0, 0, 0,
				0, near, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1
			)

			// scale the view window to (-1,-1) to (1,1)
			// cyan matrix
			let scaleViewMatrix = new Matrix4x4(
				2 / (r - l), 0, 0, 0,
				0, 2 / (t - b), 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1
			)

			// combine matrices
			let m = mapZmatrix.mulMat(moveToFrustumApex)
			m = mFrustum.mulMat(m)
			m = scaleViewMatrix.mulMat(m)

			this.projectionMatrix = m
		} else {
			throw new Error("Unknown projection mode")
		}
	}

	rotateBy(R: Matrix4x4) {
		this.rotationMatrix = R.mulMat(this.rotationMatrix)
	}

	setPosition(eye: Point3D) {
		this.eye = eye
		this.calculateMatrix()
	}

	translate(dx: number, dy: number, dz: number): void {
		this.eye.x += dx
		this.eye.y += dy
		this.eye.z += dz
		this.calculateMatrix()
	}

	translateVec(delta: Vector3D): void {
		this.eye = this.eye.add(delta)
		this.calculateMatrix()
	}
}

export class Renderer {
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	renderActive: boolean = true
	animationLoop: CallableFunction | null = null
	intervalID: number | null = null
	viewportMatrix: Matrix4x4
	title: string;
	private onMouseDown: (this: HTMLCanvasElement, ev: MouseEvent) => any;
	private onMouseUp: (this: HTMLCanvasElement, ev: MouseEvent) => any;
	private onMouseMove: (this: HTMLCanvasElement, ev: MouseEvent) => any;

	constructor(title: string, width: number, height: number) {
		this.title = title

		this.canvas = this.createCanvas(width, height)
		this.ctx = this.canvas.getContext("2d")

		let viewportWidth = width
		let viewportHeight = height
		let viewPortL = 0
		let viewportB = 0
		this.viewportMatrix = new Matrix4x4(
			viewportWidth / 2.0, 0, 0, viewportWidth / 2 + viewPortL,
			0, viewportHeight / 2.0, 0, viewportHeight / 2 + viewportB,
			0, 0, 1, 0,
			0, 0, 0, 1
		)
	}

	createCanvas(width: number, height: number) {
		let div = document.createElement("div")
		div.style.display = "inline-block"
		document.body.appendChild(div)

		let title = document.createElement("p")
		title.innerHTML = this.title
		div.appendChild(title)

		let canvas = document.createElement("canvas")
		canvas.width = width
		canvas.height = height
		canvas.style.border = "1px solid black"
		canvas.style.marginTop = "10px"
		canvas.style.marginLeft = "10px"
		div.appendChild(canvas)

		return canvas
	}

	setMouseEventListener(onMouseDown: (this: HTMLCanvasElement, ev: MouseEvent) => any,
		onMouseUp: (this: HTMLCanvasElement, ev: MouseEvent) => any,
		onMouseMove: (this: HTMLCanvasElement, ev: MouseEvent) => any) {
		if (this.onMouseUp)
			this.canvas.removeEventListener("mouseup", this.onMouseUp)
		if (this.onMouseDown)
			this.canvas.removeEventListener("mousedown", this.onMouseUp)
		if (this.onMouseMove)
			this.canvas.removeEventListener("mousemove", this.onMouseMove)

		this.onMouseDown = onMouseDown
		this.canvas.addEventListener("mousedown", onMouseDown);
		this.onMouseUp = onMouseUp
		this.canvas.addEventListener("mouseup", onMouseUp);
		this.onMouseMove = onMouseMove
		this.canvas.addEventListener("mousemove", onMouseMove);
	}


	clear(): void {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	}

	setAnimation(animationLoop: CallableFunction) {
		this.animationLoop = animationLoop
	}

	transform(camera: Camera, point: Point3D): Point3D {
		let m = camera.lookAt.mulMat(camera.rotationMatrix)
		m = camera.projectionMatrix.mulMat(m)
		m = this.viewportMatrix.mulMat(m);

		let p = m.mulVec(point)
		p.dehomogen()

		return p
	}

	drawPoint3D(camera: Camera, point: Point3D, color: string = "black", radius: number = 1) {
		let p = this.transform(camera, point)

		this.ctx.beginPath()
		this.ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI)
		this.ctx.fillStyle = color
		this.ctx.fill()
	}

	drawLine3D(camera: Camera, p0: Point3D, p1: Point3D, color: string = "black", width: number = 1) {
		let start = this.transform(camera, p0)
		let end = this.transform(camera, p1)

		this.ctx.beginPath()
		this.ctx.moveTo(start.x, start.y)
		this.ctx.lineTo(end.x, end.y)
		this.ctx.strokeStyle = color
		this.ctx.lineWidth = width
		this.ctx.stroke()
	}

	drawPolygon3D(camera: Camera, points: Point3D[], color: string = "black") {
		this.ctx.beginPath()
		let start = this.transform(camera, points[0])
		this.ctx.moveTo(start.x, start.y)
		points.forEach((p) => {
			p = this.transform(camera, p)
			this.ctx.lineTo(p.x, p.y)
		})
		this.ctx.lineTo(start.x, start.y)
		this.ctx.fillStyle = color
		this.ctx.fill()
	}

	drawGizmos(camera: Camera, pos: Point3D) {
		this.drawPoint3D(camera, pos.clone().add(new Vector3D(0, 0, 0)), "black", 5);

		this.drawPoint3D(camera, pos.clone().add(new Vector3D(1, 0, 0)), "red", 5);
		this.drawPoint3D(camera, pos.clone().add(new Vector3D(0, 1, 0)), "lightgreen", 5);
		this.drawPoint3D(camera, pos.clone().add(new Vector3D(0, 0, -1)), "blue", 5);

		this.drawLine3D(camera, pos, pos.clone().add(new Vector3D(1, 0, 0)), "red", 2);
		this.drawLine3D(camera, pos, pos.clone().add(new Vector3D(0, 1, 0)), "lightgreen", 2);
		this.drawLine3D(camera, pos, pos.clone().add(new Vector3D(0, 0, -1)), "blue", 2);
	}

	startRenderLoop() {
		this.renderActive = true
		console.log("Render loop started")
		this.renderLoopContinue()
	}

	renderLoopPause() {
		this.renderActive = false
		if (this.intervalID != null)
			window.clearInterval(this.intervalID)
		this.intervalID = null
		console.log("Render loop paused")
	}

	renderLoopContinue() {
		this.intervalID = setInterval(() => {
			if (this.renderActive == false) {
				return
			}

			if (this.animationLoop != null) {
				this.animationLoop()
			}
		}, 100)
		this.renderActive = true
		console.log("Render loop continued")
	}


	drawScene(scene: Scene, camera: Camera) {

		scene.objects.forEach((obj) => {
			obj.draw(this, camera)
		})

	}
}
