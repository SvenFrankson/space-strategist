/// <reference path="../lib/babylon.d.ts"/>
class Main {
    static get cellShadingMaterial() {
        if (!Main._cellShadingMaterial) {
            Main._cellShadingMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
            Main._cellShadingMaterial.computeHighLevel = true;
        }
        return Main._cellShadingMaterial;
    }
    static get groundMaterial() {
        if (!Main._groundMaterial) {
            Main._groundMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
            Main._groundMaterial.diffuseTexture = new BABYLON.Texture("/img/ground.jpg", Main.Scene);
            Main._groundMaterial.computeHighLevel = true;
        }
        return Main._groundMaterial;
    }
    constructor(canvasElement) {
        Main.Canvas = document.getElementById(canvasElement);
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }
    async createScene() {
        Main.Scene = new BABYLON.Scene(Main.Engine);
        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);
        Main.Camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), Main.Scene);
        Main.Camera.setPosition(new BABYLON.Vector3(0, 5, -10));
        Main.Camera.attachControl(Main.Canvas, true);
        BABYLON.Effect.ShadersStore["EdgeFragmentShader"] = `
			#ifdef GL_ES
			precision highp float;
			#endif
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform sampler2D depthSampler;
			uniform float 		width;
			uniform float 		height;
			void make_kernel(inout vec4 n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h));
				n[1] = texture2D(tex, coord + vec2(0.0, -h));
				n[2] = texture2D(tex, coord + vec2(  w, -h));
				n[3] = texture2D(tex, coord + vec2( -w, 0.0));
				n[4] = texture2D(tex, coord);
				n[5] = texture2D(tex, coord + vec2(  w, 0.0));
				n[6] = texture2D(tex, coord + vec2( -w, h));
				n[7] = texture2D(tex, coord + vec2(0.0, h));
				n[8] = texture2D(tex, coord + vec2(  w, h));
			}
			void main(void) 
			{
				vec4 d = texture2D(depthSampler, vUV);
				float depth = d.r * (2000.0 - 0.5) + 0.5;
				vec4 n[9];
				make_kernel( n, textureSampler, vUV );
				vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
				vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
				vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
				float threshold = 0.4 + max((depth - 10.) / 30., 0.);
				if (max(sobel.r, max(sobel.g, sobel.b)) < threshold) {
					gl_FragColor = n[4];
				} else {
					gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
				}
			}
        `;
        let depthMap = Main.Scene.enableDepthRenderer(Main.Camera).getDepthMap();
        let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, Main.Camera);
        postProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);
            effect.setFloat("width", Main.Engine.getRenderWidth());
            effect.setFloat("height", Main.Engine.getRenderHeight());
        };
        let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), Main.Scene);
        noPostProcessCamera.parent = Main.Camera;
        noPostProcessCamera.layerMask = 0x10000000;
        Main.Scene.activeCameras.push(Main.Camera, noPostProcessCamera);
        Main.Ground = new Ground(50, 50);
        Main.Ground.instantiate();
        Main.Ground.material = Main.groundMaterial;
        new VertexDataLoader(Main.Scene);
        new NavGraphManager();
        let wallSystem = new WallSystem();
        if (window.localStorage.getItem("scene-data")) {
            let data = JSON.parse(window.localStorage.getItem("scene-data"));
            await Serializer.Deserialize(Main.Scene, data);
        }
        //let sceneEditor = new SceneEditor(wallSystem, Main.Scene);
        //sceneEditor.enable();
        let playerControl = new PlayerControl(Main.Scene);
        playerControl.enable();
        let navGraphConsole = new NavGraphConsole(Main.Scene);
        navGraphConsole.enable();
        let performanceConsole = new PerformanceConsole(Main.Scene);
        performanceConsole.enable();
        let fongus = new Fongus();
        fongus.position2D = new BABYLON.Vector2(0, -10);
        fongus.instantiate();
        let worker = new DroneWorker();
        worker.position2D = new BABYLON.Vector2(0, -10);
        worker.instantiate();
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
    static AreEqualsCircular(a1, a2, epsilon = Math.PI / 60) {
        while (a1 < 0) {
            a1 += 2 * Math.PI;
        }
        while (a1 >= 2 * Math.PI) {
            a1 -= 2 * Math.PI;
        }
        while (a2 < 0) {
            a2 += 2 * Math.PI;
        }
        while (a2 >= 2 * Math.PI) {
            a2 -= 2 * Math.PI;
        }
        return Math.abs(a1 - a2) < epsilon;
    }
    static StepFromToCirular(from, to, step = Math.PI / 60) {
        while (from < 0) {
            from += 2 * Math.PI;
        }
        while (from >= 2 * Math.PI) {
            from -= 2 * Math.PI;
        }
        while (to < 0) {
            to += 2 * Math.PI;
        }
        while (to >= 2 * Math.PI) {
            to -= 2 * Math.PI;
        }
        if (Math.abs(to - from) <= step) {
            return to;
        }
        if (Math.abs(to - from) >= 2 * Math.PI - step) {
            return to;
        }
        if (to - from >= 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from + step;
            }
            return from - step;
        }
        if (to - from < 0) {
            if (Math.abs(to - from) <= Math.PI) {
                return from - step;
            }
            return from + step;
        }
    }
    static LerpFromToCircular(from, to, amount = 0.5) {
        while (to < from) {
            to += 2 * Math.PI;
        }
        while (to - 2 * Math.PI > from) {
            to -= 2 * Math.PI;
        }
        return from + (to - from) * amount;
    }
    static BissectFromTo(from, to, amount = 0.5) {
        let aFrom = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), from, true);
        let aTo = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), to, true);
        let angle = Math2D.LerpFromToCircular(aFrom, aTo, amount);
        return new BABYLON.Vector2(Math.cos(angle), Math.sin(angle));
    }
    static Dot(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }
    static Cross(vector1, vector2) {
        return vector1.x * vector2.y - vector1.y * vector2.x;
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
        if (cross === 0) {
            cross = 1;
        }
        angle *= Math.sign(cross);
        if (keepPositive && angle < 0) {
            angle += Math.PI * 2;
        }
        return angle;
    }
    static Rotate(vector, alpha) {
        let v = vector.clone();
        Math2D.RotateInPlace(v, alpha);
        return v;
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
    static SegmentShapeIntersection(segA, segB, shape) {
        let intersections = [];
        for (let i = 0; i < shape.length; i++) {
            let shapeA = shape[i];
            let shapeB = shape[(i + 1) % shape.length];
            let intersection = Math2D.SegmentSegmentIntersection(segA, segB, shapeA, shapeB);
            if (intersection) {
                intersections.push(intersection);
            }
        }
        return intersections;
    }
    static FattenShrinkPointShape(shape, distance) {
        let newShape = [];
        let edgesDirs = [];
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            edgesDirs[i] = pNext.subtract(p).normalize();
        }
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let edgeDir = edgesDirs[i];
            let edgeDirPrev = edgesDirs[(i - 1 + shape.length) % shape.length];
            let bissection = Math2D.BissectFromTo(edgeDirPrev.scale(-1), edgeDir, 0.5);
            newShape[i] = p.add(bissection.scaleInPlace(distance));
        }
        return newShape;
    }
    static FattenShrinkEdgeShape(shape, distance) {
        let newShape = [];
        let edgesNormals = [];
        let edgesDirs = [];
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            edgesDirs[i] = pNext.subtract(p).normalize();
            edgesNormals[i] = Math2D.Rotate(edgesDirs[i], -Math.PI / 2).scaleInPlace(distance);
        }
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            let pNext = shape[(i + 1) % shape.length];
            let edgeDir = edgesDirs[i];
            let edgeDirNext = edgesDirs[(i + 1) % shape.length];
            p = p.add(edgesNormals[i]);
            pNext = pNext.add(edgesNormals[(i + 1) % shape.length]);
            if (Math2D.Cross(edgeDir, edgeDirNext) === 0) {
                newShape[i] = p.add(pNext).scaleInPlace(0.5);
                console.warn("Oups 1");
            }
            else {
                let newP = Math2D.LineLineIntersection(p, edgeDir, pNext, edgeDirNext);
                if (newP) {
                    newShape[i] = newP;
                }
                else {
                    newShape[i] = p;
                    console.warn("Oups 2");
                }
            }
        }
        return newShape;
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
    static RayRayIntersection(ray1Origin, ray1Direction, ray2Origin, ray2Direction) {
        let x1 = ray1Origin.x;
        let y1 = ray1Origin.y;
        let x2 = x1 + ray1Direction.x;
        let y2 = y1 + ray1Direction.y;
        let x3 = ray2Origin.x;
        let y3 = ray2Origin.y;
        let x4 = x3 + ray2Direction.x;
        let y4 = y3 + ray2Direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            let intersection = new BABYLON.Vector2(x / det, y / det);
            if (Math2D.IsPointInRay(intersection, ray1Origin, ray1Direction)) {
                if (Math2D.IsPointInRay(intersection, ray2Origin, ray2Direction)) {
                    return intersection;
                }
            }
        }
        return undefined;
    }
    static LineLineIntersection(line1Origin, line1Direction, line2Origin, line2Direction) {
        let x1 = line1Origin.x;
        let y1 = line1Origin.y;
        let x2 = x1 + line1Direction.x;
        let y2 = y1 + line1Direction.y;
        let x3 = line2Origin.x;
        let y3 = line2Origin.y;
        let x4 = x3 + line2Direction.x;
        let y4 = y3 + line2Direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det !== 0) {
            let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
            let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
            return new BABYLON.Vector2(x / det, y / det);
        }
        return undefined;
    }
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
class PerformanceConsole {
    constructor(scene) {
        this.scene = scene;
        this._fps = 30;
        this._maxFrame = 30;
        this._maxFrameLast5s = 30;
        this._meshesCount = 0;
        this._turretsCount = 0;
        this._fongisCount = 0;
        this._timer5s = 0;
        this._lastT = NaN;
        this._update = () => {
            let fps = this.scene.getEngine().getFps();
            this._fps *= 0.9;
            this._fps += fps * 0.1;
            this._fpsInput.value = this._fps.toFixed(0);
            if (isNaN(this._lastT)) {
                this._lastT = performance.now();
            }
            let currentFrameDuration = performance.now() - this._lastT;
            this._lastT = performance.now();
            this._maxFrame = Math.max(this._maxFrame, currentFrameDuration);
            this._maxFrameInput.value = this._maxFrame.toFixed(2);
            this._timer5s += currentFrameDuration;
            this._maxFrameLast5s = Math.max(this._maxFrameLast5s, currentFrameDuration);
            if (this._timer5s > 5000) {
                this._maxFrameLast5sInput.value = this._maxFrameLast5s.toFixed(2);
                this._maxFrameLast5s = 0;
                this._timer5s = 0;
            }
            this._meshesCount = this.scene.meshes.length;
            this._meshesCountInput.value = this._meshesCount.toFixed(0);
            this._turretsCount = Turret.Instances.length;
            this._turretsCountInput.value = this._turretsCount.toFixed(0);
            this._fongisCount = Fongus.Instances.length;
            this._fongisCountInput.value = this._fongisCount.toFixed(0);
        };
    }
    enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("PERFS");
        this._panel.addTitle2("GLOBAL");
        this._fpsInput = this._panel.addNumberInput("FPS", this._fps);
        this._maxFrameInput = this._panel.addNumberInput("MAX ALL TIME", this._maxFrame);
        this._maxFrameLast5sInput = this._panel.addNumberInput("MAX LAST 5s", this._maxFrameLast5s);
        this._panel.addTitle2("SCENE");
        this._meshesCountInput = this._panel.addNumberInput("MESHES", this._meshesCount);
        this._panel.style.right = "10px";
        this._panel.style.top = "10px";
        this._turretsCountInput = this._panel.addNumberInput("TURRETS", this._turretsCount);
        this._panel.style.right = "10px";
        this._panel.style.top = "10px";
        this._fongisCountInput = this._panel.addNumberInput("FONGIS", this._fongisCount);
        this._panel.style.right = "10px";
        this._panel.style.top = "10px";
        this.scene.onBeforeRenderObservable.add(this._update);
    }
    disable() {
        this._panel.dispose();
        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }
}
class PlayerControl {
    constructor(scene) {
        this.scene = scene;
        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this.pointerDown = () => {
            this._pointerDownX = this.scene.pointerX;
            this._pointerDownY = this.scene.pointerY;
        };
        this.pointerMove = () => {
        };
        this.pointerUp = (ev) => {
            if (Math.abs(this.scene.pointerX - this._pointerDownX) < 3 && Math.abs(this.scene.pointerY - this._pointerDownY) < 3) {
                let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => {
                    return m instanceof Selectionable || m === this._zero;
                });
                if (pick.hit) {
                    if (pick.pickedMesh instanceof Selectionable) {
                        if (ev.button === 0) {
                            this.selectedElement = pick.pickedMesh;
                            return;
                        }
                        else if (ev.button === 2) {
                            if (this.selectedElement) {
                                this.selectedElement.onLeftClick(undefined, pick.pickedMesh);
                            }
                            return;
                        }
                    }
                    if (pick.pickedMesh === this._zero) {
                        if (ev.button === 2) {
                            if (this.selectedElement) {
                                this.selectedElement.onLeftClick(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), undefined);
                            }
                            return;
                        }
                    }
                }
                this.selectedElement = undefined;
            }
        };
        this._zero = BABYLON.MeshBuilder.CreateGround("zero", { width: 100, height: 100 }, scene);
        this._zero.isVisible = false;
        this._zero.isPickable = true;
        this.enable();
    }
    get selectedElement() {
        return this._selectedElement;
    }
    set selectedElement(selectionable) {
        if (selectionable === this.selectedElement) {
            return;
        }
        if (this._selectedElementPanel) {
            this._selectedElementPanel.dispose();
            this._selectedElementPanel = undefined;
        }
        if (this.selectedElement) {
            this.selectedElement.onUnselected();
        }
        this._selectedElement = selectionable;
        if (this.selectedElement) {
            this.selectedElement.onSelected();
        }
    }
    enable() {
        this._selectedElement = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDown);
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }
    disable() {
        this._selectedElement = undefined;
        Main.Canvas.removeEventListener("pointerdown", this.pointerDown);
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }
}
class SceneData {
    constructor() {
        this.props = [];
        this.wallSystemDatas = [];
    }
}
class Serializer {
    static findProps(scene) {
        let props = [];
        for (let i = 0; i < scene.meshes.length; i++) {
            let mesh = scene.meshes[i];
            if (mesh instanceof Prop) {
                props.push(mesh);
            }
        }
        return props;
    }
    static findWallSystems(scene) {
        let wallSystems = [];
        for (let i = 0; i < scene.transformNodes.length; i++) {
            let node = scene.transformNodes[i];
            if (node instanceof WallSystem) {
                if (wallSystems.indexOf(node) === -1) {
                    wallSystems.push(node);
                }
            }
        }
        return wallSystems;
    }
    static Serialize(scene) {
        let data = new SceneData();
        let props = Serializer.findProps(scene);
        for (let i = 0; i < props.length; i++) {
            data.props.push(props[i].serialize());
        }
        let wallSystems = Serializer.findWallSystems(scene);
        for (let i = 0; i < wallSystems.length; i++) {
            data.wallSystemDatas.push(wallSystems[i].serialize());
        }
        return data;
    }
    static async Deserialize(scene, data) {
        let propsData = data.props;
        for (let i = 0; i < propsData.length; i++) {
            let prop = Prop.Deserialize(propsData[i]);
            await prop.instantiate();
            prop.addToScene();
        }
        let wallSystems = Serializer.findWallSystems(scene);
        // Note : Wrong actually, should delete and rebuild.
        for (let i = 0; i < wallSystems.length; i++) {
            wallSystems[0].deserialize(data.wallSystemDatas[0]);
            await wallSystems[0].instantiate();
            wallSystems[0].addToScene();
        }
    }
}
class SpaceMath {
    // Method adapted from gre's work (https://github.com/gre/bezier-easing). Thanks !
    static easeOutElastic(t, b = 0, c = 1, d = 1) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) {
            return b;
        }
        if ((t /= d) == 1) {
            return b + c;
        }
        if (!p) {
            p = d * .3;
        }
        if (a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
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
class SceneEditor {
    constructor(wallSystem, scene) {
        this.wallSystem = wallSystem;
        this.scene = scene;
        this.createContainer = () => {
            this.selectedElement = undefined;
            this._newProp = new Container("", BABYLON.Vector2.Zero(), 0);
            this._newProp.instantiate();
        };
        this.createTank = () => {
            this.selectedElement = undefined;
            this._newProp = new Tank("", BABYLON.Vector2.Zero(), 0);
            this._newProp.instantiate();
        };
        this.createCristal = () => {
            this.selectedElement = undefined;
            this._newProp = new Cristal("", BABYLON.Vector2.Zero(), 0);
            this._newProp.instantiate();
        };
        this.createTurret = () => {
            this.selectedElement = undefined;
            this._newProp = new Turret("", BABYLON.Vector2.Zero(), 0);
            this._newProp.instantiate();
        };
        this.createNode = () => {
            this.selectedElement = undefined;
            this.removeEventListenerDrag();
            Main.Canvas.addEventListener("pointerup", this.pointerUpFirst);
        };
        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this.pointerDown = () => {
            this._pointerDownX = this.scene.pointerX;
            this._pointerDownY = this.scene.pointerY;
            let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => {
                return m instanceof Draggable;
            });
            if (pick.hit && pick.pickedMesh instanceof Draggable) {
                if (this.selectedElement === pick.pickedMesh) {
                    this._draggedElement = pick.pickedMesh;
                    Main.Camera.detachControl(Main.Canvas);
                }
            }
        };
        this.pointerMove = () => {
            if (this._draggedElement || this._newProp) {
                let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => {
                    return m === this._zero;
                });
                if (this._draggedElement) {
                    if (pick.hit) {
                        this._draggedElement.position2D.x = pick.pickedPoint.x;
                        this._draggedElement.position2D.y = pick.pickedPoint.z;
                        if (this._draggedElement instanceof WallNode) {
                            this.wallSystem.instantiate();
                        }
                    }
                }
                else if (this._newProp) {
                    if (pick.hit) {
                        this._newProp.isVisible = true;
                        this._newProp.position2D.x = pick.pickedPoint.x;
                        this._newProp.position2D.y = pick.pickedPoint.z;
                    }
                    else {
                        this._newProp.isVisible = false;
                    }
                }
            }
        };
        this.pointerUp = () => {
            if (this._newProp) {
                this._newProp.addToScene();
                this._newProp = undefined;
            }
            this._draggedElement = undefined;
            if (Math.abs(this.scene.pointerX - this._pointerDownX) < 3 && Math.abs(this.scene.pointerY - this._pointerDownY) < 3) {
                let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => {
                    return m instanceof Selectionable;
                });
                if (pick.hit && pick.pickedMesh instanceof Selectionable) {
                    this.selectedElement = pick.pickedMesh;
                }
                else {
                    this.selectedElement = undefined;
                }
            }
            Main.Camera.attachControl(Main.Canvas);
        };
        this.pointerUpFirst = () => {
            let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => {
                return m === this._zero;
            });
            if (pick.hit) {
                for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                    if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                        this._selectedElement = this.wallSystem.nodes[i];
                        break;
                    }
                }
                if (!this._selectedElement) {
                    this._selectedElement = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
                }
                Main.Canvas.removeEventListener("pointerup", this.pointerUpFirst);
                Main.Canvas.addEventListener("pointerup", this.pointerUpSecond);
            }
        };
        this.pointerUpSecond = () => {
            let pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => {
                return m === this._zero;
            });
            if (pick.hit) {
                let otherNode;
                for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                    if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                        otherNode = this.wallSystem.nodes[i];
                    }
                }
                if (!otherNode) {
                    otherNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
                }
                if (this._selectedElement instanceof WallNode && otherNode && (this._selectedElement !== otherNode)) {
                    new Wall(this._selectedElement, otherNode);
                }
                Main.Canvas.removeEventListener("pointerup", this.pointerUpSecond);
                this.addEventListenerDrag();
                this.wallSystem.instantiate();
            }
        };
        this._zero = BABYLON.MeshBuilder.CreateGround("zero", { width: 100, height: 100 }, scene);
        this._zero.isVisible = false;
        this._zero.isPickable = true;
        this.enable();
    }
    get selectedElement() {
        return this._selectedElement;
    }
    set selectedElement(selectionable) {
        if (selectionable === this.selectedElement) {
            return;
        }
        if (this._selectedElementPanel) {
            this._selectedElementPanel.dispose();
            this._selectedElementPanel = undefined;
        }
        this._selectedElement = selectionable;
        if (this.selectedElement) {
            if (this.selectedElement instanceof WallNode) {
                this._selectedElementPanel = WallNodeEditor.CreatePanel(this.selectedElement, () => {
                    this.selectedElement = undefined;
                });
            }
            if (this.selectedElement instanceof Wall) {
                this._selectedElementPanel = WallEditor.CreatePanel(this.selectedElement, () => {
                    this.selectedElement = undefined;
                });
            }
            else if (this.selectedElement instanceof Prop) {
                this._selectedElementPanel = PropEditor.CreatePanel(this.selectedElement, () => {
                    this.selectedElement = undefined;
                }, (prop) => {
                    this.selectedElement = undefined;
                    this._newProp = prop;
                    this._newProp.instantiate();
                });
            }
        }
    }
    enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("EDITOR");
        this._panel.addTitle2("PROPS");
        this._panel.addLargeButton("CONTAINER", this.createContainer);
        this._panel.addLargeButton("TANK", this.createTank);
        this._panel.addLargeButton("TURRET", this.createTurret);
        this._panel.addLargeButton("CRISTAL", this.createCristal);
        this._panel.addLargeButton("WALL", this.createNode);
        this._panel.addTitle2("DATA");
        this._panel.addMediumButtons("SAVE", () => {
            let data = Serializer.Serialize(Main.Scene);
            window.localStorage.setItem("scene-data", JSON.stringify(data));
        }, "LOAD", () => {
            let data = JSON.parse(window.localStorage.getItem("scene-data"));
            Serializer.Deserialize(Main.Scene, data);
            this.wallSystem.instantiate();
        });
        this.addEventListenerDrag();
        this._panel.style.left = "10px";
        this._panel.style.top = "10px";
    }
    disable() {
        this.removeEventListenerDrag();
        this._panel.dispose();
    }
    addEventListenerDrag() {
        this._selectedElement = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDown);
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }
    removeEventListenerDrag() {
        Main.Canvas.removeEventListener("pointerdown", this.pointerDown);
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }
}
class Selectionable extends BABYLON.Mesh {
    onSelected() { }
    ;
    onUnselected() { }
    ;
    onLeftClick(pickedPoint, pickedTarget) { }
    ;
}
/// <reference path="Selectionable.ts"/>
class Draggable extends Selectionable {
    constructor() {
        super(...arguments);
        this._rotation2D = 0;
        this._forward2D = new BABYLON.Vector2(0, 1);
    }
    get rotation2D() {
        return this._rotation2D;
    }
    set rotation2D(v) {
        if (v !== this.rotation2D && isFinite(v)) {
            this._rotation2D = v;
            this._forward2D.x = -Math.sin(this._rotation2D);
            this._forward2D.y = Math.cos(this._rotation2D);
        }
    }
    get forward2D() {
        return this._forward2D;
    }
}
/// <reference path="../Draggable.ts"/>
class Character extends Draggable {
    constructor(name = "") {
        super(name);
        this.moveSpeed = 1;
        this.stamina = 20;
        this.currentHitPoint = 20;
        this.alive = true;
    }
    wound(amount = 1) {
        if (this.alive) {
            this.currentHitPoint -= amount;
            if (this.currentHitPoint <= 0) {
                this.currentHitPoint = 0;
                this.kill();
            }
        }
    }
    kill() {
        this.alive = false;
    }
}
class Task {
    constructor(worker) {
        this.worker = worker;
    }
}
class GoToTask extends Task {
    constructor(worker, target) {
        super(worker);
        this.target = target;
        this.hasPathToTarget = false;
    }
    update() {
        if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target) < 0.01) {
            this.worker.currentTask = undefined;
            return;
        }
        if (!this.hasPathToTarget) {
            let navGraph = NavGraphManager.GetForRadius(1);
            navGraph.update();
            navGraph.computePathFromTo(this.worker.position2D, this.target);
            this.worker.currentPath = navGraph.path;
            this.hasPathToTarget = this.worker.currentPath !== undefined;
            this.worker.currentAction = "Going to " + this.target.x.toFixed(1) + " " + this.target.y.toFixed(1);
        }
        if (this.hasPathToTarget) {
            this.worker.moveOnPath();
            this.worker.currentAction = "Going to " + this.target.x.toFixed(1) + " " + this.target.y.toFixed(1);
        }
    }
}
class HarvestTask extends Task {
    constructor(worker, target) {
        super(worker);
        this.target = target;
        this.hasPathToTarget = false;
        this.hasPathToDepot = false;
        this._isDropping = false;
    }
    update() {
        if (!this._isDropping && this.worker.inventory < this.worker.carriageCapacity) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                this.worker.inventory += this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                this.hasPathToTarget = false;
                this.worker.currentAction = "Harvesting resource";
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to resource";
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to resource";
            }
        }
        else {
            if (!this.depot) {
                this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; });
            }
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth) {
                this.worker.inventory -= 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                this._isDropping = this.worker.inventory > 0;
                this.hasPathToDepot = false;
                this.worker.currentAction = "Droping in depot";
                return;
            }
            if (!this.hasPathToDepot) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToDepot = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to depot";
            }
            if (this.hasPathToDepot) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to depot";
            }
        }
    }
}
class BuildTask extends Task {
    constructor(worker, target) {
        super(worker);
        this.target = target;
        this.hasPathToTarget = false;
        this.hasPathToDepot = false;
    }
    update() {
        let neededResources = this.target.resourcesRequired - this.target.resourcesAvailable;
        if (neededResources > 0) {
            if (this.worker.inventory < Math.max(this.worker.carriageCapacity, neededResources)) {
                if (!this.depot) {
                    this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; });
                }
                if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth) {
                    this.worker.inventory += 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                    this.hasPathToDepot = false;
                    this.worker.currentAction = "Fetching from depot";
                    return;
                }
                if (!this.hasPathToDepot) {
                    let navGraph = NavGraphManager.GetForRadius(1);
                    navGraph.update();
                    navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                    this.worker.currentPath = navGraph.path;
                    this.hasPathToDepot = this.worker.currentPath !== undefined;
                    this.worker.currentAction = "Going to depot";
                }
                if (this.hasPathToDepot) {
                    this.worker.moveOnPath();
                    this.worker.currentAction = "Going to depot";
                }
            }
            else {
                if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                    this.target.resourcesAvailable += this.worker.inventory;
                    this.worker.inventory = 0;
                    this.hasPathToTarget = false;
                    this.worker.currentAction = "Gathering resource";
                    return;
                }
                if (!this.hasPathToTarget) {
                    let navGraph = NavGraphManager.GetForRadius(1);
                    navGraph.update();
                    navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                    this.worker.currentPath = navGraph.path;
                    this.hasPathToTarget = this.worker.currentPath !== undefined;
                    this.worker.currentAction = "Going to building";
                }
                if (this.hasPathToTarget) {
                    this.worker.moveOnPath();
                    this.worker.currentAction = "Going to building";
                }
            }
            return;
        }
        if (this.target.completion < 10) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                this.target.build(this.worker.buildRate * Main.Engine.getDeltaTime() / 1000);
                this.hasPathToTarget = false;
                this.worker.currentAction = "Building";
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to building";
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to building";
            }
            return;
        }
        this.worker.currentTask = undefined;
    }
}
class DroneWorker extends Character {
    constructor() {
        super("droneWorker");
        this.harvestRate = 2;
        this.buildRate = 1;
        this.carriageCapacity = 10;
        this._inventory = 0;
        this._currentAction = "Doing nothing";
        this._update = () => {
            if (this.currentTask) {
                this.currentTask.update();
            }
            else {
                this.currentAction = "Doing nothing";
            }
            this.position.x = this.position2D.x;
            this.position.z = this.position2D.y;
            this.rotation.y = -this.rotation2D;
        };
        this.moveSpeed = 3;
        this.ui = new DroneWorkerUI(this);
        this.getScene().onBeforeRenderObservable.add(this._update);
    }
    get inventory() {
        return this._inventory;
    }
    set inventory(n) {
        this._inventory = n;
        this._inventory = Math.min(Math.max(this._inventory, 0), this.carriageCapacity);
        this.ui.update();
    }
    get currentAction() {
        return this._currentAction;
    }
    set currentAction(s) {
        this._currentAction = s;
        this.ui.update();
    }
    async instantiate() {
        let data = await VertexDataLoader.instance.getColorized("worker", "#ce7633", "#383838", "#6d6d6d", "#c94022", "#1c1c1c");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
        this.groundWidth = 1;
        this.height = 1;
    }
    kill() {
        super.kill();
        this.dispose();
    }
    onSelected() {
        this.ui.enable();
    }
    onUnselected() {
        this.ui.disable();
    }
    onLeftClick(pickedPoint, pickedTarget) {
        this.ui.onLeftClick(pickedPoint, pickedTarget);
    }
    ;
    moveOnPath() {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            let distanceToNext = Math2D.Distance(this.position2D, next);
            if (distanceToNext <= 0.05) {
                this.currentPath.splice(0, 1);
                return this.moveOnPath();
            }
            let stepToNext = next.subtract(this.position2D).normalize();
            let rotationToNext = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            stepToNext.scaleInPlace(Math.min(distanceToNext, this.moveSpeed * Main.Engine.getDeltaTime() / 1000));
            this.position2D.addInPlace(stepToNext);
            if (isFinite(rotationToNext)) {
                this.rotation2D = Math2D.StepFromToCirular(this.rotation2D, rotationToNext, Math.PI / 60);
            }
        }
    }
}
class Fongus extends Character {
    constructor() {
        super("fongus");
        this.fongis = [];
        this.animsCleanUp = new Map();
        this._timeout = Infinity;
        this._update = () => {
            this._timeout--;
            if (this._timeout <= 0) {
                this._generateNewFongi();
                this._timeout = Math.round(5 + Math.random() * 10);
            }
            if (!this.currentPath || this.currentPath.length === 0) {
                this._findPath();
            }
            this._moveOnPath();
            this.position.x = this.position2D.x;
            this.position.z = this.position2D.y;
            this.rotation.y = -this.rotation2D;
            if (this.fongis.length > this.currentHitPoint) {
                let speed = Math.round(5 + Math.random() * 15);
                let index = Math.floor(Math.random() * 3);
                index = Math.min(index, this.fongis.length - 1);
                let oldFongi = this.fongis.splice(index, 1)[0];
                let animCleanUp = this.animsCleanUp.get(oldFongi);
                if (animCleanUp) {
                    animCleanUp();
                    this.animsCleanUp.delete(oldFongi);
                }
                let k = 0;
                let size = oldFongi.scaling.x;
                let oldFongiAnim = () => {
                    k++;
                    let scale = (1 - k / speed * k / speed) * size;
                    if (k < speed) {
                        oldFongi.scaling.copyFromFloats(scale, scale, scale);
                    }
                    else {
                        oldFongi.dispose();
                        this.getScene().onBeforeRenderObservable.removeCallback(oldFongiAnim);
                    }
                };
                this.getScene().onBeforeRenderObservable.add(oldFongiAnim);
            }
        };
        this._moveOnPath = () => {
            if (this.currentPath && this.currentPath.length > 0) {
                let next = this.currentPath[0];
                let distanceToNext = Math2D.Distance(this.position2D, next);
                if (distanceToNext <= 0.05) {
                    this.currentPath.splice(0, 1);
                    return this._moveOnPath();
                }
                let stepToNext = next.subtract(this.position2D).normalize();
                let rotationToNext = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
                stepToNext.scaleInPlace(Math.min(distanceToNext, 0.02));
                this.position2D.addInPlace(stepToNext);
                if (isFinite(rotationToNext)) {
                    this.rotation2D = Math2D.StepFromToCirular(this.rotation2D, rotationToNext, Math.PI / 60);
                }
            }
        };
        this.getScene().onBeforeRenderObservable.add(this._update);
        Fongus.Instances.push(this);
    }
    async instantiate() {
        this._timeout = 0;
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        let index = Fongus.Instances.indexOf(this);
        if (index !== -1) {
            Fongus.Instances.splice(index, 1);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
        this.animsCleanUp.forEach((cleanUp) => {
            cleanUp();
        });
        this.getScene().onBeforeRenderObservable.add(this._update);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    kill() {
        super.kill();
        this.dispose();
    }
    async _generateNewFongi() {
        if (!this.alive) {
            return;
        }
        let newFongi = new BABYLON.Mesh("fongi");
        newFongi.position.copyFrom(this.position);
        newFongi.position.x += Math.random() * 2 - 1;
        newFongi.position.y = -0.1;
        newFongi.position.z += Math.random() * 2 - 1;
        newFongi.rotation.x = Math.random() - 0.5 * Math.PI * 0.25;
        newFongi.rotation.y = Math.random() * 2 * Math.PI;
        newFongi.rotation.z = Math.random() - 0.5 * Math.PI * 0.25;
        newFongi.scaling.copyFromFloats(0.01, 0.01, 0.01);
        let color = BABYLON.Color3.FromHexString("#38bad1");
        color.r += Math.random() * 0.2 - 0.1;
        color.g += Math.random() * 0.2 - 0.1;
        color.b += Math.random() * 0.2 - 0.1;
        let colorBase = new BABYLON.Color3(color.r * 0.4 + 0.6, color.g * 0.4 + 0.6, color.b * 0.4 + 0.6);
        let model = Math.floor(Math.random() * 3);
        let data = await VertexDataLoader.instance.getColorized("fongus-" + model, colorBase.toHexString(), "", color.toHexString());
        data.applyToMesh(newFongi);
        newFongi.material = Main.cellShadingMaterial;
        let top = BABYLON.Vector3.Zero();
        let positions = data.positions;
        for (let i = 0; i < positions.length / 3; i++) {
            if (top.y < positions[3 * i + 1]) {
                top.copyFromFloats(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);
            }
        }
        let speed = Math.round(100 + Math.random() * 200);
        let k = 0;
        let size = 0.5 + Math.random();
        // SPS creation
        let particleMaterial = new BABYLON.StandardMaterial(name + "-material", this.getScene());
        particleMaterial.specularColor.copyFromFloats(0, 0, 0);
        particleMaterial.emissiveColor = BABYLON.Color3.Gray();
        var plane = BABYLON.Mesh.CreatePlane("plane", 0.2, this.getScene());
        let earthParticle = new BABYLON.SolidParticleSystem('SPS', this.getScene());
        earthParticle.addShape(plane, 15);
        plane.dispose();
        var mesh = earthParticle.buildMesh();
        mesh.material = particleMaterial;
        var particleSpeed = 0.05;
        var gravity = -0.003;
        earthParticle.initParticles = () => {
            for (var p = 0; p < earthParticle.nbParticles; p++) {
                earthParticle.recycleParticle(earthParticle.particles[p]);
            }
        };
        earthParticle.recycleParticle = (particle) => {
            particle.position.x = 0;
            particle.position.y = 0;
            particle.position.z = 0;
            particle.velocity.x = (Math.random() - 0.5) * particleSpeed;
            particle.velocity.y = Math.random() * particleSpeed;
            particle.velocity.z = (Math.random() - 0.5) * particleSpeed;
            particle.rotation.x = Math.random() * 3.5;
            particle.rotation.y = Math.random() * 3.5;
            particle.rotation.z = Math.random() * 3.5;
            let color = Math.random() * 0.4 + 0.3;
            particle.color.r = color;
            particle.color.g = color;
            particle.color.b = color;
            particle.color.a = 1;
            return particle;
        };
        earthParticle.updateParticle = (particle) => {
            if (particle.position.y < 0) {
                earthParticle.recycleParticle(particle);
            }
            particle.velocity.y += gravity;
            (particle.position).addInPlace(particle.velocity);
            particle.position.y += particleSpeed / 2;
            particle.scale.scaleInPlace(0.95);
            return particle;
        };
        // init all particle values and set them once to apply textures, colors, etc
        earthParticle.initParticles();
        earthParticle.setParticles();
        earthParticle.billboard = true;
        earthParticle.computeParticleRotation = false;
        earthParticle.computeParticleColor = false;
        earthParticle.computeParticleTexture = false;
        earthParticle.mesh.position.copyFrom(newFongi.position);
        let rSpeed = 0.8 * Math.random() - 0.4;
        let newFongiAnim = () => {
            rSpeed *= 0.95;
            newFongi.rotation.y += rSpeed;
            k++;
            if (k < speed) {
                let scale = SpaceMath.easeOutElastic(k / speed) * size;
                earthParticle.setParticles();
                newFongi.scaling.copyFromFloats(scale, scale, scale);
            }
            else {
                newFongi.scaling.copyFromFloats(size, size, size);
                earthParticle.dispose();
            }
        };
        this.animsCleanUp.set(newFongi, () => {
            this.getScene().onBeforeRenderObservable.removeCallback(newFongiAnim);
            earthParticle.dispose();
        });
        this.getScene().onBeforeRenderObservable.add(newFongiAnim);
        this.fongis.push(newFongi);
    }
    findRandomDestination(radius = 10) {
        let attempts = 0;
        while (attempts++ < 10) {
            let random = new BABYLON.Vector2(Math.random() * 2 * radius - radius, Math.random() * 2 * radius - radius);
            random.addInPlace(this.position2D);
            let graph = NavGraphManager.GetForRadius(1);
            for (let i = 0; i < graph.obstacles.length; i++) {
                let o = graph.obstacles[i];
                if (o.contains(random, 1)) {
                    random = undefined;
                    break;
                }
            }
            if (random) {
                return random;
            }
        }
        return undefined;
    }
    _findPath() {
        let dest = this.findRandomDestination();
        if (dest) {
            let navGraph = NavGraphManager.GetForRadius(1);
            navGraph.update();
            navGraph.computePathFromTo(this.position2D, dest);
            this.currentPath = navGraph.path;
        }
    }
}
Fongus.Instances = [];
class DroneWorkerUI {
    constructor(target) {
        this.target = target;
        this._isEnabled = false;
        this._update = () => {
            if (this._selector) {
                this._selector.position.copyFromFloats(this.target.position2D.x, 0.1, this.target.position2D.y);
            }
        };
    }
    enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.setTarget(this.target);
        this._panel.addTitle1("WORKER");
        this._panel.addTitle2(this.target.name.toLocaleUpperCase());
        this._inventoryInput = this._panel.addTextInput("CRISTAL", this.target.inventory.toFixed(0) + "/" + this.target.carriageCapacity.toFixed(0));
        this._currentActionInput = this._panel.addTextInput("ACTION", this.target.currentAction);
        this._panel.addLargeButton("BUILD CONTAINER", () => {
            this._onLeftClickOverride = (pickedPoint, pickedTarget) => {
                let container = new Container("", pickedPoint, 0);
                container.instantiateBuilding();
                this.target.currentTask = new BuildTask(this.target, container);
            };
        });
        this._selector = ShapeDraw.CreateCircle(1.05, 1.2);
        this.target.getScene().onBeforeRenderObservable.add(this._update);
        console.log("Enable DroneWorker Panel");
        this._isEnabled = true;
    }
    disable() {
        this._panel.dispose();
        this._selector.dispose();
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        console.log("Disable DroneWorker Panel");
        this._isEnabled = false;
    }
    update() {
        if (!this._isEnabled) {
            return;
        }
        this._inventoryInput.value = this.target.inventory.toFixed(0) + " / " + this.target.carriageCapacity.toFixed(0);
        this._currentActionInput.value = this.target.currentAction;
    }
    onLeftClick(pickedPoint, pickedTarget) {
        if (this._onLeftClickOverride) {
            this._onLeftClickOverride(pickedPoint, pickedTarget);
            this._onLeftClickOverride = undefined;
            return;
        }
        if (pickedTarget instanceof Prop) {
            this.target.currentTask = new HarvestTask(this.target, pickedTarget);
        }
        else if (pickedPoint instanceof BABYLON.Vector2) {
            this.target.currentTask = new GoToTask(this.target, pickedPoint);
        }
    }
    ;
}
/// <reference path="../Draggable.ts"/>
class PropData {
}
class Prop extends Draggable {
    constructor(name, position2D, rotation2D) {
        super(name);
        this._updatePosition = () => {
            if (this.position.x !== this.position2D.x || this.position.z !== this.position2D.y || this.rotation.y !== -this.rotation2D) {
                this.position.x = this.position2D.x;
                this.position.z = this.position2D.y;
                this.rotation.y = -this.rotation2D;
                this.onPositionChanged();
            }
        };
        this.position2D = position2D;
        this.rotation2D = rotation2D;
        this.getScene().onBeforeRenderObservable.add(this._updatePosition);
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        this.getScene().onBeforeRenderObservable.removeCallback(this._updatePosition);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    onPositionChanged() { }
    addToScene() {
        NavGraphManager.AddObstacle(this.obstacle);
    }
    serialize() {
        let data = new PropData();
        data.elementName = this.elementName();
        data.name = this.name;
        data.position2D = this.position2D;
        data.rotation2D = this.rotation2D;
        return data;
    }
    static Deserialize(data) {
        if (data.elementName === "Container") {
            return new Container(data.name, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        if (data.elementName === "Tank") {
            return new Tank(data.name, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        if (data.elementName === "Cristal") {
            return new Cristal(data.name, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        if (data.elementName === "Turret") {
            return new Turret(data.name, new BABYLON.Vector2(data.position2D.x, data.position2D.y), data.rotation2D);
        }
        return undefined;
    }
    elementName() {
        return "Prop";
    }
}
/// <reference path="../Prop.ts"/>
class Building extends Prop {
    constructor(name, position2D, rotation2D) {
        super(name, position2D, rotation2D);
        this.completion = 0;
        this.resourcesAvailable = 0;
        this.resourcesRequired = 10;
    }
    async instantiateBuilding() {
        await this.instantiate();
        this.position.y = -10;
        this._areaMesh = ShapeDraw.CreateCircle(this.groundWidth * 0.5, this.groundWidth * 0.5 + 0.15);
        this._areaMesh.position.copyFromFloats(this.position2D.x, 0.1, this.position2D.y);
    }
    build(amount) {
        this.completion += amount;
        this.completion = Math.min(10, this.completion);
        this.position.y = this.completion - 10;
        if (this.completion === 10) {
            this._areaMesh.dispose();
        }
    }
    gather(resource) {
        this.resourcesAvailable += resource;
        this.resourcesAvailable = Math.min(this.resourcesRequired, this.resourcesAvailable);
    }
}
/// <reference path="./Building/Building.ts"/>
class Container extends Building {
    constructor(name, position2D, rotation2D) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let containerCount = this.getScene().meshes.filter((m) => { return m instanceof Container; }).length;
            this.name = "container-" + containerCount;
        }
        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 2, 4);
        this.obstacle.name = name + "-obstacle";
    }
    async instantiate() {
        let vertexData = await VertexDataLoader.instance.getColorized("container", "#ce7633", "#383838", "#6d6d6d");
        let min = Infinity;
        let max = -Infinity;
        this.height = -Infinity;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i];
            let y = vertexData.positions[3 * i + 1];
            let z = vertexData.positions[3 * i + 2];
            min = Math.min(min, x, z);
            max = Math.max(max, x, z);
            this.height = Math.max(this.height, y);
        }
        this.groundWidth = max - min;
        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }
    elementName() {
        return "Container";
    }
}
class Cristal extends Prop {
    constructor(name, position2D, rotation2D) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let CristalCount = this.getScene().meshes.filter((m) => { return m instanceof Cristal; }).length;
            this.name = "cristal-" + CristalCount;
        }
        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 2);
        this.obstacle.name = name + "-obstacle";
    }
    async instantiate() {
        let vertexData = await VertexDataLoader.instance.getColorized("cristal-2", "#b0b0b0", "#d0d0d0", "#9ef442");
        for (let i = 0; i < vertexData.positions.length; i++) {
            vertexData.positions[i] *= 0.5;
        }
        let iHole0 = Math.round(this.position2D.x / 5) - Main.Ground.stepZeroW;
        let jHole0 = Math.round(this.position2D.y / 5) - Main.Ground.stepZeroH;
        let iHole1 = iHole0 - 1;
        let jHole1 = jHole0 - 1;
        let seamXMin = (Main.Ground.stepZeroW + iHole1) * 5;
        let seamXMax = (Main.Ground.stepZeroW + iHole0 + 1) * 5;
        let seamZMin = (Main.Ground.stepZeroH + jHole1) * 5;
        let seamZMax = (Main.Ground.stepZeroH + jHole0 + 1) * 5;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i];
            if (x === 2.5) {
                vertexData.positions[3 * i] = seamXMax - this.position2D.x;
            }
            if (x === -2.5) {
                vertexData.positions[3 * i] = seamXMin - this.position2D.x;
            }
            let z = vertexData.positions[3 * i + 2];
            if (z === 2.5) {
                vertexData.positions[3 * i + 2] = seamZMax - this.position2D.y;
            }
            if (z === -2.5) {
                vertexData.positions[3 * i + 2] = seamZMin - this.position2D.y;
            }
        }
        let min = Infinity;
        let max = -Infinity;
        this.height = -Infinity;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i];
            let y = vertexData.positions[3 * i + 1];
            let z = vertexData.positions[3 * i + 2];
            min = Math.min(min, x, z);
            max = Math.max(max, x, z);
            this.height = Math.max(this.height, y);
        }
        this.groundWidth = 4;
        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }
    onPositionChanged() {
        this.instantiate();
        Main.Ground.instantiate();
    }
    elementName() {
        return "Cristal";
    }
}
class PropEditor {
    static Select(prop) {
    }
    static CreatePanel(prop, onDisposeCallback, onCloneCallback) {
        let panel = SpacePanel.CreateSpacePanel();
        panel.setTarget(prop);
        panel.addTitle1(prop.elementName().toLocaleUpperCase());
        panel.addTitle2(prop.name.toLocaleUpperCase());
        panel.addNumberInput("POS X", prop.position2D.x, (v) => {
            prop.position2D.x = v;
        });
        panel.addNumberInput("POS Y", prop.position2D.y, (v) => {
            prop.position2D.y = v;
        });
        panel.addNumberInput("ROTATION", prop.rotation2D, (v) => {
            prop.rotation2D = v / 180 * Math.PI;
        });
        panel.addMediumButtons("CLONE", () => {
            let data = prop.serialize();
            let splitName = data.name.split("-");
            if (splitName.length === 2) {
                let counter = parseInt(splitName[1]);
                if (isFinite(counter)) {
                    data.name = splitName[0] + "-" + (counter + 1);
                }
            }
            let clone = Prop.Deserialize(data);
            if (onCloneCallback) {
                onCloneCallback(clone);
            }
        }, "DELETE", () => {
            prop.dispose();
            if (onDisposeCallback) {
                onDisposeCallback();
            }
        });
        return panel;
    }
    static Unselect(prop) {
    }
}
class Tank extends Building {
    constructor(name, position2D, rotation2D) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let tankCount = this.getScene().meshes.filter((m) => { return m instanceof Tank; }).length;
            this.name = "tank-" + tankCount;
        }
        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 1.5);
        this.obstacle.name = name + "-obstacle";
    }
    async instantiate() {
        let vertexData = await VertexDataLoader.instance.getColorized("tank", "#ce7633", "#383838", "#6d6d6d");
        let min = Infinity;
        let max = -Infinity;
        this.height = -Infinity;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i];
            let y = vertexData.positions[3 * i + 1];
            let z = vertexData.positions[3 * i + 2];
            min = Math.min(min, x, z);
            max = Math.max(max, x, z);
            this.height = Math.max(this.height, y);
        }
        this.groundWidth = max - min;
        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }
    elementName() {
        return "Tank";
    }
}
class Turret extends Prop {
    constructor(name, position2D, rotation2D) {
        super(name, position2D, rotation2D);
        this.fireRate = 30; // Rounds per minute.
        this._fireCooldown = 0;
        this.range = 30;
        this.rotationSpeed = Math.PI / 2; // Radian per second.
        this._targetAzimut = 0;
        this._targetElevation = 0;
        this._dirToTarget = BABYLON.Vector2.Zero();
        this._update = () => {
            let dt = this.getScene().getEngine().getDeltaTime() / 1000;
            this._headBase.rotation.y = Math2D.StepFromToCirular(this._headBase.rotation.y, this._targetAzimut, this.rotationSpeed * dt);
            this._canon.rotation.x = Math2D.StepFromToCirular(this._canon.rotation.x, this._targetElevation, this.rotationSpeed * dt);
            if (this.target && this.target.alive) {
                let distSquared = this.position2D.subtract(this.target.position2D).lengthSquared();
                if (distSquared < this.rangeSquared) {
                    if (Math2D.AreEqualsCircular(this._headBase.rotation.y, this._targetAzimut)) {
                        if (Math2D.AreEqualsCircular(this._canon.rotation.x, this._targetElevation)) {
                            this._fire();
                        }
                    }
                }
                this._dirToTarget.copyFrom(this.target.position2D);
                this._dirToTarget.subtractInPlace(this.position2D);
                let azimut = Math2D.AngleFromTo(this.forward2D, this._dirToTarget);
                this._targetAzimut = -azimut;
                let tanElevation = 2.8 / this._dirToTarget.length();
                let elevation = Math.atan(tanElevation);
                this._targetElevation = elevation;
            }
            else {
                let mesh = this.getScene().meshes.find((m) => { return (m instanceof Fongus) && m.alive; });
                if (mesh instanceof Fongus) {
                    this.target = mesh;
                }
                else {
                    this._targetAzimut = 0;
                    this._targetElevation = 0;
                }
            }
        };
        if (this.name === "") {
            let turretCount = this.getScene().meshes.filter((m) => { return m instanceof Turret; }).length;
            this.name = "turret-" + turretCount;
        }
        this._headBase = new BABYLON.Mesh("turret-canonBase");
        this._headBase.parent = this;
        this._headBase.position.copyFromFloats(0, 2.1, 0);
        this._head = new BABYLON.Mesh("turret-head");
        this._head.parent = this._headBase;
        this._head.position.copyFromFloats(0, 0, 0);
        this._canon = new BABYLON.Mesh("turret-canon");
        this._canon.parent = this._head;
        this._canon.position.copyFromFloats(0, 0.7, 0);
        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 2, 2);
        this.obstacle.name = name + "-obstacle";
        this.getScene().onBeforeRenderObservable.add(this._update);
        Turret.Instances.push(this);
    }
    get _fireCooldownMax() {
        return 60 / this.fireRate;
    }
    get rangeSquared() {
        return this.range * this.range;
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        let index = Turret.Instances.indexOf(this);
        if (index !== -1) {
            Turret.Instances.splice(index, 1);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    async instantiate() {
        let data = await VertexDataLoader.instance.getColorized("turret-base", "#ce7633", "#383838", "#6d6d6d", "#d0d0d0", "#ce7633");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
        let headData = await VertexDataLoader.instance.getColorized("turret-head", "#ce7633", "#383838", "#6d6d6d");
        headData.applyToMesh(this._head);
        this._head.material = Main.cellShadingMaterial;
        let canonData = await VertexDataLoader.instance.getColorized("turret-canon", "#ce7633", "#383838", "#6d6d6d");
        canonData.applyToMesh(this._canon);
        this._canon.material = Main.cellShadingMaterial;
        this.groundWidth = 2;
        this.height = 3;
    }
    async _fire() {
        this._fireCooldown -= this.getScene().getEngine().getDeltaTime() / 1000;
        if (this._fireCooldown > 0) {
            return;
        }
        this._fireCooldown = this._fireCooldownMax;
        let bullet = new BABYLON.Mesh("bullet");
        bullet.layerMask = 0x10000000;
        let data = await VertexDataLoader.instance.getColorized("turret-ammo", "#101010", "", "#d0d0d0");
        data.applyToMesh(bullet);
        bullet.rotation.y = -this.rotation2D + this._headBase.rotation.y;
        bullet.rotation.x = this._canon.rotation.x;
        bullet.position.copyFrom(this.position);
        bullet.position.y += 2.8;
        let k = 0;
        let dir = this._canon.getDirection(BABYLON.Axis.Z).scaleInPlace(1);
        let ammoUpdate = () => {
            bullet.position.addInPlace(dir);
            k++;
            if (k < 30) {
                let t = k / 30;
                this._head.position.z = -0.25 * ((1 - t) - Math.pow(1 - t, 16));
            }
            else {
                this._head.position.z = 0;
                if (k > 1000 || bullet.position.y < 0) {
                    this.target.wound();
                    bullet.getScene().onBeforeRenderObservable.removeCallback(ammoUpdate);
                    bullet.dispose();
                }
            }
        };
        bullet.getScene().onBeforeRenderObservable.add(ammoUpdate);
    }
    elementName() {
        return "Turret";
    }
}
Turret.Instances = [];
class WallNode extends Draggable {
    constructor(position2D, wallSystem) {
        super("wallnode");
        this.position2D = position2D;
        this.wallSystem = wallSystem;
        this.dirs = [];
        this.walls = [];
        this.position2D = position2D;
        this.wallSystem.nodes.push(this);
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        while (this.walls.length > 0) {
            this.walls[0].dispose(doNotRecurse, disposeMaterialAndTextures);
        }
        let index = this.wallSystem.nodes.indexOf(this);
        if (index > -1) {
            this.wallSystem.nodes.splice(index, 1);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    async instantiate() {
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.updateDirs();
        if (this.dirs.length >= 1) {
            let dirs = [];
            for (let i = 0; i < this.dirs.length; i++) {
                dirs.push(this.dirs[i].dir);
            }
            let vertexData = WallNode.BuildVertexData(1, ...dirs);
            let min = Infinity;
            let max = -Infinity;
            this.height = -Infinity;
            for (let i = 0; i < vertexData.positions.length / 3; i++) {
                let x = vertexData.positions[3 * i];
                let y = vertexData.positions[3 * i + 1];
                let z = vertexData.positions[3 * i + 2];
                min = Math.min(min, x, z);
                max = Math.max(max, x, z);
                this.height = Math.max(this.height, y);
            }
            this.groundWidth = max - min;
            vertexData.applyToMesh(this);
            this.material = Main.cellShadingMaterial;
        }
    }
    updateDirs() {
        this.dirs = [];
        for (let i = 0; i < this.walls.length; i++) {
            let other = this.walls[i].otherNode(this);
            if (other) {
                let d = other.position2D.subtract(this.position2D);
                let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
                this.dirs.push({ dir: dir, length: d.length() });
            }
            else {
                console.warn("Oups...");
            }
        }
        this.dirs = this.dirs.sort((a, b) => { return a.dir - b.dir; });
    }
    updateObstacle() {
        let points = [];
        if (!this.dirs || this.dirs.length !== this.walls.length) {
            this.updateDirs();
        }
        if (this.walls.length === 1) {
            let d = this.dirs[0].dir;
            points = [
                new BABYLON.Vector2(Math.cos(d - Math.PI / 2), Math.sin(d - Math.PI / 2)),
                this.walls[0].otherNode(this).position2D.subtract(this.position2D),
                new BABYLON.Vector2(Math.cos(d + Math.PI / 2), Math.sin(d + Math.PI / 2))
            ];
        }
        else if (this.walls.length >= 2) {
            for (let i = 0; i < this.walls.length; i++) {
                let d = this.dirs[i].dir;
                let l = this.dirs[i].length;
                let dNext = this.dirs[(i + 1) % this.dirs.length].dir;
                points.push(new BABYLON.Vector2(Math.cos(d) * (l - 1), Math.sin(d) * (l - 1)));
                points.push(new BABYLON.Vector2(Math.cos(Math2D.LerpFromToCircular(d, dNext, 0.5)), Math.sin(Math2D.LerpFromToCircular(d, dNext, 0.5))));
            }
        }
        /*
        for (let i = 0; i < points.length; i++) {
            BABYLON.MeshBuilder.CreateSphere(
                "p",
                { diameter: 0.2 },
                Main.Scene)
                .position.copyFromFloats(
                    points[i].x + this.position2D.x,
                    - 0.2,
                    points[i].y + this.position2D.y
                );
        }
        */
        /*
        let shape = points;
        let points3D: BABYLON.Vector3[] = [];
        let colors: BABYLON.Color4[] = [];
        let r = Math.random();
        let g = Math.random();
        let b = Math.random();
        for (let i = 0; i < shape.length; i++) {
            let p = shape[i];
            points3D.push(new BABYLON.Vector3(p.x + this.position2D.x, 0.1, p.y + this.position2D.y));
            colors.push(new BABYLON.Color4(1, 0, 0, 1));
        }
        points3D.push(new BABYLON.Vector3(shape[0].x + this.position2D.x, 0.1, shape[0].y + this.position2D.y));
        colors.push(new BABYLON.Color4(1, 0, 0, 1));
        BABYLON.MeshBuilder.CreateLines("shape", { points: points3D, colors: colors }, Main.Scene);
        */
        this.obstacle = Obstacle.CreatePolygon(this.position2D.x, this.position2D.y, points);
    }
    static BuildVertexData(radius = 1, ...directions) {
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let baseShape = [
            new BABYLON.Vector3(radius, 0, 0.6),
            new BABYLON.Vector3(radius, 0.2, 0.6),
            new BABYLON.Vector3(radius, 1, 0.35),
            new BABYLON.Vector3(radius, 1.1, 0.35),
            new BABYLON.Vector3(radius, 2, 0.2),
            new BABYLON.Vector3(radius, 2.35, 0.2),
            new BABYLON.Vector3(radius, 2.4, 0.15)
        ];
        let bspc = baseShape.length;
        if (directions.length === 1) {
            let oppositeDir = directions[0] + Math.PI;
            if (oppositeDir > 2 * Math.PI) {
                oppositeDir -= 2 * Math.PI;
            }
            directions.push(oppositeDir);
        }
        for (let i = 0; i < directions.length; i++) {
            let dir = directions[i];
            let cosDir = Math.cos(dir);
            let sinDir = Math.sin(dir);
            let n = new BABYLON.Vector2(-cosDir, -sinDir);
            let dirNext = directions[(i + 1) % directions.length];
            let cosDirNext = Math.cos(dirNext);
            let sinDirNext = Math.sin(dirNext);
            let nNext = new BABYLON.Vector2(-cosDirNext, -sinDirNext);
            for (let j = 0; j < bspc; j++) {
                let baseP = baseShape[j];
                positions.push(cosDir * baseP.x - sinDir * baseP.z);
                positions.push(baseP.y);
                positions.push(sinDir * baseP.x + cosDir * baseP.z);
            }
            for (let j = 0; j < bspc; j++) {
                let baseP = baseShape[j];
                let p = new BABYLON.Vector2(cosDir * baseP.x - sinDir * baseP.z, sinDir * baseP.x + cosDir * baseP.z);
                let pNext = new BABYLON.Vector2(cosDirNext * baseP.x + sinDirNext * baseP.z, sinDirNext * baseP.x - cosDirNext * baseP.z);
                let intersection;
                if (Math.abs(Math.abs(dir - dirNext) - Math.PI) < Math.PI / 128) {
                    intersection = p.add(pNext).scaleInPlace(0.5);
                }
                else {
                    intersection = Math2D.RayRayIntersection(p, n, pNext, nNext);
                }
                if (intersection) {
                    positions.push(intersection.x, baseP.y, intersection.y);
                }
                else {
                    positions.push(p.x, baseP.y, p.y);
                }
            }
            for (let j = 0; j < bspc; j++) {
                let baseP = baseShape[j];
                positions.push(cosDirNext * baseP.x + sinDirNext * baseP.z);
                positions.push(baseP.y);
                positions.push(sinDirNext * baseP.x - cosDirNext * baseP.z);
            }
        }
        let cCount = 3 * directions.length;
        for (let j = 0; j < cCount; j++) {
            for (let i = 0; i < bspc - 1; i++) {
                indices.push(i + j * bspc, i + ((j + 1) % cCount) * bspc, i + 1 + ((j + 1) % cCount) * bspc);
                indices.push(i + 1 + ((j + 1) % cCount) * bspc, i + 1 + j * bspc, i + j * bspc);
            }
        }
        for (let i = 0; i < directions.length; i++) {
            indices.push(bspc - 1 + ((3 * i + 1) % cCount) * bspc, bspc - 1 + ((3 * i + 2) % cCount) * bspc, bspc - 1 + ((3 * i + 3) % cCount) * bspc);
            indices.push(bspc - 1 + ((3 * i + 1) % cCount) * bspc, bspc - 1 + ((3 * i + 3) % cCount) * bspc, bspc - 1 + ((3 * i + 4) % cCount) * bspc);
        }
        if (directions.length === 3) {
            indices.push(bspc - 1 + 1 * bspc, bspc - 1 + 4 * bspc, bspc - 1 + 7 * bspc);
        }
        data.positions = positions;
        data.indices = indices;
        let normals = [];
        BABYLON.VertexData.ComputeNormals(data.positions, data.indices, normals);
        data.normals = normals;
        let color = BABYLON.Color3.FromHexString("#383838");
        let colors = [];
        for (let i = 0; i < positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, 1);
        }
        data.colors = colors;
        return data;
    }
}
class Wall extends Selectionable {
    constructor(node1, node2) {
        super("wall");
        this.node1 = node1;
        this.node2 = node2;
        node1.walls.push(this);
        node2.walls.push(this);
        this.wallSystem = node1.wallSystem;
        this.wallSystem.walls.push(this);
    }
    dispose(doNotRecurse, disposeMaterialAndTextures) {
        let indexWallSystem = this.wallSystem.walls.indexOf(this);
        if (indexWallSystem > -1) {
            this.wallSystem.walls.splice(indexWallSystem, 1);
        }
        let indexNode1 = this.node1.walls.indexOf(this);
        if (indexNode1 > -1) {
            this.node1.walls.splice(indexNode1, 1);
        }
        if (this.node1.walls.length === 0) {
            this.node1.dispose(doNotRecurse, disposeMaterialAndTextures);
        }
        let indexNode2 = this.node2.walls.indexOf(this);
        if (indexNode2 > -1) {
            this.node2.walls.splice(indexNode2, 1);
        }
        if (this.node2.walls.length === 0) {
            this.node2.dispose(doNotRecurse, disposeMaterialAndTextures);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
    otherNode(refNode) {
        if (this.node1 === refNode) {
            return this.node2;
        }
        if (this.node2 === refNode) {
            return this.node1;
        }
        return undefined;
    }
    async instantiate() {
        let vertexData = await VertexDataLoader.instance.getColorized("wall", "#6d6d6d", "#383838", "#ce7633");
        vertexData = VertexDataLoader.clone(vertexData);
        let d = this.node1.position2D.subtract(this.node2.position2D);
        let l = d.length() - 2;
        d.scaleInPlace(1 / l);
        let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
        let cosDir = Math.cos(dir);
        let sinDir = Math.sin(dir);
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i] * l;
            let z = vertexData.positions[3 * i + 2];
            vertexData.positions[3 * i] = cosDir * x - sinDir * z;
            vertexData.positions[3 * i + 2] = sinDir * x + cosDir * z;
        }
        this.groundWidth = 2;
        this.height = -Infinity;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let y = vertexData.positions[3 * i + 1];
            this.height = Math.max(this.height, y);
        }
        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
        this.position.x = (this.node1.position2D.x + this.node2.position2D.x) * 0.5;
        this.position.z = (this.node1.position2D.y + this.node2.position2D.y) * 0.5;
    }
}
class WallData {
    constructor(node1Index, node2Index) {
        this.node1Index = node1Index;
        this.node2Index = node2Index;
    }
}
class WallNodeData {
    constructor(position2D) {
        this.position2D = position2D;
    }
}
class WallSystemData {
    constructor() {
        this.nodesData = [];
        this.wallsData = [];
    }
}
class WallSystem extends BABYLON.TransformNode {
    constructor() {
        super("wall-system");
        this.nodes = [];
        this.walls = [];
    }
    serialize() {
        let data = new WallSystemData();
        for (let i = 0; i < this.nodes.length; i++) {
            data.nodesData.push(new WallNodeData(this.nodes[i].position2D));
        }
        for (let i = 0; i < this.walls.length; i++) {
            let wall = this.walls[i];
            data.wallsData.push(new WallData(this.nodes.indexOf(wall.node1), this.nodes.indexOf(wall.node2)));
        }
        console.log("Serialize.");
        console.log("NodesCount = " + data.nodesData.length);
        console.log("WallsCount = " + data.wallsData.length);
        console.log(data);
        return data;
    }
    deserialize(data) {
        while (this.nodes.length > 0) {
            this.nodes.pop().dispose();
        }
        while (this.walls.length > 0) {
            this.walls.pop().dispose();
        }
        for (let i = 0; i < data.nodesData.length; i++) {
            new WallNode(new BABYLON.Vector2(data.nodesData[i].position2D.x, data.nodesData[i].position2D.y), this);
        }
        for (let i = 0; i < data.wallsData.length; i++) {
            let wallData = data.wallsData[i];
            new Wall(this.nodes[wallData.node1Index], this.nodes[wallData.node2Index]);
        }
        console.log("Deserialize.");
        console.log("NodesCount = " + data.nodesData.length);
        console.log("WallsCount = " + data.wallsData.length);
    }
    async instantiate() {
        for (let i = 0; i < this.nodes.length; i++) {
            await this.nodes[i].instantiate();
        }
        for (let i = 0; i < this.walls.length; i++) {
            await this.walls[i].instantiate();
        }
    }
    addToScene() {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].updateObstacle();
            /*
            let shape = this.nodes[i].obstacle.getPath(0.5, true);
            let r = Math.random();
            let g = Math.random();
            let b = Math.random();
            let points: BABYLON.Vector3[] = [];
            let colors: BABYLON.Color4[] = [];
            for (let i = 0; i < shape.length; i++) {
                let p = shape[i];
                points.push(new BABYLON.Vector3(p.x, - 0.5 * i, p.y));
                colors.push(new BABYLON.Color4(r, g, b, 1));
            }
            points.push(new BABYLON.Vector3(shape[0].x, - 0.5 * shape.length, shape[0].y));
            colors.push(new BABYLON.Color4(r, g, b, 1));
            BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, Main.Scene);
            */
            NavGraphManager.AddObstacle(this.nodes[i].obstacle);
        }
    }
}
class WallEditor {
    static Select(wall) {
    }
    static CreatePanel(wall, onDisposeCallback) {
        let panel = SpacePanel.CreateSpacePanel();
        panel.setTarget(wall);
        panel.addTitle1("WALL");
        panel.addMediumButtons("DELETE", () => {
            wall.dispose();
            wall.wallSystem.instantiate();
            onDisposeCallback();
        });
        return panel;
    }
    static Unselect(wall) {
    }
}
class WallNodeEditor {
    static Select(node) {
    }
    static CreatePanel(node, onDisposeCallback) {
        let panel = SpacePanel.CreateSpacePanel();
        panel.setTarget(node);
        panel.addTitle1("WALLNODE");
        panel.addNumberInput("POS X", node.position2D.x, (v) => {
            node.position2D.x = v;
            node.wallSystem.instantiate();
        });
        panel.addNumberInput("POS Y", node.position2D.y, (v) => {
            node.position2D.y = v;
            node.wallSystem.instantiate();
        });
        panel.addMediumButtons("DELETE", () => {
            node.dispose();
            node.wallSystem.instantiate();
            onDisposeCallback();
        });
        return panel;
    }
    static Unselect(node) {
    }
}
class VertexDataLoader {
    constructor(scene) {
        this.scene = scene;
        this._vertexDatas = new Map();
        VertexDataLoader.instance = this;
    }
    static clone(data) {
        let clonedData = new BABYLON.VertexData();
        clonedData.positions = [...data.positions];
        clonedData.indices = [...data.indices];
        clonedData.normals = [...data.normals];
        if (data.uvs) {
            clonedData.uvs = [...data.uvs];
        }
        if (data.colors) {
            clonedData.colors = [...data.colors];
        }
        return clonedData;
    }
    async get(name) {
        if (this._vertexDatas.get(name)) {
            return this._vertexDatas.get(name);
        }
        let request = new XMLHttpRequest();
        return new Promise((resolve) => {
            request.onload = () => {
                if (request.status >= 200 && request.status < 400) {
                    let rawData = JSON.parse(request.responseText);
                    let data = new BABYLON.VertexData();
                    data.positions = rawData.meshes[0].positions;
                    data.indices = rawData.meshes[0].indices;
                    if (rawData.meshes[0].normals) {
                        data.normals = rawData.meshes[0].normals;
                    }
                    if (rawData.meshes[0].uvs) {
                        data.uvs = rawData.meshes[0].uvs;
                    }
                    if (rawData.meshes[0].colors) {
                        data.colors = rawData.meshes[0].colors;
                    }
                    this._vertexDatas.set(name, data);
                    resolve(this._vertexDatas.get(name));
                }
            };
            request.open("GET", "./datas/" + name + ".babylon");
            request.send();
        });
    }
    async getColorized(name, baseColorHex = "#FFFFFF", frameColorHex = "", color1Hex = "", // Replace red
    color2Hex = "", // Replace green
    color3Hex = "" // Replace blue
    ) {
        let baseColor;
        if (baseColorHex !== "") {
            baseColor = BABYLON.Color3.FromHexString(baseColorHex);
        }
        let frameColor;
        if (frameColorHex !== "") {
            frameColor = BABYLON.Color3.FromHexString(frameColorHex);
        }
        let color1;
        if (color1Hex !== "") {
            color1 = BABYLON.Color3.FromHexString(color1Hex);
        }
        let color2;
        if (color2Hex !== "") {
            color2 = BABYLON.Color3.FromHexString(color2Hex);
        }
        let color3;
        if (color3Hex !== "") {
            color3 = BABYLON.Color3.FromHexString(color3Hex);
        }
        let data = VertexDataLoader.clone(await VertexDataLoader.instance.get(name));
        if (data.colors) {
            for (let i = 0; i < data.colors.length / 4; i++) {
                let r = data.colors[4 * i];
                let g = data.colors[4 * i + 1];
                let b = data.colors[4 * i + 2];
                if (baseColor) {
                    if (r === 1 && g === 1 && b === 1) {
                        data.colors[4 * i] = baseColor.r;
                        data.colors[4 * i + 1] = baseColor.g;
                        data.colors[4 * i + 2] = baseColor.b;
                        continue;
                    }
                }
                if (frameColor) {
                    if (r === 0.502 && g === 0.502 && b === 0.502) {
                        data.colors[4 * i] = frameColor.r;
                        data.colors[4 * i + 1] = frameColor.g;
                        data.colors[4 * i + 2] = frameColor.b;
                        continue;
                    }
                }
                if (color1) {
                    if (r === 1 && g === 0 && b === 0) {
                        data.colors[4 * i] = color1.r;
                        data.colors[4 * i + 1] = color1.g;
                        data.colors[4 * i + 2] = color1.b;
                        continue;
                    }
                }
                if (color2) {
                    if (r === 0 && g === 1 && b === 0) {
                        data.colors[4 * i] = color2.r;
                        data.colors[4 * i + 1] = color2.g;
                        data.colors[4 * i + 2] = color2.b;
                        continue;
                    }
                }
                if (color3) {
                    if (r === 0 && g === 0 && b === 1) {
                        data.colors[4 * i] = color3.r;
                        data.colors[4 * i + 1] = color3.g;
                        data.colors[4 * i + 2] = color3.b;
                        continue;
                    }
                }
            }
        }
        else {
            let colors = [];
            for (let i = 0; i < data.positions.length / 3; i++) {
                colors[4 * i] = baseColor.r;
                colors[4 * i + 1] = baseColor.g;
                colors[4 * i + 2] = baseColor.b;
                colors[4 * i + 3] = 1;
            }
            data.colors = colors;
        }
        return data;
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
        this.offset = 0.5;
        this.obstacles = [];
    }
    setStart(s) {
        if (!this.start) {
            this.start = new NavGraphPoint(0, undefined, undefined);
        }
        this.start.position = s;
    }
    setEnd(e) {
        if (!this.end) {
            this.end = new NavGraphPoint(1, undefined, undefined);
        }
        this.end.position = e;
    }
    update() {
        this.points = [];
        let counter = 2;
        this.obstacles.forEach((o) => {
            o.computePath(this.offset);
        });
        for (let i = 0; i < this.obstacles.length; i++) {
            let o = this.obstacles[i];
            let path = o.getPath(this.offset);
            let ngPoints = [];
            for (let j = 0; j < path.length; j++) {
                let ngPoint = new NavGraphPoint(counter++, o, path);
                ngPoint.position = path[j];
                this.obstacles.forEach((otherObstacle) => {
                    if (otherObstacle !== o) {
                        if (Math2D.IsPointInPath(ngPoint.position, otherObstacle.getPath(this.offset))) {
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
                    let crossesAnotherShape = false;
                    for (let k = 0; k < this.obstacles.length; k++) {
                        let otherObstacle = this.obstacles[k];
                        if (o !== otherObstacle) {
                            let intersections = Math2D.SegmentShapeIntersection(p1.position, p2.position, otherObstacle.getPath(this.offset));
                            if (intersections.length > 0) {
                                crossesAnotherShape = true;
                                break;
                            }
                        }
                    }
                    if (!crossesAnotherShape) {
                        NavGraphPoint.Connect(p1, p2);
                    }
                }
                // Deal with case where [P1P2] crosses another shape
                if (!p1.unreachable) {
                    this.points.push(p1);
                }
            }
        }
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                let p1 = this.points[i];
                let p2 = this.points[j];
                if (p1.path !== p2.path || (!p1.path && !p2.path)) {
                    let d = p2.position.subtract(p1.position);
                    // Check if segment intersects p1.shape
                    let p1ShapeSelfIntersect = true;
                    if (p1.path) {
                        let index = p1.path.indexOf(p1.position);
                        let sNext = p1.path[(index + 1) % p1.path.length].subtract(p1.position);
                        let sPrev = p1.path[(index - 1 + p1.path.length) % p1.path.length].subtract(p1.position);
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
                        if (p2.path) {
                            let index = p2.path.indexOf(p2.position);
                            let sNext = p2.path[(index + 1) % p2.path.length].subtract(p2.position);
                            let sPrev = p2.path[(index - 1 + p2.path.length) % p2.path.length].subtract(p2.position);
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
                                if (o !== p1.obstacle && o !== p2.obstacle) {
                                    let path = o.getPath(this.offset);
                                    for (let j = 0; j < path.length; j++) {
                                        let s1 = path[j];
                                        let s2 = path[(j + 1) % path.length];
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
    }
    computePathFromTo(from, to) {
        let toObstacle = undefined;
        this.setStart(from);
        if (to instanceof BABYLON.Vector2) {
            this.setEnd(to);
        }
        else if (to instanceof Obstacle) {
            this.setEnd(to.position2D);
            toObstacle = to;
        }
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].distanceToEnd = Infinity;
        }
        this.points.push(this.start, this.end);
        let newPoints = [this.start, this.end];
        for (let i = 0; i < newPoints.length; i++) {
            let p1 = newPoints[i];
            for (let j = 0; j < this.points.length; j++) {
                let p2 = this.points[j];
                if (p1 !== p2) {
                    let d = p1.position.subtract(p2.position);
                    let p2ShapeSelfIntersect = true;
                    if (p2.path) {
                        let index = p2.path.indexOf(p2.position);
                        let sNext = p2.path[(index + 1) % p2.path.length].subtract(p2.position);
                        let sPrev = p2.path[(index - 1 + p2.path.length) % p2.path.length].subtract(p2.position);
                        if (Math2D.AngleFromTo(sPrev, d, true) <= Math2D.AngleFromTo(sPrev, sNext, true)) {
                            p2ShapeSelfIntersect = false;
                        }
                    }
                    else {
                        p2ShapeSelfIntersect = false;
                    }
                    if (!p2ShapeSelfIntersect) {
                        let crossOtherShape = false;
                        for (let k = 0; k < this.obstacles.length; k++) {
                            let o = this.obstacles[k];
                            let path = o.getPath(this.offset);
                            if (!Math2D.IsPointInPath(p1.position, path)) {
                                if (o !== toObstacle && o !== p2.obstacle) {
                                    for (let j = 0; j < path.length; j++) {
                                        let s1 = path[j];
                                        let s2 = path[(j + 1) % path.length];
                                        if (Math2D.SegmentSegmentIntersection(p1.position, p2.position, s1, s2)) {
                                            crossOtherShape = true;
                                        }
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
        this.end.distanceToEnd = 0;
        this.start.distanceToEnd = Infinity;
        this.end.propagateDistanceToEnd();
        this.path = [this.start.position];
        this.start.appendNextPathPoint(this.path);
        this.start.remove();
        this.end.remove();
        this.points.pop();
        this.points.pop();
        return this.path;
    }
    isDisplayed() {
        return this._devLineMeshes !== undefined;
    }
    toggleDisplay(scene) {
        if (this.isDisplayed()) {
            this.hide();
        }
        else {
            this.display(scene);
        }
    }
    display(scene) {
        this.hide();
        this._devLineMeshes = new BABYLON.TransformNode("NavGraphDevLinesMeshes", scene);
        for (let i = 0; i < this.points.length; i++) {
            let p = this.points[i];
            BABYLON.MeshBuilder.CreateSphere("p-" + i, { diameter: 0.1 }, scene).position.copyFromFloats(p.position.x, -0.2, p.position.y);
            for (let j = 0; j < p.links.length; j++) {
                let p2 = p.links[j].other(p);
                if (p.index < p2.index) {
                    let devLinesMesh = BABYLON.MeshBuilder.CreateLines("line", {
                        points: [
                            new BABYLON.Vector3(p.position.x, 0.1, p.position.y),
                            new BABYLON.Vector3(p2.position.x, 0.1, p2.position.y)
                        ],
                        colors: [
                            new BABYLON.Color4(0, 0, 1, 1),
                            new BABYLON.Color4(0, 0, 1, 1)
                        ]
                    }, scene);
                    devLinesMesh.renderingGroupId = 1;
                    devLinesMesh.parent = this._devLineMeshes;
                }
            }
        }
        if (this.path) {
            let points = [];
            let colors = [];
            for (let i = 0; i < this.path.length; i++) {
                let p = this.path[i];
                points.push(new BABYLON.Vector3(p.x, 0.3, p.y));
                colors.push(new BABYLON.Color4(0, 1, 0, 1));
            }
            let devLinesMesh = BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
            devLinesMesh.renderingGroupId = 1;
            devLinesMesh.parent = this._devLineMeshes;
        }
    }
    hide() {
        if (this._devLineMeshes) {
            this._devLineMeshes.dispose();
            this._devLineMeshes = undefined;
        }
    }
}
class NavGraphConsole {
    constructor(scene) {
        this.scene = scene;
        this._offset = 1;
        this._navGraph = NavGraphManager.GetForRadius(this._offset);
    }
    enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("NAVGRAPH");
        this._panel.addTitle2("DEV CONSOLE");
        this._panel.addNumberInput("OFFSET", this._offset, (v) => {
            this._offset = v;
            this._navGraph.hide();
            this._navGraph = NavGraphManager.GetForRadius(this._offset);
        });
        this._panel.addConditionalButton("OBSTACLES", () => {
            if (this._navGraph && this._navGraph.obstacles[0] && this._navGraph.obstacles[0].isDisplayed()) {
                return "HIDE";
            }
            return "SHOW";
        }, () => {
            this._navGraph.update();
            for (let i = 0; i < this._navGraph.obstacles.length; i++) {
                let o = this._navGraph.obstacles[i];
                if (o.isDisplayed()) {
                    o.hide();
                }
                else {
                    o.display(this.scene);
                }
            }
        });
        this._panel.addConditionalButton("NAVGRAPH", () => {
            if (this._navGraph.isDisplayed()) {
                return "HIDE";
            }
            return "SHOW";
        }, () => {
            this._navGraph.update();
            if (this._navGraph.isDisplayed()) {
                this._navGraph.hide();
            }
            else {
                this._navGraph.display(this.scene);
            }
        });
        this._panel.style.left = "10px";
        this._panel.style.bottom = "10px";
    }
    disable() {
        this._panel.dispose();
    }
}
class NavGraphManager {
    constructor() {
        NavGraphManager.Instance = this;
        this._navGraphs = new Map();
        this._navGraphZero = new NavGraph();
        this._navGraphZero.offset = 0;
        this._navGraphs.set(0, this._navGraphZero);
    }
    static GetForRadius(radius) {
        return NavGraphManager.Instance.getForOffset(radius);
    }
    getForOffset(offset) {
        let navGraph = this._navGraphs.get(offset);
        if (!navGraph) {
            navGraph = new NavGraph();
            navGraph.offset = offset;
            for (let i = 0; i < this._navGraphZero.obstacles.length; i++) {
                navGraph.obstacles.push(this._navGraphZero.obstacles[i]);
            }
            this._navGraphs.set(offset, navGraph);
        }
        return navGraph;
    }
    static AddObstacle(obstacle) {
        return NavGraphManager.Instance.addObstacle(obstacle);
    }
    addObstacle(obstacle) {
        this._navGraphs.forEach((navGraph) => {
            navGraph.obstacles.push(obstacle);
        });
    }
}
class NavGraphLink {
    other(current) {
        if (this.p1 === current) {
            return this.p2;
        }
        if (this.p2 === current) {
            return this.p1;
        }
        console.warn("Undefined request for other NavGraphPoint.");
        return undefined;
    }
}
class NavGraphPoint {
    constructor(index, obstacle, shape) {
        this.index = 0;
        this.path = [];
        this.links = [];
        this.distanceToEnd = Infinity;
        this.unreachable = false;
        this.index = index;
        this.obstacle = obstacle;
        this.path = shape;
    }
    remove() {
        while (this.links.length > 0) {
            let other = this.links[0].other(this);
            NavGraphPoint.Disconnect(this, other);
        }
    }
    hasNeighbour(n) {
        for (let i = 0; i < this.links.length; i++) {
            if (this.links[i].other(this) === n) {
                return this.links[i];
            }
        }
        return undefined;
    }
    propagateDistanceToEnd() {
        for (let i = 0; i < this.links.length; i++) {
            let n = this.links[i].other(this);
            let distanceToEnd = this.links[i].length + this.distanceToEnd;
            if (distanceToEnd < n.distanceToEnd) {
                n.distanceToEnd = distanceToEnd;
                n.propagateDistanceToEnd();
            }
        }
    }
    appendNextPathPoint(path) {
        this.links.sort((l1, l2) => { return (l1.length + l1.other(this).distanceToEnd) - (l2.length + l2.other(this).distanceToEnd); });
        if (this.links[0]) {
            let other = this.links[0].other(this);
            if (other.distanceToEnd < Infinity) {
                path.push(other.position);
                if (other.distanceToEnd > 0) {
                    other.appendNextPathPoint(path);
                }
            }
        }
    }
    static Connect(p1, p2) {
        let link = new NavGraphLink();
        link.p1 = p1;
        link.p2 = p2;
        link.length = Math2D.Distance(p1.position, p2.position);
        let checkFineConnection = 0;
        if (!p1.hasNeighbour(p2)) {
            p1.links.push(link);
            checkFineConnection++;
        }
        if (!p2.hasNeighbour(p1)) {
            p2.links.push(link);
            checkFineConnection++;
        }
        if (checkFineConnection % 2 !== 0) {
            console.warn("Connect between 2 NavGraphPoint went wrong : Only one was already connected to the other.");
        }
    }
    static Disconnect(p1, p2) {
        let l = p1.hasNeighbour(p2);
        if (l === p2.hasNeighbour(p1)) {
            let p1LIndex = p1.links.indexOf(l);
            let p2LIndex = p2.links.indexOf(l);
            p1.links.splice(p1LIndex, 1);
            p2.links.splice(p2LIndex, 1);
        }
        else {
            if (!p1.hasNeighbour(p2) && !p2.hasNeighbour(p1)) {
                console.warn("Disconnection between 2 NavGraphPoint went wrong : Points were already disconnected.");
            }
            else {
                console.warn("Disconnection between 2 NavGraphPoint went wrong : Only one was connected to the other.");
            }
        }
    }
}
class Obstacle {
    constructor(posRotSource = undefined) {
        this.posRotSource = posRotSource;
        this.name = (Math.random() * 100).toFixed(0);
        this._path = new Map();
    }
    get position2D() {
        if (this.posRotSource) {
            return this.posRotSource.position2D;
        }
        return this._position2D;
    }
    set position2D(v) {
        this._position2D = v;
    }
    get rotation2D() {
        if (this.posRotSource) {
            return this.posRotSource.rotation2D;
        }
        return this._rotation2D;
    }
    set rotation2D(v) {
        this._rotation2D = v;
    }
    static CreateRectWithPosRotSource(posRotSource, w = 1, h = 1) {
        let rect = new Obstacle();
        rect.posRotSource = posRotSource;
        rect.shape = new Rect(w, h);
        rect.shape.posRotSource = posRotSource;
        return rect;
    }
    static CreateRect(x, y, w = 1, h = 1, rotation = 0) {
        let rect = new Obstacle();
        rect.shape = new Rect(w, h);
        rect.shape.position2D = new BABYLON.Vector2(x, y);
        rect.shape.rotation2D = rotation;
        return rect;
    }
    static CreateHexagonWithPosRotSource(posRotSource, radius = 1) {
        let hexagon = new Obstacle();
        hexagon.posRotSource = posRotSource;
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.posRotSource = posRotSource;
        return hexagon;
    }
    static CreateHexagon(x, y, radius = 1) {
        let hexagon = new Obstacle();
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.position2D = new BABYLON.Vector2(x, y);
        return hexagon;
    }
    static CreatePolygon(x, y, points) {
        let polygon = new Obstacle();
        polygon.shape = new Polygon(points);
        polygon.shape.position2D = new BABYLON.Vector2(x, y);
        return polygon;
    }
    getPath(offset = 1, forceCompute = false) {
        let path = this._path.get(offset);
        if (!path || forceCompute) {
            path = this.computePath(offset);
        }
        return path;
    }
    computePath(offset = 1) {
        let path = this.shape.getPath(offset);
        this._path.set(offset, path);
        return path;
    }
    contains(point, offset = 1, forceCompute = false) {
        return Math2D.IsPointInPath(point, this.getPath(offset, forceCompute));
    }
    isDisplayed() {
        return this._devLineMesh !== undefined;
    }
    toggleDisplay(scene) {
        if (this.isDisplayed()) {
            this.hide();
        }
        else {
            this.display(scene);
        }
    }
    display(scene) {
        this.hide();
        let path = this.shape.getPath();
        let points = [];
        let colors = [];
        for (let i = 0; i < path.length; i++) {
            let p = path[i];
            points.push(new BABYLON.Vector3(p.x, 0.2, p.y));
            colors.push(new BABYLON.Color4(1, 0, 0, 1));
        }
        points.push(points[0]);
        colors.push(new BABYLON.Color4(1, 0, 0, 1));
        this._devLineMesh = BABYLON.MeshBuilder.CreateLines("shape", { points: points, colors: colors }, scene);
        this._devLineMesh.renderingGroupId = 1;
    }
    hide() {
        if (this._devLineMesh) {
            this._devLineMesh.dispose();
            this._devLineMesh = undefined;
        }
    }
}
class ShapeDraw {
    static CreateCircle(rMin, rMax, name = "circle") {
        let mesh = new BABYLON.Mesh(name);
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        for (let i = 0; i <= 32; i++) {
            let a = i + Math.random() * 0.5;
            let cosa = Math.cos(a * 2 * Math.PI / 32);
            let sina = Math.sin(a * 2 * Math.PI / 32);
            positions.push(cosa * rMin, 0, sina * rMin);
            positions.push(cosa * rMax, 0, sina * rMax);
        }
        for (let i = 0; i < 32; i++) {
            if (Math.cos(i * 500) > 0) {
                indices.push(2 * i, 2 * i + 1, 2 * (i + 1) + 1);
                indices.push(2 * i, 2 * (i + 1) + 1, 2 * (i + 1));
            }
        }
        data.positions = positions;
        data.indices = indices;
        data.applyToMesh(mesh);
        return mesh;
    }
}
class Shape {
    constructor(posRotSource = undefined) {
        this.posRotSource = posRotSource;
    }
    get position2D() {
        if (this.posRotSource) {
            return this.posRotSource.position2D;
        }
        return this._position2D;
    }
    set position2D(v) {
        this._position2D = v;
    }
    get rotation2D() {
        if (this.posRotSource) {
            return this.posRotSource.rotation2D;
        }
        return this._rotation2D;
    }
    set rotation2D(v) {
        this._rotation2D = v;
    }
}
class Rect extends Shape {
    constructor(width = 1, height = 1) {
        super();
        this.width = width;
        this.height = height;
    }
    getPath(offset = 0) {
        this._path = [
            new BABYLON.Vector2(-(this.width + offset) * 0.5, -(this.height + offset) * 0.5),
            new BABYLON.Vector2((this.width + offset) * 0.5, -(this.height + offset) * 0.5),
            new BABYLON.Vector2((this.width + offset) * 0.5, (this.height + offset) * 0.5),
            new BABYLON.Vector2(-(this.width + offset) * 0.5, (this.height + offset) * 0.5)
        ];
        for (let i = 0; i < this._path.length; i++) {
            Math2D.RotateInPlace(this._path[i], this.rotation2D);
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}
class Hexagon extends Shape {
    constructor(radius = 1) {
        super();
        this.radius = radius;
    }
    getPath(offset = 0) {
        this._path = [];
        for (let i = 0; i < 6; i++) {
            this._path.push(new BABYLON.Vector2(Math.cos(i * Math.PI / 3) * (this.radius + offset), Math.sin(i * Math.PI / 3) * (this.radius + offset)));
        }
        for (let i = 0; i < this._path.length; i++) {
            Math2D.RotateInPlace(this._path[i], this.rotation2D);
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}
class Polygon extends Shape {
    constructor(points) {
        super();
        this.points = points;
    }
    getPath(offset = 0) {
        this._path = Math2D.FattenShrinkPointShape(this.points, offset);
        for (let i = 0; i < this._path.length; i++) {
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
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
class Ground extends BABYLON.Mesh {
    constructor(width, height) {
        super("ground");
        this.width = width;
        this.height = height;
        this.stepCountW = 1;
        this.stepZeroW = 1;
        this.stepCountH = 1;
        this.stepZeroH = 1;
        this.stepCountW = Math.ceil(this.width / 5) + 1;
        this.stepZeroW = Math.ceil(-this.stepCountW / 2);
        this.stepCountH = Math.ceil(this.height / 5) + 1;
        this.stepZeroH = Math.ceil(-this.stepCountH / 2);
    }
    instantiate() {
        let cristals = this.getScene().meshes.filter((m) => { return m instanceof Cristal; });
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let colors = [];
        let uvs = [];
        let normals = [];
        let holes = [];
        for (let i = 0; i < cristals.length; i++) {
            let iHole0 = Math.round(cristals[i].position2D.x / 5) - this.stepZeroW;
            let jHole0 = Math.round(cristals[i].position2D.y / 5) - this.stepZeroH;
            let iHole1 = iHole0 - 1;
            let jHole1 = jHole0 - 1;
            holes.push(new BABYLON.Vector2(iHole0, jHole0), new BABYLON.Vector2(iHole0, jHole1), new BABYLON.Vector2(iHole1, jHole0), new BABYLON.Vector2(iHole1, jHole1));
        }
        for (let j = 0; j < this.stepCountH; j++) {
            for (let i = 0; i < this.stepCountW; i++) {
                let x = (this.stepZeroW + i) * 5;
                let y = (this.stepZeroH + j) * 5;
                positions.push(x, 0, y);
                let c = (Math.cos(i * 43 + j * 3201) + 1) * 0.25 + 0.5;
                colors.push(c, c, c, 1);
                uvs.push(i, j);
                normals.push(0, 1, 0);
                if (i + 1 < this.stepCountW && j + 1 < this.stepCountH) {
                    if (!holes.find(h => { return h.x === i && h.y === j; })) {
                        let index = i + j * this.stepCountW;
                        indices.push(index, index + 1, index + 1 + this.stepCountW);
                        indices.push(index, index + 1 + this.stepCountW, index + this.stepCountW);
                    }
                }
            }
        }
        data.positions = positions;
        data.indices = indices;
        data.colors = colors;
        data.uvs = uvs;
        data.normals = normals;
        data.applyToMesh(this);
    }
}
class SpacePanel extends HTMLElement {
    constructor() {
        super();
        this._update = () => {
            if (!this._target) {
                return;
            }
            let dView = this._target.position.subtract(Main.Camera.position);
            let n = BABYLON.Vector3.Cross(dView, new BABYLON.Vector3(0, 1, 0));
            n.normalize();
            n.scaleInPlace(-this._target.groundWidth * 0.5);
            let p0 = this._target.position;
            let p1 = this._target.position.add(n);
            let p2 = p1.clone();
            p2.y += this._target.groundWidth * 0.5 + this._target.height;
            let screenPos = BABYLON.Vector3.Project(p2, BABYLON.Matrix.Identity(), this._target.getScene().getTransformMatrix(), Main.Camera.viewport.toGlobal(1, 1));
            this.style.left = (screenPos.x * Main.Canvas.width - this.clientWidth * 0.5) + "px";
            this.style.bottom = ((1 - screenPos.y) * Main.Canvas.height) + "px";
            this._line.setVerticesData(BABYLON.VertexBuffer.PositionKind, [...p0.asArray(), ...p2.asArray()]);
        };
    }
    static CreateSpacePanel() {
        let panel = document.createElement("space-panel");
        document.body.appendChild(panel);
        return panel;
    }
    connectedCallback() {
        this._innerBorder = document.createElement("div");
        this._innerBorder.classList.add("space-panel-inner-border");
        this.appendChild(this._innerBorder);
    }
    dispose() {
        if (this._target) {
            this._target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        }
        if (this._line) {
            this._line.dispose();
        }
        document.body.removeChild(this);
    }
    setTarget(mesh) {
        this._target = mesh;
        this._line = BABYLON.MeshBuilder.CreateLines("line", {
            points: [
                BABYLON.Vector3.Zero(),
                BABYLON.Vector3.Zero()
            ],
            updatable: true,
            colors: [
                new BABYLON.Color4(0, 1, 0, 1),
                new BABYLON.Color4(0, 1, 0, 1)
            ]
        }, this._target.getScene());
        this._line.renderingGroupId = 1;
        this._line.layerMask = 0x10000000;
        this._target.getScene().onBeforeRenderObservable.add(this._update);
    }
    addTitle1(title) {
        let titleLine = document.createElement("div");
        titleLine.classList.add("space-title-1-line");
        let e = document.createElement("h1");
        e.classList.add("space-title-1");
        e.textContent = title;
        titleLine.appendChild(e);
        let eShadow = document.createElement("span");
        eShadow.classList.add("space-title-1-shadow");
        eShadow.textContent = title;
        titleLine.appendChild(eShadow);
        this._innerBorder.appendChild(titleLine);
    }
    addTitle2(title) {
        let e = document.createElement("h2");
        e.classList.add("space-title-2");
        e.textContent = title;
        this._innerBorder.appendChild(e);
    }
    addNumberInput(label, value, onInputCallback, precision = 1) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-number");
        inputElement.setAttribute("type", "number");
        inputElement.value = value.toFixed(precision);
        let step = 1 / (Math.pow(2, Math.round(precision)));
        inputElement.setAttribute("step", step.toString());
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                let v = parseFloat(ev.srcElement.value);
                if (isFinite(v)) {
                    if (onInputCallback) {
                        onInputCallback(v);
                    }
                }
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }
    addTextInput(label, text, onInputCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-text");
        inputElement.setAttribute("type", "text");
        inputElement.value = text;
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                if (onInputCallback) {
                    onInputCallback(ev.srcElement.value);
                }
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }
    addLargeButton(value, onClickCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-lg");
        inputElement.setAttribute("type", "button");
        inputElement.value = value;
        inputElement.addEventListener("click", () => {
            onClickCallback();
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }
    addConditionalButton(label, value, onClickCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-button-inline");
        inputElement.setAttribute("type", "button");
        inputElement.value = value();
        inputElement.addEventListener("click", () => {
            onClickCallback();
            inputElement.value = value();
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }
    addMediumButtons(value1, onClickCallback1, value2, onClickCallback2) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let inputElement1 = document.createElement("input");
        inputElement1.classList.add("space-button");
        inputElement1.setAttribute("type", "button");
        inputElement1.value = value1;
        inputElement1.addEventListener("click", () => {
            onClickCallback1();
        });
        lineElement.appendChild(inputElement1);
        let inputs = [inputElement1];
        if (value2 && onClickCallback2) {
            let inputElement2 = document.createElement("input");
            inputElement2.classList.add("space-button");
            inputElement2.setAttribute("type", "button");
            inputElement2.value = value2;
            inputElement2.addEventListener("click", () => {
                onClickCallback2();
            });
            lineElement.appendChild(inputElement2);
            inputs.push(inputElement2);
        }
        this._innerBorder.appendChild(lineElement);
        return inputs;
    }
    addCheckBox(label, value, onToggleCallback) {
        let lineElement = document.createElement("div");
        lineElement.classList.add("space-panel-line");
        let labelElement = document.createElement("space-panel-label");
        labelElement.textContent = label;
        lineElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.classList.add("space-input", "space-input-toggle");
        inputElement.setAttribute("type", "checkbox");
        inputElement.addEventListener("input", (ev) => {
            if (ev.srcElement instanceof HTMLInputElement) {
                onToggleCallback(ev.srcElement.checked);
            }
        });
        lineElement.appendChild(inputElement);
        this._innerBorder.appendChild(lineElement);
        return inputElement;
    }
}
window.customElements.define("space-panel", SpacePanel);
class SpacePanelLabel extends HTMLElement {
    constructor() {
        super();
    }
}
window.customElements.define("space-panel-label", SpacePanelLabel);
