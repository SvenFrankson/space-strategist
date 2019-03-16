class AdmiralCamera extends BABYLON.FreeCamera {
    
    constructor(spaceship: Spaceship) {
        super(
            "AdmiralCamera",
            new BABYLON.Vector3(0, 7.4, - 12),
            spaceship.getScene()
        );
        this.parent = spaceship;
        this.attachControl(Main.Canvas);
    }
}