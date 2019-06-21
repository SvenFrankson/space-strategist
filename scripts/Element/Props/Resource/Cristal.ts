/// <reference path="ResourceSpot.ts"/>

class Cristal extends ResourceSpot {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let CristalCount = this.getScene().meshes.filter((m) => { return m instanceof Cristal; }).length;
            this.name = "cristal-" + CristalCount;
        }
        this.obstacle = Obstacle.CreateHexagonWithPosRotSource(this, 3);
        this.obstacle.name = name + "-obstacle";
        this.resourceType = ResourceType.Cristal;
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("cristal-2", "#b0b0b0", "#d0d0d0", "#9ef442");

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
        return "Cristal";
    }
}