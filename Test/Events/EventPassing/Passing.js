var EventPassing;
(function (EventPassing) {
    var ƒ = Fudge;
    let canvas;
    let camera;
    let viewPorts = [];
    window.addEventListener("DOMContentLoaded", init);
    function init() {
        let branch = Scenes.createAxisCross();
        // initialize RenderManager and transmit content
        ƒ.RenderManager.initialize();
        ƒ.RenderManager.addBranch(branch);
        ƒ.RenderManager.update();
        let posCameras = [new ƒ.Vector3(-1, 2, 3), new ƒ.Vector3(1, 2, 3)];
        let canvasList = document.getElementsByTagName("canvas");
        for (let i = 0; i < canvasList.length; i++) {
            let camera = Scenes.createCamera(posCameras[i]);
            let cmpCamera = camera.getComponent(ƒ.ComponentCamera);
            cmpCamera.projectCentral(1, 45);
            let viewPort = new ƒ.Viewport();
            viewPort.initialize(canvasList[i].id, branch, cmpCamera, canvasList[i]);
            viewPorts.push(viewPort);
            viewPort.draw();
            viewPort.addEventListener("focusin" /* FOCUS_IN */, hndEvent);
            viewPort.addEventListener("focusout" /* FOCUS_OUT */, hndEvent);
            viewPort.activatePointerEvent("\u0192pointerup" /* UP */, true);
            viewPort.addEventListener("\u0192pointerup" /* UP */, hndEvent);
            viewPort.activateDragDropEvent("\u0192dragstart" /* START */, true);
            viewPort.addEventListener("\u0192dragstart" /* START */, hndEvent);
            viewPort.activateDragDropEvent("\u0192drop" /* DROP */, true);
            viewPort.addEventListener("\u0192drop" /* DROP */, hndEvent);
            viewPort.activateDragDropEvent("\u0192dragover" /* OVER */, true);
            viewPort.addEventListener("\u0192dragover" /* OVER */, hndEvent);
            viewPort.activateKeyboardEvent("\u0192keydown" /* DOWN */, true);
            // viewPort.addEventListener(ƒ.EVENT_KEYBOARD.DOWN, hndEvent);
            viewPort.addEventListener("\u0192keydown" /* DOWN */, rotate);
        }
    }
    function hndEvent(_event) {
        if (_event.type == "\u0192dragover" /* OVER */)
            return;
        let viewPort = getViewport(_event);
        if (_event.type == "\u0192pointerup" /* UP */)
            viewPort.setFocus(true);
        console.group(`${_event.type} on ${viewPort.name}`);
        console.log(`Position (${_event.pointerX} | ${_event.pointerY})`);
        console.groupEnd();
    }
    function rotate(_event) {
        let viewPort = getViewport(_event);
        let cmpCameraTransform = viewPort.camera.getContainer().cmpTransform;
        cmpCameraTransform.translateY(0.1 *
            (_event.code == ƒ.KEYBOARD_CODE.ARROW_UP || _event.code == ƒ.KEYBOARD_CODE.W ? 1 :
                _event.code == ƒ.KEYBOARD_CODE.ARROW_DOWN || _event.code == ƒ.KEYBOARD_CODE.S ? -1 :
                    0));
        cmpCameraTransform.translateX(0.1 *
            (_event.code == ƒ.KEYBOARD_CODE.ARROW_LEFT || _event.code == ƒ.KEYBOARD_CODE.A ? 1 :
                _event.code == ƒ.KEYBOARD_CODE.ARROW_RIGHT || _event.code == ƒ.KEYBOARD_CODE.D ? -1 :
                    0));
        cmpCameraTransform.lookAt(new ƒ.Vector3());
        viewPort.draw();
    }
    function getViewport(_event) {
        let viewPort = _event.target;
        return viewPort;
    }
})(EventPassing || (EventPassing = {}));
//# sourceMappingURL=Passing.js.map