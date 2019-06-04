interface IHasPosRot {
    position2D: BABYLON.Vector2;
    rotation2D: number;
}

class ShapeDraw {

    public static CreateCircle(rMin: number, rMax: number, name: string = "circle"): BABYLON.Mesh {
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

abstract class Shape {

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
    protected _path: BABYLON.Vector2[];

    constructor(
        public posRotSource: IHasPosRot = undefined
    ) {

    }

    public abstract getPath(offset?: number): BABYLON.Vector2[];
}

class Rect extends Shape {

    constructor(
        public width: number = 1,
        public height: number = 1
    ) {
        super();
    }

    public getPath(offset: number = 0): BABYLON.Vector2[] {
        this._path = [
            new BABYLON.Vector2(- (this.width + offset) * 0.5, - (this.height + offset) * 0.5),
            new BABYLON.Vector2((this.width + offset) * 0.5, - (this.height + offset) * 0.5),
            new BABYLON.Vector2((this.width + offset) * 0.5, (this.height + offset) * 0.5),
            new BABYLON.Vector2(- (this.width + offset) * 0.5, (this.height + offset) * 0.5)
        ];
        for (let i = 0; i < this._path.length; i++) {
            Math2D.RotateInPlace(this._path[i], this.rotation2D);
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}

class Hexagon extends Shape {

    constructor(
        public radius: number = 1
    ) {
        super();
    }

    public getPath(offset: number = 0): BABYLON.Vector2[] {
        this._path = [];
        for (let i = 0; i < 6; i++) {
            this._path.push(new BABYLON.Vector2(
                Math.cos(i * Math.PI / 3) * (this.radius + offset),
                Math.sin(i * Math.PI / 3) * (this.radius + offset)
            ));
        }
        for (let i = 0; i < this._path.length; i++) {
            Math2D.RotateInPlace(this._path[i], this.rotation2D);
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}

class Polygon extends Shape {

    constructor(
        public points: BABYLON.Vector2[]
    ) {
        super();
    }

    public getPath(offset: number = 0): BABYLON.Vector2[] {
        this._path = Math2D.FattenShrinkPointShape(this.points, offset);
        for (let i = 0; i < this._path.length; i++) {
            this._path[i].addInPlace(this.position2D);
        }
        return this._path;
    }
}