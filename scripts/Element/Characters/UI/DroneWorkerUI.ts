class DroneWorkerUI {

    private _isEnabled: boolean = false;
    private _panel: SpacePanel;
    private get _ghostProp(): Prop {
        return this._ghostProps[0];
    }
    private set _ghostProp(p: Prop) {
        this._ghostProps = [p];
    }
    private _ghostProps: Prop[] = [];
    private _newWallOriginNeedsBuild: boolean = false;
    private _newWallOrigin: WallNode;
    private _newWallEndNeedsBuild: boolean = false;

    private _onMouseMoveOverride: (currentPoint: BABYLON.Vector2) => void;
    private _onRightClickOverride: (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => void;
    private _onLeftClickOverride: (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => void;

    private _inventoryInput: HTMLInputElement;
    private _currentActionInput: HTMLInputElement;

    private _selector: BABYLON.Mesh;

    constructor(
        public target: DroneWorker
    ) {

    }

    public enable(): void {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.setTarget(this.target);
        this._panel.addTitle1("WORKER");
        this._panel.addTitle2(this.target.name.toLocaleUpperCase());
        this._inventoryInput = this._panel.addTextInput("CRISTAL", this.target.inventory.toFixed(0) + "/" + this.target.carriageCapacity.toFixed(0));
        this._currentActionInput = this._panel.addTextInput("ACTION", this.target.currentAction);
        this._panel.addLargeButton("BUILD CONTAINER", () => {
            this._ghostProp = new Container("ghost", this.target.owner, BABYLON.Vector2.Zero(), 0);
            this._ghostProp.instantiate();
            this._ghostProp.setVisibility(0);
            this._ghostProp.isPickable = false;
            this._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                let container = new Container("", this.target.owner, pickedPoint, 0);
                container.instantiateBuilding();
                this.target.currentTask = new BuildTask(this.target, container);
                this._ghostProp.dispose();
                this._ghostProp = undefined;
            }
        });
        this._panel.addLargeButton("BUILD TANK", () => {
            this._ghostProp = new Tank("ghost", this.target.owner, BABYLON.Vector2.Zero(), 0);
            this._ghostProp.instantiate();
            this._ghostProp.setVisibility(0);
            this._ghostProp.isPickable = false;
            this._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                let tank = new Tank("", this.target.owner, pickedPoint, 0);
                tank.instantiateBuilding();
                this.target.currentTask = new BuildTask(this.target, tank);
                this._ghostProp.dispose();
                this._ghostProp = undefined;
            }
        });
        this._panel.addLargeButton("BUILD TURRET", () => {
            this._ghostProp = new Turret("ghost", this.target.owner, BABYLON.Vector2.Zero(), 0);
            this._ghostProp.instantiate();
            this._ghostProp.setVisibility(0);
            this._ghostProp.isPickable = false;
            this._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                let turret = new Turret("", this.target.owner, pickedPoint, 0);
                turret.instantiateBuilding();
                this.target.currentTask = new BuildTask(this.target, turret);
                this._ghostProp.dispose();
                this._ghostProp = undefined;
            }
        });
        this._panel.addLargeButton("BUILD WALL", () => {
            this._ghostProp = new WallNode(BABYLON.Vector2.Zero(), Main.WallSystem);
            this._ghostProp.instantiate();
            this._ghostProp.setVisibility(0);
            this._ghostProp.isPickable = false;
            this._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                this._ghostProp.dispose();
                this._ghostProp = undefined;
                if (pickedTarget && pickedTarget instanceof WallNode) {
                    console.log("First Build Wall click, use existing WallNode.");
                    this._newWallOrigin = pickedTarget;
                    this._newWallOriginNeedsBuild = false;
                }
                else {
                    console.log("First Build Wall click, create new WallNode.");
                    this._newWallOrigin = new WallNode(pickedPoint, Main.WallSystem);
                    this._newWallOrigin.instantiate();
                    this._ghostProp = this._newWallOrigin;
                    this._newWallOriginNeedsBuild = true;
                }
                // Go to second WallNode next frame. TODO.
                let newWallEnd = new WallNode(BABYLON.Vector2.Zero(), Main.WallSystem);
                newWallEnd.setVisibility(0);
                newWallEnd.isPickable = false;

                let _ghostWall = new Wall(this._newWallOrigin, newWallEnd);

                this._ghostProps.splice(0, 0, newWallEnd, _ghostWall);
                requestAnimationFrame(
                    () => {
                        this._onRightClickOverride = async (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                            if (pickedTarget && pickedTarget instanceof WallNode) {
                                console.log("Second Build Wall click, use existing WallNode.");
                                newWallEnd = pickedTarget;
                                _ghostWall.dispose();
                                _ghostWall = new Wall(this._newWallOrigin, newWallEnd);
                                this._newWallEndNeedsBuild = false;
                            }
                            else {
                                console.log("Second Build Wall click, use ghost WallNode.");
                                this._newWallEndNeedsBuild = true;
                            }
                            for (let i = 0; i < this._ghostProps.length; i++) {
                                this._ghostProps[i].setVisibility(1);
                                this._ghostProps[i].isPickable = true;
                            }
                            if (this._newWallOriginNeedsBuild) {
                                await this._newWallOrigin.instantiateBuilding();
                            }
                            await _ghostWall.instantiateBuilding();
                            if (this._newWallEndNeedsBuild) {
                                await newWallEnd.instantiateBuilding();
                            }
                            this.target.currentTask = new BuildTask(this.target, _ghostWall);
                            console.log(_ghostWall);
                            this._ghostProp = undefined;
                        }
                    }
                )
            }
        });
        this._panel.addLargeButton("LOOK AT", () => { Main.CameraTarget = this.target; });

        this._selector = ShapeDraw.CreateCircle(1.05, 1.2);
        this.target.getScene().onBeforeRenderObservable.add(this._update);
        console.log("Enable DroneWorker Panel");
        this._isEnabled = true;
    }

    public disable(): void {
        this._panel.dispose();
        this._selector.dispose();
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        console.log("Disable DroneWorker Panel");
        this._isEnabled = false;
    }

    public update(): void {
        if (!this._isEnabled) {
            return;
        }
        this._inventoryInput.value = this.target.inventory.toFixed(0) + " / " + this.target.carriageCapacity.toFixed(0);
        this._currentActionInput.value = this.target.currentAction;
    }

    private _update = () => {
        if (this._selector) {
            this._selector.position.copyFromFloats(this.target.position2D.x, 0.1, this.target.position2D.y);
        }
    }

    public onMouseMove(currentPoint: BABYLON.Vector2): boolean {
        if (this._ghostProp) {
            for (let i = 0; i < this._ghostProps.length; i++) {
                this._ghostProps[i].setVisibility(0.5);
            }
            this._ghostProp.position2D = currentPoint;
            if (this._ghostProp instanceof WallNode) {
                for (let i = 0; i < this._ghostProps.length; i++) {
                    this._ghostProps[i].instantiate();
                }
            }
            return true;
        }
        return false;
    }

    public onRightClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): boolean {
        if (this._onRightClickOverride) {
            this._onRightClickOverride(pickedPoint, pickedTarget);
            this._onRightClickOverride = undefined;
            return true;
        }
        return false;
    }

    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): boolean {
        if (this._onLeftClickOverride) {
            this._onLeftClickOverride(pickedPoint, pickedTarget);
            this._onLeftClickOverride = undefined;
        }
        else if (pickedTarget instanceof ResourceSpot) {
            this.target.currentTask = new HarvestTask(this.target, pickedTarget);
        }
        else if (pickedPoint instanceof BABYLON.Vector2) {
            this.target.currentTask = new GoToTask(this.target, pickedPoint);
        }
        else {
            return false;
        }
        return true;
    };
}