/* eslint-disable indent */
import { Scene, Vector2, Vector3, MOUSE, Quaternion, Spherical, Color, PerspectiveCamera, WebGLRenderer, PlaneBufferGeometry, TextureLoader, MeshNormalMaterial, MeshBasicMaterial, Mesh, ClampToEdgeWrapping, CanvasTexture, Texture, EventDispatcher } from 'three';

var OrbitControls = function (object, domElement) {

    this.object = object;

    this.domElement = (domElement !== undefined) ? domElement : document;

    // Set to false to disable this control
    this.enabled = true;

    // "target" sets the location of focus, where the object orbits around
    this.target = new Vector3();

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = 0;
    this.maxZoom = Infinity;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    this.minAzimuthAngle = - Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false;
    this.dampingFactor = 0.25;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    // Set to false to disable rotating
    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    // Set to false to disable panning
    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = false; // if true, pan in screen-space
    this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    // Set to false to disable use of the keys
    this.enableKeys = true;

    // The four arrow keys
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

    // Mouse buttons
    this.mouseButtons = { LEFT: MOUSE.LEFT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.RIGHT };

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;

    //
    // public methods
    //

    this.getPolarAngle = function () {

        return spherical.phi;

    };

    this.getAzimuthalAngle = function () {

        return spherical.theta;

    };

    this.saveState = function () {

        scope.target0.copy(scope.target);
        scope.position0.copy(scope.object.position);
        scope.zoom0 = scope.object.zoom;

    };

    this.reset = function () {

        scope.target.copy(scope.target0);
        scope.object.position.copy(scope.position0);
        scope.object.zoom = scope.zoom0;

        scope.object.updateProjectionMatrix();
        scope.dispatchEvent(changeEvent);

        scope.update();

        state = STATE.NONE;

    };

    // this method is exposed, but perhaps it would be better if we can make it private...
    this.update = function () {

        var offset = new Vector3();

        // so camera.up is the orbit axis
        var quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
        var quatInverse = quat.clone().inverse();

        var lastPosition = new Vector3();
        var lastQuaternion = new Quaternion();

        return function update() {

            var position = scope.object.position;

            offset.copy(position).sub(scope.target);

            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion(quat);

            // angle from z-axis around y-axis
            spherical.setFromVector3(offset);

            if (scope.autoRotate && state === STATE.NONE) {

                rotateLeft(getAutoRotationAngle());

            }

            spherical.theta += sphericalDelta.theta;
            spherical.phi += sphericalDelta.phi;

            // restrict theta to be between desired limits
            spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));

            // restrict phi to be between desired limits
            spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

            spherical.makeSafe();


            spherical.radius *= scale;

            // restrict radius to be between desired limits
            spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

            // move target to panned location
            scope.target.add(panOffset);

            offset.setFromSpherical(spherical);

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion(quatInverse);

            position.copy(scope.target).add(offset);

            scope.object.lookAt(scope.target);

            if (scope.enableDamping === true) {

                sphericalDelta.theta *= (1 - scope.dampingFactor);
                sphericalDelta.phi *= (1 - scope.dampingFactor);

                panOffset.multiplyScalar(1 - scope.dampingFactor);

            } else {

                sphericalDelta.set(0, 0, 0);

                panOffset.set(0, 0, 0);

            }

            scale = 1;

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8

            if (zoomChanged ||
                lastPosition.distanceToSquared(scope.object.position) > EPS ||
                8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

                scope.dispatchEvent(changeEvent);

                lastPosition.copy(scope.object.position);
                lastQuaternion.copy(scope.object.quaternion);
                zoomChanged = false;

                return true;

            }

            return false;

        };

    }();

    this.dispose = function () {

        scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
        scope.domElement.removeEventListener('mousedown', onMouseDown, false);
        scope.domElement.removeEventListener('wheel', onMouseWheel, false);

        scope.domElement.removeEventListener('touchstart', onTouchStart, false);
        scope.domElement.removeEventListener('touchend', onTouchEnd, false);
        scope.domElement.removeEventListener('touchmove', onTouchMove, false);

        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);

        window.removeEventListener('keydown', onKeyDown, false);

        //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

    };

    //
    // internals
    //

    var scope = this;

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };

    var STATE = { NONE: - 1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

    var state = STATE.NONE;

    var EPS = 0.000001;

    // current position in spherical coordinates
    var spherical = new Spherical();
    var sphericalDelta = new Spherical();

    var scale = 1;
    var panOffset = new Vector3();
    var zoomChanged = false;

    var rotateStart = new Vector2();
    var rotateEnd = new Vector2();
    var rotateDelta = new Vector2();

    var panStart = new Vector2();
    var panEnd = new Vector2();
    var panDelta = new Vector2();

    var dollyStart = new Vector2();
    var dollyEnd = new Vector2();
    var dollyDelta = new Vector2();

    function getAutoRotationAngle() {

        return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

    }

    function getZoomScale() {

        return Math.pow(0.95, scope.zoomSpeed);

    }

    function rotateLeft(angle) {

        sphericalDelta.theta -= angle;

    }

    function rotateUp(angle) {

        sphericalDelta.phi -= angle;

    }

    var panLeft = function () {

        var v = new Vector3();

        return function panLeft(distance, objectMatrix) {

            v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
            v.multiplyScalar(- distance);

            panOffset.add(v);

        };

    }();

    var panUp = function () {

        var v = new Vector3();

        return function panUp(distance, objectMatrix) {

            if (scope.screenSpacePanning === true) {

                v.setFromMatrixColumn(objectMatrix, 1);

            } else {

                v.setFromMatrixColumn(objectMatrix, 0);
                v.crossVectors(scope.object.up, v);

            }

            v.multiplyScalar(distance);

            panOffset.add(v);

        };

    }();

    // deltaX and deltaY are in pixels; right and down are positive
    var pan = function () {

        var offset = new Vector3();

        return function pan(deltaX, deltaY) {

            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if (scope.object.isPerspectiveCamera) {

                // perspective
                var position = scope.object.position;
                offset.copy(position).sub(scope.target);
                var targetDistance = offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

                // we use only clientHeight here so aspect ratio does not distort speed
                panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
                panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);

            } else if (scope.object.isOrthographicCamera) {

                // orthographic
                panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
                panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);

            } else {

                // camera neither orthographic nor perspective
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
                scope.enablePan = false;

            }

        };

    }();

    function dollyIn(dollyScale) {

        if (scope.object.isPerspectiveCamera) {

            scale /= dollyScale;

        } else if (scope.object.isOrthographicCamera) {

            scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
            scope.object.updateProjectionMatrix();
            zoomChanged = true;

        } else {

            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
            scope.enableZoom = false;

        }

    }

    function dollyOut(dollyScale) {

        if (scope.object.isPerspectiveCamera) {

            scale *= dollyScale;

        } else if (scope.object.isOrthographicCamera) {

            scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
            scope.object.updateProjectionMatrix();
            zoomChanged = true;

        } else {

            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
            scope.enableZoom = false;

        }

    }

    //
    // event callbacks - update the object state
    //

    function handleMouseDownRotate(event) {

        //console.log( 'handleMouseDownRotate' );

        rotateStart.set(event.clientX, event.clientY);

    }

    function handleMouseDownDolly(event) {

        //console.log( 'handleMouseDownDolly' );

        dollyStart.set(event.clientX, event.clientY);

    }

    function handleMouseDownPan(event) {

        //console.log( 'handleMouseDownPan' );

        panStart.set(event.clientX, event.clientY);

    }

    function handleMouseMoveRotate(event) {

        //console.log( 'handleMouseMoveRotate' );

        rotateEnd.set(event.clientX, event.clientY);

        rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

        rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

        rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

        rotateStart.copy(rotateEnd);

        scope.update();

    }

    function handleMouseMoveDolly(event) {

        //console.log( 'handleMouseMoveDolly' );

        dollyEnd.set(event.clientX, event.clientY);

        dollyDelta.subVectors(dollyEnd, dollyStart);

        if (dollyDelta.y > 0) {

            dollyIn(getZoomScale());

        } else if (dollyDelta.y < 0) {

            dollyOut(getZoomScale());

        }

        dollyStart.copy(dollyEnd);

        scope.update();

    }

    function handleMouseMovePan(event) {

        //console.log( 'handleMouseMovePan' );

        panEnd.set(event.clientX, event.clientY);

        panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

        pan(panDelta.x, panDelta.y);

        panStart.copy(panEnd);

        scope.update();

    }

    function handleMouseUp(event) {

        // console.log( 'handleMouseUp' );

    }

    function handleMouseWheel(event) {

        // console.log( 'handleMouseWheel' );

        if (event.deltaY < 0) {

            dollyOut(getZoomScale());

        } else if (event.deltaY > 0) {

            dollyIn(getZoomScale());

        }

        scope.update();

    }

    function handleKeyDown(event) {

        //console.log( 'handleKeyDown' );

        // prevent the browser from scrolling on cursor up/down

        event.preventDefault();

        switch (event.keyCode) {
            case scope.keys.UP:
                pan(0, scope.keyPanSpeed);
                scope.update();
                break;
            case scope.keys.BOTTOM:
                pan(0, - scope.keyPanSpeed);
                scope.update();
                break;
            case scope.keys.LEFT:
                pan(scope.keyPanSpeed, 0);
                scope.update();
                break;
            case scope.keys.RIGHT:
                pan(- scope.keyPanSpeed, 0);
                scope.update();
                break;
        }

    }

    function handleTouchStartRotate(event) {

        //console.log( 'handleTouchStartRotate' );

        rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);

    }

    function handleTouchStartDollyPan(event) {

        //console.log( 'handleTouchStartDollyPan' );

        if (scope.enableZoom) {

            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;

            var distance = Math.sqrt(dx * dx + dy * dy);

            dollyStart.set(0, distance);

        }

        if (scope.enablePan) {

            var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
            var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

            panStart.set(x, y);

        }

    }

    function handleTouchMoveRotate(event) {

        //console.log( 'handleTouchMoveRotate' );

        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

        rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

        rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

        rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

        rotateStart.copy(rotateEnd);

        scope.update();

    }

    function handleTouchMoveDollyPan(event) {

        //console.log( 'handleTouchMoveDollyPan' );

        if (scope.enableZoom) {

            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;

            var distance = Math.sqrt(dx * dx + dy * dy);

            dollyEnd.set(0, distance);

            dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));

            dollyIn(dollyDelta.y);

            dollyStart.copy(dollyEnd);

        }

        if (scope.enablePan) {

            var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
            var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

            panEnd.set(x, y);

            panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

            pan(panDelta.x, panDelta.y);

            panStart.copy(panEnd);

        }

        scope.update();

    }

    function handleTouchEnd(event) {

        //console.log( 'handleTouchEnd' );

    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    function onMouseDown(event) {

        if (scope.enabled === false) return;

        // Prevent the browser from scrolling.

        event.preventDefault();

        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.

        scope.domElement.focus ? scope.domElement.focus() : window.focus();

        switch (event.button) {

            case scope.mouseButtons.LEFT:

                if (event.ctrlKey || event.metaKey || event.shiftKey) {

                    if (scope.enablePan === false) return;

                    handleMouseDownPan(event);

                    state = STATE.PAN;

                } else {

                    if (scope.enableRotate === false) return;

                    handleMouseDownRotate(event);

                    state = STATE.ROTATE;

                }

                break;

            case scope.mouseButtons.MIDDLE:

                if (scope.enableZoom === false) return;

                handleMouseDownDolly(event);

                state = STATE.DOLLY;

                break;

            case scope.mouseButtons.RIGHT:

                if (scope.enablePan === false) return;

                handleMouseDownPan(event);

                state = STATE.PAN;

                break;

        }

        if (state !== STATE.NONE) {

            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);

            scope.dispatchEvent(startEvent);

        }

    }

    function onMouseMove(event) {

        if (scope.enabled === false) return;

        event.preventDefault();

        switch (state) {

            case STATE.ROTATE:

                if (scope.enableRotate === false) return;

                handleMouseMoveRotate(event);

                break;

            case STATE.DOLLY:

                if (scope.enableZoom === false) return;

                handleMouseMoveDolly(event);

                break;

            case STATE.PAN:

                if (scope.enablePan === false) return;

                handleMouseMovePan(event);

                break;

        }

    }

    function onMouseUp(event) {

        if (scope.enabled === false) return;

        handleMouseUp(event);

        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);

        scope.dispatchEvent(endEvent);

        state = STATE.NONE;

    }

    function onMouseWheel(event) {

        if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return;

        event.preventDefault();
        event.stopPropagation();

        scope.dispatchEvent(startEvent);

        handleMouseWheel(event);

        scope.dispatchEvent(endEvent);

    }

    function onKeyDown(event) {

        if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;

        handleKeyDown(event);

    }

    function onTouchStart(event) {

        if (scope.enabled === false) return;

        event.preventDefault();

        switch (event.touches.length) {

            case 1:	// one-fingered touch: rotate

                if (scope.enableRotate === false) return;

                handleTouchStartRotate(event);

                state = STATE.TOUCH_ROTATE;

                break;

            case 2:	// two-fingered touch: dolly-pan

                if (scope.enableZoom === false && scope.enablePan === false) return;

                handleTouchStartDollyPan(event);

                state = STATE.TOUCH_DOLLY_PAN;

                break;

            default:

                state = STATE.NONE;

        }

        if (state !== STATE.NONE) {

            scope.dispatchEvent(startEvent);

        }

    }

    function onTouchMove(event) {

        if (scope.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {

            case 1: // one-fingered touch: rotate

                if (scope.enableRotate === false) return;
                if (state !== STATE.TOUCH_ROTATE) return; // is this needed?

                handleTouchMoveRotate(event);

                break;

            case 2: // two-fingered touch: dolly-pan

                if (scope.enableZoom === false && scope.enablePan === false) return;
                if (state !== STATE.TOUCH_DOLLY_PAN) return; // is this needed?

                handleTouchMoveDollyPan(event);

                break;

            default:

                state = STATE.NONE;

        }

    }

    function onTouchEnd(event) {

        if (scope.enabled === false) return;

        handleTouchEnd(event);

        scope.dispatchEvent(endEvent);

        state = STATE.NONE;

    }

    function onContextMenu(event) {

        if (scope.enabled === false) return;

        event.preventDefault();

    }

    //

    scope.domElement.addEventListener('contextmenu', onContextMenu, false);

    scope.domElement.addEventListener('mousedown', onMouseDown, false);
    scope.domElement.addEventListener('wheel', onMouseWheel, false);

    scope.domElement.addEventListener('touchstart', onTouchStart, false);
    scope.domElement.addEventListener('touchend', onTouchEnd, false);
    scope.domElement.addEventListener('touchmove', onTouchMove, false);

    window.addEventListener('keydown', onKeyDown, false);

    // force an update at start

    this.update();

};

