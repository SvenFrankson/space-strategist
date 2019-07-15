class Shuttle extends BABYLON.Mesh {

    private _doorMesh: BABYLON.Mesh;
    private _footBack: BABYLON.Mesh;
    private _footLeft: BABYLON.Mesh;
    private _footRight: BABYLON.Mesh;

    constructor(
        name: string,
        public landingPad: LandingPad
    ) {
        super(name);
        if (this.name === "") {
            let shuttleCount = this.getScene().meshes.filter((m) => { return m instanceof Shuttle; }).length;
            this.name = "shuttle-" + shuttleCount;
        }
        this.parent = this.landingPad;
        this.position.y = 1.5;
    }

    public async instantiate(
        baseColorHex: string = "#dadada",
        frameColorHex: string = "#383838",
        color1Hex: string = "#ce7633", // Replace red
        color2Hex: string = "#c94022", // Replace green
        color3Hex: string = "#1c1c1c" // Replace blue
    ): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("shuttle-body", baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);
        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;

        this._doorMesh = new BABYLON.Mesh("door-mesh");
        this._doorMesh.position.copyFromFloats(0, 0.5, 1.3);
        this._doorMesh.parent = this;
        let doorVertexData = await VertexDataLoader.instance.getColorized("shuttle-door", baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);
        doorVertexData.applyToMesh(this._doorMesh);
        this._doorMesh.material = Main.cellShadingMaterial;

        let footData = await VertexDataLoader.instance.getColorized("shuttle-foot", baseColorHex, frameColorHex, color1Hex, color2Hex, color3Hex);

        this._footBack = new BABYLON.Mesh("foot-back-mesh");
        this._footBack.position.copyFromFloats(0, 0, - 0.8);
        this._footBack.parent = this;
        footData.applyToMesh(this._footBack);
        this._footBack.material = Main.cellShadingMaterial;

        this._footRight = new BABYLON.Mesh("foot-right-mesh");
        this._footRight.position.copyFromFloats(0.7, 0, 0.4);
        this._footRight.rotation.y = - 2 * Math.PI / 3;
        this._footRight.parent = this;
        footData.applyToMesh(this._footRight);
        this._footRight.material = Main.cellShadingMaterial;

        this._footLeft = new BABYLON.Mesh("foot-left-mesh");
        this._footLeft.position.copyFromFloats(- 0.7, 0, 0.4);
        this._footLeft.rotation.y = 2 * Math.PI / 3;
        this._footLeft.parent = this;
        footData.applyToMesh(this._footLeft);
        this._footLeft.material = Main.cellShadingMaterial;
    }
}