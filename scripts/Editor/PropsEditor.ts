class PropsEditor {

    private currentProp: Prop;
    private ground: BABYLON.Mesh;

    constructor(
        public scene: BABYLON.Scene
    ) {
        this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        this.enable();
        this.createTank();
    }

    public enable() {
        this.ground.isVisible = true;
        Main.Canvas.addEventListener("pointermove", this.pointerMove);
        Main.Canvas.addEventListener("pointerup", this.pointerUp);
    }

    public disable() {
        this.ground.isVisible = false;
        this.currentProp = undefined;
        Main.Canvas.removeEventListener("pointermove", this.pointerMove);
        Main.Canvas.removeEventListener("pointerup", this.pointerUp);
    }

    private createTank = () => {
        this.currentProp = new Tank("tank", BABYLON.Vector2.Zero(), 0);
        this.currentProp.instantiate();
    }

    private pointerMove = () => {
        let pick = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (m) => {
                return m === this.ground;
            }
        );
        if (pick.hit) {
            this.currentProp.position2D.x = pick.pickedPoint.x;
            this.currentProp.position2D.y = pick.pickedPoint.z;
            this.currentProp.position.x = this.currentProp.position2D.x;
            this.currentProp.position.z = this.currentProp.position2D.y;
        }
    }

    private pointerUp = () => {
        this.currentProp.addToScene();
        this.disable();
    }
}