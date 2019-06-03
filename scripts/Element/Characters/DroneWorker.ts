abstract class Task {

    constructor(
        public worker: DroneWorker
    ) {

    }

    public abstract update(): void;
}

class GoToTask extends Task {
    
    public hasPathToTarget: boolean = false;

    constructor(
        worker: DroneWorker,
        public target: BABYLON.Vector2
    ) {
        super(worker);
    }

    public update(): void {
        if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target) < 0.01) {
            this.worker.currentTask = undefined;
            return;
        }
        if (!this.hasPathToTarget) {
            let navGraph = NavGraphManager.GetForRadius(1);
            navGraph.update();
            navGraph.computePathFromTo(this.worker.position2D, this.target);
            this.worker.currentPath = navGraph.path;
            this.hasPathToTarget = this.worker.currentPath !== undefined;
        }
        if (this.hasPathToTarget) {
            this.worker.moveOnPath();
        }
    }
}

class HarvestTask extends Task {

    public hasPathToTarget: boolean = false;
    public depot: Prop;
    public hasPathToDepot: boolean = false;

    constructor(
        worker: DroneWorker,
        public target: Prop
    ) {
        super(worker);
    }

    public update(): void {
        if (this.worker.inventory < 10) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                this.worker.inventory += 1;
                this.hasPathToTarget = false;
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
            }
        }
        else {
            if (!this.depot) {
                this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; }) as Container;
            }
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth) {
                this.worker.inventory = 0;
                this.hasPathToDepot = false;
                return;
            }
            if (!this.hasPathToDepot) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToDepot = this.worker.currentPath !== undefined;
            }
            if (this.hasPathToDepot) {
                this.worker.moveOnPath();
            }
        }
    }
}

class DroneWorker extends Character {

    public currentTask: Task;

    public inventory: number = 0;
    public currentPath: BABYLON.Vector2[];

    public ui: DroneWorkerUI;

    constructor() {
        super("droneWorker");
        this.ui = new DroneWorkerUI(this);
        this.getScene().onBeforeRenderObservable.add(this._update);
    }

    public async instantiate(): Promise<void> {
        let data = await VertexDataLoader.instance.getColorized("worker", "#ce7633", "#383838", "#6d6d6d", "#c94022", "#1c1c1c");
        data.applyToMesh(this);
        this.material = Main.cellShadingMaterial;
        this.groundWidth = 1;
        this.height = 1;
    }

    public kill(): void {
        super.kill();
        this.dispose();
    }

    public onSelected(): void {
        this.ui.enable();
    }

    public onUnselected(): void {
        this.ui.disable();
    }

    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): void {
        this.ui.onLeftClick(pickedPoint, pickedTarget);
    };

    private _update = () => {
        if (this.currentTask) {
            this.currentTask.update();
        }

        this.position.x = this.position2D.x;
        this.position.z = this.position2D.y;
        this.rotation.y = - this.rotation2D;
    }

    public moveOnPath(): void {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            let distanceToNext = Math2D.Distance(this.position2D, next);
            if (distanceToNext <= 0.05) {
                this.currentPath.splice(0, 1);
                return this.moveOnPath();
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