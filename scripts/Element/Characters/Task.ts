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

    private _isDropping: boolean = false;

    constructor(
        worker: DroneWorker,
        public target: Building
    ) {
        super(worker);
    }

    public update(): void {
        let neededResources = this.target.resourcesRequired - this.target.resourcesAvailable;
        if (neededResources > 0) {
            if (!this._isDropping && this.worker.inventory < Math.min(this.worker.carriageCapacity, neededResources)) {
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
                    this.target.resourcesAvailable += 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                    this.worker.inventory -= 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                    this._isDropping = this.worker.inventory > 0;
                    this.hasPathToTarget = false;
                    this.worker.currentAction = "Droping at building";
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
        
        if (this.target.currentCompletion < this.target.completionRequired) {
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

