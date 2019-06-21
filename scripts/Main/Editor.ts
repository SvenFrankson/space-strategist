/// <reference path="Main.ts"/>

class Editor extends Main {

    public async initialize(): Promise<void> {

        let sceneEditor = new SceneEditor(Main.WallSystem, Main.Player, Main.Scene);
        sceneEditor.enable();

        if (window.localStorage.getItem("scene-data")) {
            let data = JSON.parse(window.localStorage.getItem("scene-data"));
            await Serializer.Deserialize(Main.Scene, data, Main.Player);
        }
        
        console.log("Editor initialized.");
    }
}

window.addEventListener("DOMContentLoaded", async () => {
	if (window.location.href.indexOf("scene-editor.html") > -1) {
		let maze: Editor = new Editor("render-canvas");
		await maze.initializeScene();
		await maze.initialize();
		maze.animate();
	}
});