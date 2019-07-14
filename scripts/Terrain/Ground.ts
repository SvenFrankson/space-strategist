enum GroundShape {
    None,
    Disc,
    Square
}
class Ground extends BABYLON.Mesh {

    public heightMap: number[][] = [];
    public posYMap: number[][] = [];
    public normalMap: BABYLON.Vector3[][] = [];
    public vertexSize = 1;
    public offset = 1;

    private _border: BABYLON.Mesh;

    constructor(
        public size: number,
        public imagePath: string = "/datas/heightmaps/flat-ground.png",
        public shape: GroundShape = GroundShape.None
    ) {
        super("ground");
        this.size = Math.round(this.size / 4) * 4;
        this.vertexSize = Math.round(this.size / 2) + 1;
        this.offset = - this.size / 2;
    }

    public setVisibility(v: number): void {
        if (v === 0) {
            this.isVisible = false;
            this._border.isVisible = false;
        }
        else {
            this.isVisible = true;
            this._border.isVisible = false;
            this.visibility = v;
            this._border.visibility = v;
        }
    }

    public heightFunction(i: number, j: number): number {
        return Math.cos(3207 * i + 10001 * j);
    }

    public getHeightAt(position: BABYLON.Vector2): number {
        let i0 = Math.floor(position.x / 2 - this.offset / 2);
        let j0 = Math.floor(position.y / 2 - this.offset / 2);

        let h00 = this.posYMap[i0][j0];
        let h10 = this.posYMap[i0 + 1][j0];
        let h01 = this.posYMap[i0][j0 + 1];
        let h11 = this.posYMap[i0 + 1][j0 + 1];

        let di = position.x / 2 - Math.floor(position.x / 2);
        let dj = position.y / 2 - Math.floor(position.y / 2);

        let h0 = h00 * (1 - di) + h10 * di;
        let h1 = h01 * (1 - di) + h11 * di;

        return h0 * (1 - dj) + h1 * dj;
    }

    public getNormalAtToRef(position: BABYLON.Vector2, normal: BABYLON.Vector3): void {
        let i0 = Math.floor(position.x / 2 - this.offset / 2);
        let j0 = Math.floor(position.y / 2 - this.offset / 2);

        let n00 = this.normalMap[i0][j0];
        let n10 = this.normalMap[i0 + 1][j0];
        let n01 = this.normalMap[i0][j0 + 1];
        let n11 = this.normalMap[i0 + 1][j0 + 1];

        let di = position.x / 2 - Math.floor(position.x / 2);
        let dj = position.y / 2 - Math.floor(position.y / 2);

        let n0x = n00.x * (1 - di) + n10.x * di;
        let n0y = n00.y * (1 - di) + n10.y * di;
        let n0z = n00.z * (1 - di) + n10.z * di;
        let n1x = n01.x * (1 - di) + n11.x * di;
        let n1y = n01.y * (1 - di) + n11.y * di;
        let n1z = n01.z * (1 - di) + n11.z * di;

        BABYLON.Tmp.Vector3[0].copyFromFloats(n0x, n0y, n0z).scaleInPlace(1 - dj);
        BABYLON.Tmp.Vector3[1].copyFromFloats(n1x, n1y, n1z).scaleInPlace(dj);
        normal.copyFrom(BABYLON.Tmp.Vector3[0]).addInPlace(BABYLON.Tmp.Vector3[1]).normalize();
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
                img.src = this.imagePath;
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
                    for (let j = 0; j < this.vertexSize; j++) {
                        for (let i = 0; i < this.vertexSize; i++) {
                            let x = i * 2 + this.offset;
                            let y = j * 2 + this.offset;
                            let h = this.heightMap[Math.floor(i / this.vertexSize * 256)][Math.floor(j / this.vertexSize * 256)];
                            positions.push(x, h, y);
                            uvs.push(i * 0.25, j * 0.25);
                            if (i + 1 < this.vertexSize && j + 1 < this.vertexSize) {
                                let index = i + j * this.vertexSize;
                                if (this.shape === GroundShape.None) {
                                    indices.push(index, index + 1, index + 1 + this.vertexSize);
                                    indices.push(index, index + 1 + this.vertexSize, index + this.vertexSize);
                                }
                                else if (this.shape === GroundShape.Disc) {
                                    let lSquared = (x + 1) * (x + 1) + (y + 1) * (y + 1);
                                    if (lSquared < halfSizeSquared) {
                                        indices.push(index, index + 1, index + 1 + this.vertexSize);
                                        indices.push(index, index + 1 + this.vertexSize, index + this.vertexSize);
                                    }
                                }
                            }
                        }
                    }
            
                    data.positions = positions;
                    data.indices = indices;
                    data.uvs = uvs;
                    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
                    for (let i = 0; i < this.vertexSize; i++) {
                        this.posYMap[i] = [];
                        this.normalMap[i] = [];
                        for (let j = 0; j < this.vertexSize; j++) {
                            this.posYMap[i][j] = positions[3 * (i + this.vertexSize * j) + 1];
                            this.normalMap[i][j] = new BABYLON.Vector3(
                                normals[3 * (i + this.vertexSize * j)],
                                normals[3 * (i + this.vertexSize * j) + 1],
                                normals[3 * (i + this.vertexSize * j) + 2]
                            );
                        }
                    }
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
            let iHole0 = Math.round(cristals[i].position2D.x / 5) - this.offset;
            let jHole0 = Math.round(cristals[i].position2D.y / 5) - this.offset;
            let iHole1 = iHole0 - 1;
            let jHole1 = jHole0 - 1;
            holes.push(
                new BABYLON.Vector2(iHole0, jHole0),
                new BABYLON.Vector2(iHole0, jHole1),
                new BABYLON.Vector2(iHole1, jHole0),
                new BABYLON.Vector2(iHole1, jHole1),
            );
        }

        for (let j = 0; j < this.vertexSize; j++) {
            for (let i = 0; i < this.vertexSize; i++) {
                let x = (this.offset + i) * 5;
                let y = (this.offset + j) * 5;
                positions.push(x, 0, y);
                colors.push(1, 1, 1, 1);
                uvs.push(i, j);
                normals.push(0, 1, 0);
                if (i + 1 < this.vertexSize && j + 1 < this.vertexSize) {
                    if (!holes.find(h => { return h.x === i && h.y === j; })) {
                        let index = i + j * this.vertexSize;
                        indices.push(index, index + 1, index + 1 + this.vertexSize);
                        indices.push(index, index + 1 + this.vertexSize, index + this.vertexSize);
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