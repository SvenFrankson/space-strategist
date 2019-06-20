/// <reference path="Prop.ts"/>

class Banner extends Prop {

    public static SizeToName: string[] = ["small", "medium", "large"];

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number, public size: number = 1) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let bannerCount = this.getScene().meshes.filter((m) => { return m instanceof Banner; }).length;
            this.name = "banner-" + bannerCount;
        }
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("banner-" + Banner.SizeToName[this.size], "#007fff", "#383838");

        this.groundWidth = 0.5;

        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }

    public elementName(): string {
        return "Banner";
    }
}