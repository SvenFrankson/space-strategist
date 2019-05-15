class DroneWorker extends BABYLON.Mesh {

    public position2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public rotation2D: number = 0;

    public currentPath: BABYLON.Vector2[];

    constructor() {
        super("droneWorker");
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("worker", "#ce7633", "#383838", "#6d6d6d", "#c94022", "#1c1c1c");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
    }

    private _update = () => {
        if (!this.currentPath || this.currentPath.length === 0) {
            this._findPath();
        }
        this._moveOnPath();

        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - this.rotation2D;
    }

    public findRandomDestination(radius: number = 10): BABYLON.Vector2 {
        let attempts: number = 0;
        while (attempts++ < 10) {
            let random = new BABYLON.Vector2(Math.random() * 2 * radius - radius, Math.random() * 2 * radius - radius);
            random.addInPlace(this.position2D);
            let graph = NavGraphManager.GetForRadius(1);
            for (let i = 0; i < graph.obstacles.length; i++) {
                let o = graph.obstacles[i];
                if (o.contains(random, 1)) {
                    random = undefined;
                    break;
                }
            }
            if (random) {
                return random;
            }
        }
        return undefined;
    }

    private _findPath(): void {
        let dest = this.findRandomDestination();
        if (dest) {
            BABYLON.MeshBuilder.CreateBox("box", {size: 0.5}).position.copyFromFloats(dest.x, 1, dest.y);
            let navGraph = NavGraphManager.GetForRadius(1);
            navGraph.update();
            navGraph.computePathFromTo(this.position2D, dest);
            this.currentPath = navGraph.path;
        }
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