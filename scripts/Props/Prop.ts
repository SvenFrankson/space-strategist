abstract class Prop extends BABYLON.Mesh {

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
    }

    public addToScene(): void {
        NavGraphManager.AddObstacle(this.obstacle);
    }

    public abstract instantiate(): void;
}