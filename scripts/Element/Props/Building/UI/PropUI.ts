class PropUI {

    //protected _panel: SpacePanel;

    protected _selector: BABYLON.Mesh;

    constructor(
        public target: Prop
    ) {

    }

    public enable(): void {
        /*
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.setTarget(this.target);
        this._panel.addTitle1(this.target.elementName().toLocaleUpperCase());
        this._panel.addTitle2(this.target.name.toLocaleUpperCase());
        this._panel.addLargeButton("LOOK AT", () => { Main.CameraTarget = this.target; });
        */
        Board.Instance.clearLeft();
        Board.Instance.setLeftTitle(this.target.elementName().toLocaleUpperCase());
        Board.Instance.setMiniature("datas/miniatures/" + this.target.elementName() + "-miniature.png");
        Board.Instance.clearLeftPage();

        this._onEnable();

        this._selector = ShapeDraw.CreateCircle(this.target.groundWidth * Math.SQRT2 * 0.5, this.target.groundWidth * Math.SQRT2 * 0.5 + 0.15);
        this._selector.position.copyFromFloats(this.target.position2D.x, 0.1, this.target.position2D.y);
    }

    protected _onEnable(): void {};

    public disable(): void {
        //this._panel.dispose();
        this._selector.dispose();
        this._onDisable();
    }

    protected _onDisable(): void {};
}