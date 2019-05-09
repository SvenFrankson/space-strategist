class NavGraphConsole {

    private _offset: number = 0.5;
    private _panel: SpacePanel;
    private _navGraph: NavGraph;

    constructor(public scene: BABYLON.Scene) {
        this._navGraph = NavGraphManager.GetForRadius(this._offset);
    }

    public enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("NAVGRAPH");
        this._panel.addTitle2("dev console");
        this._panel.addNumberInput(
            "OFFSET",
            this._offset,
            (v) => {
                this._offset = v;
                this._navGraph.hide();
                this._navGraph = NavGraphManager.GetForRadius(this._offset);
            }
        );
        this._panel.addLargeButton(
            "Toggle Obstacles",
            () => {
                this._navGraph.update();
                for (let i = 0; i < this._navGraph.obstacles.length; i++) {
                    let o = this._navGraph.obstacles[i];
                    o.toggleDisplay(this.scene);
                }
            }
        );
        this._panel.addLargeButton(
            "Toggle NavGraph",
            () => {
                this._navGraph.update();
                this._navGraph.toggleDisplay(this.scene);
            }
        );
        this._panel.style.left = "10px";
        this._panel.style.bottom = "10px";
    }

    public disable() {
        this._panel.dispose();
    }
}