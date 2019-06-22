/// <reference path="Prop.ts"/>

class Banner extends Prop {

    private _flagMesh: BABYLON.Mesh;

    public static SizeToName: string[] = ["small", "medium", "large"];

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number, public size: number = 1) {
        super(name, position2D, rotation2D);
        if (this.name === "") {
            let bannerCount = this.getScene().meshes.filter((m) => { return m instanceof Banner; }).length;
            this.name = "banner-" + bannerCount;
        }
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorizedMultiple("banner-" + Banner.SizeToName[this.size], "#ce7633", "#383838");

        this.height = 4;
        this.groundWidth = 0.5;

        vertexData[0].applyToMesh(this);
        this.material = Main.cellShadingMaterial;

        if (!this._flagMesh) {
            this._flagMesh = new BABYLON.Mesh("flag-mesh");
            this._flagMesh.parent = this;
        }
        vertexData[1].applyToMesh(this._flagMesh);
        this._flagMesh.material = Main.cellShadingMaterial;
    }

    public serialize(): PropData {
        let data = super.serialize();

        data.size = this.size;

        return data;
    }

    public elementName(): string {
        return "Banner";
    }
}