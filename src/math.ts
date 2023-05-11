import { Camera, Renderer } from "./render"

export class Point3D implements Renderable {
	x: number
	y: number
	z: number
	w: number

	constructor(x = 0, y = 0, z = 0, w = 1) {
		this.x = x
		this.y = y
		this.z = z
		this.w = w
	}

	clone(): Point3D {
		return new Point3D(this.x, this.y, this.z, this.w)
	}

	add(v: Vector3D): Point3D {
		this.x += v.x
		this.y += v.y
		this.z += v.z
		return this
	}

	sub(v: Vector3D): Point3D {
		this.add(v.mul(-1))
		return this
	}

	subPoint(p: Point3D): Vector3D {
		return new Vector3D(this.x - p.x, this.y - p.y, this.z - p.z)
	}

	draw(renderer: Renderer, camera: Camera): void {
		renderer.drawPoint3D(camera, this, "black", 5)
	}

	toVector(): Vector3D {
		return Vector3D.fromPoint(this)
	}

	dehomogen() {
		this.x /= this.w
		this.y /= this.w
		this.z /= this.w
		this.w = 1
	}

}

export class Vector3D {
	x: number
	y: number
	z: number
	w: number

	constructor(x = 0, y = 0, z = 0) {
		this.x = x
		this.y = y
		this.z = z
		this.w = 0
	}

	static fromPoint(p: Point3D): Vector3D {
		return new Vector3D(p.x, p.y, p.z)
	}

	mul(n: number): Vector3D {
		this.x *= n
		this.y *= n
		this.z *= n
		return this
	}

	dot(v: Vector3D | Point3D): number {
		return this.x * v.x + this.y * v.y + this.z * v.z
	}

	cross(v: Vector3D): Vector3D {
		return new Vector3D(
			this.y * v.z - this.z * v.y,
			this.z * v.x - this.x * v.z,
			this.x * v.y - this.y * v.x
		)
	}

	norm(): number {
		return Math.sqrt(this.dot(this))
	}

	normalize() {
		let n = this.norm()
		this.x /= n
		this.y /= n
		this.z /= n
	}

	sub(v: Vector3D): Vector3D {
		return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z)
	}
}

export class Matrix4x4 {
	a00: number; a01: number; a02: number; a03: number;
	a10: number; a11: number; a12: number; a13: number;
	a20: number; a21: number; a22: number; a23: number;
	a30: number; a31: number; a32: number; a33: number;

	constructor(
		a00 = 1, a01 = 0, a02 = 0, a03 = 0,
		a10 = 0, a11 = 1, a12 = 0, a13 = 0,
		a20 = 0, a21 = 0, a22 = 1, a23 = 0,
		a30 = 0, a31 = 0, a32 = 0, a33 = 1
	) {
		this.a00 = a00; this.a01 = a01; this.a02 = a02; this.a03 = a03;
		this.a10 = a10; this.a11 = a11; this.a12 = a12; this.a13 = a13;
		this.a20 = a20; this.a21 = a21; this.a22 = a22; this.a23 = a23;
		this.a30 = a30; this.a31 = a31; this.a32 = a32; this.a33 = a33;
	}

	mulMat(m: Matrix4x4) {
		return new Matrix4x4(
			this.a00 * m.a00 + this.a01 * m.a10 + this.a02 * m.a20 + this.a03 * m.a30,
			this.a00 * m.a01 + this.a01 * m.a11 + this.a02 * m.a21 + this.a03 * m.a31,
			this.a00 * m.a02 + this.a01 * m.a12 + this.a02 * m.a22 + this.a03 * m.a32,
			this.a00 * m.a03 + this.a01 * m.a13 + this.a02 * m.a23 + this.a03 * m.a33,
			this.a10 * m.a00 + this.a11 * m.a10 + this.a12 * m.a20 + this.a13 * m.a30,
			this.a10 * m.a01 + this.a11 * m.a11 + this.a12 * m.a21 + this.a13 * m.a31,
			this.a10 * m.a02 + this.a11 * m.a12 + this.a12 * m.a22 + this.a13 * m.a32,
			this.a10 * m.a03 + this.a11 * m.a13 + this.a12 * m.a23 + this.a13 * m.a33,
			this.a20 * m.a00 + this.a21 * m.a10 + this.a22 * m.a20 + this.a23 * m.a30,
			this.a20 * m.a01 + this.a21 * m.a11 + this.a22 * m.a21 + this.a23 * m.a31,
			this.a20 * m.a02 + this.a21 * m.a12 + this.a22 * m.a22 + this.a23 * m.a32,
			this.a20 * m.a03 + this.a21 * m.a13 + this.a22 * m.a23 + this.a23 * m.a33,
			this.a30 * m.a00 + this.a31 * m.a10 + this.a32 * m.a20 + this.a33 * m.a30,
			this.a30 * m.a01 + this.a31 * m.a11 + this.a32 * m.a21 + this.a33 * m.a31,
			this.a30 * m.a02 + this.a31 * m.a12 + this.a32 * m.a22 + this.a33 * m.a32,
			this.a30 * m.a03 + this.a31 * m.a13 + this.a32 * m.a23 + this.a33 * m.a33
		)
	}

