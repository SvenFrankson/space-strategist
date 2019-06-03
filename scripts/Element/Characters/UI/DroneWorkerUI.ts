class DroneWorkerUI {

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
    }

    public disable(): void {
        this.panel.dispose();
        console.log("Disable DroneWorker Panel");
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