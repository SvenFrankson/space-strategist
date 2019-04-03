class Tank extends Prop {

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name, position2D, rotation2D);
        this.obstacle = Obstacle.CreateHexagon(this.position2D.x, this.position2D.y, 1.5);
        this.obstacle.name = name + "-obstacle";
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("tank", "#ce7633", "#383838", "#6d6d6d");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }
}