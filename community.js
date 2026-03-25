async function addToComment(postInfo) {
    const articleElement = document.createElement("article");
    articleElement.classList.add("post-card", "glass-card");

    /* HEADER */
    const postHeader = document.createElement("div");
    postHeader.classList.add("post-header");

    const userImg = document.createElement("img");
    userImg.src = "https://placehold.co/40x40/3b82f6/white?text=S"; // A CHANGER
    userImg.alt = "Avatar";
    userImg.classList.add("post-avatar");
    
    const userInfoDiv = document.createElement("div");
    userInfoDiv.classList.add("post-user-info");
    const userInfosQuery = await fetch(`/api/get-user-info?id=${postInfo.user_id}`);
    if (userInfosQuery.ok) {
        const userInfos = await userInfosQuery.json();
        const usernameSpan = document.createElement("span");
        usernameSpan.classList.add("post-username");
        usernameSpan.textContent = userInfos.username;
        userInfoDiv.appendChild(usernameSpan);
    }
    const dateSpan = document.createElement("span");
    dateSpan.classList.add("post-time");
    dateSpan.textContent = `Il y a ${postInfo.date}`;

    userInfoDiv.appendChild(dateSpan);
    postHeader.appendChild(userImg);
    postHeader.appendChild(userInfoDiv);

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

    document.getElementById("community-feed").append(articleElement);
}

document.addEventListener("DOMContentLoaded", async () => {
    const serverResponse = await fetch("/api/loadInspiComments");
    if (serverResponse.ok) {
        const responseInfo = await serverResponse.json();
        document.getElementById("community-feed").innerHTML = "";
        for (const comment of responseInfo) {
            addToComment(comment);
        }
    }
});