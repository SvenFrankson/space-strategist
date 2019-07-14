/// <reference path="./Building.ts"/>

class Container extends Building {

    constructor(name: string, owner: Player, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, owner, position2D, rotation2D);
        if (this.name === "") {
            let containerCount = this.getScene().meshes.filter((m) => { return m instanceof Container; }).length;
            this.name = "container-" + containerCount;
        }

        this.resourcesAvailableRequired.get(ResourceType.Steel).required = 20;
        this.completionRequired = 10;

        this.ui = new ContainerUI(this);

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
        let vertexData = await VertexDataLoader.instance.getColorized("container", baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);

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

    public onSelected(): void {
        this.ui.enable();
    }

    public onUnselected(): void {
        this.ui.disable();
    }

    public elementName(): string {
        return "Container";
    }
}