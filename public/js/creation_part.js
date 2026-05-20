class CreationViewer3D {
    constructor() {
        this.container = document.getElementById("creation-3d-area");
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 40);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
        mainLight.position.set(3, 4, 5);
        this.scene.add(mainLight);
        const backLight = new THREE.DirectionalLight(0xe0eaff, 1.5);
        backLight.position.set(-4, 2, -5);
        this.scene.add(backLight);

        this.currentMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.stickerMode = false;
        this.stickerTexture = null;

        this.placedStickers = [];
        this.stickerCounter = 0;
        this.currentFileName = "";
        this.currentStickerSize = 5;
        this.placedStickerMesh = null;
        this.movingStickerId = null;

        this.renderer.domElement.addEventListener("click", this.onClick.bind(this));
        this.animate();
    }

    removeSticker(id) {
        const index = this.placedStickers.findIndex((s) => s.id === id);
        if (index !== -1) {
            this.scene.remove(this.placedStickers[index].mesh);
            this.placedStickers.splice(index, 1);
        }
    }

    clearAllStickers() {
        this.placedStickers.forEach((sticker) => this.scene.remove(sticker.mesh));
        this.placedStickers = [];
    }

    loadModel(url, defaultColorHex) {
        if (this.currentMesh) this.scene.remove(this.currentMesh);
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        const loader = new THREE.GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load(
            url,
            (gltf) => {
                this.currentMesh = gltf.scene;
                this.currentMesh.position.set(0, -15, 0);
                this.currentMesh.scale.set(0.1, 0.1, 0.1);
                this.scene.add(this.currentMesh);
                if (defaultColorHex) this.changeColor(defaultColorHex);
            },
            undefined,
            (error) => {
                console.error("Erreur de chargement 3D :", error);
            }
        );
    }

    changeColor(hexCode) {
        if (!this.currentMesh) return;
        this.currentMesh.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.set(hexCode);
            }
        });
    }

    activateStickerMode(imageUrl, fileName) {
        this.stickerTexture = new THREE.TextureLoader().load(imageUrl);
        this.stickerTexture.encoding = THREE.sRGBEncoding;
        this.currentFileName = fileName;
        this.currentImageUrl = imageUrl;
        this.stickerMode = true;
        this.container.style.cursor = "crosshair";
    }

    updateStickerTransform(id, newSize, newRotationDeg, offsetY = 0) {
        const sticker = this.placedStickers.find((s) => s.id === id);
        if (!sticker) return;

        let sizeX = parseFloat(newSize);
        let sizeY = parseFloat(newSize);
        if (sticker.aspectRatio > 1) {
            sizeY /= sticker.aspectRatio;
        } else {
            sizeX *= sticker.aspectRatio;
        }

        const sizeVec = new THREE.Vector3(sizeX, sizeY, 8);

        const dummy = new THREE.Object3D();
        dummy.position.copy(sticker.position);
        dummy.rotation.copy(sticker.baseOrientation);
        dummy.rotateZ(THREE.MathUtils.degToRad(parseFloat(newRotationDeg)));

        const finalPosition = sticker.position.clone();
        finalPosition.y += parseFloat(offsetY);

        const newGeometry = new THREE.DecalGeometry(sticker.targetMesh, finalPosition, dummy.rotation, sizeVec);
        sticker.mesh.geometry.dispose();
        sticker.mesh.geometry = newGeometry;
        sticker.currentSize = newSize;
        sticker.currentRotation = newRotationDeg;
        sticker.currentOffsetY = offsetY;
    }

    activateRepositionMode(id) {
        this.movingStickerId = id;
        this.container.style.cursor = "move";
    }

    onClick(event) {
        if (!this.stickerMode && !this.movingStickerId) return;
        if (!this.currentMesh) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.currentMesh, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const dummy = new THREE.Object3D();
            const normal = hit.face.normal.clone();
            normal.transformDirection(hit.object.matrixWorld);
            dummy.position.copy(hit.point);
            dummy.lookAt(hit.point.clone().add(normal));

            if (this.movingStickerId) {
                const sticker = this.placedStickers.find((s) => s.id === this.movingStickerId);
                if (sticker) {
                    sticker.position = hit.point.clone();
                    sticker.baseOrientation = dummy.rotation.clone();
                    sticker.targetMesh = hit.object;
                    this.updateStickerTransform(this.movingStickerId, sticker.currentSize, sticker.currentRotation);
                }
                this.movingStickerId = null;
                this.container.style.cursor = "default";
                return;
            }

            const targetMat = hit.object.material;
            if (!this.stickerTexture || !this.stickerTexture.image) return;
            const decalMaterial = new THREE.MeshStandardMaterial({
                map: this.stickerTexture,
                transparent: true,
                depthTest: true,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                roughness: targetMat.roughness !== undefined ? targetMat.roughness : 0.5,
                metalness: targetMat.metalness !== undefined ? targetMat.metalness : 0.1
            });

            const aspectRatio = this.stickerTexture.image.width / this.stickerTexture.image.height;
            let sizeX = 5,
                sizeY = 5;
            if (aspectRatio > 1) {
                sizeY /= aspectRatio;
            } else {
                sizeX *= aspectRatio;
            }

            const size = new THREE.Vector3(sizeX, sizeY, 8);
            const decalGeometry = new THREE.DecalGeometry(hit.object, hit.point, dummy.rotation, size);
            const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);

            this.scene.add(decalMesh);

            const stickerId = `sticker_${this.stickerCounter++}`;
            this.placedStickers.push({
                id: stickerId,
                mesh: decalMesh,
                name: this.currentFileName,
                imageUrl: this.currentImageUrl,
                position: hit.point.clone(),
                baseOrientation: dummy.rotation.clone(),
                targetMesh: hit.object,
                material: decalMaterial,
                aspectRatio: aspectRatio,
                currentSize: 5,
                currentRotation: 0,
                currentOffsetY: 0
            });

            this.stickerMode = false;
            this.container.style.cursor = "default";

            if (window.onStickerPlaced) {
                window.onStickerPlaced(stickerId, this.currentFileName);
            }
        }
    }

    takeScreenshot() {
        const savedPosition = this.camera.position.clone();
        const savedTarget = this.controls.target.clone();

        const box = new THREE.Box3().setFromObject(this.currentMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);

        this.camera.position.set(center.x + 15, center.y + 15, 30);
        this.controls.target.copy(center);
        this.controls.update();

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.render(this.scene, this.camera);

        const imgData = this.renderer.domElement.toDataURL("image/png");

        this.camera.position.copy(savedPosition);
        this.controls.target.copy(savedTarget);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        return imgData;
    }

    resizeCanvas() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.myCreation3D = new CreationViewer3D();
