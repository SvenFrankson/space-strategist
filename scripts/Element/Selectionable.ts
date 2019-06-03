abstract class Selectionable extends BABYLON.Mesh {

    public groundWidth: number;
    public height: number;

    public onSelected(): void {};
    public onUnselected(): void {};
    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): void {};
}