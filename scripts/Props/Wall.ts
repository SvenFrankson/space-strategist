class WallNode extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2;

    public walls: Wall[] = [];

    constructor(position2D: BABYLON.Vector2) {
        super("wallnode");
        this.position2D = position2D;
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
    }

    public async instantiate(): Promise<void> {
        let dirs: number[] = [];
        console.log("!");
        for (let i = 0; i < this.walls.length; i++) {
            let other = this.walls[i].otherNode(this);
            if (other) {
                let d = other.position2D.subtract(this.position2D).normalize();
                console.log(d);
                let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
                dirs.push(dir);
            }
            else {
                console.warn("Oups...");
            }
        }
        dirs = dirs.sort((a, b) => { return a - b; });
        console.log(dirs);
        if (dirs.length >= 1) {
            WallNode.BuildVertexData(1, ...dirs).applyToMesh(this);
        }
    }

    public static BuildVertexData(radius: number = 2, ...directions: number[]): BABYLON.VertexData {
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
            directions.push(directions[0] + Math.PI);
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

                let intersection = Math2D.RayRayIntersection(p, n, pNext, nNext);
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

        let color = BABYLON.Color3.FromHexString("#6d6d6d");
        let colors = [];
        for (let i = 0; i < positions.length / 3; i++) {
            colors.push(color.r, color.g, color.b, 1);
        }
        data.colors = colors;

        return data;
    }
}

class Wall {

    constructor(
        public node1: WallNode,
        public node2: WallNode
    ) {
        node1.walls.push(this);
        node2.walls.push(this);
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
}

class WallSystem {

    public nodes: WallNode[] = [];
    public walls: Wall[] = [];

    public async instantiate(): Promise<void> {
        for (let i = 0; i < this.nodes.length; i++) {
            await this.nodes[i].instantiate();
        }
    }
}