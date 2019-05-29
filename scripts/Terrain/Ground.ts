class Ground extends BABYLON.Mesh {


    public stepCountW = 1;
    public stepZeroW = 1;
    public stepCountH = 1;
    public stepZeroH = 1;

    constructor(
        public width: number,
        public height: number
    ) {
        super("ground");
        this.stepCountW = Math.ceil(this.width / 5) + 1;
        this.stepZeroW = Math.ceil(- this.stepCountW / 2);
        this.stepCountH = Math.ceil(this.height / 5) + 1;
        this.stepZeroH = Math.ceil(- this.stepCountH / 2);
    }

    public instantiate(): void {
        let cristals = this.getScene().meshes.filter((m) => { return m instanceof Cristal; }) as Cristal[];

        let data = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let colors: number[] = [];
        let uvs: number[] = [];
        let normals: number[] = [];

        let holes: BABYLON.Vector2[] = [];
        for (let i = 0; i < cristals.length; i++) {
            let iHole0 = Math.round(cristals[i].position2D.x / 5) - this.stepZeroW;
            let jHole0 = Math.round(cristals[i].position2D.y / 5) - this.stepZeroH;
            let iHole1 = iHole0 - 1;
            let jHole1 = jHole0 - 1;
            holes.push(
                new BABYLON.Vector2(iHole0, jHole0),
                new BABYLON.Vector2(iHole0, jHole1),
                new BABYLON.Vector2(iHole1, jHole0),
                new BABYLON.Vector2(iHole1, jHole1),
            );
        }

        for (let j = 0; j < this.stepCountH; j++) {
            for (let i = 0; i < this.stepCountW; i++) {
                let x = (this.stepZeroW + i) * 5;
                let y = (this.stepZeroH + j) * 5;
                positions.push(x, 0, y);
                let c = (Math.cos(i * 43 + j * 3201) + 1) * 0.25 + 0.5;
                colors.push(c, c, c, 1);
                uvs.push(i, j);
                normals.push(0, 1, 0);
                if (i + 1 < this.stepCountW && j + 1 < this.stepCountH) {
                    if (!holes.find(h => { return h.x === i && h.y === j; })) {
                        let index = i + j * this.stepCountW;
                        indices.push(index, index + 1, index + 1 + this.stepCountW);
                        indices.push(index, index + 1 + this.stepCountW, index + this.stepCountW);
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