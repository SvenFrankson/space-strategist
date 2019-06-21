class Rock extends ResourceSpot {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let rockCount = this.getScene().meshes.filter((m) => { return m instanceof Rock; }).length;
            this.name = "rock-" + rockCount;
        }
        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 2);
        this.obstacle.name = name + "-obstacle";
        this.resourceType = ResourceType.Rock;
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("cristal-2", "#b0b0b0", "#b0b0b0", "#dadada");

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
        this.groundWidth = 6;

        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }

    public elementName(): string {
        return "Rock";
    }
}