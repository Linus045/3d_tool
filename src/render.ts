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


export class ViewFrustum {
	near: number
	far: number
	l: number
	r: number
	t: number
	b: number

	fovX: number
	fovY: number

	constructor(near: number, far: number, fovX: number, aspect: number) {
		this.near = near
		this.far = far
		this.fovX = fovX
		this.fovY = fovX / aspect
	}

	setNearFar(near: number, far: number) {
		this.near = near
		this.far = far
	}

	setFovXY(fovX: number, fovY: number) {
		this.fovX = fovX
		this.fovY = fovY
	}

	setFovXWithAspect(fovX: number, aspect: number) {
		this.fovX = fovX
		this.fovY = fovX / aspect
	}

	calculateNearPlane(): { t: number, b: number, l: number, r: number } {
		let t = this.near * Math.tan((this.fovY * Math.PI / 180) / 2)
		let b = -t
		let r = this.near * Math.tan((this.fovX * Math.PI / 180) / 2)
		let l = -r
		return { t, b, l, r }
	}

	calculateFarPlane(): { t: number, b: number, l: number, r: number } {
		let t = this.far * Math.tan((this.fovY * Math.PI / 180) / 2)
		let b = -t
		let r = this.far * Math.tan((this.fovX * Math.PI / 180) / 2)
		let l = -r
		return { t, b, l, r }
	}


	calculateMatrix(): Matrix4x4 {
		// http://learnwebgl.brown37.net/08_projections/projections_perspective.html
		// let aspect = 1.0

		// fov 90 = 45 degrees => t~=2 and r ~= 2
		let { t, b, l, r } = this.calculateNearPlane()

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
		let c1 = 2 * this.far * this.near / (this.near - this.far)
		let c2 = (this.far + this.near) / (this.far - this.near)
		let mapZmatrix = new Matrix4x4(
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, -c2, c1,
			0, 0, -1, 0
		)

		// gray matrix
		let mFrustum = new Matrix4x4(
			this.near, 0, 0, 0,
			0, this.near, 0, 0,
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

		// console.log("near", this.near, "far", this.far, "l", l, "r", r, "t", t, "b", b)

		let result = scaleViewMatrix.mulMat(mFrustum.mulMat(mapZmatrix).mulMat(moveToFrustumApex))
		// result.printMatrix("Frustum Matrix:")
		return result
	}


	calculateCorners(): Point3D[] {
		let corners = []

		let { t, b, l, r } = this.calculateNearPlane()

		// console.log("near", this.near, "far", this.far, "l", l, "r", r, "t", t, "b", b)

		corners[0] = new Point3D(l, t, this.near)
		corners[1] = new Point3D(l, b, this.near)
		corners[2] = new Point3D(r, t, this.near)
		corners[3] = new Point3D(r, l, this.near)


		let { t: tFar, b: bFar, l: lFar, r: rFar } = this.calculateFarPlane()

		// console.log("near", this.near, "far", this.far, "l", lFar, "r", rFar, "t", tFar, "b", bFar)

		corners[4] = new Point3D(lFar, tFar, this.far)
		corners[5] = new Point3D(lFar, bFar, this.far)
		corners[6] = new Point3D(rFar, tFar, this.far)
		corners[7] = new Point3D(rFar, lFar, this.far)

		return corners
	}

}

export class Camera {
	lookAt: Matrix4x4
	lookAtInv: Matrix4x4
	projectionMatrix: Matrix4x4
	right: Vector3D;
	up: Vector3D;
	dir: Vector3D;
	projectionMode: ProjectionMode;
	rotationMatrix: Matrix4x4;
	eye: Point3D

	viewFrustum: ViewFrustum


	constructor(eye: Point3D, center: Point3D, up: Vector3D, projectionMode: ProjectionMode) {
		this.up = up
		this.up.normalize()

		this.dir = Vector3D.fromPoint(center).sub(Vector3D.fromPoint(eye))
		this.dir.normalize()

		this.right = this.dir.cross(up)
		this.right.normalize()

		this.projectionMode = projectionMode
		this.eye = eye

		this.rotationMatrix = new Matrix4x4()

		this.viewFrustum = new ViewFrustum(-1, -10, 90, 1 / 1)

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

		this.lookAtInv = new Matrix4x4(
			this.right.x, this.up.x, -this.dir.x, this.eye.x,
			this.right.y, this.up.y, -this.dir.y, this.eye.y,
			this.right.z, this.up.z, -this.dir.z, this.eye.z,
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
			// combine matrices
			this.projectionMatrix = this.viewFrustum.calculateMatrix()
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

	setFov(fovX: number, fovY: number) {
		this.viewFrustum.setFovXY(fovX, fovY)
		this.calculateMatrix()
	}

	setNearFar(near: number, far: number) {
		this.viewFrustum.setNearFar(near, far)
		this.calculateMatrix()
	}

	setFovXWithAspect(fovX: number, aspect: number) {
		this.viewFrustum.setFovXWithAspect(fovX, aspect)
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

	transform(camera: Camera, point: Point3D): Point3D | null {
		let m = camera.lookAt.mulMat(camera.rotationMatrix)

		// invert y axis because canvas has positive y axis pointing down
		m = new Matrix4x4(
			1, 0, 0, 0,
			0, -1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1).mulMat(m)

		m = camera.projectionMatrix.mulMat(m)

		m = this.viewportMatrix.mulMat(m);

		let p = m.mulVec(point)
		if ((-p.z > camera.viewFrustum.near) || (-p.z < camera.viewFrustum.far)) {
			// console.log("point out of view frustum", camera.viewFrustum.near, camera.viewFrustum.far, -p.z)
			return null
		}

		return p
	}

	orderPointsByZ(points: Point3D[]) {
		points.sort((a: Point3D, b: Point3D) => {
			return b.z - a.z
		})
	}


	drawPoint3D(camera: Camera, point: Point3D, color: string = "black", radius: number = 1, dontTransform: boolean = false) {
		let p = dontTransform ? point : this.transform(camera, point)
		if (p == null) {
			return
		}
		p.dehomogen()

		this.ctx.beginPath()
		this.ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI)
		this.ctx.fillStyle = color
		this.ctx.fill()
	}

	drawLine3D(camera: Camera, p0: Point3D, p1: Point3D, color: string = "black", width: number = 1, dontTransform: boolean = false) {
		let start = dontTransform ? p0 : this.transform(camera, p0)
		let end = dontTransform ? p1 : this.transform(camera, p1)
		if (start == null || end == null) {
			return
		}
		start.dehomogen()
		end.dehomogen()

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
		if (start == null) {
			return
		}
		start.dehomogen()
		this.ctx.moveTo(start.x, start.y)
		points.forEach((p) => {
			p = this.transform(camera, p)
			p.dehomogen()
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
