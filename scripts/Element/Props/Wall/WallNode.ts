class WallNodeData {

    constructor(
        public position2D: BABYLON.Vector2
    ) {}
}

class WallNode extends Building {

    public obstacle: Obstacle;

    public dirs: {dir: number, length: number}[] = [];
    public walls: Wall[] = [];

    public ui: WallNodeUI;

    constructor(
        position2D: BABYLON.Vector2,
        public wallSystem: WallSystem
    ) {
        super("wallnode", wallSystem.owner, position2D);
        this.wallSystem.nodes.push(this);

        this.resourcesAvailableRequired.get(ResourceType.Steel).required = 0;
        this.resourcesAvailableRequired.get(ResourceType.Rock).required = 0;
        this.completionRequired = 0;

        this.ui = new WallNodeUI(this);
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        while (this.walls.length > 0) {
            this.walls[0].dispose(doNotRecurse, disposeMaterialAndTextures);
        }
        let index = this.wallSystem.nodes.indexOf(this);
        if (index > -1) {
            this.wallSystem.nodes.splice(index, 1);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public async instantiate(): Promise<void> {
        this.updateDirs();
        if (this.dirs.length === 0) {
            let vertexData = await VertexDataLoader.instance.get("wallNode");
            vertexData.applyToMesh(this);
            this.rotation2D = 0;
        }
        else if (this.dirs.length === 1) {
            let vertexData = await VertexDataLoader.instance.getColorized("wallNode-1Wall", "#383838");
            vertexData.applyToMesh(this);
            this.rotation2D = this.dirs[0].dir;
        }
        else if (this.dirs.length > 1) {
            let dirs = [];
            for (let i = 0; i < this.dirs.length; i++) {
                dirs.push(this.dirs[i].dir);
            }
            let vertexData = WallNode.BuildVertexData(1, ...dirs);
            let min = Infinity;
            let max = - Infinity;
            this.height = - Infinity;
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
            this.rotation2D = 0;
        }
        this.material = Main.cellShadingMaterial;
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

        if (points.length > 0) {
            this.obstacle = Obstacle.CreatePolygon(this.position2D.x, this.position2D.y, points);
        }
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

    public onSelected(): void {
        this.ui.enable();
    }

    public onUnselected(): void {
        this.ui.disable();
    }

    public elementName(): string {
        return "WallNode";
    }
}