/* ==========================================================================
   Tally DEx — Change Password
   Used on first login and after signing in with a system-generated password.
   Same API helper shape as login.js.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- API helper (relative in dev, portal API in production) ---- */

  function apiBase() {
    var h = window.location.hostname || "";
    var isLocal =
      h === "localhost" || h === "127.0.0.1" ||
      h.indexOf("192.168.") === 0 || h.indexOf("10.") === 0 || h.indexOf("172.") === 0 ||
      window.location.protocol === "file:";
    return isLocal ? "" : "https://itcatalystindia.com/Development/CustomerPortal_API";
  }

  async function apiPost(path, body) {
    var headers = { "Content-Type": "application/json" };
    var token = sessionStorage.getItem("token");
    if (token) headers.Authorization = "Bearer " + token;

    var res = await fetch(apiBase() + path, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body || {})
    });
    var text = await res.text();
    var data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
    if (!res.ok || data.error) {
      throw new Error(String(data.error || data.message || "Request failed: " + res.status));
    }
    return data;
  }

  /* ---------- elements -------------------------------------------------- */

  var form = document.getElementById("changePasswordForm");
  var oldInput = document.getElementById("oldPassword");
  var newInput = document.getElementById("newPassword");
  var confirmInput = document.getElementById("confirmPassword");
  var submitBtn = document.getElementById("changePasswordBtn");
  var messageBox = document.getElementById("message");

  function showMessage(type, text) {
    messageBox.className = "message " + type;
    messageBox.textContent = text;
    messageBox.hidden = false;
  }

  function clearMessage() {
    messageBox.hidden = true;
    messageBox.textContent = "";
  }

  function setBusy(btn, busy, busyLabel, idleLabel) {
    btn.disabled = busy;
    btn.textContent = busy ? busyLabel : idleLabel;
  }

  function validate(input) {
    if (input.checkValidity()) return true;
    input.reportValidity();
    return false;
  }

  /* ---------- password visibility --------------------------------------- */

  document.querySelectorAll("[data-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.getElementById(btn.getAttribute("data-toggle"));
      var visible = input.type === "text";
      input.type = visible ? "password" : "text";
      btn.setAttribute("aria-pressed", String(!visible));
      btn.setAttribute("aria-label", visible ? "Show password" : "Hide password");
      btn.querySelector("span").textContent = visible ? "visibility" : "visibility_off";
    });
  });

  /* ---------- submit ------------------------------------------------------ */

  confirmInput.addEventListener("input", function () {
    confirmInput.setCustomValidity("");
  });

  async function doChangePassword() {
    confirmInput.setCustomValidity("");
    if (!validate(oldInput) || !validate(newInput) || !validate(confirmInput)) return;

    if (newInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity("Passwords don't match");
      confirmInput.reportValidity();
      return;
    }
    if (newInput.value === oldInput.value) {
      showMessage("error", "New password must be different from the old password.");
      return;
    }

    clearMessage();
    setBusy(submitBtn, true, "Saving...", "Change Password");
    try {
      await apiPost("/api/change-password", {
        email: sessionStorage.getItem("email") || "",
        old_password: oldInput.value,
        new_password: newInput.value
      });
      form.hidden = true;
      showMessage("success", "Password Changed Successfully!");
      setTimeout(function () { window.location.href = "login.html"; }, 2000);
    } catch (err) {
      showMessage("error", err.message || "Could not change the password");
      setBusy(submitBtn, false, "Saving...", "Change Password");
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    doChangePassword();
  });
})();
