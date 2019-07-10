abstract class Selectionable extends BABYLON.Mesh {

    public groundWidth: number = 1;
    public height: number = 1;

    public onSelected(): void {};
    public onUnselected(): void {};
    public onMouseMove(currentPoint: BABYLON.Vector2): boolean { return false; };
    public onRightClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): boolean { return false; };
    public onLeftClick(pickedPoint: BABYLON.Vector2, pickedTarget: Selectionable): boolean { return false; };
}