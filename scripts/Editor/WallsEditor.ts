class WallsEditor {

    private _dragedWallNode: WallNode;
    private _selectedWallNodePanel: SpacePanel;
    private _selectedWallNode: WallNode;
    private get selectedWallNode(): WallNode {
        return this._selectedWallNode;
    }
    private set selectedWallNode(node: WallNode) {
        if (node === this.selectedWallNode) {
            return;
        }
        if (this._selectedWallNodePanel) {
            this._selectedWallNodePanel.dispose();
            this._selectedWallNodePanel = undefined;
        }
        this._selectedWallNode = node;
        if (this._selectedWallNode) {
            this._selectedWallNodePanel = SpacePanel.CreateSpacePanel();
            this._selectedWallNodePanel.setTarget(this.selectedWallNode);
            this._selectedWallNodePanel.addTitle1("WALLNODE");
            this._selectedWallNodePanel.addNumberInput(
                "POS X",
                this._selectedWallNode.position2D.x,
                (v) => {
                    this.selectedWallNode.position2D.x = v;
                    this.wallSystem.instantiate();
                }
            );
            this._selectedWallNodePanel.addNumberInput(
                "POS Y",
                this._selectedWallNode.position2D.y,
                (v) => {
                    this.selectedWallNode.position2D.y = v;
                    this.wallSystem.instantiate();
                }
            );
        }
    }
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
        this._selectedWallNode = undefined;
        Main.Canvas.addEventListener("pointerdown", this.pointerDown);
        Main.Canvas.addEventListener("pointermove", this.pointerMoveOnDrag);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }

    private removeEventListenerDrag(): void {
        Main.Canvas.removeEventListener("pointerdown", this.pointerDown);
        Main.Canvas.removeEventListener("pointermove", this.pointerMoveOnDrag);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }

    private _pointerDownX: number = 0;
    private _pointerDownY: number = 0;
    private pointerDown = () => {
        this._pointerDownX = this.scene.pointerX;
        this._pointerDownY = this.scene.pointerY;
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m instanceof WallNode;
            }
        );
        if (pick.hit && pick.pickedMesh instanceof WallNode) {
            if (this.selectedWallNode === pick.pickedMesh) {
                this._dragedWallNode = pick.pickedMesh as WallNode;
                this.scene.activeCamera.detachControl(Main.Canvas);
            }
        }
    }

    private pointerMoveOnDrag = () => {
        if (this._dragedWallNode) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m === this.ground;
                }
            );
            if (pick.hit) {
                this._dragedWallNode.position2D.x = pick.pickedPoint.x;
                this._dragedWallNode.position2D.y = pick.pickedPoint.z;
                this.wallSystem.instantiate();
            }
        }
    }

    private pointerUp = () => {
        this._dragedWallNode = undefined;
        if (Math.abs(this.scene.pointerX - this._pointerDownX) < 3 && Math.abs(this.scene.pointerY - this._pointerDownY) < 3) {
            let pick = this.scene.pick(
                this.scene.pointerX,
                this.scene.pointerY,
                (m) => {
                    return m instanceof WallNode;
                }
            );
            if (pick.hit && pick.pickedMesh instanceof WallNode) {
                this.selectedWallNode = pick.pickedMesh;
            }
            else {
                this.selectedWallNode = undefined;
            }
        }
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
                    this._selectedWallNode = this.wallSystem.nodes[i];
                    break;
                }
            }
            if (!this._selectedWallNode) {
                this._selectedWallNode = new WallNode(new BABYLON.Vector2(pick.pickedPoint.x, pick.pickedPoint.z), this.wallSystem);
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
            if (this._selectedWallNode && otherNode && (this._selectedWallNode !== otherNode)) {
                this.wallSystem.walls.push(new Wall(this._selectedWallNode, otherNode));
            }
            Main.Canvas.removeEventListener("pointerup", this.pointerUpSecond);
            this.addEventListenerDrag();
            this.wallSystem.instantiate();
        }
    }
}