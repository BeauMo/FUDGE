///<reference types="../../Core/Build/FudgeCore"/>
///<reference types="../../Aid/Build/FudgeAid"/>
var ParticleSystemTest;
///<reference types="../../Core/Build/FudgeCore"/>
///<reference types="../../Aid/Build/FudgeAid"/>
(function (ParticleSystemTest) {
    var f = FudgeCore;
    var fAid = FudgeAid;
    window.addEventListener("load", hndLoad);
    let root = new f.Node("Root");
    let particles;
    let viewport;
    let camera;
    let speedCameraRotation = 0.2;
    let speedCameraTranslation = 0.02;
    let inputParticleNum;
    let inputEffectName;
    let particleSystem;
    async function hndLoad(_event) {
        f.RenderManager.initialize(true, false);
        f.RenderManager.setDepthTest(false);
        f.RenderManager.setBlendMode(f.BLEND.PARTICLE);
        inputParticleNum = document.getElementById("particleNum");
        inputEffectName = document.getElementById("effectName");
        const canvas = document.querySelector("canvas");
        f.Debug.log("Canvas", canvas);
        f.Debug.setFilter(f.DebugConsole, f.DEBUG_FILTER.ERROR);
        // enable unlimited mouse-movement (user needs to click on canvas first)
        canvas.addEventListener("mousedown", canvas.requestPointerLock);
        canvas.addEventListener("mouseup", () => document.exitPointerLock());
        // setup orbiting camera
        camera = new fAid.CameraOrbit(new f.ComponentCamera(), 4);
        camera.component.backgroundColor = f.Color.CSS("black");
        root.addChild(camera);
        // setup coordinate axes
        let coordinateSystem = new fAid.NodeCoordinateSystem("Coordinates", f.Matrix4x4.SCALING(new f.Vector3(1, 1, 1)));
        root.addChild(coordinateSystem);
        // setup viewport
        viewport = new f.Viewport();
        viewport.initialize("Viewport", root, camera.component, canvas);
        f.Debug.log("Viewport", viewport);
        // setup event handling
        viewport.activatePointerEvent("\u0192pointermove" /* MOVE */, true);
        viewport.activateWheelEvent("\u0192wheel" /* WHEEL */, true);
        viewport.addEventListener("\u0192pointermove" /* MOVE */, hndPointerMove);
        viewport.addEventListener("\u0192wheel" /* WHEEL */, hndWheelMove);
        // setup particles
        let img = document.querySelector("img");
        let txtImage = new f.TextureImage();
        txtImage.image = img;
        let coat = new f.CoatTextured();
        coat.texture = txtImage;
        let material = new f.Material("Material", f.ShaderTexture, coat);
        // let material: ƒ.Material = new ƒ.Material("Material", ƒ.ShaderUniColor, new ƒ.CoatColored(ƒ.Color.CSS("WHITE")));
        let mesh = new f.MeshQuad();
        particles = new fAid.Node("Particles", f.Matrix4x4.TRANSLATION(new f.Vector3(0, 0, 0)), material, mesh);
        // particles.getComponent(f.ComponentMesh).pivot.translate(new f.Vector3(1, 0, 0));
        particles.getComponent(f.ComponentMesh).pivot.scale(new f.Vector3(0.2, 0.2, 0.2));
        // particles.getComponent(f.ComponentMesh).showToCamera = true;
        particles.getComponent(f.ComponentMaterial).clrPrimary = new f.Color(1, 0.5, 0.2);
        let particleEffect = new f.ParticleEffect(inputParticleNum.valueAsNumber);
        await particleEffect.load("test.json");
        console.log(particleEffect);
        particleSystem = new f.ComponentParticleSystem(particleEffect);
        particles.addComponent(particleSystem);
        root.addChild(particles);
        // setup input
        let reStartParticleSystem = async (_event) => {
            let newParticleEffect = new f.ParticleEffect(inputParticleNum.valueAsNumber);
            await newParticleEffect.load(inputEffectName.value);
            let newParticleSystem = new f.ComponentParticleSystem(newParticleEffect);
            particles.removeComponent(particleSystem);
            particles.addComponent(newParticleSystem);
            particleSystem = newParticleSystem;
        };
        inputParticleNum.addEventListener("input", reStartParticleSystem);
        // inputEffectName.addEventListener("input", reStartParticleSystem);
        // inputParticleNum.dispatchEvent(new Event("input"));
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.TIME_GAME, 10);
        function update(_event) {
            // console.log(particles.getComponent(f.ComponentTransform).local);
            viewport.draw();
        }
    }
    function hndPointerMove(_event) {
        if (!_event.buttons)
            return;
        camera.rotateY(_event.movementX * speedCameraRotation);
        camera.rotateX(_event.movementY * speedCameraRotation);
    }
    function hndWheelMove(_event) {
        camera.distance = camera.distance + _event.deltaY * speedCameraTranslation;
    }
})(ParticleSystemTest || (ParticleSystemTest = {}));
//# sourceMappingURL=ParticleSystemTest.js.map