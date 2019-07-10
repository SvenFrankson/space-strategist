/// <reference path="PropUI.ts"/>

class ContainerUI extends PropUI {

    private _rockInput: HTMLInputElement;
    private _steelInput: HTMLInputElement;
    private _cristalInput: HTMLInputElement;

    public _onEnable(): void {
        this._rockInput = this._panel.addTextInput("ROCK", this.target.owner.currentRock.toFixed(0));
        this._steelInput = this._panel.addTextInput("STEEL", this.target.owner.currentSteel.toFixed(0));
        this._cristalInput = this._panel.addTextInput("CRISTAL", this.target.owner.currentCristal.toFixed(0));
        
        this.target.getScene().onBeforeRenderObservable.add(this._update);
    }

    public _onDisable(): void {
        this.target.getScene().onBeforeRenderObservable.removeCallback(this._update);
    }

    private _update = () => {
        this._rockInput.value = this.target.owner.currentRock.toFixed(0);
        this._steelInput.value = this.target.owner.currentSteel.toFixed(0);
        this._cristalInput.value = this.target.owner.currentCristal.toFixed(0);
    }
}