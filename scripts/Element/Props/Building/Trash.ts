class Trash extends Building {

    constructor(name: string, owner: Player, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, owner, position2D, rotation2D);
        if (this.name === "") {
            let trashCount = this.getScene().meshes.filter((m) => { return m instanceof Trash; }).length;
            this.name = "trash-" + trashCount;
        }

        this.resourcesAvailableRequired.get(ResourceType.Steel).required = 20;
        this.resourcesAvailableRequired.get(ResourceType.Rock).required = 10;
        this.completionRequired = 10;

        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 2, 4);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(
        baseColorHex: string = "#ce7633",
        frameColorHex: string = "#383838",
        color1Hex: string = "#6d6d6d", // Replace red
        color2Hex: string = "#c94022", // Replace green
        color3Hex: string = "#1c1c1c" // Replace blue
    ): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("Trash", baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);

        this.height = 4;
        this.groundWidth = 4;

        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }

    public elementName(): string {
        return "Trash";
    }
}