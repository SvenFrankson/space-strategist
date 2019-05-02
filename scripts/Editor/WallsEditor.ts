class WallsEditor {

    private _currentWallNode: WallNode;
    private ground: BABYLON.Mesh;

    constructor(
        public wallSystem: WallSystem,
        public scene: BABYLON.Scene
    ) {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        this.enable();
    }

    public enable() {
        this.ground.isVisible = true;
        document.getElementById("add-wall").addEventListener("click", this.createNode);
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
    }

    public disable() {
        this.ground.isVisible = false;
        document.getElementById("add-wall").removeEventListener("click", this.createNode);
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
    }

    private createNode = () => {
        Main.Canvas.addEventListener("pointerup", this.pointerUpFirst);
    }

    private pointerMove = () => {
        
    }

    private pointerUpFirst = () => {
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m === this.ground;
            }
        );
        if (pick.hit) {
            for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                    this._currentWallNode = this.wallSystem.nodes[i];
                    break;
                }
            }
            if (!this._currentWallNode) {
                this._currentWallNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z));
                this.wallSystem.nodes.push(this._currentWallNode);
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpFirst);
            Main.Canvas.addEventListener("pointerup", this.pointerUpSecond);
        }
    }

    private pointerUpSecond = () => {
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m === this.ground;
            }
        );
        if (pick.hit) {
            let otherNode: WallNode;
            for (let i = 0; i < this.wallSystem.nodes.length; i++) {
                if (BABYLON.Vector3.DistanceSquared(this.wallSystem.nodes[i].position, pick.pickedPoint) < 1) {
                    otherNode = this.wallSystem.nodes[i];
                }
            }
            if (!otherNode) {
                otherNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z));
                this.wallSystem.nodes.push(otherNode);
            }
            if (this._currentWallNode && otherNode && (this._currentWallNode !== otherNode)) {
                this.wallSystem.walls.push(new Wall(this._currentWallNode, otherNode));
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpSecond);
            this.wallSystem.instantiate();
        }
    }
}