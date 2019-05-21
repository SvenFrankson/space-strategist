class Tank extends Prop {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let tankCount = this.getScene().meshes.filter((m) => { return m instanceof Tank; }).length;
            this.name = "tank-" + tankCount;
        }
        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 1.5);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("tank", "#ce7633", "#383838", "#6d6d6d");

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
        this.material = Main.cellShadingMaterial;
    }

    public elementName(): string {
        return "Tank";
    }
}