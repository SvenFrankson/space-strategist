enum DroneWorkerAnimState {
    Idle,
    IdleGrab,
    Grab,
    Drop,
    Build        
}

class DroneWorkerAnimator {

    public state: DroneWorkerAnimState;

    constructor(
        public target: DroneWorker
    ) {
        this._animationIdle();
    }

    private _animationIdle(): void {
        this.state = DroneWorkerAnimState.Idle;
        Main.Scene.beginAnimation(this.target.skeleton, 1, 120, true, 1);
    }

    private _animationIdleGrab(): void {
        this.state = DroneWorkerAnimState.IdleGrab;
        Main.Scene.beginAnimation(this.target.skeleton, 161, 220, true, 1);
    }

    private _animationGrab(): void {
        this.state = DroneWorkerAnimState.Grab;
        Main.Scene.beginAnimation(this.target.skeleton, 121, 160, true, 1);
    }

    private _animationDrop(): void {
        this.state = DroneWorkerAnimState.Drop;
        Main.Scene.beginAnimation(this.target.skeleton, 221, 280, true, 1);
    }

    private _animationBuild(): void {
        this.state = DroneWorkerAnimState.Build;
        Main.Scene.beginAnimation(this.target.skeleton, 281, 400, true, 1);
    }

    public setIdle(): void {
        if (this.state !== DroneWorkerAnimState.Idle && this.state !== DroneWorkerAnimState.IdleGrab) {
            if (this.target.inventory !== 0) {
                this._animationIdleGrab();
            }
            else {
                this._animationIdle();
            }
        }
    }

    public setGrab(): void {
        if (this.state !== DroneWorkerAnimState.Grab) {
            this._animationGrab();
        }
    }

    public setDrop(): void {
        if (this.state !== DroneWorkerAnimState.Drop) {
            this._animationDrop();
        }
    }

    public setBuild(): void {
        if (this.state !== DroneWorkerAnimState.Build) {
            this._animationBuild();
        }
    }
}

class DroneWorker extends Character {

    public targetSkeleton: BABYLON.Skeleton;
    public animator: DroneWorkerAnimator;

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

        let loadedFile = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "./datas/worker.babylon",
            "",
            Main.Scene
        );
        loadedFile.meshes[0].dispose();
        this.skeleton = loadedFile.skeletons[0];

        this.animator = new DroneWorkerAnimator(this);
        
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

    public onMouseMove(currentPoint: BABYLON.Vector2): boolean {
        return this.ui.onMouseMove(currentPoint);
    };

    public onRightClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): boolean {
        return this.ui.onRightClick(pickedPoint, pickedTarget);
    };

    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): boolean {
        return this.ui.onLeftClick(pickedPoint, pickedTarget);
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