/// <reference path="./Prop.ts"/>

class Container extends Prop {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let containerCount = this.getScene().meshes.filter((m) => { return m instanceof Container; }).length;
            this.name = "container-" + containerCount;
        }
        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 2, 4);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("container", "#ce7633", "#383838", "#6d6d6d");

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
        return "Container";
    }
}