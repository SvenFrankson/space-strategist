class MazeConsole {

    private _panel: SpacePanel;

    constructor(public maze: Maze) {
        
    }

    public enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("MAZE");
        this._panel.addTitle2("PATHFINDING DEMO");
        this._panel.addLargeButton(
            "RANDOMIZE",
            async () => {
                Main.WallSystem.dispose();
                Main.WallSystem = new WallSystem();
                await this.maze.createRandomMaze();
                this.maze.initializeDroneWorker();
            }
        );
        this._panel.style.left = "10px";
        this._panel.style.top = "10px";
    }

    public disable() {
        this._panel.dispose();
    }
}