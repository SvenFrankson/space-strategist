/// <reference path="../lib/babylon.d.ts"/>

class Main {

    public static Canvas: HTMLCanvasElement;
    public static Engine: BABYLON.Engine;
    public static Scene: BABYLON.Scene;
    public static Light: BABYLON.Light;

    public static _cellShadingMaterial: BABYLON.CellMaterial;
	public static get cellShadingMaterial(): BABYLON.CellMaterial {
		if (!Main._cellShadingMaterial) {
			Main._cellShadingMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
			Main._cellShadingMaterial.computeHighLevel = true;
		}
		return Main._cellShadingMaterial;
	}

    constructor(canvasElement: string) {
        Main.Canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }

    createScene(): void {
        Main.Scene = new BABYLON.Scene(Main.Engine);

        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);

        var camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), Main.Scene);
        camera.setPosition(new BABYLON.Vector3(0, 5, - 10));
        camera.attachControl(Main.Canvas, true);

        BABYLON.Effect.ShadersStore["EdgeFragmentShader"] = `
			#ifdef GL_ES
			precision highp float;
			#endif
			varying vec2 vUV;
			uniform sampler2D textureSampler;
			uniform sampler2D depthSampler;
			uniform float 		width;
			uniform float 		height;
			void make_kernel(inout vec4 n[9], sampler2D tex, vec2 coord)
			{
				float w = 1.0 / width;
				float h = 1.0 / height;
				n[0] = texture2D(tex, coord + vec2( -w, -h));
				n[1] = texture2D(tex, coord + vec2(0.0, -h));
				n[2] = texture2D(tex, coord + vec2(  w, -h));
				n[3] = texture2D(tex, coord + vec2( -w, 0.0));
				n[4] = texture2D(tex, coord);
				n[5] = texture2D(tex, coord + vec2(  w, 0.0));
				n[6] = texture2D(tex, coord + vec2( -w, h));
				n[7] = texture2D(tex, coord + vec2(0.0, h));
				n[8] = texture2D(tex, coord + vec2(  w, h));
			}
			void main(void) 
			{
				vec4 d = texture2D(depthSampler, vUV);
				float depth = d.r * (2000.0 - 0.5) + 0.5;
				vec4 n[9];
				make_kernel( n, textureSampler, vUV );
				vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
				vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
				vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
				float threshold = 0.4 + max((depth - 10.) / 30., 0.);
				if (max(sobel.r, max(sobel.g, sobel.b)) < threshold) {
					gl_FragColor = n[4];
				} else {
					gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
				}
			}
        `;
        
        let depthMap = Main.Scene.enableDepthRenderer(camera).getDepthMap();
		var postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, camera);
		postProcess.onApply = (effect) => {
			effect.setTexture("depthSampler", depthMap);
			effect.setFloat("width", Main.Engine.getRenderWidth());
			effect.setFloat("height", Main.Engine.getRenderHeight());
        };

        new VertexDataLoader(Main.Scene);
        new NavGraphManager();

        let start = new BABYLON.Vector2(0, -10);
        BABYLON.MeshBuilder.CreateSphere("start", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(start.x, 0, start.y);
        let end = new BABYLON.Vector2(0, 10);
        BABYLON.MeshBuilder.CreateSphere("end", { diameter: 0.1 }, Main.Scene).position.copyFromFloats(end.x, 0, end.y);

        let worker = new DroneWorker();
        worker.position2D = start;
        worker.instantiate();

        let wallSystem = new WallSystem();
        wallSystem.nodes.push(
            new WallNode(new BABYLON.Vector2(- 6, - 6)),
            new WallNode(new BABYLON.Vector2(6, - 6)),
            new WallNode(new BABYLON.Vector2(6, 6)),
            new WallNode(new BABYLON.Vector2(- 6, 6)),
        )
        wallSystem.walls.push(
            new Wall(
                wallSystem.nodes[0],
                wallSystem.nodes[1]
            ),
            new Wall(
                wallSystem.nodes[1],
                wallSystem.nodes[2]
            ),
            new Wall(
                wallSystem.nodes[3],
                wallSystem.nodes[2]
            )
        )
        wallSystem.instantiate();

        /*
        let container1 = new Container("c1", new BABYLON.Vector2(1, -5), Math.PI * 0.5);
        container1.instantiate();
        let container2 = new Container("c2", new BABYLON.Vector2(3, 0), Math.PI * 0.5);
        container2.instantiate();
        let container3 = new Container("c3", new BABYLON.Vector2(-2, 0), Math.PI * 0.4);
        container3.instantiate();
        let container4 = new Container("c4", new BABYLON.Vector2(-2, 5), Math.PI * 0.5);
        container4.instantiate();
        */
        let container1 = new Container("c1", new BABYLON.Vector2(-3, -2), 0);
        container1.addToScene();
        container1.instantiate();

        let container2 = new Container("c1", new BABYLON.Vector2(-1.5, 1.75), Math.PI * 0.5);
        container2.addToScene();
        container2.instantiate();

        let container21 = new Tank("c1", new BABYLON.Vector2(-6, 1.75), Math.PI * 0.8);
        container21.addToScene();
        container21.instantiate();
        
        let container3 = new Container("c1", new BABYLON.Vector2(1.5, - 1.75), Math.PI * 0.5);
        container3.addToScene();
        container3.instantiate();
        
        let container4 = new Container("c1", new BABYLON.Vector2(3, 2), 0);
        container4.addToScene();
        container4.instantiate();
        
        let container41 = new Tank("c1", new BABYLON.Vector2(6, 2), 0);
        container41.addToScene();
        container41.instantiate();
        
        let container5 = new Container("c1", new BABYLON.Vector2(1.5, 5.25), Math.PI * 0.5);
        container5.addToScene();
        container5.instantiate();

        let navGraph = NavGraphManager.GetForRadius(0);
        navGraph.update();
        navGraph.computePathFromTo(start, end);
        navGraph.display(Main.Scene);

        worker.currentPath = navGraph.path; 

        let propEditor = new PropsEditor(Main.Scene);
        propEditor.enable();
    }

    public animate(): void {
        Main.Engine.runRenderLoop(() => {
            Main.Scene.render();
        });

        window.addEventListener("resize", () => {
            Main.Engine.resize();
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    let game: Main = new Main("render-canvas");
    game.createScene();
    game.animate();
});
