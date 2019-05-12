class Obstacle {

    public name: string = (Math.random() * 100).toFixed(0);
    public shape: Shape;
    private _path: Map<number, BABYLON.Vector2[]> = new Map<number, BABYLON.Vector2[]>();

    public static CreateRect(x: number, y: number, w: number = 1, h: number = 1, rotation: number = 0): Obstacle {
        let rect = new Obstacle();
        rect.shape = new Rect(w, h);
        rect.shape.position = new BABYLON.Vector2(x, y);
        rect.shape.rotation = rotation;
        return rect;
    }

    public static CreateHexagon(x: number, y: number, radius: number = 1): Obstacle {
        let hexagon = new Obstacle();
        hexagon.shape = new Hexagon(radius);
        hexagon.shape.position = new BABYLON.Vector2(x, y);
        return hexagon;
    }

    public static CreatePolygon(x: number, y: number, points: BABYLON.Vector2[]): Obstacle {
        let polygon = new Obstacle();
        polygon.shape = new Polygon(points);
        polygon.shape.position = new BABYLON.Vector2(x, y);
        return polygon;
    }

    public getPath(offset: number = 1, forceCompute: boolean = false): BABYLON.Vector2[] {
        let path = this._path.get(offset);
        if (!path || forceCompute) {
            path = this.computePath(offset);
            this._path.set(offset, path)
        }
        return path;
    }

    public computePath(offset: number = 1): BABYLON.Vector2[] {
        return this.shape.getPath(offset);
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