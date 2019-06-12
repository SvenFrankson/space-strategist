class PerformanceConsole {

    private _panel: SpacePanel;

    private _fpsInput: HTMLInputElement;
    private _fps: number = 30;
    private _maxFrameInput: HTMLInputElement;
    private _maxFrame: number = 30;
    private _maxFrameLast5sInput: HTMLInputElement;
    private _maxFrameLast5s: number = 30;
    private _meshesCountInput: HTMLInputElement;
    private _meshesCount: number = 0;
    private _turretsCountInput: HTMLInputElement;
    private _turretsCount: number = 0;
    private _fongisCountInput: HTMLInputElement;
    private _fongisCount: number = 0;
    private _pointerPosInput: HTMLInputElement;
    private _pointerPos: string = "";

    constructor(public scene: BABYLON.Scene) {
        
    }

    public enable() {
        this._panel = SpacePanel.CreateSpacePanel();
        this._panel.addTitle1("PERFS");
        this._panel.addTitle2("GLOBAL");
        this._fpsInput = this._panel.addNumberInput("FPS", this._fps);
        this._maxFrameInput = this._panel.addNumberInput("MAX ALL TIME", this._maxFrame);
        this._maxFrameLast5sInput = this._panel.addNumberInput("MAX LAST 5s", this._maxFrameLast5s);
        this._panel.addTitle2("SCENE");
        this._meshesCountInput = this._panel.addNumberInput("MESHES", this._meshesCount);
        this._turretsCountInput = this._panel.addNumberInput("TURRETS", this._turretsCount);
        this._fongisCountInput = this._panel.addNumberInput("FONGIS", this._fongisCount);
        this._panel.addTitle2("POINTER");
        this._pointerPosInput = this._panel.addTextInput("POINTER", this._pointerPos);

        this._panel.style.right = "10px";
        this._panel.style.top = "10px";

        this.scene.onBeforeRenderObservable.add(this._update);
    }

    public disable() {
        this._panel.dispose();

        this.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    private _timer5s: number = 0;
    private _lastT: number = NaN;
    private _update = () => {
        let fps = this.scene.getEngine().getFps();
        this._fps *= 0.9;
        this._fps += fps * 0.1;
        this._fpsInput.value = this._fps.toFixed(0);

        if (isNaN(this._lastT)) {
            this._lastT = performance.now();
        }
        let currentFrameDuration = performance.now() - this._lastT;
        this._lastT = performance.now();
        this._maxFrame = Math.max(this._maxFrame, currentFrameDuration);
        this._maxFrameInput.value = this._maxFrame.toFixed(2);
        
        this._timer5s += currentFrameDuration;
        this._maxFrameLast5s = Math.max(this._maxFrameLast5s, currentFrameDuration);
        if (this._timer5s > 5000) {
            this._maxFrameLast5sInput.value = this._maxFrameLast5s.toFixed(2);
            this._maxFrameLast5s = 0;
            this._timer5s = 0;
        }

        this._meshesCount = this.scene.meshes.length;
        this._meshesCountInput.value = this._meshesCount.toFixed(0);

        this._turretsCount = Turret.Instances.length;
        this._turretsCountInput.value = this._turretsCount.toFixed(0);

        this._fongisCount = Fongus.Instances.length;
        this._fongisCountInput.value = this._fongisCount.toFixed(0);

        this._pointerPos = "X " + Main.Scene.pointerX.toFixed(0) + " Y " + Main.Scene.pointerY.toFixed(0);
        this._pointerPosInput.value = this._pointerPos;
    }
}