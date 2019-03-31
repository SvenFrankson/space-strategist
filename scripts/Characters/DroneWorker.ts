class DroneWorker extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public rotation2D: number = 0;

    public currentPath: BABYLON.Vector2[];

    constructor() {
        super("droneWorker");
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public instantiate(): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./datas/worker.babylon",
            "",
            Main.Scene,
            (meshes) => {
                for (let i = 0; i < meshes.length; i++) {
                    meshes[i].parent = this;
                }
            }
        )
    }

    private _update = () => {
        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - this.rotation2D;

        this._moveOnPath();
    }

    private _moveOnPath = () => {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            let distanceToNext = Math2D.Distance(this.position2D, next);
            if (distanceToNext <= 0.05) {
                this.currentPath.splice(0, 1);
                return this._moveOnPath();
            }
            let stepToNext = next.subtract(this.position2D).normalize();
            let rotationToNext = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            stepToNext.scaleInPlace(Math.min(distanceToNext, 0.05));
            this.position2D.addInPlace(stepToNext);
            if (isFinite(rotationToNext)) {
                this.rotation2D = Math2D.StepFromToCirular(this.rotation2D, rotationToNext, Math.PI / 60);
            }
        }
    }
}