	mulVec(v: Vector3D | Point3D) {
		return new Point3D(
			this.a00 * v.x + this.a01 * v.y + this.a02 * v.z + this.a03 * v.w,
			this.a10 * v.x + this.a11 * v.y + this.a12 * v.z + this.a13 * v.w,
			this.a20 * v.x + this.a21 * v.y + this.a22 * v.z + this.a23 * v.w,
			this.a30 * v.x + this.a31 * v.y + this.a32 * v.z + this.a33 * v.w
		)
	}
}


export class Transform {

	transform: Matrix4x4

	constructor(position: Point3D, rotation: Vector3D, scale: Vector3D) {

		let translateMat = new Matrix4x4(
			1, 0, 0, position.x,
			0, 1, 0, position.y,
			0, 0, 1, position.z,
			0, 0, 0, 1
		)


		let aX = (rotation.x * Math.PI) / 180
		let rotXMat = new Matrix4x4(
			1, 0, 0, 0,
			0, Math.cos(aX), -Math.sin(aX), 0,
			0, Math.sin(aX), Math.cos(aX), 0,
			0, 0, 0, 1
		)

		let aY = (rotation.y * Math.PI) / 180
		let rotYMat = new Matrix4x4(
			Math.cos(aY), 0, Math.sin(aY), 0,
			0, 1, 0, 0,
			-Math.sin(aY), 0, Math.cos(aY), 0,
			0, 0, 0, 1
		)

		let aZ = (rotation.z * Math.PI) / 180
		let rotZMat = new Matrix4x4(
			Math.cos(aZ), -Math.sin(aZ), 0, 0,
			Math.sin(aZ), Math.cos(aZ), 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		)

		let scaleMat = new Matrix4x4(
			scale.x, 0, 0, 0,
			0, scale.y, 0, 0,
			0, 0, scale.z, 0,
			0, 0, 0, 1
		)

		this.transform = translateMat.mulMat(rotXMat).mulMat(rotYMat).mulMat(rotZMat).mulMat(scaleMat)
	}

	getMatrix(): Matrix4x4 {
		return this.transform
	}

	setPosition(position: Point3D) {
		this.transform.a03 = position.x
		this.transform.a13 = position.y
		this.transform.a23 = position.z
	}

	getPosition(): Point3D {
		return new Point3D(this.transform.a03, this.transform.a13, this.transform.a23)
	}

	getRotation() {
		let rotX = Math.atan2(this.transform.a12, this.transform.a22) * 180 / Math.PI
		let rotY = Math.atan2(-this.transform.a02, Math.sqrt(this.transform.a12 * this.transform.a12 + this.transform.a22 * this.transform.a22)) * 180 / Math.PI
		let rotZ = Math.atan2(this.transform.a01, this.transform.a00) * 180 / Math.PI

		return new Vector3D(rotX, rotY, rotZ)
	}

}

export interface Renderable {
	draw(renderer: Renderer, camera: Camera): void;
}

export interface WorldObject extends Renderable {
	readonly transform: Transform;
}


export class Cube implements WorldObject {
	readonly transform: Transform
	private points: Point3D[]
	color: string
	fill: boolean

	//TODO: change rotation to quaternion
	constructor(position: Point3D, rotation: Vector3D, edgeLength: number, color: string = "black", fill: boolean = false) {
		this.color = color
		this.transform = new Transform(
			position,
			rotation,
			new Vector3D(1, 1, 1)
		)
		this.points = []
		this.fill = fill

		// generate cube with edge length 8 and center (4, 2, -6)
		for (let x = -1; x <= 1; x += 2) {
			for (let y = -1; y <= 1; y += 2) {
				for (let z = -1; z <= 1; z += 2) {
					this.points.push(
						new Point3D(
							x * (edgeLength / 2),
							y * (edgeLength / 2),
							z * (edgeLength / 2)
						)
					)
				}
			}
		}

	}

	draw(renderer: Renderer, camera: Camera): void {
		let points = this.points.map((p) => this.transform.getMatrix().mulVec(p))
		if (this.fill) {

			// bottom and top
			renderer.drawPolygon3D(camera, [points[0], points[1], points[5], points[4]], this.color)
			renderer.drawPolygon3D(camera, [points[2], points[3], points[7], points[6]], this.color)

			// left and right
			renderer.drawPolygon3D(camera, [points[0], points[1], points[3], points[2]], this.color)
			renderer.drawPolygon3D(camera, [points[4], points[5], points[7], points[6]], this.color)

			// front and back
			renderer.drawPolygon3D(camera, [points[1], points[5], points[7], points[3]], this.color)
			renderer.drawPolygon3D(camera, [points[0], points[4], points[6], points[2]], this.color)
		} else {
			renderer.drawLine3D(camera, points[0], points[1], this.color, 3)
			renderer.drawLine3D(camera, points[0], points[4], this.color, 3)
			renderer.drawLine3D(camera, points[0], points[2], this.color, 3)

			renderer.drawLine3D(camera, points[1], points[3], this.color, 3)
			renderer.drawLine3D(camera, points[1], points[5], this.color, 3)

			renderer.drawLine3D(camera, points[2], points[3], this.color, 3)
			renderer.drawLine3D(camera, points[2], points[6], this.color, 3)

			renderer.drawLine3D(camera, points[3], points[7], this.color, 3)
			renderer.drawLine3D(camera, points[4], points[5], this.color, 3)
			renderer.drawLine3D(camera, points[4], points[6], this.color, 3)
			renderer.drawLine3D(camera, points[5], points[7], this.color, 3)
			renderer.drawLine3D(camera, points[6], points[7], this.color, 3)
		}
	}
}
