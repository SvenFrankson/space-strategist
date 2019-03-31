class Obstacle {

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

    public getPath(offset: number = 1, forceCompute: boolean = false): BABYLON.Vector2[] {
        let path = this._path.get(offset);
        if (!path || forceCompute) {
            path = this.computePath(offset);
            this._path.set(offset, path)
            console.log(path);
        }
        return path;
    }

    public computePath(offset: number = 1): BABYLON.Vector2[] {
        return this.shape.getPath(offset);
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