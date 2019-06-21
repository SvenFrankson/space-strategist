class WallSystemData {

    public nodesData: WallNodeData[] = [];
    public wallsData: WallData[] = [];
}

class WallSystem extends BABYLON.TransformNode {

    public nodes: WallNode[] = [];
    public walls: Wall[] = [];

    constructor(public owner?: Player) {
        super("wall-system");
    }

    public serialize(): WallSystemData {
        let data = new WallSystemData();
        for (let i = 0; i < this.nodes.length; i++) {
            data.nodesData.push(new WallNodeData(this.nodes[i].position2D));
        }
        for (let i = 0; i < this.walls.length; i++) {
            let wall = this.walls[i];
            data.wallsData.push(
                new WallData(
                    this.nodes.indexOf(wall.node1),
                    this.nodes.indexOf(wall.node2)
                )
            );
        }
        console.log("Serialize.");
        console.log("NodesCount = " + data.nodesData.length);
        console.log("WallsCount = " + data.wallsData.length);
        console.log(data);
        return data;
    }

    public deserialize(data: WallSystemData): void {
        while (this.nodes.length > 0) {
            this.nodes.pop().dispose();
        }
        while (this.walls.length > 0) {
            this.walls.pop().dispose();
        }
        for (let i = 0; i < data.nodesData.length; i++) {
            new WallNode(
                new BABYLON.Vector2(
                    data.nodesData[i].position2D.x,
                    data.nodesData[i].position2D.y
                ),
                this
            );
        }
        for (let i = 0; i < data.wallsData.length; i++) {
            let wallData = data.wallsData[i];
            new Wall(
                this.nodes[wallData.node1Index],
                this.nodes[wallData.node2Index]
            );
        }
        console.log("Deserialize.");
        console.log("NodesCount = " + data.nodesData.length);
        console.log("WallsCount = " + data.wallsData.length);
    }

    public async instantiate(): Promise<void> {
        for (let i = 0; i < this.nodes.length; i++) {
            await this.nodes[i].instantiate();
        }
        for (let i = 0; i < this.walls.length; i++) {
            await this.walls[i].instantiate();
        }
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        while (this.nodes.length > 0) {
            this.nodes[0].dispose(doNotRecurse, disposeMaterialAndTextures);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public addToScene(): void {
        for (let i = 0; i < this.nodes.length; i++) {
            NavGraphManager.RemoveObstacle(this.nodes[i].obstacle);
            this.nodes[i].updateObstacle();
            NavGraphManager.AddObstacle(this.nodes[i].obstacle);
        }
    }
}