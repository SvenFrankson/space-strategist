class Tank extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2;
    public rotation2D: number;

    public obstacle: Obstacle;

    constructor(name: string, position2D: BABYLON.Vector2, rotation2D: number) {
        super(name);
        this.position2D = position2D;
        this.rotation2D = rotation2D;
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - rotation2D;
        this.obstacle = Obstacle.CreateHexagon(this.position2D.x, this.position2D.y, 1.5);
        this.obstacle.name = name + "-obstacle";
        NavGraphManager.AddObstacle(this.obstacle);
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("tank", "#ce7633", "#383838", "#6d6d6d");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }
}