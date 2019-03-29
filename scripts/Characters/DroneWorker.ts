class DroneWorker extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2;

    constructor() {
        super("droneWorker");
        this.position2D = BABYLON.Vector2.Zero();
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
    }
}