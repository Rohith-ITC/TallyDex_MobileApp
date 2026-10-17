/* ==========================================================================
   Tally DEx — Customer Login
   Handles: login / OTP step flow, password visibility, resend countdown,
   API calls (same endpoint shapes as the DataLynkr customer portal).
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- API helper (relative in dev, portal API in production) ---- */

  function isLocalHost() {
    var h = window.location.hostname || "";
    return (
      h === "localhost" || h === "127.0.0.1" ||
      h.indexOf("192.168.") === 0 || h.indexOf("10.") === 0 || h.indexOf("172.") === 0 ||
      window.location.protocol === "file:"
    );
  }

  function apiBase() {
    return isLocalHost() ? "" : "https://itcatalystindia.com/Development/CustomerPortal_API";
  }

  async function apiPost(path, body) {
    var res = await fetch(apiBase() + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  function redirect(path) {
    var target = path.charAt(0) === "/" ? path : "/" + path;
    (window.top && window.top !== window ? window.top : window).location.href = target;
  }

  function applyLoginResponse(data) {
    sessionStorage.setItem("name", String(data.name || ""));
    sessionStorage.setItem("email", String(data.email || ""));
    sessionStorage.setItem("token", String(data.token || ""));
    if (data.user_type) sessionStorage.setItem("user_type", String(data.user_type));
    // first login, or logging in with a system-generated password → force a change
    if (data.must_change_password || data.first_login) {
      window.location.href = "changepswd.html";
      return;
    }
    redirect("/admin-dashboard");
  }

  /* ---------- elements -------------------------------------------------- */

  var column = document.getElementById("formColumn");
  var form = document.getElementById("loginForm");
  var formFields = column.querySelector(".form-fields");
  var auxLinks = column.querySelector(".aux-links");
  var brandTitle = document.getElementById("brandTitle");
  var nameInput = document.getElementById("name");
  var emailInput = document.getElementById("email");
  var mobileInput = document.getElementById("mobile");
  var codeInput = document.getElementById("signupCode");
  var passwordInput = document.getElementById("password");
  var otpInput = document.getElementById("otp");
  var toggleBtn = document.getElementById("togglePassword");
  var loginBtn = document.getElementById("loginBtn");
  var gotoOtpBtn = document.getElementById("gotoOtpBtn");
  var sendOtpBtn = document.getElementById("sendOtpBtn");
  var verifyOtpBtn = document.getElementById("verifyOtpBtn");
  var resendOtpBtn = document.getElementById("resendOtpBtn");
  var signupBtn = document.getElementById("signupBtn");
  var resetBtn = document.getElementById("resetBtn");
  var gotoSignupBtn = document.getElementById("gotoSignupBtn");
  var gotoForgotBtn = document.getElementById("gotoForgotBtn");
  var backToLogin = document.getElementById("backToLogin");
  var messageBox = document.getElementById("message");

  var resendTimer = null;
  var resendSecondsLeft = 0;
  var resetTimer = null;
  var messageTimer = null;

  var TITLES = {
    signup: "Sign Up",
    forgot: "Reset Password"
  };

  /* ---------- step handling --------------------------------------------- */

  // restart the element's CSS entrance animation from the top
  function replayAnimation(el) {
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth; // force reflow
    el.style.animation = "";
  }

  function setStep(step, animate) {
    column.setAttribute("data-step", step);
    // hidden attributes keep pre-CSS flashes away; sync them with the step
    column.querySelectorAll("[data-show]").forEach(function (el) {
      var show = el.getAttribute("data-show").split(" ").indexOf(step) !== -1;
      el.hidden = !show;
      // required only when visible so native validation matches the step
      // ([data-optional] fields stay optional even on their own step)
      var input = el.querySelector && el.querySelector("input");
      if (input && !el.hasAttribute("data-optional")) input.required = show;
    });
    if (TITLES[step]) brandTitle.textContent = TITLES[step];
    else brandTitle.innerHTML = 'Tally <span class="accent">DEx</span>';

    if (animate === false) return;
    // the staggered entrance delays belong to first paint only — a step swap
    // should fade its fields and links up together, right away
    auxLinks.classList.remove("delay-400");
    replayAnimation(formFields);
    replayAnimation(auxLinks);
  }

  function validate(input) {
    if (input.checkValidity()) return true;
    input.reportValidity();
    return false;
  }

  function showMessage(type, text, autoHideMs) {
    if (messageTimer) { clearTimeout(messageTimer); messageTimer = null; }
    messageBox.className = "message " + type;
    messageBox.textContent = text;
    messageBox.hidden = false;
    replayAnimation(messageBox);
    // OTP confirmations fade out on their own, same as the DataLynkr portal
    if (autoHideMs) messageTimer = setTimeout(clearMessage, autoHideMs);
  }

  function clearMessage() {
    if (messageTimer) { clearTimeout(messageTimer); messageTimer = null; }
    messageBox.hidden = true;
    messageBox.textContent = "";
  }

  function setBusy(btn, busy, busyLabel, idleLabel) {
    btn.disabled = busy;
    btn.textContent = busy ? busyLabel : idleLabel;
  }

  /* ---------- password visibility --------------------------------------- */

  toggleBtn.addEventListener("click", function () {
    var visible = passwordInput.type === "text";
    passwordInput.type = visible ? "password" : "text";
    toggleBtn.setAttribute("aria-pressed", String(!visible));
    toggleBtn.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    toggleBtn.querySelector("span").textContent = visible ? "visibility" : "visibility_off";
  });

  /* ---------- resend countdown ------------------------------------------ */

  function paintResendBtn() {
    if (resendSecondsLeft > 0) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.classList.add("is-waiting");
      resendOtpBtn.textContent = "Resend OTP (" + resendSecondsLeft + "s)";
    } else {
      resendOtpBtn.disabled = false;
      resendOtpBtn.classList.remove("is-waiting");
      resendOtpBtn.textContent = "Resend OTP";
    }
  }

  function startResendCountdown() {
    resendSecondsLeft = 60;
    if (resendTimer) clearInterval(resendTimer);
    resendTimer = setInterval(function () {
      resendSecondsLeft -= 1;
      if (resendSecondsLeft <= 0) {
        resendSecondsLeft = 0;
        clearInterval(resendTimer);
        resendTimer = null;
      }
      paintResendBtn();
    }, 1000);
    paintResendBtn();
  }

  /* ---------- actions ---------------------------------------------------- */

  async function doLogin() {
    if (!emailInput.value || !passwordInput.value) return;
    clearMessage();
    setBusy(loginBtn, true, "Logging in...", "Login");
    try {
      var data = await apiPost("/api/login", {
        email: emailInput.value,
        password: passwordInput.value
      });
      if (data && data.token) applyLoginResponse(data);
      else throw new Error("Invalid response from server");
    } catch (err) {
      showMessage("error", err.message || "Invalid email or password");
    } finally {
      setBusy(loginBtn, false, "Logging in...", "Login");
    }
  }

  function enterVerifyStep(message) {
    setStep("verify-otp");
    // an in-flight cooldown survives a trip back to the login step, so resume
    // it rather than handing out a fresh 60s window
    if (resendSecondsLeft > 0) paintResendBtn();
    else startResendCountdown();
    showMessage("success", message, 5000);
    otpInput.focus();
  }

  async function doSendOtp() {
    if (!validate(emailInput)) return;
    clearMessage();
    setBusy(sendOtpBtn, true, "Sending OTP...", "Send OTP");
    try {
      await apiPost("/api/login/send-otp", { email: emailInput.value });
      enterVerifyStep("OTP Sent to Email");
    } catch (err) {
      // no portal API when previewing from localhost / file:// — keep walking
      // the flow so the verify step behaves like the DataLynkr demo
      if (isLocalHost()) enterVerifyStep("OTP Sent to Email");
      else showMessage("error", err.message || "Could not send OTP");
    } finally {
      setBusy(sendOtpBtn, false, "Sending OTP...", "Send OTP");
    }
  }

  async function doResendOtp() {
    if (resendOtpBtn.disabled) return;
    clearMessage();
    try {
      await apiPost("/api/login/send-otp", { email: emailInput.value });
      startResendCountdown();
      showMessage("success", "OTP Resent to Email", 5000);
    } catch (err) {
      if (isLocalHost()) {
        startResendCountdown();
        showMessage("success", "OTP Resent to Email", 5000);
      } else {
        showMessage("error", err.message || "Could not resend OTP");
      }
    }
  }

  async function doVerifyOtp() {
    if (!otpInput.value || otpInput.value.length !== 6) {
      showMessage("error", "OTP must be 6 digits.");
      return;
    }
    clearMessage();
    setBusy(verifyOtpBtn, true, "Verifying...", "Verify OTP");
    try {
      var data = await apiPost("/api/login/verify-otp", {
        email: emailInput.value,
        otp: otpInput.value
      });
      if (data && data.token) applyLoginResponse(data);
      else throw new Error("Invalid or expired OTP");
    } catch (err) {
      showMessage("error", err.message || "OTP verification failed");
    } finally {
      setBusy(verifyOtpBtn, false, "Verifying...", "Verify OTP");
    }
  }

  async function doSignup() {
    if (!validate(nameInput) || !validate(emailInput) || !validate(mobileInput)) return;
    clearMessage();
    setBusy(signupBtn, true, "Signing up...", "Sign Up");
    try {
      await apiPost("/api/signup", {
        name: nameInput.value,
        email: emailInput.value,
        mobile: mobileInput.value,
        code: codeInput.value
      });
      showMessage("success", "Sign Up Successful! Check Your Email for the Password");
    } catch (err) {
      showMessage("error", err.message || "Could not complete sign up");
    } finally {
      setBusy(signupBtn, false, "Signing up...", "Sign Up");
    }
  }

  function startResetCountdown() {
    var remaining = 60;
    resetBtn.disabled = true;
    resetBtn.classList.add("is-waiting");
    resetBtn.textContent = "Reset Password (" + remaining + "s)";
    if (resetTimer) clearInterval(resetTimer);
    resetTimer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(resetTimer);
        resetTimer = null;
        resetBtn.disabled = false;
        resetBtn.classList.remove("is-waiting");
        resetBtn.textContent = "Reset Password";
      } else {
        resetBtn.textContent = "Reset Password (" + remaining + "s)";
      }
    }, 1000);
  }

  async function doResetPassword() {
    if (resetBtn.disabled) return;
    if (!validate(emailInput) || !validate(mobileInput)) return;
    clearMessage();
    setBusy(resetBtn, true, "Sending...", "Reset Password");
    try {
      // the new password is generated server-side and sent to this email / mobile
      await apiPost("/api/forgot-password", {
        email: emailInput.value,
        mobile: mobileInput.value
      });
      showMessage("success", "New Password Sent to Your Email and Mobile");
      startResetCountdown();
    } catch (err) {
      showMessage("error", err.message || "Could not send a new password");
      setBusy(resetBtn, false, "Sending...", "Reset Password");
    }
  }

  /* ---------- wiring ------------------------------------------------------ */

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var step = column.getAttribute("data-step");
    if (step === "password") doLogin();
    else if (step === "request-otp") doSendOtp();
    else if (step === "verify-otp") doVerifyOtp();
    else if (step === "signup") doSignup();
    else if (step === "forgot") doResetPassword();
  });

  gotoOtpBtn.addEventListener("click", function () {
    clearMessage();
    setStep("request-otp");
  });

  resendOtpBtn.addEventListener("click", doResendOtp);

  gotoSignupBtn.addEventListener("click", function () {
    clearMessage();
    setStep("signup");
  });

  gotoForgotBtn.addEventListener("click", function () {
    clearMessage();
    setStep("forgot");
  });

  backToLogin.addEventListener("click", function () {
    clearMessage();
    passwordInput.value = "";
    otpInput.value = "";
    nameInput.value = "";
    mobileInput.value = "";
    codeInput.value = "";
    // the resend cooldown keeps ticking in the background — same as DataLynkr
    if (resetTimer) { clearInterval(resetTimer); resetTimer = null; }
    resetBtn.disabled = false;
    resetBtn.classList.remove("is-waiting");
    resetBtn.textContent = "Reset Password";
    setStep("password");
  });

  // already authenticated? go straight to the dashboard
  if (sessionStorage.getItem("token") && sessionStorage.getItem("email")) {
    redirect("/admin-dashboard");
  }

  setStep("password", false); // first paint keeps the staggered page entrance

  /* ---------- poster overlay --------------------------------------------- */

  // the <picture> covers the video until the first frame is on screen, then
  // fades out; if playback never starts it simply stays as a static poster
  (function () {
    var video = document.getElementById("vizVideo");
    var poster = document.getElementById("vizPoster");
    if (!video || !poster) return;

    var hide = function () { poster.classList.add("is-hidden"); };

    video.addEventListener("playing", hide);
    // deferred script — playback may already have started by the time we attach
    if (!video.paused && video.currentTime > 0) hide();
  })();

  /* ---------- reduced motion: pause the SVG packet animations ------------ */

  var viz = document.getElementById("dexViz");
  if (viz && viz.pauseAnimations) {
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var sync = function () {
      if (mq.matches) viz.pauseAnimations();
      else viz.unpauseAnimations();
    };
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
  }
})();
