class MazeConsole {

    private _panel: SpacePanel;

    constructor(public maze: Maze) {
        
    }

    public enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.style.position = "fixed";
        this._panel.addTitle1("MAZE");
        this._panel.addTitle2("PATHFINDING DEMO");
        this._panel.addLargeButton(
            "RANDOMIZE (WALLS)",
            async () => {
                let props = Main.Scene.meshes.filter(m => { return m instanceof Prop; });
                while (props.length > 0) {
                    props.pop().dispose();
                }
                Main.WallSystem.dispose();
                await this.maze.createRandomMazeWall();
                this.maze.initializeDroneWorker();
            }
        );
        this._panel.addLargeButton(
            "RANDOMIZE (CONTAINERS)",
            async () => {
                let props = Main.Scene.meshes.filter(m => { return m instanceof Prop; });
                while (props.length > 0) {
                    props.pop().dispose();
                }
                Main.WallSystem.dispose();
                await this.maze.createRandomMazeContainers();
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