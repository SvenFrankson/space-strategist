class DroneWorkerUI {

    private _isEnabled: boolean = false;
    
    private get _ghostProp(): Prop {
        return this._ghostProps[0];
    }
    private set _ghostProp(p: Prop) {
        if (p) {
            this._ghostProps = [p];
        }
        else {
            this._ghostProps = [];
        }
    }
    private _ghostProps: Prop[] = [];

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

    public static GetPropBuildCallback(
        ui: DroneWorkerUI,
        PropCtor: new (name: string, position2D: BABYLON.Vector2, rotation2D: number) => Prop
    ) {
        return () => {
            ui._ghostProp = new PropCtor("ghost", BABYLON.Vector2.Zero(), 0);
            ui._ghostProp.instantiate();
            ui._ghostProp.setVisibility(0);
            ui._ghostProp.isPickable = false;
            ui._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                let container = new PropCtor("", pickedPoint, 0);
                container.addToScene();
                container.instantiate();
                ui._ghostProp.dispose();
                ui._ghostProp = undefined;
            }
        }
    }

    public static GetBuildingBuildCallback(
        ui: DroneWorkerUI,
        BuildingCtor: new (name: string, owner: Player, position2D: BABYLON.Vector2, rotation2D: number) => Building
    ): () => void {
        return () => {
            ui._ghostProp = new BuildingCtor("ghost", ui.target.owner, BABYLON.Vector2.Zero(), 0);
            ui._ghostProp.instantiate();
            ui._ghostProp.setVisibility(0);
            ui._ghostProp.isPickable = false;
            ui._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                let container = new BuildingCtor("", ui.target.owner, pickedPoint, 0);
                if (Cheat.OmniBuilder) {
                    container.addToScene();
                    container.instantiate();
                }
                else {
                    container.instantiateBuilding();
                    ui.target.currentTask = new BuildTask(ui.target, container);
                }
                ui._ghostProp.dispose();
                ui._ghostProp = undefined;
            }
        }
    }

    public enable(): void {
        /*
        this._panel.setTarget(this.target);
        this._panel.addTitle1("WORKER");
        this._panel.addTitle2(this.target.name.toLocaleUpperCase());
        this._inventoryInput = this._panel.addTextInput("CRISTAL", this.target.inventory.toFixed(0) + "/" + this.target.carriageCapacity.toFixed(0));
        this._currentActionInput = this._panel.addTextInput("ACTION", this.target.currentAction);
        */
        Board.Instance.clearLeftPage();
        Board.Instance.addButtonLeftPage("CONTAINER", DroneWorkerUI.GetBuildingBuildCallback(this, Container));
        Board.Instance.addButtonLeftPage("TANK", DroneWorkerUI.GetBuildingBuildCallback(this, Tank));
        Board.Instance.addButtonLeftPage("TURRET", DroneWorkerUI.GetBuildingBuildCallback(this, Turret));
        Board.Instance.addButtonLeftPage("LANDING PAD", DroneWorkerUI.GetBuildingBuildCallback(this, LandingPad));
        Board.Instance.addButtonLeftPage("DOCK", DroneWorkerUI.GetBuildingBuildCallback(this, Dock));
        if (Cheat.OmniBuilder) {
            Board.Instance.addButtonLeftPage("CRISTAL", DroneWorkerUI.GetPropBuildCallback(this, Cristal));
            Board.Instance.addButtonLeftPage("ROCK", DroneWorkerUI.GetPropBuildCallback(this, Rock));
        }
        Board.Instance.addButtonLeftPage("WALL", () => {
            this._ghostProp = new WallNode(BABYLON.Vector2.Zero(), Main.WallSystem);
            this._ghostProp.instantiate();
            this._ghostProp.setVisibility(0);
            this._ghostProp.isPickable = false;
            this._onRightClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                this._ghostProp.dispose();
                this._ghostProp = undefined;
                let newWallOrigin: WallNode;
                let newWallOriginNeedsBuild: boolean = false;
                if (pickedTarget && pickedTarget instanceof WallNode) {
                    newWallOrigin = pickedTarget;
                }
                else {
                    newWallOrigin = new WallNode(pickedPoint, Main.WallSystem);
                    newWallOrigin.instantiate();
                    this._ghostProp = newWallOrigin;
                    newWallOriginNeedsBuild = true;
                }
                // Go to second WallNode next frame. TODO.
                let newWallEnd = new WallNode(BABYLON.Vector2.Zero(), Main.WallSystem);
                newWallEnd.setVisibility(0);
                newWallEnd.isPickable = false;

                let newWall = new Wall(newWallOrigin, newWallEnd);

                this._ghostProps.splice(0, 0, newWallEnd, newWall);
                requestAnimationFrame(
                    () => {
                        this._onRightClickOverride = async (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                            let newWallEndNeedsBuild: boolean = false;
                            if (pickedTarget && pickedTarget instanceof WallNode) {
                                newWallEnd.dispose();
                                newWallEnd = pickedTarget;
                                newWall.dispose();
                                newWall = new Wall(newWallOrigin, newWallEnd);
                                newWallEndNeedsBuild = false;
                            }
                            else {
                                newWallEndNeedsBuild = true;
                            }
                            for (let i = 0; i < this._ghostProps.length; i++) {
                                this._ghostProps[i].setVisibility(1);
                                this._ghostProps[i].isPickable = true;
                            }
                            if (newWallOriginNeedsBuild) {
                                newWallOrigin.position.y = - 100;
                            }
                            await newWall.instantiateBuilding();
                            if (newWallEndNeedsBuild) {
                                newWallEnd.position.y = - 100;
                            }
                            this.target.currentTask = new BuildTask(this.target, newWall);
                            this._ghostProp = undefined;
                        }
                    }
                )
            }
        });
        Board.Instance.addButtonLeftPage("LOOK AT", () => { Main.CameraTarget = this.target; });
        Board.Instance.updateLeftPageLayout();

        this._selector = ShapeDraw.CreateCircle(1.05, 1.2);
        this.target.getScene().onBeforeRenderObservable.add(this._update);
        console.log("Enable DroneWorker Panel");
        this._isEnabled = true;
    }

    public disable(): void {
        Board.Instance.clearLeftPage();
        this._selector.dispose();
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._update);
        console.log("Disable DroneWorker Panel");
        this._isEnabled = false;
    }

    public update(): void {
        if (!this._isEnabled) {
            return;
        }
        //this._inventoryInput.value = this.target.inventory.toFixed(0) + " / " + this.target.carriageCapacity.toFixed(0);
        //this._currentActionInput.value = this.target.currentAction;
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