OrbitControls.prototype = Object.create(EventDispatcher.prototype);
OrbitControls.prototype.constructor = OrbitControls;

Object.defineProperties(OrbitControls.prototype, {

    center: {

        get: function () {

            console.warn('OrbitControls: .center has been renamed to .target');
            return this.target;

        }

    },

    // backward compatibility

    noZoom: {

        get: function () {

            console.warn('OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
            return !this.enableZoom;

        },

        set: function (value) {

            console.warn('OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
            this.enableZoom = !value;

        }

    },

    noRotate: {

        get: function () {

            console.warn('OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
            return !this.enableRotate;

        },

        set: function (value) {

            console.warn('OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
            this.enableRotate = !value;

        }

    },

    noPan: {

        get: function () {

            console.warn('OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
            return !this.enablePan;

        },

        set: function (value) {

            console.warn('OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
            this.enablePan = !value;

        }

    },

    noKeys: {

        get: function () {

            console.warn('OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
            return !this.enableKeys;

        },

        set: function (value) {

            console.warn('OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
            this.enableKeys = !value;

        }

    },

    staticMoving: {

        get: function () {

            console.warn('OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
            return !this.enableDamping;

        },

        set: function (value) {

            console.warn('OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
            this.enableDamping = !value;

        }

    },

    dynamicDampingFactor: {

        get: function () {

            console.warn('OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
            return this.dampingFactor;

        },

        set: function (value) {

            console.warn('OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
            this.dampingFactor = value;

        }

    }

});

export class TopoViewer {

    constructor(params) {
        // TOPO VIEWER CONFIG PARAMS
        this.container = params.container || document.createElement('div');
        this.backgroundColor = params.backgroundColor || 0x1e1e1e;
        this.isRaycast = params.isRaycast || false;
        this.isBakedLighting = params.isBakedLighting || false;
        this.width = params.width || 512;
        this.height = params.height || 512;
        this.worldWidth = params.worldWidth || 256;
        this.worldDepth = params.worldDepth || 256;
        this.planeWidth = params.planeWidth || 7500;
        this.planeHeight = params.planeHeight || 7500;
        this.heightScale = params.heightScale || 10;
        this.textureURL = params.textureURL || '../test/img/defaultTopoViewerTexture.png';
        this.isAnimating = false;
        this.annimationId;

        // TOPO VIEWER DERIVED PARAMS
        this.worldHalfWidth = this.worldWidth / 2;
        this.worldHalfDepth = this.worldDepth / 2;

        // SCENE SETUP
        this.scene = new Scene();
        this.scene.background = new Color(this.backgroundColor);

        // CAMERA SETUP
        this.camera = new PerspectiveCamera(60, this.width / this.height, 10, 20000);

        // RENDERER SETUP
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        // CONTROL SETUP
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.minDistance = 100;
        this.controls.maxDistance = 10000;
        this.controls.maxPolarAngle = Math.PI / 2;

        // UPDATE CAMERA POSITION
        this.camera.position.x = 1500;
        this.camera.position.y = 4500;
        this.camera.position.z = 6000;

        this.controls.update();

        // MISC
        // this.raycaster = new Three.Raycaster();
        // this.mouse = new Three.Vector2();

        // PLANE GEOMETRY
        this.geometry = new PlaneBufferGeometry(this.planeWidth, this.planeHeight, this.worldWidth - 1, this.worldDepth - 1);
        this.geometry.attributes.position.dynamic = true;
        this.geometry.rotateX(- Math.PI / 2);

        // TEXTURE
        this.texture1 = new TextureLoader().load(this.textureURL);

        // MATERIAL
        this.materials = [];
        this.materials.push(new MeshNormalMaterial());
        this.materials.push(new MeshBasicMaterial({ map: this.texture1 }));

        this.currMaterial = 0;
        this.material = this.materials[this.currMaterial];

        this.cycleMaterial = () => {
            this.currMaterial = (this.currMaterial < this.materials.length - 1) ? this.currMaterial + 1 : 0;
            console.log('current material changed to ' + this.currMaterial);

            this.material = this.materials[this.currMaterial];
            this.mesh.material = this.materials[this.currMaterial];
            this.render();
        };

        // MESH
        this.mesh = new Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        // ANNIMATION
        this.animate = () => {
            this.annimationId = requestAnimationFrame(this.animate);
            this.render();
        };

        this.stopAnimate = () => {
            cancelAnimationFrame(this.annimationId);
            // console.log('ANNIMATION STOPED');
        };

    }

    // METHODS
    //------------------------------------------------------------

    // Get the Render Canvas
    getDOMElement() {
        return this.renderer.domElement;
    }

    // Sets the input image
    setInputImage(inputURL) {
        this.inputImage.src = inputURL;
    }

    // Sets the Height Data
    getHeightData(img, scale) {
        if (scale == undefined) scale = 1;

        var canvas = document.createElement('canvas');
        // document.body.appendChild(canvas);
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');

        var size = img.width * img.height;
        // console.log(img.width);
        var data = new Uint8Array(size);

        context.drawImage(img, 0, 0);

        for (var i = 0; i < size; i++) {
            data[i] = 0;
        }

        var pix = context.getImageData(0, 0, img.width, img.height).data;

        return this.averageHeightData(pix, scale);

    }

    averageHeightData(pix, scale) {
        let data = new Uint8Array(pix.length / 4);
        var j = 0;
        for (var i = 0; i < pix.length; i += 4) {
            var all = pix[i] + pix[i + 1] + pix[i + 2];
            data[j++] = all / (3 * scale);
        }
        return data;
    }

    // Updated the Plane Geometry
    updateGeometry(heightData) {

        let vertices = this.geometry.attributes.position.array;

        for (let i = 0, j = 0, l = vertices.length; i < l; i++ , j += 3) {
            vertices[j + 1] = heightData[i] * this.heightScale;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }

    // Generate the Canvas for a bAked Texture
    generateBakedTexture(data, width, height) {
        // bake lighting into texture

        var canvas, canvasScaled, context, image, imageData, vector3, sun, shade;

        vector3 = new Vector3(0, 0, 0);

        sun = new Vector3(1, 1, 1);
        sun.normalize();

        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, width, height);

        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;

        for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

            vector3.x = data[j - 2] - data[j + 2];
            vector3.y = 2;
            vector3.z = data[j - width * 2] - data[j + width * 2];
            vector3.normalize();

            shade = vector3.dot(sun);

            imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
            imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
            imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);
        }
        context.putImageData(image, 0, 0);

        // Scaled 4x

        canvasScaled = document.createElement('canvas');
        canvasScaled.width = width * 4;
        canvasScaled.height = height * 4;

        context = canvasScaled.getContext('2d');
        context.scale(4, 4);
        context.drawImage(canvas, 0, 0);

        image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
        imageData = image.data;

        for (var i = 0, l = imageData.length; i < l; i += 4) {

            var v = ~ ~(Math.random() * 5);

            imageData[i] += v;
            imageData[i + 1] += v;
            imageData[i + 2] += v;

        }

        context.putImageData(image, 0, 0);

        return canvasScaled;
    }

    // Builds the texture
    buildTexture(data, image) {
        // image = this.inputImage;
        let texture;
        if (this.isBakedLighting) {
            texture = new CanvasTexture(this.generateBakedTexture(data, this.worldWidth, this.worldDepth));
        } else {
            texture = new Texture(image);
        }
        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = ClampToEdgeWrapping;

        return texture;
    }

    // Updates the Model Geometry and Rendering
    updateModel(input) {
        let scale = 1; // TODO fix this
        // setInputImage(inputURL);
        // const data = this.getHeightData(image);

        const data = this.averageHeightData(input, scale);
        this.updateGeometry(data);

        // Optional --- ????
        this.controls.target.y = data[this.worldHalfWidth + this.worldHalfDepth * this.worldWidth] + 500;

        // this.texture = this.buildTexture(data, image);
        // console.log(this);
        this.render();
    }


    attatchTo(container) {
        container.appendChild(this.container);
    }

    // Render the Scene and Camera
    render() {
        this.renderer.render(this.scene, this.camera);
    }

}


// function newFunction() {
//     return *;
// }

