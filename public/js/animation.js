let scene, camera, renderer, loader;
const repoModels = "./3DModels/";

const loadedMeshes = {
    "bouchon": null,
    "corps": null,
    "habillage": null,
    "socle": null
};

window.loadAnimation = async function(selectedProducts) {
    const container = document.getElementById('3d-container');
    if (!container) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    loader = new THREE.GLTFLoader();

    for (const type in selectedProducts) {
        if (selectedProducts[type] !== null) {
            await window.update3DModel(type, selectedProducts[type]);
        }
    }

    animate();
};

window.update3DModel = async function(type, productId) {
    const typeLower = type.toLowerCase();
    if (loadedMeshes[typeLower]) {
        scene.remove(loadedMeshes[typeLower]);
        loadedMeshes[typeLower] = null;
    }
    if (!productId) return;
    try {
        const response = await fetch(`/api/get-product-info?id=${productId}`);
        if (response.ok) {
            const productInfos = await response.json();
            const fileName = `${productInfos.type}_${productInfos.name.trim().toLowerCase().split(" ").join("_")}.glb`;
            
            loader.load(repoModels + fileName, function (gltf) {
                const newModel = gltf.scene;
                
                newModel.rotation.y = -Math.PI / 2;
                newModel.position.y = -30;
                newModel.position.z = -50;
                newModel.scale.set(0.2, 0.2, 0.2);
                
                scene.add(newModel);
                loadedMeshes[typeLower] = newModel;
            });
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