class Obstacle {

    public shape: BABYLON.Vector2[] = [];

    public static CreateSquare(x: number, y: number, size: number = 1): Obstacle {
        let square = new Obstacle();
        square.shape = [
            new BABYLON.Vector2(x - size * 0.5, y - size * 0.5),
            new BABYLON.Vector2(x + size * 0.5, y - size * 0.5),
            new BABYLON.Vector2(x + size * 0.5, y + size * 0.5),
            new BABYLON.Vector2(x - size * 0.5, y + size * 0.5)
        ];
        return square;
    }

    public static CreateHexagon(x: number, y: number, size: number = 1): Obstacle {
        let square = new Obstacle();
        for (let i = 0; i < 6; i++) {
            square.shape.push(new BABYLON.Vector2(
                x + Math.cos(i * Math.PI / 3) * size * 0.5,
                y + Math.sin(i * Math.PI / 3) * size * 0.5
            ));
        }
        return square;
    }

    public display(scene: BABYLON.Scene): BABYLON.LinesMesh {
        let points: BABYLON.Vector3[] = [];
        for (let i = 0; i < this.shape.length; i++) {
            let p = this.shape[i];
            points.push(new BABYLON.Vector3(p.x, 0, p.y));
        }
        points.push(points[0]);
        return BABYLON.MeshBuilder.CreateLines("shape", { points: points }, scene);
    }
}