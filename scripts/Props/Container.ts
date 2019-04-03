/// <reference path="./Prop.ts"/>

class Container extends Prop {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        this.obstacle = Obstacle.CreateRect(this.position2D.x, this.position2D.y, 2, 4, this.rotation2D);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("container", "#ce7633", "#383838", "#6d6d6d");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }
}