/// <reference path="../lib/babylon.d.ts"/>
class Main {
    constructor(canvasElement) {
        Main.Canvas = document.getElementById(canvasElement);
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }
    createScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);
        var camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 1, BABYLON.Vector3.Zero(), Main.Scene);
        camera.setPosition(new BABYLON.Vector3(0, 5, -10));
        camera.attachControl(Main.Canvas, true);
        let start = new BABYLON.Vector2(-5, -5);
        BABYLON.MeshBuilder.CreateSphere("start", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(-5, 0, -5);
        let end = new BABYLON.Vector2(5, 5);
        BABYLON.MeshBuilder.CreateSphere("end", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(5, 0, 5);
        let navGraph = new NavGraph();
        navGraph.setStart(start);
        navGraph.setEnd(end);
        navGraph.obstacles = [];
        for (let i = 0; i < 10; i++) {
            let o = Obstacle.CreateHexagon(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 2.5 + 0.5);
            o.display(Main.Scene);
            navGraph.obstacles.push(o);
        }
        navGraph.update();
        navGraph.display(Main.Scene);
    }
    animate() {
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
        });
        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}
window.addEventListener("DOMContentLoaded", () => {
    let game = new Main("render-canvas");
    game.createScene();
    game.animate();
});
class Math2D {
    static Dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    static DistanceSquared(from, to) {
        return (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y);
    }
    static Distance(from, to) {
        return Math.sqrt(Math2D.DistanceSquared(from, to));
    }
    static AngleFromTo(from, to, keepPositive = false) {
        let dot = Math2D.Dot(from, to) / from.length() / to.length();
        let angle = Math.acos(dot);
        let cross = from.x * to.y - from.y * to.x;
        angle *= Math.sign(cross);
        if (keepPositive && angle < 0) {
            angle += Math.PI * 2;
        }
        return angle;
    }
    static RotateInPlace(vector, alpha) {
        let x = Math.cos(alpha) * vector.x - Math.sin(alpha) * vector.y;
        let y = Math.cos(alpha) * vector.y + Math.sin(alpha) * vector.x;
        vector.x = x;
        vector.y = y;
    }
    static get _Tmp0() {
        if (!Math2D.__Tmp0) {
            Math2D.__Tmp0 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp0;
    }
    static get _Tmp1() {
        if (!Math2D.__Tmp1) {
            Math2D.__Tmp1 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp1;
    }
    static get _Tmp2() {
        if (!Math2D.__Tmp2) {
            Math2D.__Tmp2 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp2;
    }
    static get _Tmp3() {
        if (!Math2D.__Tmp3) {
            Math2D.__Tmp3 = new BABYLON.Vector2(1, 0);
        }
        return Math2D.__Tmp3;
    }
    static PointSegmentABDistanceSquared(point, segA, segB) {
        Math2D._Tmp0.copyFrom(segB).subtractInPlace(segA).normalize();
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, Math2D._Tmp0);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }
    static PointSegmentAxAyBxByDistanceSquared(point, segAx, segAy, segBx, segBy) {
        Math2D._Tmp2.x = segAx;
        Math2D._Tmp2.y = segAy;
        Math2D._Tmp3.x = segBx;
        Math2D._Tmp3.y = segBy;
        return Math2D.PointSegmentABDistanceSquared(point, Math2D._Tmp2, Math2D._Tmp3);
    }
    static PointSegmentABUDistanceSquared(point, segA, segB, u) {
        Math2D._Tmp1.copyFrom(point).subtractInPlace(segA);
        let projectionDistance = Math2D.Dot(Math2D._Tmp1, u);
        if (projectionDistance < 0) {
            return Math2D.DistanceSquared(point, segA);
        }
        if (projectionDistance * projectionDistance > Math2D.DistanceSquared(segB, segA)) {
            return Math2D.DistanceSquared(point, segB);
        }
        Math2D._Tmp0.copyFrom(u).scaleInPlace(projectionDistance);
        return Math2D.Dot(Math2D._Tmp1, Math2D._Tmp1) - Math2D.Dot(Math2D._Tmp0, Math2D._Tmp0);
    }
    static IsPointInSegment(point, segA, segB) {
        if ((point.x - segA.x) * (segB.x - segA.x) + (point.y - segA.y) * (segB.y - segA.y) < 0) {
            return false;
        }
        if ((point.x - segB.x) * (segA.x - segB.x) + (point.y - segB.y) * (segA.y - segB.y) < 0) {
            return false;
        }
        return true;
    }
    static IsPointInRay(point, rayOrigin, rayDirection) {
        if ((point.x - rayOrigin.x) * rayDirection.x + (point.y - rayOrigin.y) * rayDirection.y < 0) {
            return false;
        }
        return true;
    }
    static IsPointInRegion(point, region) {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, Math2D._Tmp1, Math2D._Tmp2)) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    static IsPointInPath(point, path) {
        let count = 0;
        let randomDir = Math.random() * Math.PI * 2;
        Math2D._Tmp0.x = Math.cos(randomDir);
        Math2D._Tmp0.y = Math.sin(randomDir);
        for (let i = 0; i < path.length; i++) {
            if (Math2D.RaySegmentIntersection(point, Math2D._Tmp0, path[i], path[(i + 1) % path.length])) {
                count++;
            }
        }
        return count % 2 === 1;
    }
    /*
    public static IsPointInShape(point: BABYLON.Vector2, shape: IShape): boolean {
        for (let i = 0; i < shape.regions.length; i++) {
            let region = shape.regions[i];
            if (Math2D.IsPointInRegion(point, region)) {
                return true;
            }
        }
        return false;
    }
    */
    static RaySegmentIntersection(rayOrigin, rayDirection, segA, segB) {
        let x1 = rayOrigin.x;
        let y1 = rayOrigin.y;
        let x2 = x1 + rayDirection.x;
        let y2 = y1 + rayDirection.y;
        let x3 = segA.x;
        let y3 = segA.y;
        let x4 = segB.x;
        let y4 = segB.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, rayOrigin, rayDirection)) {
                if (Math2D.IsPointInSegment(intersection, segA, segB)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static SegmentSegmentIntersection(seg1A, seg1B, seg2A, seg2B) {
        let x1 = seg1A.x;
        let y1 = seg1A.y;
        let x2 = seg1B.x;
        let y2 = seg1B.y;
        let x3 = seg2A.x;
        let y3 = seg2A.y;
        let x4 = seg2B.x;
        let y4 = seg2B.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInSegment(intersection, seg1A, seg1B)) {
                if (Math2D.IsPointInSegment(intersection, seg2A, seg2B)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static PointRegionDistanceSquared(point, region) {
        let minimalSquaredDistance = Infinity;
        for (let i = 0; i < region.length; i++) {
            Math2D._Tmp1.x = region[i][0];
            Math2D._Tmp1.y = region[i][1];
            Math2D._Tmp2.x = region[(i + 1) % region.length][0];
            Math2D._Tmp2.y = region[(i + 1) % region.length][1];
            let distSquared = Math2D.PointSegmentAxAyBxByDistanceSquared(point, region[i][0], region[i][1], region[(i + 1) % region.length][0], region[(i + 1) % region.length][1]);
            minimalSquaredDistance = Math.min(minimalSquaredDistance, distSquared);
        }
        return minimalSquaredDistance;
    }
}
class SpaceMath {
    static ProjectPerpendicularAt(v, at) {
        let p = BABYLON.Vector3.Zero();
        let k = (v.x * at.x + v.y * at.y + v.z * at.z);
        k = k / (at.x * at.x + at.y * at.y + at.z * at.z);
        p.copyFrom(v);
        p.subtractInPlace(at.multiplyByFloats(k, k, k));
        return p;
    }
    static Angle(from, to) {
        let pFrom = BABYLON.Vector3.Normalize(from);
        let pTo = BABYLON.Vector3.Normalize(to);
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        return angle;
    }
    static AngleFromToAround(from, to, around) {
        let pFrom = SpaceMath.ProjectPerpendicularAt(from, around).normalize();
        let pTo = SpaceMath.ProjectPerpendicularAt(to, around).normalize();
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        if (BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(pFrom, pTo), around) < 0) {
            angle = -angle;
        }
        return angle;
    }
    static CatmullRomPath(path) {
        let interpolatedPoints = [];
        for (let i = 0; i < path.length; i++) {
            let p0 = path[(i - 1 + path.length) % path.length];
            let p1 = path[i];
            let p2 = path[(i + 1) % path.length];
            let p3 = path[(i + 2) % path.length];
            interpolatedPoints.push(BABYLON.Vector3.CatmullRom(p0, p1, p2, p3, 0.5));
        }
        for (let i = 0; i < interpolatedPoints.length; i++) {
            path.splice(2 * i + 1, 0, interpolatedPoints[i]);
        }
    }
}
class AdmiralCamera extends BABYLON.FreeCamera {
    constructor(spaceship) {
        super("AdmiralCamera", new BABYLON.Vector3(0, 7.4, -12), spaceship.getScene());
        this.parent = spaceship;
        this.attachControl(Main.Canvas);
    }
}
class SpaceshipControler {
    constructor(spaceship) {
        this.spaceship = spaceship;
    }
}
/// <reference path="./SpaceshipControler.ts"/>
class AIControler extends SpaceshipControler {
    constructor(spaceship) {
        super(spaceship);
        this.dirToTarget = BABYLON.Vector3.One();
        this.localX = BABYLON.Vector3.Right();
        this.localY = BABYLON.Vector3.Up();
        this.localZ = BABYLON.Vector3.Forward();
        this._k = 0;
        this.update = () => {
            this.rotateToward(new BABYLON.Vector3(50, 60, 100));
        };
        this.scene.onBeforeRenderObservable.add(this.update);
    }
    get scene() {
        return this.spaceship.getScene();
    }
    rotateToward(target) {
        this.dirToTarget.copyFrom(target);
        this.dirToTarget.subtractInPlace(this.spaceship.position);
        this.spaceship.getDirectionToRef(BABYLON.Axis.X, this.localX);
        this.spaceship.getDirectionToRef(BABYLON.Axis.Z, this.localZ);
        let pitchAngle = SpaceMath.AngleFromToAround(this.localZ, this.dirToTarget, this.localX);
        this.spaceship.pitch = pitchAngle / Math.PI * 0.25 + this.spaceship.pitch * 0.75;
        let rollAngle = SpaceMath.AngleFromToAround(this.localZ, this.dirToTarget, this.localY);
        this.spaceship.roll = rollAngle / Math.PI * 0.25 + this.spaceship.roll * 0.75;
    }
}
class SpaceshipMaterial {
    constructor(scene) {
        this.scene = scene;
        SpaceshipMaterial.instance = this;
        this.transparentGlass = new BABYLON.StandardMaterial("glassMaterial", this.scene);
        this.transparentGlass.diffuseColor.copyFromFloats(0, 0.2, 0.8);
        this.transparentGlass.alpha = 0.1;
    }
}
class NavGraph {
    constructor() {
        this.obstacles = [];
    }
    setStart(s) {
        if (!this.start) {
            this.start = new NavGraphPoint(0, undefined);
        }
        this.start.position = s;
    }
    setEnd(e) {
        if (!this.end) {
            this.end = new NavGraphPoint(1, undefined);
        }
        this.end.position = e;
    }
    update() {
        this.points = [this.start, this.end];
        let counter = 2;
        for (let i = 0; i < this.obstacles.length; i++) {
            let o = this.obstacles[i];
            let ngPoints = [];
            for (let j = 0; j < o.shape.length; j++) {
                let ngPoint = new NavGraphPoint(counter++, o.shape);
                ngPoint.position = o.shape[j];
                this.obstacles.forEach((otherObstacle) => {
                    if (otherObstacle !== o) {
                        if (Math2D.IsPointInPath(ngPoint.position, otherObstacle.shape)) {
                            ngPoint.unreachable = true;
                        }
                    }
                });
                ngPoints.push(ngPoint);
            }
            for (let j = 0; j < ngPoints.length; j++) {
                let p1 = ngPoints[j];
                let p2 = ngPoints[(j + 1) % ngPoints.length];
                if (!p1.unreachable && !p2.unreachable) {
                    NavGraphPoint.Connect(p1, p2);
                }
                if (!p1.unreachable) {
                    this.points.push(p1);
                }
            }
        }
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                let p1 = this.points[i];
                let p2 = this.points[j];
                if (p1.shape !== p2.shape || (!p1.shape && !p2.shape)) {
                    let d = p2.position.subtract(p1.position);
                    // Check if segment intersects p1.shape
                    let p1ShapeSelfIntersect = true;
                    if (p1.shape) {
                        let index = p1.shape.indexOf(p1.position);
                        let sNext = p1.shape[(index + 1) % p1.shape.length].subtract(p1.position);
                        let sPrev = p1.shape[(index - 1 + p1.shape.length) % p1.shape.length].subtract(p1.position);
                        if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                            p1ShapeSelfIntersect = false;
                        }
                    }
                    else {
                        p1ShapeSelfIntersect = false;
                    }
                    if (!p1ShapeSelfIntersect) {
                        // Check if segment intersects p2.shape
                        d.scaleInPlace(-1);
                        let p2ShapeSelfIntersect = true;
                        if (p2.shape) {
                            let index = p2.shape.indexOf(p2.position);
                            let sNext = p2.shape[(index + 1) % p2.shape.length].subtract(p2.position);
                            let sPrev = p2.shape[(index - 1 + p2.shape.length) % p2.shape.length].subtract(p2.position);
                            if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                                p2ShapeSelfIntersect = false;
                            }
                        }
                        else {
                            p2ShapeSelfIntersect = false;
                        }
                        if (!p2ShapeSelfIntersect) {
                            let crossOtherShape = false;
                            for (let i = 0; i < this.obstacles.length; i++) {
                                let o = this.obstacles[i];
                                if (o.shape !== p1.shape && o.shape !== p2.shape) {
                                    for (let j = 0; j < o.shape.length; j++) {
                                        let s1 = o.shape[j];
                                        let s2 = o.shape[(j + 1) % o.shape.length];
                                        if (Math2D.SegmentSegmentIntersection(p1.position, p2.position, s1, s2)) {
                                            crossOtherShape = true;
                                        }
                                    }
                                }
                            }
                            if (!crossOtherShape) {
                                NavGraphPoint.Connect(p1, p2);
                            }
                        }
                    }
                }
            }
        }
        this.end.distanceToEnd = 0;
        this.end.propagateDistanceToEnd();
        this.path = [this.start];
        this.start.appendNextPathPoint(this.path);
    }
    display(scene) {
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            BABYLON.MeshBuilder.CreateSphere("p-" + i, { diameter: 0.1 }, scene).position.copyFromFloats(p.position.x, -0.2, p.position.y);
            for (let j = 0; j < p.neighbourgs.length; j++) {
                let p2 = p.neighbourgs[j];
                if (p.index < p2.index) {
                    BABYLON.MeshBuilder.CreateLines("line", {
                        points: [
                            new BABYLON.Vector3(p.position.x, -0.1, p.position.y),
                            new BABYLON.Vector3(p2.position.x, -0.1, p2.position.y)
                        ],
                        colors: [
                            new BABYLON.Color4(0.5, 0.5, 0.5, 1),
                            new BABYLON.Color4(0.5, 0.5, 0.5, 1)
                        ]
                    }, scene);
                }
            }
        }
        if (this.path) {
            let points = [];
            let colors = [];
            for (let i = 0; i < this.path.length; i++) {
                let p = this.path[i];
                points.push(new BABYLON.Vector3(p.position.x, 0.1, p.position.y));
                colors.push(new BABYLON.Color4(1, 0, 0, 1));
            }
            BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
        }
    }
}
class NavGraphPoint {
    constructor(index, shape) {
        this.index = 0;
        this.shape = [];
        this.neighbourgs = [];
        this.distanceToEnd = Infinity;
        this.unreachable = false;
        this.index = index;
        this.shape = shape;
    }
    propagateDistanceToEnd() {
        for (let i = 0; i < this.neighbourgs.length; i++) {
            let n = this.neighbourgs[i];
            let distanceToEnd = Math2D.Distance(this.position, n.position) + this.distanceToEnd;
            if (distanceToEnd < n.distanceToEnd) {
                n.distanceToEnd = distanceToEnd;
                n.propagateDistanceToEnd();
            }
        }
    }
    appendNextPathPoint(path) {
        this.neighbourgs.sort((a, b) => { return (Math2D.Distance(this.position, a.position) + a.distanceToEnd) - (Math2D.Distance(this.position, b.position) + b.distanceToEnd); });
        if (this.neighbourgs[0]) {
            if (this.neighbourgs[0].distanceToEnd < Infinity) {
                path.push(this.neighbourgs[0]);
                if (this.neighbourgs[0].distanceToEnd > 0) {
                    this.neighbourgs[0].appendNextPathPoint(path);
                }
            }
        }
    }
    static Connect(p1, p2) {
        if (p1.neighbourgs.indexOf(p2) === -1) {
            p1.neighbourgs.push(p2);
        }
        if (p2.neighbourgs.indexOf(p1) === -1) {
            p2.neighbourgs.push(p1);
        }
    }
}
class Obstacle {
    constructor() {
        this.shape = [];
    }
    static CreateSquare(x, y, size = 1) {
        let square = new Obstacle();
        square.shape = [
            new BABYLON.Vector2(x - size * 0.5, y - size * 0.5),
            new BABYLON.Vector2(x + size * 0.5, y - size * 0.5),
            new BABYLON.Vector2(x + size * 0.5, y + size * 0.5),
            new BABYLON.Vector2(x - size * 0.5, y + size * 0.5)
        ];
        return square;
    }
    static CreateHexagon(x, y, size = 1) {
        let square = new Obstacle();
        for (let i = 0; i < 6; i++) {
            square.shape.push(new BABYLON.Vector2(x + Math.cos(i * Math.PI / 3) * size * 0.5, y + Math.sin(i * Math.PI / 3) * size * 0.5));
        }
        return square;
    }
    display(scene) {
        let points = [];
        for (let i = 0; i < this.shape.length; i++) {
            let p = this.shape[i];
            points.push(new BABYLON.Vector3(p.x, 0, p.y));
        }
        points.push(points[0]);
        return BABYLON.MeshBuilder.CreateLines("shape", { points: points }, scene);
    }
}
class Spaceship extends BABYLON.TransformNode {
    constructor(name) {
        super(name);
        this.speed = 0;
        this.thrust = 0;
        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;
        this._deltaPosition = BABYLON.Vector3.Zero();
        this.update = () => {
            let dt = this.getScene().getEngine().getDeltaTime() / 1000;
            this.speed += this.thrust * 10 * dt;
            this.speed *= 0.99;
            this.getDirectionToRef(BABYLON.Axis.Z, this._deltaPosition);
            this._deltaPosition.scaleInPlace(this.speed * dt);
            this.position.addInPlace(this._deltaPosition);
            let roll = BABYLON.Quaternion.RotationAxis(this.getDirection(BABYLON.Axis.Z), -this.roll * dt);
            this.rotationQuaternion = roll.multiply(this.rotationQuaternion);
            let yaw = BABYLON.Quaternion.RotationAxis(this.getDirection(BABYLON.Axis.Y), this.yaw * dt);
            this.rotationQuaternion = yaw.multiply(this.rotationQuaternion);
            let pitch = BABYLON.Quaternion.RotationAxis(this.getDirection(BABYLON.Axis.X), -this.pitch * dt);
            this.rotationQuaternion = pitch.multiply(this.rotationQuaternion);
        };
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.getScene().onBeforeRenderObservable.add(this.update);
    }
    async instantiate() {
        return new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh("", "./datas/" + this.name + ".babylon", "", this.getScene(), (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    let mesh = meshes[i];
                    if (mesh.material instanceof BABYLON.StandardMaterial) {
                        if (mesh.material.name.split(".")[1] === "transparentGlass") {
                            console.log(mesh.material.name);
                            mesh.material = SpaceshipMaterial.instance.transparentGlass;
                        }
                    }
                    mesh.parent = this;
                }
                resolve();
            });
        });
    }
}