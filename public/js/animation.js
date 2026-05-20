let scene, camera, renderer, loader;
const repoModels = "./3DModels/Compressed_files/";

const loadedMeshes = {
    bouchon: null,
    corps: null,
    habillage: null,
    socle: null
};

window.loadAnimation = async function (selectedProducts) {
    const container = document.getElementById("3d-container");
    if (!container) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(3, 4, 5);
    scene.add(mainLight);

    const backLight = new THREE.DirectionalLight(0xe0eaff, 0.5);
    backLight.position.set(-4, 2, -5);
    scene.add(backLight);

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

    loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    for (const type in selectedProducts) {
        if (selectedProducts[type] !== null) {
            await window.update3DModel(type, selectedProducts[type]);
        }
    }

    animate();
};

window.update3DModel = async function (type, productId) {
    const typeLower = type.toLowerCase();
    if (loadedMeshes[typeLower]) {
        scene.remove(loadedMeshes[typeLower]);
        loadedMeshes[typeLower] = null;
    }
    if (!productId) return;

    const isCreation = String(productId).startsWith("creation_");
    const cleanId = isCreation ? String(productId).replace("creation_", "") : productId;

    try {
        const query = isCreation ? `/api/get-creation-info?id=${cleanId}` : `/api/get-product-info?id=${cleanId}`;
        const response = await fetch(query);
        if (response.ok) {
            const productInfos = await response.json();
            let fileName = "";
            let hexColor = null;
            let stickers = [];

            if (isCreation) {
                fileName = `${productInfos.type}.glb`;
                hexColor = productInfos.hex_color;
                stickers =
                    typeof productInfos.images === "string" ? JSON.parse(productInfos.images) : productInfos.images;
            } else {
                fileName = `${productInfos.type}_${productInfos.name.trim().toLowerCase().split(" ").join("_")}.glb`;
            }

            const loaderUI = document.getElementById("loading-3d");
            if (loaderUI) {
                loaderUI.style.display = "block";
                loaderUI.textContent = "Chargement 3D : 0%";
            }
            loader.load(
                repoModels + fileName,
                function (gltf) {
                    const containerGroup = new THREE.Group();
                    const newModel = gltf.scene;

                    if (isCreation && hexColor) {
                        newModel.traverse((child) => {
                            if (child.isMesh && child.material) {
                                child.material = child.material.clone();
                                child.material.color.set(hexColor);
                                child.material.needsUpdate = true;
                            }
                        });
                    }
                    containerGroup.add(newModel);
                    if (isCreation && stickers && stickers.length > 0) {
                        const textureLoader = new THREE.TextureLoader();

                        stickers.forEach((stickerData) => {
                            const imageUrl = stickerData.name;

                            textureLoader.load(imageUrl, (texture) => {
                                texture.encoding = THREE.sRGBEncoding;
                                const savedPos = new THREE.Vector3(
                                    stickerData.position.x,
                                    stickerData.position.y,
                                    stickerData.position.z
                                );
                                savedPos.y += parseFloat(stickerData.offsetY || 0);

                                const localPos = new THREE.Vector3(
                                    savedPos.x * 10,
                                    (savedPos.y + 15) * 10,
                                    savedPos.z * 10
                                );

                                // On récupère l'angle
                                const savedEuler = new THREE.Euler(
                                    stickerData.baseOrientation.x,
                                    stickerData.baseOrientation.y,
                                    stickerData.baseOrientation.z
                                );
                                const dummy = new THREE.Object3D();
                                dummy.position.copy(localPos);
                                dummy.rotation.copy(savedEuler);
                                dummy.rotateZ(THREE.MathUtils.degToRad(parseFloat(stickerData.rotation || 0)));

                                // On recalcule la taille
                                let sizeX = parseFloat(stickerData.size);
                                let sizeY = parseFloat(stickerData.size);
                                if (stickerData.aspectRatio > 1) {
                                    sizeY /= stickerData.aspectRatio;
                                } else {
                                    sizeX *= stickerData.aspectRatio;
                                }
                                const localSize = new THREE.Vector3(sizeX * 10, sizeY * 10, 80);

                                // On projette le sticker sur le mesh
                                newModel.traverse((child) => {
                                    if (child.isMesh) {
                                        const decalMat = new THREE.MeshStandardMaterial({
                                            map: texture,
                                            transparent: true,
                                            depthTest: true,
                                            depthWrite: false,
                                            polygonOffset: true,
                                            polygonOffsetFactor: -4,
                                            roughness:
                                                child.material.roughness !== undefined ? child.material.roughness : 0.5,
                                            metalness:
                                                child.material.metalness !== undefined ? child.material.metalness : 0.1
                                        });

                                        const decalGeo = new THREE.DecalGeometry(
                                            child,
                                            localPos,
                                            dummy.rotation,
                                            localSize
                                        );
                                        const decalMesh = new THREE.Mesh(decalGeo, decalMat);

                                        containerGroup.add(decalMesh);
                                    }
                                });
                            });
                        });
                    }
                    containerGroup.rotation.y = -Math.PI / 2;
                    containerGroup.position.y = -30;
                    containerGroup.position.z = -50;
                    containerGroup.scale.set(0.2, 0.2, 0.2);

                    scene.add(containerGroup);
                    loadedMeshes[typeLower] = containerGroup;
                    if (loaderUI) loaderUI.style.display = "none";
                },
                function (xhr) {
                    if (xhr.lengthComputable) {
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        if (loaderUI) {
                            loaderUI.textContent = `Chargement 3D : ${Math.round(percentComplete)}%`;
                        }
                    }
                },
                function (error) {
                    console.error("Erreur lors du chargement du modèle 3D :", error);
                    if (loaderUI) {
                        loaderUI.textContent = "Erreur de chargement";
                        setTimeout(() => (loaderUI.style.display = "none"), 2000);
                    }
                }
            );
        }
    } catch (error) {
        console.error("Erreur lors du chargement du nouveau modèle 3D :", error);
    }
};

function animate() {
    requestAnimationFrame(animate);
    for (const key in loadedMeshes) {
        if (loadedMeshes[key]) {
            loadedMeshes[key].rotation.y += 0.02;
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}
