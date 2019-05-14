class Ground extends BABYLON.Mesh {

    constructor(
        public width: number,
        public height: number
    ) {
        super("ground");
    }

    public instantiate(): void {
        let data = new BABYLON.VertexData();
        let positions: number[] = [];
        let indices: number[] = [];
        let colors: number[] = [];
        let uvs: number[] = [];
        let normals: number[] = [];

        let stepCountW = Math.ceil(this.width / 5) + 1;
        let stepZeroW = Math.ceil(- stepCountW / 2);
        let stepCountH = Math.ceil(this.height / 5) + 1;
        let stepZeroH = Math.ceil(- stepCountH / 2);

        for (let j = 0; j < stepCountH; j++) {
            for (let i = 0; i < stepCountW; i++) {
                let x = (stepZeroW + i) * 5;
                let y = (stepZeroH + j) * 5;
                positions.push(x, 0, y);
                let c = Math.random() * 0.5 + 0.5;
                colors.push(c, c, c, 1);
                uvs.push(i, j);
                normals.push(0, 1, 0);
                if (i + 1 < stepCountW && j + 1 < stepCountH) {
                    let index = i + j * stepCountW;
                    indices.push(index, index + 1, index + 1 + stepCountW);
                    indices.push(index, index + 1 + stepCountW, index + stepCountW);
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