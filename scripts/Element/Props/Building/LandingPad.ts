class LandingPad extends Building {

    constructor(name: string, owner: Player, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, owner, position2D, rotation2D);
        if (this.name === "") {
            let landingPadCount = this.getScene().meshes.filter((m) => { return m instanceof LandingPad; }).length;
            this.name = "landing-pad-" + landingPadCount;
        }

        this.resourcesAvailableRequired.get(ResourceType.Steel).required = 20;
        this.resourcesAvailableRequired.get(ResourceType.Rock).required = 10;
        this.completionRequired = 10;

        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 1.5);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("landing-pad", "#404040", "", "#e0e0e0");

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
        return "LandingPad";
    }
}