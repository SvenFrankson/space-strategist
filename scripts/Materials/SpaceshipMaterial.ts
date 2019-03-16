class SpaceshipMaterial {

    public static instance: SpaceshipMaterial;

    public transparentGlass: BABYLON.StandardMaterial;

    constructor(
        public scene: BABYLON.Scene
    ) {
        SpaceshipMaterial.instance = this;
        this.transparentGlass = new BABYLON.StandardMaterial("glassMaterial", this.scene);
        this.transparentGlass.diffuseColor.copyFromFloats(0, 0.2, 0.8);
        this.transparentGlass.alpha = 0.1;
    }
}