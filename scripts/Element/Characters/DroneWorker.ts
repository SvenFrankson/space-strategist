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
            this.worker.currentAction = "Going to " + this.target.x.toFixed(1) + " " + this.target.y.toFixed(1);
        }
        if (this.hasPathToTarget) {
            this.worker.moveOnPath();
            this.worker.currentAction = "Going to " + this.target.x.toFixed(1) + " " + this.target.y.toFixed(1);
        }
    }
}

class HarvestTask extends Task {

    public hasPathToTarget: boolean = false;
    public depot: Prop;
    public hasPathToDepot: boolean = false;

    private _isDropping: boolean = false;

    constructor(
        worker: DroneWorker,
        public target: Prop
    ) {
        super(worker);
    }

    public update(): void {
        if (!this._isDropping && this.worker.inventory < this.worker.carriageCapacity) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                this.worker.inventory += this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                this.hasPathToTarget = false;
                this.worker.currentAction = "Harvesting resource";
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to resource";
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to resource";
            }
        }
        else {
            if (!this.depot) {
                this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; }) as Container;
            }
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth) {
                this.worker.inventory -= 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                this._isDropping = this.worker.inventory > 0;
                this.hasPathToDepot = false;
                this.worker.currentAction = "Droping in depot";
                return;
            }
            if (!this.hasPathToDepot) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToDepot = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to depot";
            }
            if (this.hasPathToDepot) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to depot";
            }
        }
    }
}

class BuildTask extends Task {

    public hasPathToTarget: boolean = false;
    public depot: Prop;
    public hasPathToDepot: boolean = false;

    constructor(
        worker: DroneWorker,
        public target: Building
    ) {
        super(worker);
    }

    public update(): void {
        let neededResources = this.target.resourcesRequired - this.target.resourcesAvailable;
        if (neededResources > 0) {
            if (this.worker.inventory < Math.max(this.worker.carriageCapacity, neededResources)) {
                if (!this.depot) {
                    this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; }) as Container;
                }
                if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth) {
                    this.worker.inventory += 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                    this.hasPathToDepot = false;
                    this.worker.currentAction = "Fetching from depot";
                    return;
                }
                if (!this.hasPathToDepot) {
                    let navGraph = NavGraphManager.GetForRadius(1);
                    navGraph.update();
                    navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                    this.worker.currentPath = navGraph.path;
                    this.hasPathToDepot = this.worker.currentPath !== undefined;
                    this.worker.currentAction = "Going to depot";
                }
                if (this.hasPathToDepot) {
                    this.worker.moveOnPath();
                    this.worker.currentAction = "Going to depot";
                }
            }
            else {
                if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                    this.target.resourcesAvailable += this.worker.inventory;
                    this.worker.inventory = 0;
                    this.hasPathToTarget = false;
                    this.worker.currentAction = "Gathering resource";
                    return;
                }
                if (!this.hasPathToTarget) {
                    let navGraph = NavGraphManager.GetForRadius(1);
                    navGraph.update();
                    navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                    this.worker.currentPath = navGraph.path;
                    this.hasPathToTarget = this.worker.currentPath !== undefined;
                    this.worker.currentAction = "Going to building";
                }
                if (this.hasPathToTarget) {
                    this.worker.moveOnPath();
                    this.worker.currentAction = "Going to building";
                }
            }
            return;
        }
        
        if (this.target.completion < 10) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth) {
                this.target.build(this.worker.buildRate * Main.Engine.getDeltaTime() / 1000);
                this.hasPathToTarget = false;
                this.worker.currentAction = "Building";
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to building";
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to building";
            }
            return;
        }
        
        this.worker.currentTask = undefined;
    }
}

class DroneWorker extends Character {

    public harvestRate: number = 2;
    public buildRate: number = 1;
    public carriageCapacity: number = 10;
    private _inventory: number = 0;
    public get inventory(): number {
        return this._inventory;
    }
    public set inventory(n: number) {
        this._inventory = n;
        this._inventory = Math.min(Math.max(this._inventory, 0), this.carriageCapacity);
        this.ui.update();
    }

    public currentTask: Task;
    public currentPath: BABYLON.Vector2[];

    public ui: DroneWorkerUI;
    private _currentAction: string = "Doing nothing";
    public get currentAction(): string {
        return this._currentAction;
    }
    public set currentAction(s: string) {
        this._currentAction = s;
        this.ui.update();
    }

    constructor() {
        super("droneWorker");
        this.moveSpeed = 3;
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
        else {
            this.currentAction = "Doing nothing";
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
            stepToNext.scaleInPlace(Math.min(distanceToNext, this.moveSpeed * Main.Engine.getDeltaTime() / 1000));
            this.position2D.addInPlace(stepToNext);
            if (isFinite(rotationToNext)) {
                this.rotation2D = Math2D.StepFromToCirular(this.rotation2D, rotationToNext, Math.PI / 60);
            }
        }
    }
}