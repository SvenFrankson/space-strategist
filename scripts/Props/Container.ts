class Container extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2;
    public rotation2D: number;

    public obstacle: Obstacle;

    constructor(position2D: BABYLON.Vector2, rotation2D: number) {
        super("container");
        this.position2D = position2D;
        this.rotation2D = rotation2D;
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - rotation2D;
        this.obstacle = Obstacle.CreateRect(this.position2D.x, this.position2D.y, 2, 4, this.rotation2D);
        NavGraphManager.AddObstacle(this.obstacle);
    }

    public instantiate(): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./datas/container.babylon",
            "",
            Main.Scene,
            (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    meshes[i].parent = this;
                }
            }
        )
    }
}