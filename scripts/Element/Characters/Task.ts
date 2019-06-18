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
            this.worker.animator.setIdle();
        }
        if (this.hasPathToTarget) {
            this.worker.moveOnPath();
            this.worker.currentAction = "Going to " + this.target.x.toFixed(1) + " " + this.target.y.toFixed(1);
            this.worker.animator.setIdle();
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
        public target: ResourceSpot
    ) {
        super(worker);
    }

    public update(): void {
        if (!this._isDropping && this.worker.inventory < this.worker.carriageCapacity) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth * this.target.groundWidth) {
                this.worker.carriedResource = this.target.resourceType;
                this.worker.inventory += this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                this.hasPathToTarget = false;
                this.worker.currentAction = "Harvesting resource";
                this.worker.animator.setGrab();
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to resource";
                this.worker.animator.setIdle();
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to resource";
                this.worker.animator.setIdle();
            }
        }
        else {
            if (!this.depot) {
                this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; }) as Container;
            }
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth * this.depot.groundWidth) {
                let r = 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                this.worker.inventory -= r;
                this.worker.owner.addCurrentResource(r, this.worker.carriedResource);
                this._isDropping = this.worker.inventory > 0;
                this.hasPathToDepot = false;
                this.worker.currentAction = "Droping in depot";
                this.worker.animator.setDrop();
                return;
            }
            if (!this.hasPathToDepot) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                this.worker.currentPath = navGraph.path;
                this.hasPathToDepot = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to depot";
                this.worker.animator.setIdle();
            }
            if (this.hasPathToDepot) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to depot";
                this.worker.animator.setIdle();
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
        let neededResources = 0;
        let neededResourcesType: ResourceType;
        for (let resourceType = 0; resourceType < 3; resourceType++) {
            let rAQ = this.target.resourcesAvailableRequired.get(resourceType);
            neededResources = rAQ.required - rAQ.available;
            if (neededResources > 0) {
                neededResourcesType = resourceType;
                break;
            }
        }
        if (neededResources > 0) {
            if (!this._isDropping && this.worker.inventory < Math.min(this.worker.carriageCapacity, neededResources)) {
                if (!this.depot) {
                    this.depot = this.worker.getScene().meshes.find((m) => { return m instanceof Container; }) as Container;
                }
                if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.depot.position2D) < this.depot.groundWidth * this.depot.groundWidth) {
                    let r = 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                    this.worker.carriedResource = neededResourcesType;
                    this.worker.inventory += r;
                    this.worker.owner.subtractCurrentResource(r, this.worker.carriedResource);
                    this.hasPathToDepot = false;
                    this.worker.currentAction = "Fetching from depot";
                    this.worker.animator.setGrab();
                    return;
                }
                if (!this.hasPathToDepot) {
                    let navGraph = NavGraphManager.GetForRadius(1);
                    navGraph.update();
                    navGraph.computePathFromTo(this.worker.position2D, this.depot.obstacle);
                    this.worker.currentPath = navGraph.path;
                    this.hasPathToDepot = this.worker.currentPath !== undefined;
                    this.worker.currentAction = "Going to depot";
                    this.worker.animator.setIdle();
                }
                if (this.hasPathToDepot) {
                    this.worker.moveOnPath();
                    this.worker.currentAction = "Going to depot";
                    this.worker.animator.setIdle();
                }
            }
            else {
                if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth * this.target.groundWidth) {
                    let r = 2 * this.worker.harvestRate * Main.Engine.getDeltaTime() / 1000;
                    this.target.resourcesAvailableRequired.get(this.worker.carriedResource).available += r;
                    this.worker.inventory -= r;
                    this._isDropping = this.worker.inventory > 0;
                    this.hasPathToTarget = false;
                    this.worker.currentAction = "Droping at building";
                    this.worker.animator.setDrop();
                    return;
                }
                if (!this.hasPathToTarget) {
                    let navGraph = NavGraphManager.GetForRadius(1);
                    navGraph.update();
                    if (this.target.obstacle) {
                        navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                    }
                    else {
                        navGraph.computePathFromTo(this.worker.position2D, this.target.position2D);
                    }
                    this.worker.currentPath = navGraph.path;
                    this.hasPathToTarget = this.worker.currentPath !== undefined;
                    this.worker.currentAction = "Going to building";
                    this.worker.animator.setIdle();
                }
                if (this.hasPathToTarget) {
                    this.worker.moveOnPath();
                    this.worker.currentAction = "Going to building";
                    this.worker.animator.setIdle();
                }
            }
            return;
        }
        
        if (this.target.currentCompletion < this.target.completionRequired) {
            if (BABYLON.Vector2.DistanceSquared(this.worker.position2D, this.target.position2D) < this.target.groundWidth * this.target.groundWidth) {
                this.target.build(this.worker.buildRate * Main.Engine.getDeltaTime() / 1000);
                this.hasPathToTarget = false;
                this.worker.currentAction = "Building";
                this.worker.animator.setBuild();
                return;
            }
            if (!this.hasPathToTarget) {
                let navGraph = NavGraphManager.GetForRadius(1);
                navGraph.update();
                if (this.target.obstacle) {
                    navGraph.computePathFromTo(this.worker.position2D, this.target.obstacle);
                }
                else {
                    navGraph.computePathFromTo(this.worker.position2D, this.target.position2D);
                }
                this.worker.currentPath = navGraph.path;
                this.hasPathToTarget = this.worker.currentPath !== undefined;
                this.worker.currentAction = "Going to building";
                this.worker.animator.setIdle();
            }
            if (this.hasPathToTarget) {
                this.worker.moveOnPath();
                this.worker.currentAction = "Going to building";
                this.worker.animator.setIdle();
            }
            return;
        }
        
        this.worker.currentTask = undefined;
        this.worker.animator.setIdle();
    }
}

