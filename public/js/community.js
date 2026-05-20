async function loadComments() {
    try {
        const userRes = await fetch("/api/current-user-id");
        currentUserId = await userRes.json();
    } catch {
        currentUserId = null;
    }
    const serverResponse = await fetch("/api/load-inspi-comments");
    if (serverResponse.ok) {
        const responseInfo = await serverResponse.json();
        if (responseInfo.length > 0) {
            document.getElementById("community-feed").innerHTML = "";
            for (const comment of responseInfo) {
                addToComment(comment, "community-feed");
            }
        }
    }
}

function addBadgeElement() {
    const badgeNameInput = document.getElementById("element-input");
    if (badgeNameInput.value != "") {
        const badgeName = badgeNameInput.value;
        compositionElements.push(badgeName);
        const tag = document.createElement("span");
        tag.classList.add("comp-tag", "new-tag");
        tag.innerHTML = `
            ${badgeName} 
            <button type="button" class="remove-tag-btn" title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
        tag.querySelector(".remove-tag-btn").addEventListener("click", () => {
            tag.remove();
            compositionElements = compositionElements.filter((item) => item !== badgeName);
        });

        document.getElementById("elements-container").appendChild(tag);
        badgeNameInput.value = "";
        badgeNameInput.focus();
    }
}

function showToast(creationName) {
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.classList.add("toast-container");
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Création ${creationName} ajouté au produits !
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => toast.remove());
    }, 3000);
}

const postButton = document.getElementById("create-post-btn");
let compositionElements = [];

document.addEventListener("DOMContentLoaded", loadComments);
postButton.addEventListener("click", async () => {
    try {
        const checkAuth = await fetch("/api/get-email");
        const authData = await checkAuth.json();

        if (Array.isArray(authData) && authData.length === 0) {
            document.cookie = "return_to=/community; Path=/";
            window.location.href = "/login";
            return;
        }
    } catch (error) {
        console.error("Erreur lors de la vérification :", error);
        return;
    }

    /* Close Menu */
    const postInfoMenu = document.getElementById("post-modal");
    postInfoMenu.classList.add("show");
    document.body.style.overflow = "hidden";
    const closeButton = document.getElementById("close-modal-btn");
    closeButton.addEventListener("click", () => {
        postInfoMenu.classList.remove("show");
        document.body.style.overflow = "auto";
    });
    window.addEventListener("click", (event) => {
        if (event.target === postInfoMenu) {
            postInfoMenu.classList.remove("show");
            document.body.style.overflow = "auto";
        }
    });

    /* Upload Picture */
    const uploadImgBtn = document.getElementById("upload-img-btn");
    const fileInput = document.getElementById("post-image-file");
    const imageUrlInput = document.getElementById("post-image");

    uploadImgBtn.addEventListener("click", () => {
        fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imageUrlInput.value = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    /* Add Badges */
    const addBadgeElementBtn = document.getElementById("add-element-btn");
    addBadgeElementBtn.addEventListener("click", addBadgeElement);

    /* Create Post */
    const postForm = document.getElementById("new-post-form");
    postForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const imageLink = document.getElementById("post-image").value;
        const description = document.getElementById("post-description").value;
        if (compositionElements.length === 0) {
            alert("N'oublie pas d'ajouter au moins un élément à ta composition !");
            return;
        }
        const postData = {
            image: imageLink,
            articles: compositionElements,
            description: description
        };
        try {
            const response = await fetch("/api/create-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData)
            });
            if (response.ok) {
                document.getElementById("post-modal").classList.remove("show");
                document.body.style.overflow = "auto";
                window.location.reload();
            } else {
                alert("Une erreur est survenue lors de la publication.");
            }
        } catch (error) {
            console.error("Erreur API - Add New Post :", error);
        }
    });
});

// MENU CREATION

document.addEventListener("DOMContentLoaded", () => {
    const btnCompositions = document.getElementById("btn-compositions");
    const btnCreations = document.getElementById("btn-creations");
    const feedZone = document.getElementById("view-composition");
    const creationZone = document.getElementById("view-creation");

    // Switch entre les 2 menus
    btnCreations.addEventListener("click", async () => {
        if (window.innerWidth <= 768) {
            const warningModal = document.getElementById("mobile-warning-modal");
            warningModal.classList.add("show");
            document.body.style.overflow = "hidden";
            return;
        }

        try {
            const checkAuth = await fetch("/api/get-email");
            const authData = await checkAuth.json();
            if (Array.isArray(authData) && authData.length === 0) {
                document.cookie = "return_to=/community; Path=/";
                window.location.href = "/login";
                return;
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de connexion :", error);
            return;
        }

        btnCompositions.classList.remove("active");
        btnCreations.classList.add("active");
        feedZone.style.display = "none";
        creationZone.style.display = "block";
        setTimeout(() => {
            if (window.myCreation3D) {
                window.myCreation3D.resizeCanvas();
            }
        }, 10);
    });
    btnCompositions.addEventListener("click", () => {
        btnCreations.classList.remove("active");
        btnCompositions.classList.add("active");
        creationZone.style.display = "none";
        feedZone.style.display = "grid";
    });

    // WARNING MOBILE
    const warningModal = document.getElementById("mobile-warning-modal");
    const closeWarningBtn = document.getElementById("close-warning-btn");
    const understandBtn = document.getElementById("understand-warning-btn");

    function closeWarningModal() {
        warningModal.classList.remove("show");
        document.body.style.overflow = "auto";
    }

    if (warningModal) {
        closeWarningBtn.addEventListener("click", closeWarningModal);
        understandBtn.addEventListener("click", closeWarningModal);
        window.addEventListener("click", (event) => {
            if (event.target === warningModal) closeWarningModal();
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const productButtons = document.querySelectorAll(".part-btn");
    const colorPicker = document.getElementById("piece-color-picker");
    const stickerInput = document.getElementById("sticker-upload");

    const stickerListContainer = document.getElementById("sticker-list-container");
    const placedStickersList = document.getElementById("placed-stickers-list");

    const editPanel = document.getElementById("sticker-edit-panel");
    const editSliderSize = document.getElementById("edit-sticker-size");
    const editSliderSizeInput = document.getElementById("edit-sticker-size-input");
    const editSliderRot = document.getElementById("edit-sticker-rotation");
    const editSliderRotInput = document.getElementById("edit-sticker-rotation-input");
    const editSliderY = document.getElementById("edit-sticker-y");
    const editSliderYInput = document.getElementById("edit-sticker-y-input");
    const editName = document.getElementById("edit-sticker-name");

    const repositionBtn = document.getElementById("reposition-sticker-btn");
    let activeStickerId = null;
    const closeEditPanelBtn = document.getElementById("close-edit-panel-btn");

    if (closeEditPanelBtn) {
        closeEditPanelBtn.addEventListener("click", () => {
            editPanel.style.display = "none";
            const allRows = document.getElementById("placed-stickers-list").children;
            for (let row of allRows) {
                row.style.border = "1px solid transparent";
                row.style.background = "rgba(0,0,0,0.3)";
            }
        });
    }

    // UPLOAD ET PLACEMENT DU STICKER
    if (stickerInput) {
        stickerInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const base64Image = e.target.result;
                    window.myCreation3D.activateStickerMode(base64Image, file.name);
                };
                reader.readAsDataURL(file);
                event.target.value = "";
            }
        });
    }

    window.onStickerPlaced = function (stickerId, fileName) {
        document.getElementById("sticker-list-container").style.display = "block";

        const stickerRow = document.createElement("div");
        stickerRow.dataset.id = stickerId;
        stickerRow.dataset.size = "5";
        stickerRow.dataset.rotation = "0";
        stickerRow.dataset.offsety = "0";

        stickerRow.style.display = "flex";
        stickerRow.style.justifyContent = "space-between";
        stickerRow.style.alignItems = "center";
        stickerRow.style.background = "rgba(0,0,0,0.3)";
        stickerRow.style.padding = "8px 12px";

        stickerRow.style.borderRadius = "6px";
        stickerRow.style.border = "1px solid transparent";
        stickerRow.style.transition = "all 0.2s";

        const nameSpan = document.createElement("span");
        nameSpan.style.fontSize = "0.9rem";
        nameSpan.style.color = "white";
        nameSpan.style.cursor = "pointer";
        nameSpan.style.flexGrow = "1";
        nameSpan.style.transition = "color 0.2s";
        nameSpan.textContent = fileName.length > 15 ? fileName.substring(0, 15) + "..." : fileName;

        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.gap = "10px";

        const trashBtn = document.createElement("button");
        trashBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        trashBtn.style.background = "none";
        trashBtn.style.border = "none";
        trashBtn.style.cursor = "pointer";

        // ACTION: NOM
        nameSpan.addEventListener("click", () => {
            activeStickerId = stickerId;
            editPanel.style.display = "block";
            editName.textContent = fileName.length > 15 ? fileName.substring(0, 15) + "..." : fileName;

            const allRows = document.getElementById("placed-stickers-list").children;
            for (let row of allRows) {
                row.style.border = "1px solid transparent";
                row.style.background = "rgba(0,0,0,0.3)";
            }
            stickerRow.style.border = "1px solid #4ade80";
            stickerRow.style.background = "rgba(74, 222, 128, 0.1)";

            editSliderSize.value = stickerRow.dataset.size;
            editSliderSizeInput.value = stickerRow.dataset.size;
            editSliderRot.value = stickerRow.dataset.rotation;
            editSliderRotInput.value = stickerRow.dataset.rotation;
            editSliderY.value = stickerRow.dataset.offsety || "0";
            editSliderYInput.value = stickerRow.dataset.offsety || "0";
        });

        // ACTION: POUBELLE
        trashBtn.addEventListener("click", () => {
            window.myCreation3D.removeSticker(stickerId);
            stickerRow.remove();
            if (activeStickerId === stickerId) {
                editPanel.style.display = "none";
                activeStickerId = null;
            }
            if (document.getElementById("placed-stickers-list").children.length === 0) {
                document.getElementById("sticker-list-container").style.display = "none";
            }
        });

        actionsDiv.appendChild(trashBtn);
        stickerRow.appendChild(nameSpan);
        stickerRow.appendChild(actionsDiv);
        document.getElementById("placed-stickers-list").appendChild(stickerRow);

        nameSpan.click();
    };

    // ACTION: LES CURSEURS ET INPUTS (Taille & Rotation)
    function applyTransform() {
        if (activeStickerId && window.myCreation3D) {
            const newSize = editSliderSize.value;
            const newRot = editSliderRot.value;
            const newY = editSliderY.value;
            window.myCreation3D.updateStickerTransform(activeStickerId, newSize, newRot, newY);

            const activeRow = document.querySelector(`[data-id="${activeStickerId}"]`);
            if (activeRow) {
                activeRow.dataset.size = newSize;
                activeRow.dataset.rotation = newRot;
                activeRow.dataset.offsety = newY;
            }
        }
    }

    // Synchroniser la Taille
    function syncSize(event) {
        const val = event.target.value;
        editSliderSize.value = val;
        editSliderSizeInput.value = val;
        applyTransform();
    }

    // Synchroniser la Rotation
    function syncRot(event) {
        const val = event.target.value;
        editSliderRot.value = val;
        editSliderRotInput.value = val;
        applyTransform();
    }

    // Synchroniser la Hauteur
    function syncY(event) {
        const val = event.target.value;
        editSliderY.value = val;
        editSliderYInput.value = val;
        applyTransform();
    }

    if (editSliderSize) editSliderSize.addEventListener("input", syncSize);
    if (editSliderSizeInput) editSliderSizeInput.addEventListener("input", syncSize);

    if (editSliderRot) editSliderRot.addEventListener("input", syncRot);
    if (editSliderRotInput) editSliderRotInput.addEventListener("input", syncRot);

    if (editSliderY) editSliderY.addEventListener("input", syncY);
    if (editSliderYInput) editSliderYInput.addEventListener("input", syncY);

    // ACTION: LE BOUTON DÉPLACER
    if (repositionBtn) {
        repositionBtn.addEventListener("click", () => {
            if (activeStickerId && window.myCreation3D) {
                window.myCreation3D.activateRepositionMode(activeStickerId);
            }
        });
    }

    // CHANGEMENT DE PIÈCE
    productButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            productButtons.forEach((button) => button.classList.remove("active"));
            btn.classList.add("active");
            const productType = btn.textContent.toLowerCase();
            const currentColor = colorPicker.value;
            window.myCreation3D.loadModel(`/3DModels/Compressed_files/${productType}.glb`, currentColor);

            window.myCreation3D.clearAllStickers();
            window.myCreation3D.stickerMode = false;

            if (placedStickersList) placedStickersList.innerHTML = "";
            if (stickerListContainer) stickerListContainer.style.display = "none";

            if (editPanel) editPanel.style.display = "none";
            activeStickerId = null;
        });
    });

    // CHANGEMENT DE COULEUR
    colorPicker.addEventListener("input", (event) => {
        const currentColor = event.target.value;
        document.getElementById("hex-value").textContent = currentColor.toUpperCase();
        window.myCreation3D.changeColor(currentColor);
    });

    // Initialisation au lancement (On charge la première pièce)
    const firstActiveBtn = document.querySelector(".part-btn.active");
    if (firstActiveBtn) firstActiveBtn.click();
});

// --- VALIDATION CREATION ---
document.addEventListener("DOMContentLoaded", async () => {
    const validerCreationBtn = document.querySelector(".creation-actions .btn-primary");
    const annulerCreationBtn = document.querySelector(".creation-actions .btn-cancel");

    const validationModal = document.getElementById("validation-modal");
    const closeValidationBtn = document.getElementById("close-validation-btn");
    const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
    const finalConfirmBtn = document.getElementById("final-confirm-btn");

    const recapPart = document.getElementById("recap-part");
    const recapColorSwatch = document.getElementById("recap-color-swatch");
    const recapHex = document.getElementById("recap-hex");
    const creationNameInput = document.getElementById("creation-name-input");
    const colorPicker = document.getElementById("piece-color-picker");

    if (validerCreationBtn) {
        validerCreationBtn.addEventListener("click", () => {
            const activePart = document.querySelector(".part-btn.active");
            if (activePart) {
                recapPart.textContent = activePart.textContent;
            }

            const colorValue = colorPicker.value;
            recapColorSwatch.style.backgroundColor = colorValue;
            recapHex.textContent = colorValue.toUpperCase();

            const stickerCount = document.getElementById("placed-stickers-list").children.length;
            const recapStickersCount = document.getElementById("recap-stickers-count");
            if (recapStickersCount) {
                recapStickersCount.textContent = stickerCount;
            }

            validationModal.classList.add("show");
            document.body.style.overflow = "hidden";
        });
    }

    function closeValidationModal() {
        validationModal.classList.remove("show");
        document.body.style.overflow = "auto";
    }

    if (closeValidationBtn) closeValidationBtn.addEventListener("click", closeValidationModal);
    if (confirmCancelBtn) confirmCancelBtn.addEventListener("click", closeValidationModal);

    window.addEventListener("click", (event) => {
        if (event.target === validationModal) closeValidationModal();
    });

    // ACTION: CONFIRMER & SAUVEGARDER
    if (finalConfirmBtn) {
        finalConfirmBtn.addEventListener("click", async () => {
            const nomCreation = creationNameInput.value.trim();
            if (nomCreation === "") {
                alert("Veuillez donner un nom à votre création !");
                return;
            }

            const typePiece = document.querySelector(".part-btn.active").textContent;
            const couleurHex = colorPicker.value;

            let stickersToSave = [];
            if (window.myCreation3D && window.myCreation3D.placedStickers) {
                stickersToSave = window.myCreation3D.placedStickers.map((sticker) => {
                    return {
                        name: sticker.imageUrl,
                        size: parseFloat(sticker.currentSize),
                        rotation: parseFloat(sticker.currentRotation),
                        offsetY: parseFloat(sticker.currentOffsetY),
                        aspectRatio: sticker.aspectRatio,
                        position: {
                            x: sticker.position.x,
                            y: sticker.position.y,
                            z: sticker.position.z
                        },
                        baseOrientation: {
                            x: sticker.baseOrientation.x,
                            y: sticker.baseOrientation.y,
                            z: sticker.baseOrientation.z
                        }
                    };
                });
            }
            const screenshotBase64 = window.myCreation3D ? window.myCreation3D.takeScreenshot() : null;

            const stickersData = {
                type: typePiece,
                name: nomCreation,
                hex_color: couleurHex,
                images: stickersToSave,
                image_creation: screenshotBase64
            };
            const response = await fetch("/api/add-creation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stickersData)
            });

            if (response.ok) {
                closeValidationModal();
                creationNameInput.value = "";
                showToast(nomCreation);
            } else {
                alert("Erreur lors de la sauvegarde !");
            }
        });
    }

    // ACTION BOUTON "Annuler"
    if (annulerCreationBtn) {
        annulerCreationBtn.addEventListener("click", () => {
            if (confirm("Êtes-vous sûr de vouloir réinitialiser votre création ?")) {
                if (window.myCreation3D) window.myCreation3D.clearAllStickers();
                document.getElementById("placed-stickers-list").innerHTML = "";
                document.getElementById("sticker-list-container").style.display = "none";
                document.getElementById("sticker-edit-panel").style.display = "none";

                colorPicker.value = "#ffffff";
                document.getElementById("hex-value").textContent = "#FFFFFF";
                if (window.myCreation3D) window.myCreation3D.changeColor("#ffffff");
            }
        });
    }
});
