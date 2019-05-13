class Obstacle {

    public name: string = (Math.random() * 100).toFixed(0);
    private _position2D: BABYLON.Vector2;
    public get position2D(): BABYLON.Vector2 {
        if (this.posRotSource) {
            return this.posRotSource.position2D;
        }
        return this._position2D;
    }
    public set position2D(v: BABYLON.Vector2) {
        this._position2D = v;
    }
    private _rotation2D: number;
    public get rotation2D(): number {
        if (this.posRotSource) {
            return this.posRotSource.rotation2D;
        }
        return this._rotation2D;
    }
    public set rotation2D(v: number) {
        this._rotation2D = v;
    }
    public shape: Shape;
    private _path: Map<number, BABYLON.Vector2[]> = new Map<number, BABYLON.Vector2[]>();

    constructor(
        public posRotSource: IHasPosRot = undefined
    ) {

    }

    public static CreateRectWithPosRotSource(posRotSource: IHasPosRot, w: number = 1, h: number = 1): Obstacle {
        let rect = new Obstacle();
        rect.posRotSource = posRotSource;
        rect.shape = new Rect(w, h);
        rect.shape.posRotSource = posRotSource;
        return rect;
    }
    public static CreateRect(x: number, y: number, w: number = 1, h: number = 1, rotation: number = 0): Obstacle {
        let rect = new Obstacle();
        rect.shape = new Rect(w, h);
        rect.shape.position2D = new BABYLON.Vector2(x, y);
        rect.shape.rotation2D = rotation;
        return rect;
    }

    public static CreateHexagonWithPosRotSource(posRotSource: IHasPosRot, radius: number = 1): Obstacle {
        let hexagon = new Obstacle();
        hexagon.posRotSource = posRotSource
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.posRotSource = posRotSource;
        return hexagon;
    }
    public static CreateHexagon(x: number, y: number, radius: number = 1): Obstacle {
        let hexagon = new Obstacle();
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.position2D = new BABYLON.Vector2(x, y);
        return hexagon;
    }

    public static CreatePolygon(x: number, y: number, points: BABYLON.Vector2[]): Obstacle {
        let polygon = new Obstacle();
        polygon.shape = new Polygon(points);
        polygon.shape.position2D = new BABYLON.Vector2(x, y);
        return polygon;
    }

    public getPath(offset: number = 1, forceCompute: boolean = false): BABYLON.Vector2[] {
        let path = this._path.get(offset);
        if (!path || forceCompute) {
            path = this.computePath(offset);
        }
        return path;
    }

    public computePath(offset: number = 1): BABYLON.Vector2[] {
        let path = this.shape.getPath(offset);
        this._path.set(offset, path)
        return path;
    }

    public contains(point: BABYLON.Vector2, offset: number = 1, forceCompute: boolean = false): boolean {
        return Math2D.IsPointInPath(point, this.getPath(offset, forceCompute));
    }

    private _devLineMesh: BABYLON.LinesMesh;
    public isDisplayed(): boolean {
        return this._devLineMesh !== undefined;
    }
    public toggleDisplay(scene: BABYLON.Scene): void {
        if (this.isDisplayed()) {
            this.hide();
        }
        else {
            this.display(scene);
        }
    }
    public display(scene: BABYLON.Scene): void {
        this.hide();
        let path = this.shape.getPath();
        let points: BABYLON.Vector3[] = [];
        let colors: BABYLON.Color4[] = [];
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
    public hide(): void {
        if (this._devLineMesh) {
            this._devLineMesh.dispose();
            this._devLineMesh = undefined;
        }
    }
}