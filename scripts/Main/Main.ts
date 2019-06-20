/// <reference path="../../lib/babylon.d.ts"/>

class Main {

    public static Canvas: HTMLCanvasElement;
    public static Engine: BABYLON.Engine;
    public static Scene: BABYLON.Scene;
	public static Light: BABYLON.Light;
	public static Camera: BABYLON.ArcRotateCamera;
	public static CameraTarget: BABYLON.Mesh;
	public static Ground: Ground;
	public static Player: Player;
	public static WallSystem: WallSystem;

    public static _cellShadingMaterial: BABYLON.CellMaterial;
	public static get cellShadingMaterial(): BABYLON.CellMaterial {
		if (!Main._cellShadingMaterial) {
			Main._cellShadingMaterial = new BABYLON.CellMaterial("CellMaterial", Main.Scene);
			Main._cellShadingMaterial.computeHighLevel = true;
		}
		return Main._cellShadingMaterial;
	}

    public static _groundMaterial: BABYLON.StandardMaterial;
	public static get groundMaterial(): BABYLON.StandardMaterial {
		if (!Main._groundMaterial) {
            Main._groundMaterial = new BABYLON.StandardMaterial("StandardMaterial", Main.Scene);
            Main._groundMaterial.diffuseTexture = new BABYLON.Texture("/img/ground.jpg", Main.Scene);
			Main._groundMaterial.specularColor.copyFromFloats(0, 0, 0);
		}
		return Main._groundMaterial;
	}

    constructor(canvasElement: string) {
        Main.Canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        Main.Engine = new BABYLON.Engine(Main.Canvas, true);
    }

    public async initializeScene(): Promise<void> {
        Main.Scene = new BABYLON.Scene(Main.Engine);

        Main.Light = new BABYLON.HemisphericLight("AmbientLight", new BABYLON.Vector3(1, 3, 2), Main.Scene);

        Main.Camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 1, new BABYLON.Vector3(0, 0, 0), Main.Scene);
        Main.Camera.setPosition(new BABYLON.Vector3(0, 5, - 10));
		Main.Camera.attachControl(Main.Canvas, true);
		Main.Camera.lowerRadiusLimit = 6;
		Main.Camera.upperRadiusLimit = 40;
		Main.Camera.radius = Main.Camera.upperRadiusLimit;
		Main.Camera.upperBetaLimit = 2 * Math.PI / 5;
		Main.Camera.wheelPrecision *= 8;

		let canvasHasFocus: boolean = false;
		Main.Canvas.addEventListener("pointerleave", () => { canvasHasFocus = false; });
		Main.Canvas.addEventListener("pointerenter", () => { canvasHasFocus = true; });
		Main.Scene.onBeforeRenderObservable.add(
			() => {
				if (Main.CameraTarget) {
					Main.Camera.target.x = Main.Camera.target.x * 0.9 + Main.CameraTarget.position.x * 0.1;
					Main.Camera.target.z = Main.Camera.target.z * 0.9 + Main.CameraTarget.position.z * 0.1;
				}
				Main.Camera.target.y = 0;
				if (!canvasHasFocus) {
					return;
				}
				let pointerTop = Main.Scene.pointerY;
				let pointerLeft = Main.Scene.pointerX;
				let pointerBottom = Main.Canvas.height - Main.Scene.pointerY;
				let pointerRight = Main.Canvas.width - Main.Scene.pointerX;

				if (pointerTop < 50) {
					Main.CameraTarget = undefined;
					let groundForward = Main.Camera.getDirection(BABYLON.Axis.Z);
					groundForward.y = 0;
					groundForward.normalize();
					groundForward.scaleInPlace(Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerTop) / 50);
					Main.Camera.target.addInPlace(groundForward);
				}
				if (pointerBottom < 50) {
					Main.CameraTarget = undefined;
					let groundBackward = Main.Camera.getDirection(BABYLON.Axis.Z);
					groundBackward.y = 0;
					groundBackward.normalize();
					groundBackward.scaleInPlace(- Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerBottom) / 50);
					Main.Camera.target.addInPlace(groundBackward);
				}
				if (pointerLeft < 50) {
					Main.CameraTarget = undefined;
					let groundLeft = Main.Camera.getDirection(BABYLON.Axis.X);
					groundLeft.y = 0;
					groundLeft.normalize();
					groundLeft.scaleInPlace(- Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerLeft) / 50);
					Main.Camera.target.addInPlace(groundLeft);
				}
				if (pointerRight < 50) {
					Main.CameraTarget = undefined;
					let groundRight = Main.Camera.getDirection(BABYLON.Axis.X);
					groundRight.y = 0;
					groundRight.normalize();
					groundRight.scaleInPlace(Main.Engine.getDeltaTime() / 1000 * 20 * (50 - pointerRight) / 50);
					Main.Camera.target.addInPlace(groundRight);
				}
			}
		)

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
        
        let depthMap = Main.Scene.enableDepthRenderer(Main.Camera).getDepthMap();
		let postProcess = new BABYLON.PostProcess("Edge", "Edge", ["width", "height"], ["depthSampler"], 1, Main.Camera);
		postProcess.onApply = (effect) => {
			effect.setTexture("depthSampler", depthMap);
			effect.setFloat("width", Main.Engine.getRenderWidth());
			effect.setFloat("height", Main.Engine.getRenderHeight());
		};
		
		let noPostProcessCamera = new BABYLON.FreeCamera("no-post-process-camera", BABYLON.Vector3.Zero(), Main.Scene);
		noPostProcessCamera.parent = Main.Camera;
		noPostProcessCamera.layerMask = 0x10000000;
		
		Main.Scene.activeCameras.push(Main.Camera, noPostProcessCamera);

        Main.Ground = new Ground(100, 100);
        await Main.Ground.instantiate();
        Main.Ground.material = Main.groundMaterial;

        new VertexDataLoader(Main.Scene);
        new NavGraphManager();

		Main.Player = new Player();

		Main.WallSystem = new WallSystem();

        //let sceneEditor = new SceneEditor(Main.WallSystem, player, Main.Scene);
		//sceneEditor.enable();

        let navGraphConsole = new NavGraphConsole(Main.Scene);
		navGraphConsole.enable();

        let performanceConsole = new PerformanceConsole(Main.Scene);
        performanceConsole.enable();

        //let fongus = new Fongus();
        //fongus.position2D = new BABYLON.Vector2(0, -10);
		//fongus.instantiate();
		
		console.log("Scene Initialized");
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
