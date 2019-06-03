class DroneWorkerUI {

    private _isEnabled: boolean = false;
    public panel: SpacePanel;

    constructor(
        public target: DroneWorker
    ) {

    }

    public enable(): void {
        this.panel = SpacePanel.CreateSpacePanel();
        this.panel.setTarget(this.target);
        this.panel.addTitle1("WORKER");
        this.panel.addTitle2(this.target.name.toLocaleUpperCase());
        console.log("Enable DroneWorker Panel");
        this._isEnabled = true;
    }

    public disable(): void {
        this.panel.dispose();
        console.log("Disable DroneWorker Panel");
        this._isEnabled = false;
    }

    public update(): void {
        if (!this._isEnabled) {
            return;
        }
    }

    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): void {
        if (pickedTarget instanceof Prop) {
            this.target.currentTask = new HarvestTask(this.target, pickedTarget);
        }
        else if (pickedPoint instanceof BABYLON.Vector2) {
            this.target.currentTask = new GoToTask(this.target, pickedPoint);
        }
    };
}