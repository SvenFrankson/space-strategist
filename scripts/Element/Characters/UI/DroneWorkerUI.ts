class DroneWorkerUI {

    private _isEnabled: boolean = false;
    private _panel: SpacePanel;
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
            this._onLeftClickOverride = (pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable) => {
                let container = new Container("", pickedPoint, 0);
                container.instantiateBuilding();
                this.target.currentTask = new BuildTask(this.target, container);
            }
        })

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

    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): void {
        if (this._onLeftClickOverride) {
            this._onLeftClickOverride(pickedPoint, pickedTarget);
            this._onLeftClickOverride = undefined;
            return;
        }
        if (pickedTarget instanceof Prop) {
            this.target.currentTask = new HarvestTask(this.target, pickedTarget);
        }
        else if (pickedPoint instanceof BABYLON.Vector2) {
            this.target.currentTask = new GoToTask(this.target, pickedPoint);
        }
    };
}