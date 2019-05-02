class WallNode extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2;
    public obstacle: Obstacle;

    public dirs: {dir: number, length: number}[] = [];
    public walls: Wall[] = [];

    constructor(position2D: BABYLON.Vector2) {
        super("wallnode");
        this.position2D = position2D;
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
    }

    public async instantiate(): Promise<void> {
        if (!this.dirs || this.dirs.length !== this.walls.length) {
            this.updateDirs();
        }
        if (this.dirs.length >= 1) {
            let dirs = [];
            for (let i = 0; i < this.dirs.length; i++) {
                dirs.push(this.dirs[i].dir);
            }
            WallNode.BuildVertexData(1, ...dirs).applyToMesh(this);
            this.material = Main.cellShadingMaterial;
        }
    }

    public updateDirs(): void {
        this.dirs = [];
        for (let i = 0; i < this.walls.length; i++) {
            let other = this.walls[i].otherNode(this);
            if (other) {
                let d = other.position2D.subtract(this.position2D);
                let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
                this.dirs.push({dir: dir, length: d.length()});
            }
            else {
                console.warn("Oups...");
            }
        }
        this.dirs = this.dirs.sort((a, b) => { return a.dir - b.dir; });
    }

    public updateObstacle(): void {
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

    public static BuildVertexData(radius: number = 1, ...directions: number[]): BABYLON.VertexData {
        let data = new BABYLON.VertexData();

        let positions: number[] = [];
        let indices: number[] = [];

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

        console.log(directions);
        for (let i = 0; i < directions.length; i++) {
            
            let dir = directions[i];
            let cosDir = Math.cos(dir);
            let sinDir = Math.sin(dir);
            let n = new BABYLON.Vector2(- cosDir, - sinDir);

            let dirNext = directions[(i + 1) % directions.length];
            let cosDirNext = Math.cos(dirNext);
            let sinDirNext = Math.sin(dirNext);
            let nNext = new BABYLON.Vector2(- cosDirNext, - sinDirNext);

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

                let intersection: BABYLON.Vector2;
                if (Math.abs(Math.abs(dir - dirNext) - Math.PI) < Math.PI / 128) {
                    intersection = p.add(pNext).scaleInPlace(0.5);
                    console.log("smooth");
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
                indices.push(
                    i + j * bspc,
                    i + ((j + 1) % cCount) * bspc,
                    i + 1 + ((j + 1) % cCount) * bspc
                );
                indices.push(
                    i + 1 + ((j + 1) % cCount) * bspc,
                    i + 1 + j * bspc,
                    i + j * bspc,
                );
            }
        }

        for (let i = 0; i < directions.length; i++) {
            indices.push(
                bspc - 1 + ((3 * i + 1) % cCount) * bspc,
                bspc - 1 + ((3 * i + 2) % cCount) * bspc,
                bspc - 1 + ((3 * i + 3) % cCount) * bspc
            );
            indices.push(
                bspc - 1 + ((3 * i + 1) % cCount) * bspc,
                bspc - 1 + ((3 * i + 3) % cCount) * bspc,
                bspc - 1 + ((3 * i + 4) % cCount) * bspc
            );
        }

        if (directions.length === 3) {
            indices.push(
                bspc - 1 + 1 * bspc,
                bspc - 1 + 4 * bspc,
                bspc - 1 + 7 * bspc
            )
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

class Wall extends BABYLON.Mesh {

    constructor(
        public node1: WallNode,
        public node2: WallNode
    ) {
        super("wall");
        node1.walls.push(this);
        node2.walls.push(this);

        let d = this.node1.position2D.subtract(this.node2.position2D);
        let l = d.length() - 2;
        d.scaleInPlace(1 / l);
        let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
    }

    public otherNode(refNode: WallNode): WallNode {
        if (this.node1 === refNode) {
            return this.node2;
        }
        if (this.node2 === refNode) {
            return this.node1;
        }
        return undefined;
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("wall", "#6d6d6d", "#383838", "#ce7633");
        data = VertexDataLoader.clone(data);

        let d = this.node1.position2D.subtract(this.node2.position2D);
        let l = d.length() - 2;
        d.scaleInPlace(1 / l);
        let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
        let cosDir = Math.cos(dir);
        let sinDir = Math.sin(dir);

        for (let i = 0; i < data.positions.length / 3; i++) {
            let x = data.positions[3 * i] * l;
            let z = data.positions[3 * i + 2];

            data.positions[3 * i] = cosDir * x - sinDir * z;
            data.positions[3 * i + 2] = sinDir *x + cosDir * z; 
        }

        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;

        this.position.x = (this.node1.position2D.x + this.node2.position2D.x) * 0.5;
        this.position.z = (this.node1.position2D.y + this.node2.position2D.y) * 0.5;
    }
}

class WallSystem {

    public nodes: WallNode[] = [];
    public walls: Wall[] = [];

    public async instantiate(): Promise<void> {
        for (let i = 0; i < this.nodes.length; i++) {
            await this.nodes[i].instantiate();
        }
        for (let i = 0; i < this.walls.length; i++) {
            await this.walls[i].instantiate();
        }
    }

    public addToScene(): void {
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