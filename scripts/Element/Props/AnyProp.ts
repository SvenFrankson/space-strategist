/// <reference path="Prop.ts"/>

// For debug / miniature creation purpose only.
class AnyProp extends Prop {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number, public modelName: string) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let anyPropCount = this.getScene().meshes.filter((m) => { return m instanceof AnyProp; }).length;
            this.name = "anyProp-" + anyPropCount;
        }

        this.obstacle = Obstacle.CreateRectWithPosRotSource(this, 1, 1);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(
        baseColorHex: string = "#ce7633",
        frameColorHex: string = "#383838",
        color1Hex: string = "#6d6d6d", // Replace red
        color2Hex: string = "#c94022", // Replace green
        color3Hex: string = "#1c1c1c" // Replace blue
    ): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized(this.modelName, baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);

        this.height = 0.5;

        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }

    public elementName(): string {
        return "AnyProp";
    }
}