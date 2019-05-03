class WallsEditor {

    private _currentWallNode: WallNode;
    private ground: BABYLON.Mesh;

    constructor(
        public wallSystem: WallSystem,
        public scene: BABYLON.Scene
    ) {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 40, height: 40}, scene);
        this.enable();
    }

    public enable() {
        this.ground.isVisible = true;
        document.getElementById("add-wall").addEventListener("click", this.createNode);
        this.addEventListenerDrag();
    }

    public disable() {
        this.ground.isVisible = false;
        document.getElementById("add-wall").removeEventListener("click", this.createNode);
    }

    private createNode = () => {
        this.removeEventListenerDrag();
        Main.Canvas.addEventListener("pointerup", this.pointerUpFirst);
    }

    private addEventListenerDrag(): void {
        this._currentWallNode = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDownStartDrag);
        Main.Canvas.addEventListener("pointermove", this.pointerMoveOnDrag);
        Main.Canvas.addEventListener("pointerup", this.pointerUpEndDrag);
    }

    private removeEventListenerDrag(): void {
        Main.Canvas.removeEventListener("pointerdown", this.pointerDownStartDrag);
        Main.Canvas.removeEventListener("pointermove", this.pointerMoveOnDrag);
        Main.Canvas.removeEventListener("pointerup", this.pointerUpEndDrag);
    }

    private pointerDownStartDrag = () => {
        if (!this._currentWallNode) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m instanceof WallNode;
                }
            );
            if (pick.hit && pick.pickedMesh instanceof WallNode) {
                this._currentWallNode = pick.pickedMesh as WallNode;
                this.scene.activeCamera.detachControl(Main.Canvas);
            }
        }
    }

    private pointerMoveOnDrag = () => {
        if (this._currentWallNode) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m === this.ground;
                }
            );
            if (pick.hit) {
                this._currentWallNode.position2D.x = pick.pickedPoint.x;
                this._currentWallNode.position2D.y = pick.pickedPoint.z;
                this.wallSystem.instantiate();
            }
        }
    }

    private pointerUpEndDrag = () => {
        this._currentWallNode = undefined;
        this.scene.activeCamera.attachControl(Main.Canvas);
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
                this._currentWallNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
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
                otherNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
            }
            if (this._currentWallNode && otherNode && (this._currentWallNode !== otherNode)) {
                this.wallSystem.walls.push(new Wall(this._currentWallNode, otherNode));
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpSecond);
            this.addEventListenerDrag();
            this.wallSystem.instantiate();
        }
    }
}