class ContainerUI {

    private _panel: SpacePanel;
    
    private _rockInput: HTMLInputElement;
    private _steelInput: HTMLInputElement;
    private _cristalInput: HTMLInputElement;

    private _selector: BABYLON.Mesh;

    constructor(
        public target: Container
    ) {

    }

    public enable(): void {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.setTarget(this.target);
        this._panel.addTitle1(this.target.elementName().toLocaleUpperCase());
        this._panel.addTitle2(this.target.name.toLocaleUpperCase());
        this._rockInput = this._panel.addTextInput("ROCK", this.target.owner.currentRock.toFixed(0));
        this._steelInput = this._panel.addTextInput("STEEL", this.target.owner.currentSteel.toFixed(0));
        this._cristalInput = this._panel.addTextInput("CRISTAL", this.target.owner.currentCristal.toFixed(0));
        this._panel.addLargeButton("LOOK AT", () => { Main.CameraTarget = this.target; });

        this._selector = ShapeDraw.CreateCircle(this.target.groundWidth * Math.SQRT2 * 0.5, this.target.groundWidth * Math.SQRT2 * 0.5 + 0.15);
        this._selector.position.copyFromFloats(this.target.position2D.x, 0.1, this.target.position2D.y);

        this.target.getScene().onBeforeRenderObservable.add(this._update);
    }

    public disable(): void {
        this._panel.dispose();
        this._selector.dispose();
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }

    private _update = () => {
        this._rockInput.value = this.target.owner.currentRock.toFixed(0);
        this._steelInput.value = this.target.owner.currentSteel.toFixed(0);
        this._cristalInput.value = this.target.owner.currentCristal.toFixed(0);
    }
}