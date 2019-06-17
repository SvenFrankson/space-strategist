enum DroneWorkerAnimState {
    Idle,
    IdleGrab,
    Grab,
    Drop,
    Build        
}

class DroneWorkerAnimator {

    private _armR: BABYLON.Bone;
    private _handR: BABYLON.Bone;
    private _currentResourceType: ResourceType;
    private _resourcePiece: BABYLON.Mesh;
    private _resourceStack: BABYLON.Mesh;
    public state: DroneWorkerAnimState;

    constructor(
        public target: DroneWorker
    ) {
        this._animationIdle();
    }

    public async instantiate(): Promise<void> {
        
        this._resourceStack = new BABYLON.Mesh(this.target.name + "-resources-stack");
        this._resourceStack.parent = this.target;
        this._resourceStack.position.copyFromFloats(0, 0.5, 0.5);
        this._resourceStack.rotation.x = Math.PI / 16;
        let vertexData = await VertexDataLoader.instance.getColorized("steel-stack", "#dadada");
        vertexData.applyToMesh(this._resourceStack);

        this._resourcePiece = new BABYLON.Mesh(this.target.name + "-resources-piece");
        let vertexDataPiece = await VertexDataLoader.instance.getColorized("steel-piece", "#dadada");
        vertexDataPiece.applyToMesh(this._resourcePiece);
        this._armR = this.target.skeleton.bones.find(b => { return b.name === "ArmR"; });
        this._handR = this.target.skeleton.bones.find(b => { return b.name === "HandR"; });
        this.target.getScene().onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        this._handR.getAbsolutePositionToRef(this.target, this._resourcePiece.position);
        this._armR.getRotationToRef(BABYLON.Space.WORLD, this.target, this._resourcePiece.rotation);
        this._resourcePiece.rotation.x -= Math.PI / 2;
        this._updateStack();
    }

    private _animationIdle(): void {
        this.state = DroneWorkerAnimState.Idle;
        Main.Scene.beginAnimation(this.target.skeleton, 1, 120, true, 1);
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._animationGrabUpdate);
    }

    private _animationIdleGrab(): void {
        this.state = DroneWorkerAnimState.IdleGrab;
        Main.Scene.beginAnimation(this.target.skeleton, 161, 220, true, 1);
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._animationGrabUpdate);
    }

    private _animationGrab(): void {
        this.state = DroneWorkerAnimState.Grab;
        this._animationGrabAnimatable = Main.Scene.beginAnimation(this.target.skeleton, 121, 160, true, 1);
        this._animationGrabAnimatable.onAnimationEnd = () => {
            this.target.getScene().onBeforeRenderObservable.removeCallback(this._animationGrabUpdate);
            this._resourcePiece.scaling.copyFromFloats(0, 0, 0);
        }
        this.target.getScene().onBeforeRenderObservable.add(this._animationGrabUpdate);
    }

    private _animationGrabAnimatable: BABYLON.Animatable;
    private _animationGrabUpdate = () => {
        if (this._animationGrabAnimatable) {
            let s = 1;
            let i = this._animationGrabAnimatable.masterFrame - 120;
            if (i <= 5) {
                s = 1 - i / 5;
            }
            else if (i <= 18) {
                s = 0;
            }
            else if (i <= 22) {
                s = (i - 18) / 4;
            }
            this._resourcePiece.scaling.copyFromFloats(s, s, s);
        }
    }

    private async _updateStack(): Promise<void> {
        if (this._currentResourceType !== this.target.carriedResource) {
            this._currentResourceType = this.target.carriedResource;
            if (this._currentResourceType === ResourceType.Rock) {
                let vertexData = await VertexDataLoader.instance.getColorized("cristal-stack", "#dadada");
                vertexData.applyToMesh(this._resourceStack);
                let vertexDataPiece = await VertexDataLoader.instance.getColorized("cristal-piece", "#dadada");
                vertexDataPiece.applyToMesh(this._resourcePiece);
            }
            else if (this._currentResourceType === ResourceType.Steel) {
                let vertexData = await VertexDataLoader.instance.getColorized("steel-stack", "#bababa");
                vertexData.applyToMesh(this._resourceStack);
                let vertexDataPiece = await VertexDataLoader.instance.getColorized("steel-piece", "#bababa");
                vertexDataPiece.applyToMesh(this._resourcePiece);
            }
            else if (this._currentResourceType === ResourceType.Cristal) {
                let vertexData = await VertexDataLoader.instance.getColorized("cristal-stack", "#9ef442");
                vertexData.applyToMesh(this._resourceStack);
                let vertexDataPiece = await VertexDataLoader.instance.getColorized("cristal-piece", "#9ef442");
                vertexDataPiece.applyToMesh(this._resourcePiece);
            }
        }
        if (this.target.inventory > 3) {
            this._resourceStack.isVisible = true;
        }
        else {
            this._resourceStack.isVisible = false;
        }
    }

    private _animationDrop(): void {
        this.state = DroneWorkerAnimState.Drop;
        Main.Scene.beginAnimation(this.target.skeleton, 221, 280, true, 1);
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._animationGrabUpdate);
    }

    private _animationBuild(): void {
        this.state = DroneWorkerAnimState.Build;
        Main.Scene.beginAnimation(this.target.skeleton, 281, 400, true, 1);
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._animationGrabUpdate);
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
    private _carriedResource: ResourceType;
    public get carriedResource(): ResourceType {
        return this._carriedResource;
    }
    public set carriedResource(t: ResourceType) {
        if (t !== this._carriedResource) {
            this.inventory = 0;
        }
        this._carriedResource = t;
    }
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

    constructor(owner: Player) {
        super("droneWorker", owner);
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
        await this.animator.instantiate();
        
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