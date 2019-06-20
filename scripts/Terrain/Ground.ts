enum GroundShape {
    None,
    Disc,
    Square
}
class Ground extends BABYLON.Mesh {

    public heightMap: number[][] = [];
    public stepCount = 1;
    public stepZero = 1;

    private _border: BABYLON.Mesh;

    constructor(
        public size: number,
        public shape: GroundShape = GroundShape.None
    ) {
        super("ground");
        this.stepCount = Math.ceil(this.size / 2) + 1;
        this.stepZero = Math.ceil(- this.stepCount / 2);
    }

    public heightFunction(i: number, j: number): number {
        return Math.cos(3207 * i + 10001 * j);
    }

    public getHeightAt(position: BABYLON.Vector2): number {
        let i0 = Math.floor((position.x + this.size / 2) / this.size * 256);
        let j0 = Math.floor((position.y + this.size / 2) / this.size * 256);

        let h00 = this.heightMap[i0][j0];
        let h10 = this.heightMap[i0 + 1][j0];
        let h01 = this.heightMap[i0][j0 + 1];
        let h11 = this.heightMap[i0 + 1][j0 + 1];

        let di = (position.x + this.size / 2) / this.size * 256 - i0;
        let dj = (position.y + this.size / 2) / this.size * 256 - j0;

        let h0 = h00 * (1 - di) + h10 * di;
        let h1 = h01 * (1 - di) + h11 * di;

        return h0 * (1 - dj) + h1 * dj;
    }

    public async instantiate(): Promise<void> {
        return new Promise<void>(
            (resolve) => {
                let data = new BABYLON.VertexData();
                let positions: number[] = [];
                let colors: number[] = [];
                let indices: number[] = [];
                let uvs: number[] = [];
                let normals: number[] = [];
                
                let img = document.createElement("img");
                img.src = "datas/heightmaps/ground.png";
                img.onload = async () => {
                    let c: HTMLCanvasElement = document.createElement("canvas");
                    c.width = 256;
                    c.height = 256;
                    let ctx: CanvasRenderingContext2D = c.getContext("2d");
                    ctx.drawImage(img, 0, 0, 256, 256);
                    let pixels: Uint8ClampedArray = ctx.getImageData(0, 0, 256, 256).data;
                    this.heightMap = [];
                    for (let i = 0; i < 256; i++) {
                        this.heightMap[i] = [];
                        for (let j = 0; j < 256; j++) {
                            this.heightMap[i][j] = (pixels[(i + 256 * (255 - j)) * 4] / 256) * 8 - 4;
                            if (this.shape === GroundShape.Disc) {
                                let l = Math.sqrt((i - 128) * (i - 128) + (j - 128) * (j - 128));
                                if (l > 128) {
                                    this.heightMap[i][j] = 0;
                                }
                                else if (l > 64) {
                                    let f = (l - 64) / 64;
                                    f = 1 - f * f;
                                    this.heightMap[i][j] *= f;
                                }
                            }
                        }
                    }
        
                    let halfSizeSquared = this.size * 0.5 * this.size * 0.5;
                    for (let j = 0; j < this.stepCount; j++) {
                        for (let i = 0; i < this.stepCount; i++) {
                            let x = (this.stepZero + i) * 2;
                            let y = (this.stepZero + j) * 2;
                            let h = this.heightMap[Math.floor(i / this.stepCount * 256)][Math.floor(j / this.stepCount * 256)];
                            positions.push(x, h, y);
                            uvs.push(i * 0.25, j * 0.25);
                            if (i + 1 < this.stepCount && j + 1 < this.stepCount) {
                                let index = i + j * this.stepCount;
                                if (this.shape === GroundShape.None) {
                                    indices.push(index, index + 1, index + 1 + this.stepCount);
                                    indices.push(index, index + 1 + this.stepCount, index + this.stepCount);
                                }
                                else if (this.shape === GroundShape.Disc) {
                                    let lSquared = (x + 1) * (x + 1) + (y + 1) * (y + 1);
                                    if (lSquared < halfSizeSquared) {
                                        indices.push(index, index + 1, index + 1 + this.stepCount);
                                        indices.push(index, index + 1 + this.stepCount, index + this.stepCount);
                                    }
                                }
                            }
                        }
                    }
            
                    data.positions = positions;
                    data.indices = indices;
                    data.uvs = uvs;
                    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
                    for (let i = 0; i < normals.length / 3; i++) {
                        let ny = normals[3 * i + 1];
                        let c = 0.8;
                        if (ny < 0.95) {
                            c = 0.2;
                        }
                        else if (ny < 0.97) {
                            c = 0.3;
                        }
                        else if (ny < 0.99) {
                            c = 0.4;
                        }
                        else if (ny < 0.995) {
                            c = 0.5;
                        }
                        colors.push(c, c, c, 1);
                    }
                    data.colors = colors;
                    data.normals = normals;
            
                    data.applyToMesh(this);

                    if (!this._border) {
                        this._border = new BABYLON.Mesh("ground-border");
                        if (this.shape === GroundShape.Disc) {
                            let n = BABYLON.Vector2.Zero();
                            let borderVertexData = await VertexDataLoader.instance.getColorized("ground-disc-border", "", "#383838");
                            for (let i = 0; i < borderVertexData.positions.length / 3; i++) {
                                let x = borderVertexData.positions[3 * i];
                                let z = borderVertexData.positions[3 * i + 2];
                                n.copyFromFloats(x, z);
                                n.normalize();
                                borderVertexData.positions[3 * i] += n.x * (this.size * 0.5 - 2.5);
                                borderVertexData.positions[3 * i + 2] += n.y * (this.size * 0.5 - 2.5);
                            }
                            borderVertexData.applyToMesh(this._border);
                            this._border.material = Main.cellShadingMaterial;
                        }
                    }
                    resolve();
                }
            }
        );
    }

    public instantiateOld(): void {
        let cristals = this.getScene().meshes.filter((m) => { return m instanceof Cristal; }) as Cristal[];

        let data = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let colors: number[] = [];
        let uvs: number[] = [];
        let normals: number[] = [];

        let holes: BABYLON.Vector2[] = [];
        for (let i = 0; i < cristals.length; i++) {
            let iHole0 = Math.round(cristals[i].position2D.x / 5) - this.stepZero;
            let jHole0 = Math.round(cristals[i].position2D.y / 5) - this.stepZero;
            let iHole1 = iHole0 - 1;
            let jHole1 = jHole0 - 1;
            holes.push(
                new BABYLON.Vector2(iHole0, jHole0),
                new BABYLON.Vector2(iHole0, jHole1),
                new BABYLON.Vector2(iHole1, jHole0),
                new BABYLON.Vector2(iHole1, jHole1),
            );
        }

        for (let j = 0; j < this.stepCount; j++) {
            for (let i = 0; i < this.stepCount; i++) {
                let x = (this.stepZero + i) * 5;
                let y = (this.stepZero + j) * 5;
                positions.push(x, 0, y);
                colors.push(1, 1, 1, 1);
                uvs.push(i, j);
                normals.push(0, 1, 0);
                if (i + 1 < this.stepCount && j + 1 < this.stepCount) {
                    if (!holes.find(h => { return h.x === i && h.y === j; })) {
                        let index = i + j * this.stepCount;
                        indices.push(index, index + 1, index + 1 + this.stepCount);
                        indices.push(index, index + 1 + this.stepCount, index + this.stepCount);
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