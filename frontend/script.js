// ================================
// ✅ Firebase Initialization
// ================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("🔥 script.js loaded");

let auth = null;
let googleProvider = null;

async function initializeFirebase() {
  try {
    console.log("🔄 Fetching Firebase config from backend...");
    const res = await fetch('/api/config/firebase');
    const firebaseConfig = await res.json();
    console.log("✅ Firebase config received:", firebaseConfig);

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
  }
}

(async () => {
  console.log("🚀 Before Firebase init");
  await initializeFirebase();
  console.log("✅ After Firebase init");
})();

// =====================================================
// ✅ Global Config
// =====================================================
const API_URL = "/api";

// =====================================================
// ✅ Utility: Show error/success messages
// =====================================================
function showMessage(message, formElement, type = 'error') {
  const existingMsg = formElement.querySelector('.message');
  if (existingMsg) existingMsg.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}-message`;
  msgDiv.style.padding = '10px';
  msgDiv.style.marginTop = '10px';
  msgDiv.style.borderRadius = '5px';
  msgDiv.style.color = type === 'error' ? 'red' : 'green';
  msgDiv.style.backgroundColor = type === 'error' ? '#ffe6e6' : '#e6ffe6';
  msgDiv.textContent = message;

  formElement.appendChild(msgDiv);
  setTimeout(() => msgDiv.remove(), 5000);
}

// =====================================================
// ✅ Form Elements
// =====================================================
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const otpLoginForm = document.getElementById('otpLoginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const formTitle = document.getElementById('formTitle');

function hideAllForms() {
  [loginForm, signupForm, otpLoginForm, forgotPasswordForm].forEach(f => f?.classList.add('hidden'));
}

// =====================================================
// ✅ GOOGLE SIGN-IN — FINAL FIX (REAL OAUTH TOKEN)
// =====================================================
async function handleGoogleSignIn() {
  console.log("═══════════════════════════");
  console.log("🔵 Google Sign-In Triggered");
  console.log("═══════════════════════════");

  try {
    if (!auth || !googleProvider) {
      throw new Error("Firebase not initialized. Please refresh the page.");
    }

    console.log("🔓 Opening Google popup...");
    const result = await signInWithPopup(auth, googleProvider);

    // ✅ Extract Google OAuth ID Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const googleIdToken = credential?.idToken;

    if (!googleIdToken) {
      console.error("❌ Could not extract Google token. Result:", result);
      throw new Error("Could not obtain Google OAuth ID Token.");
    }

    console.log("✅ Google OAuth ID Token:", googleIdToken.substring(0, 15) + "...");

    // ✅ Send REAL Google token to backend
    const response = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: googleIdToken }),
    });

    const data = await response.json();
    console.log("📥 Backend Response:", data);

    if (response.ok && data.success) {
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data));

      alert("✅ Login Successful");
      window.location.href = "index.html";
    } else {
      alert("❌ Google Login Failed: " + data.message);
    }

  } catch (err) {
    console.error("❌ Google Sign-in Error:", err);
    alert("Google Sign-In failed: " + err.message);
  }
}

document.getElementById("googleLogin")?.addEventListener("click", handleGoogleSignIn);
document.getElementById("googleSignup")?.addEventListener("click", handleGoogleSignIn);

// =====================================================
// ✅ FORM SWITCHING
// =====================================================
document.getElementById('switchToSignup')?.addEventListener('click', e => {
  e.preventDefault();
  hideAllForms();
  signupForm.classList.remove('hidden');
  formTitle.textContent = 'Sign Up';
});

document.getElementById('switchToLogin')?.addEventListener('click', e => {
  e.preventDefault();
  hideAllForms();
  loginForm.classList.remove('hidden');
  formTitle.textContent = 'Login';
});

document.getElementById('otpLoginBtn')?.addEventListener('click', () => {
  hideAllForms();
  otpLoginForm.classList.remove('hidden');
  formTitle.textContent = 'Login with OTP';
});

document.getElementById('backToLogin')?.addEventListener('click', e => {
  e.preventDefault();
  hideAllForms();
  loginForm.classList.remove('hidden');
  formTitle.textContent = 'Login';
});

document.getElementById('forgotPassword')?.addEventListener('click', e => {
  e.preventDefault();
  hideAllForms();
  forgotPasswordForm.classList.remove('hidden');
  formTitle.textContent = 'Reset Password';
});

document.getElementById('backToLoginFromReset')?.addEventListener('click', e => {
  e.preventDefault();
  hideAllForms();
  loginForm.classList.remove('hidden');
  formTitle.textContent = 'Login';
});

// =====================================================
// ✅ EMAIL/PASSWORD LOGIN
// =====================================================
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = loginForm.loginEmail.value.trim();
  const password = loginForm.loginPassword.value;

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (response.ok && data.success) {
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data));
    window.location.href = "index.html";
  } else {
    showMessage(data.message, loginForm);
  }
});

// =====================================================
// ✅ SIGNUP
// =====================================================
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = signupForm.signupName.value.trim();
  const email = signupForm.signupEmail.value.trim();
  const phone = signupForm.signupPhone.value.trim();
  const password = signupForm.signupPassword.value;

  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, password }),
  });

  const data = await response.json();

  if (response.ok && data.success) {
    alert("✅ Account created! Please login.");
    hideAllForms();
    loginForm.classList.remove("hidden");
  } else {
    showMessage(data.message, signupForm);
  }
});

// =====================================================
// ✅ OTP LOGIN
// =====================================================
document.getElementById("sendOtpBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("otpEmail").value.trim();

  const res = await fetch(`${API_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById("otpInputGroup").classList.remove("hidden");
    document.getElementById("verifyOtpBtn").classList.remove("hidden");
    showMessage("OTP sent!", otpLoginForm, "success");
  } else {
    showMessage(data.message, otpLoginForm);
  }
});

otpLoginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = otpLoginForm.otpEmail.value.trim();
  const otp = otpLoginForm.otpCode.value.trim();

  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();

  if (res.ok && data.success) {
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data));
    window.location.href = "index.html";
  } else {
    showMessage(data.message, otpLoginForm);
  }
});

// =====================================================
// ✅ FORGOT PASSWORD + RESET
// =====================================================
document.getElementById("sendResetOtpBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("resetEmail").value.trim();

  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (res.ok && data.success) {
    showMessage("Reset OTP sent!", forgotPasswordForm, "success");
    document.getElementById("resetOtpGroup").classList.remove("hidden");
    document.getElementById("newPasswordGroup").classList.remove("hidden");
    document.getElementById("resetPasswordBtn").classList.remove("hidden");
  } else {
    showMessage(data.message, forgotPasswordForm);
  }
});

forgotPasswordForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = forgotPasswordForm.resetEmail.value.trim();
  const otp = forgotPasswordForm.resetOtpCode.value.trim();
  const newPassword = forgotPasswordForm.newPassword.value;

  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  const data = await res.json();

  if (res.ok && data.success) {
    alert("✅ Password reset successful.");
    hideAllForms();
    loginForm.classList.remove("hidden");
  } else {
    showMessage(data.message, forgotPasswordForm);
  }
});

// =====================================================
// ✅ Already logged-in redirect
// =====================================================
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (token && window.location.pathname.includes("login.html")) {
    if (confirm("You are already logged in. Go to home page?")) {
      window.location.href = "index.html";
    }
  }
});
