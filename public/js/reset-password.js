const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
if (!token) {
    window.location.href = "/login";
}

document.getElementById("resetPwdForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const newPwd = document.getElementById("new-password").value;
    const confirmPwd = document.getElementById("confirm-password").value;
    const successMsg = document.getElementById("success-msg");
    const errorMsg = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");

    successMsg.style.display = "none";
    errorMsg.style.display = "none";

    if (newPwd !== confirmPwd) {
        errorMsg.textContent = "Les mots de passe ne correspondent pas.";
        errorMsg.style.display = "block";
        return;
    }
    submitBtn.textContent = "Modification...";
    submitBtn.style.opacity = "0.7";
    submitBtn.disabled = true;

    try {
        const response = await fetch("/api/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({token: token, password: newPwd}) 
        });
        if (response.ok) {
            successMsg.style.display = "block";
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } else {
            const errData = await response.json();
            errorMsg.textContent = errData.message || "Le lien est invalide ou expiré.";
            errorMsg.style.display = "block";
            submitBtn.textContent = "Réinitialiser";
            submitBtn.style.opacity = "1";
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error("Erreur :", error);
        errorMsg.textContent = "Erreur de connexion au serveur.";
        errorMsg.style.display = "block";
        submitBtn.textContent = "Réinitialiser";
        submitBtn.style.opacity = "1";
        submitBtn.disabled = false;
    }
});