async function loadComments() {
    try {
        const userRes = await fetch("/api/current-user-id");
        currentUserId = await userRes.json();
    } catch (error) {
        currentUserId = null;
    }
    const serverResponse = await fetch("/api/loadInspiComments");
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
            compositionElements = compositionElements.filter((item) => item !== valeur);
        });

        document.getElementById("elements-container").appendChild(tag);
        badgeNameInput.value = "";
        badgeNameInput.focus();
    }
}

const postButton = document.getElementById("create-post-btn");
const postCommentButton = document.getElementById("send-comment-btn");
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
