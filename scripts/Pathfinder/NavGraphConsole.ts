class NavGraphConsole {

    private _offset: number = 1;
    private _panel: SpacePanel;
    private _navGraph: NavGraph;

    constructor(public scene: BABYLON.Scene) {
        this._navGraph = NavGraphManager.GetForRadius(this._offset);
    }

    public enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("NAVGRAPH");
        this._panel.addTitle2("DEV CONSOLE");
        this._panel.addNumberInput(
            "OFFSET",
            this._offset,
            (v) => {
                this._offset = v;
                this._navGraph.hide();
                this._navGraph = NavGraphManager.GetForRadius(this._offset);
            }
        );
        this._panel.addConditionalButton(
            "OBSTACLES",
            () => {
                if (this._navGraph && this._navGraph.obstacles[0] && this._navGraph.obstacles[0].isDisplayed()) {
                    return "HIDE";
                }
                return "SHOW";
            },
            () => {
                for (let i = 0; i < this._navGraph.obstacles.length; i++) {
                    let o = this._navGraph.obstacles[i];
                    if (o.isDisplayed()) {
                        o.hide();
                    }
                    else {
                        o.display(this.scene);
                    }
                }
            }
        )
        this._panel.addConditionalButton(
            "NAVGRAPH",
            () => {
                if (this._navGraph.isDisplayed()) {
                    return "HIDE";
                }   
                return "SHOW";
            },
            () => {
                if (this._navGraph.isDisplayed()) {
                    this._navGraph.hide();
                }
                else {
                    this._navGraph.displayGraph(this.scene);
                    this._navGraph.displayPath(this.scene);
                }
            }
        );
        document.getElementById("space-panel-top-right-container").appendChild(this._panel);
        this._panel.hide();
    }

    public disable() {
        this._panel.dispose();
    }
}