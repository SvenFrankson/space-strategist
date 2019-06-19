class WallData {

    constructor(
        public node1Index: number,
        public node2Index: number
    ) {}
}

class Wall extends Building {

    public wallSystem: WallSystem;

    public ui: WallUI;

    constructor(
        public node1: WallNode,
        public node2: WallNode
    ) {
        super("wall", node1.wallSystem.owner);
        node1.walls.push(this);
        node2.walls.push(this);
        this.wallSystem = node1.wallSystem;
        this.wallSystem.walls.push(this);

        this.resourcesAvailableRequired.get(ResourceType.Steel).required = 20;
        this.resourcesAvailableRequired.get(ResourceType.Rock).required = 20;
        this.completionRequired = 10;

        this.ui = new WallUI(this);
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        let indexWallSystem = this.wallSystem.walls.indexOf(this);
        if (indexWallSystem > -1) {
            this.wallSystem.walls.splice(indexWallSystem, 1);
        }
        let indexNode1 = this.node1.walls.indexOf(this);
        if (indexNode1 > -1) {
            this.node1.walls.splice(indexNode1, 1);
        }
        let indexNode2 = this.node2.walls.indexOf(this);
        if (indexNode2 > -1) {
            this.node2.walls.splice(indexNode2, 1);
        }
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public otherNode(refNode: WallNode): WallNode {
        if (this.node1 === refNode) {
            return this.node2;
        }
        if (this.node2 === refNode) {
            return this.node1;
        }
        return undefined;
    }

    public async instantiate(): Promise<void> {
        let vertexData = await VertexDataLoader.instance.getColorized("wall", "#6d6d6d", "#383838", "#ce7633");
        vertexData = VertexDataLoader.clone(vertexData);

        let d = this.node1.position2D.subtract(this.node2.position2D);
        let l = d.length() - 2;
        d.scaleInPlace(1 / l);
        let dir = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), d, true);
        let cosDir = Math.cos(dir);
        let sinDir = Math.sin(dir);

        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let x = vertexData.positions[3 * i] * l;
            let z = vertexData.positions[3 * i + 2];

            vertexData.positions[3 * i] = cosDir * x - sinDir * z;
            vertexData.positions[3 * i + 2] = sinDir *x + cosDir * z; 
        }
        this.groundWidth = 2;
        this.height = - Infinity;
        for (let i = 0; i < vertexData.positions.length / 3; i++) {
            let y = vertexData.positions[3 * i + 1];
            this.height = Math.max(this.height, y);
        }

        vertexData.applyToMesh(this);
        this.material = Main.cellShadingMaterial;

        this.position2D.x = (this.node1.position2D.x + this.node2.position2D.x) * 0.5;
        this.position2D.y = (this.node1.position2D.y + this.node2.position2D.y) * 0.5;
    }

    public addToScene(): void {
        this.isActive = true;
    }

    public onSelected(): void {
        this.ui.enable();
    }

    public onUnselected(): void {
        this.ui.disable();
    }

    public elementName(): string {
        return "Wall";
    }
}