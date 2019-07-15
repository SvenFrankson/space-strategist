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

    public async instantiate(
        baseColorHex: string = "#dadada",
        frameColorHex: string = "#383838",
        color1Hex: string = "#ce7633", // Replace red
        color2Hex: string = "#c94022", // Replace green
        color3Hex: string = "#1c1c1c" // Replace blue
    ): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("landing-pad", baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);

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

        let shuttle = new Shuttle("test-shuttle", this);
        await shuttle.instantiate();
    }

    public elementName(): string {
        return "LandingPad";
    }
}