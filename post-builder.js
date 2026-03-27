async function addToComment(postInfo, containerId) {
    const articleElement = document.createElement("article");
    articleElement.classList.add("post-card", "glass-card");

    /* HEADER */
    const postHeader = document.createElement("div");
    postHeader.classList.add("post-header");
    
    const userInfoDiv = document.createElement("div");
    userInfoDiv.classList.add("post-user-info");

    const userImg = document.createElement("img");
    const userInfosQuery = await fetch(`/api/get-user-info?id=${postInfo.user_id}`);
    if (userInfosQuery.ok) {
        const userInfos = await userInfosQuery.json();

        userImg.src = userInfos.profil_pic;
        userImg.alt = "Avatar";
        userImg.classList.add("post-avatar");

        const usernameSpan = document.createElement("span");
        usernameSpan.classList.add("post-username");
        usernameSpan.textContent = userInfos.username;
        userInfoDiv.appendChild(usernameSpan);
    }
    const dateSpan = document.createElement("span");
    dateSpan.classList.add("post-time");
    const postDate = new Date(postInfo.date)
    const datePart = postDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const timePart = postDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    }).replace(":", "h");
    dateSpan.textContent = `Posté le ${datePart} à ${timePart}`;

    userInfoDiv.appendChild(dateSpan);
    postHeader.appendChild(userImg);
    postHeader.appendChild(userInfoDiv);

    /* DELETE BUTTON */
    if (currentUserId === postInfo.user_id) {
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn"); 
        deleteButton.style.color = "rgba(248, 113, 113, 0.7)";
        deleteButton.style.marginLeft = "auto";
        deleteButton.style.background = "none";
        deleteButton.style.border = "none";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.transition = "color 0.2s ease, transform 0.2s ease";
        deleteButton.title = "Supprimer mon post";
        deleteButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;

        deleteButton.addEventListener("mouseenter", () => {
            deleteButton.style.color = "#f87171";
            deleteButton.style.transform = "scale(1.1)";
        });
        deleteButton.addEventListener("mouseleave", () => {
            deleteButton.style.color = "rgba(248, 113, 113, 0.7)";
            deleteButton.style.transform = "scale(1)";
        });

        deleteButton.addEventListener("click", async () => {
            if (confirm("Es-tu sûr de vouloir supprimer ce magnifique setup ? L'action est irréversible !")) {
                try {
                    const response = await fetch("/api/delete-post", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({post_id: postInfo.inspi_comment_id})
                    });
                    
                    if (response.ok) {
                        articleElement.remove();
                    } else {
                        alert("Erreur lors de la suppression.");
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        });

        postHeader.appendChild(deleteButton);
    }

    /* IMAGE */
    const postImgDiv = document.createElement("div");
    postImgDiv.classList.add("post-image-container");

    const postImg = document.createElement("img");
    postImg.src = postInfo.image;
    postImg.alt = "Gourde personnalisée";
    postImg.classList.add("post-image");

    postImgDiv.appendChild(postImg);

    /* COMPOSITION */
    const postComposition = document.createElement("div");
    postComposition.classList.add("post-composition");

    const composition = postInfo.articles;
    for (const elem of composition) {
        const elementSpan = document.createElement("span");
        elementSpan.classList.add("comp-tag");
        elementSpan.textContent = elem;
        postComposition.appendChild(elementSpan);
    }

    /* DESCRIPTION */
    const postDescription = document.createElement("div");
    postDescription.classList.add("post-content");
    
    const description = document.createElement("p");
    description.textContent = postInfo.description;
    postDescription.appendChild(description);

    /* DIVIDER */
    const divider = document.createElement("div");
    divider.classList.add("summary-divider");
    divider.style.margin = "15px 0";

    /* ACTIONS */
    /* Likes */
    const actionDiv = document.createElement("div");
    actionDiv.classList.add("post-actions");

    const likeButton = document.createElement("button");
    likeButton.classList.add("action-btn", "like-btn");
    likeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <span>${postInfo.nb_likes}</span>
    `;
    const isLikedFetch = await fetch(`/api/check-like?id=${postInfo.inspi_comment_id}`);
    if (isLikedFetch.ok) {
        const isLiked = await isLikedFetch.json();
        if (isLiked) {
            likeButton.classList.add("liked");
        } else {
            likeButton.classList.remove("liked");
        }
    }
    likeButton.addEventListener("click", async () => {
        try {
            const checkAuth = await fetch("/api/get-email");
            const authData = await checkAuth.json();
            if (Array.isArray(authData) && authData.length === 0) {
                window.location.href = "/login";
                return;
            }
        } catch (error) {
            console.error("Erreur lors de la vérification :", error);
            return;
        }
        const nbLikesSpan = likeButton.querySelector("span"); 
        let currentCount = Number(nbLikesSpan.textContent);
        if (!likeButton.classList.contains("liked")) {
            likeButton.classList.add("liked");
            nbLikesSpan.textContent = currentCount + 1;
            await fetch(`/api/add-like?id=${postInfo.inspi_comment_id}`);
        } else {
            likeButton.classList.remove("liked");
            nbLikesSpan.textContent = currentCount - 1;
            await fetch(`/api/remove-like?id=${postInfo.inspi_comment_id}`);
        }
    });

    /* Comments */
    const commentButton = document.createElement("button");
    commentButton.classList.add("action-btn", "comment-btn");
    commentButton.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <span>${postInfo.nb_comments}</span>
    `;    

    /* Share */
    const shareButton = document.createElement("button");
    shareButton.classList.add("action-btn", "share-btn");
    shareButton.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
    `;

    /* Save */
    const saveButton = document.createElement("button");
    saveButton.classList.add("action-btn", "save-btn");
    saveButton.style.marginLeft = "auto";
    saveButton.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
    `;

    /* Assembly */
    actionDiv.appendChild(likeButton);
    actionDiv.appendChild(commentButton);
    actionDiv.appendChild(shareButton);
    actionDiv.appendChild(saveButton);

    /* GLOBAL ASSEMBLY */
    articleElement.appendChild(postHeader);
    articleElement.appendChild(postImgDiv);
    articleElement.appendChild(postComposition);
    articleElement.appendChild(postDescription);
    articleElement.appendChild(divider);
    articleElement.appendChild(actionDiv);

    document.getElementById(containerId).append(articleElement);
}