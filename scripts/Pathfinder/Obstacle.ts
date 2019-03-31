class Obstacle {

    public shape: Shape;
    private _path: BABYLON.Vector2[];
    public get path(): BABYLON.Vector2[] {
        if (!this._path) {
            this.updatePath();
        }
        return this._path;
    }

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

    public updatePath(): void {
        this._path = this.shape.getPath();
    }

    public display(scene: BABYLON.Scene): BABYLON.LinesMesh {
        let path = this.shape.getPath();
        let points: BABYLON.Vector3[] = [];
        for (let i = 0; i < path.length; i++) {
            let p = path[i];
            points.push(new BABYLON.Vector3(p.x, 0, p.y));
        }
        points.push(points[0]);
        return BABYLON.MeshBuilder.CreateLines("shape", { points: points }, scene);
    }
}