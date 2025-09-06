// ShuttleStats v2 - Login & Sign Up System with Firebase Authentication
console.log("login.js loaded");

// Import Firebase services
import {
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
} from "../config/firebase-config.js";

(function () {
  // Validation utilities
  const ValidationUtils = {
    isValidEmail: (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    hasUppercase: (str) => /[A-Z]/.test(str),
    hasNumber: (str) => /\d/.test(str),
    isValidPassword: (password) => {
      return (
        password.length >= 6 &&
        ValidationUtils.hasUppercase(password) &&
        ValidationUtils.hasNumber(password)
      );
    },

    showFieldError: (fieldId, message) => {
      const errorElement = document.getElementById(fieldId + "Error");
      const inputElement = document.getElementById(fieldId);

      if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.classList.add("show");
        inputElement.classList.add("error");
        inputElement.classList.remove("success");
      }
    },

    hideFieldError: (fieldId) => {
      const errorElement = document.getElementById(fieldId + "Error");
      const inputElement = document.getElementById(fieldId);

      if (errorElement && inputElement) {
        errorElement.classList.remove("show");
        inputElement.classList.remove("error");
        inputElement.classList.add("success");
      }
    },

    clearFieldValidation: (fieldId) => {
      const errorElement = document.getElementById(fieldId + "Error");
      const inputElement = document.getElementById(fieldId);

      if (errorElement && inputElement) {
        errorElement.classList.remove("show");
        inputElement.classList.remove("error", "success");
      }
    },
  };

  // Password strength checker
  const PasswordStrength = {
    getStrength: (password) => {
      let score = 0;
      if (password.length >= 6) score += 1;
      if (ValidationUtils.hasUppercase(password)) score += 1;
      if (ValidationUtils.hasNumber(password)) score += 1;
      if (password.length >= 12) score += 1;

      if (score === 0) return "none";
      if (score === 1) return "weak";
      if (score === 2) return "fair";
      if (score === 3) return "good";
      return "strong";
    },

    updateStrengthDisplay: (password, prefix = "signup-") => {
      const strength = PasswordStrength.getStrength(password);
      const strengthText = document.getElementById(prefix + "strengthText");
      const strengthFill = document.getElementById(prefix + "strengthFill");
      const lengthReq = document.getElementById(prefix + "lengthReq");
      const uppercaseReq = document.getElementById(prefix + "uppercaseReq");
      const numberReq = document.getElementById(prefix + "numberReq");

      if (!strengthText || !strengthFill) return;

      // Update strength text and fill
      strengthFill.className = "password-strength-fill strength-" + strength;

      const strengthTexts = {
        none: "Enter password",
        weak: "Weak password",
        fair: "Fair password",
        good: "Good password",
        strong: "Strong password",
      };

      strengthText.textContent = strengthTexts[strength] || "";
      strengthText.className = "strength-text strength-" + strength + "-text";

      // Update requirements
      if (lengthReq) {
        const lengthIcon = lengthReq.querySelector(".requirement-icon");
        if (password.length >= 6) {
          lengthIcon.classList.remove("requirement-unmet");
          lengthIcon.classList.add("requirement-met");
        } else {
          lengthIcon.classList.remove("requirement-met");
          lengthIcon.classList.add("requirement-unmet");
        }
      }

      if (uppercaseReq) {
        const uppercaseIcon = uppercaseReq.querySelector(".requirement-icon");
        if (ValidationUtils.hasUppercase(password)) {
          uppercaseIcon.classList.remove("requirement-unmet");
          uppercaseIcon.classList.add("requirement-met");
        } else {
          uppercaseIcon.classList.remove("requirement-met");
          uppercaseIcon.classList.add("requirement-unmet");
        }
      }

      if (numberReq) {
        const numberIcon = numberReq.querySelector(".requirement-icon");
        if (ValidationUtils.hasNumber(password)) {
          numberIcon.classList.remove("requirement-unmet");
          numberIcon.classList.add("requirement-met");
        } else {
          numberIcon.classList.remove("requirement-met");
          numberIcon.classList.add("requirement-unmet");
        }
      }
    },
  };

  // Form Toggle System
  const FormToggle = {
    updateFormPrompt: (isLoginForm) => {
      const authSwitchText = document.getElementById("authSwitchText");
      const authSwitchLink = document.getElementById("authSwitchLink");

      if (!authSwitchText || !authSwitchLink) return;

      if (isLoginForm) {
        // Login form is visible - prompt to sign up
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = "Sign up";
      } else {
        // Sign-up form is visible - prompt to sign in
        authSwitchText.textContent = "Already have an account?";
        authSwitchLink.textContent = "Sign in";
      }
    },

    showSignUp: () => {
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      const authHeader = document.getElementById("authSubtitle");

      if (loginForm && signupForm) {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");

        if (authHeader) {
          authHeader.textContent = "Create your account";
        }

        // Update the dynamic prompt text
        FormToggle.updateFormPrompt(false); // false = sign-up form is visible

        console.log("Switched to sign-up form");
      }
    },

    showLogin: () => {
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      const authHeader = document.getElementById("authSubtitle");

      if (loginForm && signupForm) {
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");

        if (authHeader) {
          authHeader.textContent = "Sign in to your account";
        }

        // Reset sign-up form
        SignUpForm.resetForm();

        // Update the dynamic prompt text
        FormToggle.updateFormPrompt(true); // true = login form is visible

        console.log("Switched to login form");
      }
    },
  };

  // Sign Up Form Handler
  const SignUpForm = {
    validationState: {
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      confirmPassword: false,
      role: false,
      coachEmail: true, // Default to true, only required when player has coach
    },

    init: () => {
      const form = document.getElementById("signupForm");
      if (!form) return;

      // Bind event listeners
      SignUpForm.bindFieldValidation();
      SignUpForm.bindPasswordToggles();
      SignUpForm.bindRoleChange();
      SignUpForm.bindCoachSelection();

      // Form submission
      form.addEventListener("submit", SignUpForm.handleSubmit);

      console.log("Sign-up form initialized");
    },

    bindFieldValidation: () => {
      // First Name validation
      const firstName = document.getElementById("signup-firstName");
      if (firstName) {
        firstName.addEventListener("blur", () =>
          SignUpForm.validateFirstName()
        );
        firstName.addEventListener("input", () => {
          if (firstName.value.trim()) {
            ValidationUtils.clearFieldValidation("signup-firstName");
            SignUpForm.validationState.firstName = true;
          } else {
            SignUpForm.validationState.firstName = false;
          }
          SignUpForm.checkFormValidity();
        });
      }

      // Last Name validation
      const lastName = document.getElementById("signup-lastName");
      if (lastName) {
        lastName.addEventListener("blur", () => SignUpForm.validateLastName());
        lastName.addEventListener("input", () => {
          if (lastName.value.trim()) {
            ValidationUtils.clearFieldValidation("signup-lastName");
            SignUpForm.validationState.lastName = true;
          } else {
            SignUpForm.validationState.lastName = false;
          }
          SignUpForm.checkFormValidity();
        });
      }

      // Email validation
      const email = document.getElementById("signup-email");
      if (email) {
        email.addEventListener("blur", () => SignUpForm.validateEmail());
        email.addEventListener("input", () => {
          const value = email.value.trim();
          if (value && ValidationUtils.isValidEmail(value)) {
            ValidationUtils.clearFieldValidation("signup-email");
            SignUpForm.validationState.email = true;
          } else if (value) {
            SignUpForm.validationState.email = false;
          } else {
            ValidationUtils.clearFieldValidation("signup-email");
            SignUpForm.validationState.email = false;
          }
          SignUpForm.checkFormValidity();
        });
      }

      // Password validation
      const password = document.getElementById("signup-password");
      if (password) {
        password.addEventListener("input", () => {
          const value = password.value;
          PasswordStrength.updateStrengthDisplay(value);

          if (value && ValidationUtils.isValidPassword(value)) {
            ValidationUtils.clearFieldValidation("signup-password");
            SignUpForm.validationState.password = true;
          } else if (value) {
            SignUpForm.validationState.password = false;
          } else {
            ValidationUtils.clearFieldValidation("signup-password");
            SignUpForm.validationState.password = false;
          }

          // Revalidate confirm password when password changes
          SignUpForm.validateConfirmPassword();
          SignUpForm.checkFormValidity();
        });

        password.addEventListener("focus", () => {
          const container = document.getElementById(
            "signup-passwordStrengthContainer"
          );
          if (container) container.style.display = "block";
        });

        password.addEventListener("blur", () => SignUpForm.validatePassword());
      }

      // Confirm Password validation
      const confirmPassword = document.getElementById("signup-confirmPassword");
      if (confirmPassword) {
        confirmPassword.addEventListener("blur", () =>
          SignUpForm.validateConfirmPassword()
        );
        confirmPassword.addEventListener("input", () => {
          const password = document.getElementById("signup-password");
          if (password && confirmPassword.value === password.value) {
            ValidationUtils.clearFieldValidation("signup-confirmPassword");
            SignUpForm.validationState.confirmPassword = true;
          } else if (confirmPassword.value) {
            SignUpForm.validationState.confirmPassword = false;
          } else {
            ValidationUtils.clearFieldValidation("signup-confirmPassword");
            SignUpForm.validationState.confirmPassword = false;
          }
          SignUpForm.checkFormValidity();
        });
      }

      // Role validation
      const role = document.getElementById("signup-role");
      if (role) {
        role.addEventListener("change", () => {
          if (role.value) {
            ValidationUtils.clearFieldValidation("signup-role");
            SignUpForm.validationState.role = true;
          } else {
            SignUpForm.validationState.role = false;
          }
          SignUpForm.checkFormValidity();
        });

        role.addEventListener("blur", () => SignUpForm.validateRole());
      }

      // Coach Email validation
      const coachEmail = document.getElementById("signup-coachEmail");
      if (coachEmail) {
        coachEmail.addEventListener("blur", () =>
          SignUpForm.validateCoachEmail()
        );
        coachEmail.addEventListener("input", () => {
          const hasCoachRadio = document.getElementById("signup-hasCoach");
          if (!hasCoachRadio || !hasCoachRadio.checked) {
            SignUpForm.validationState.coachEmail = true;
            SignUpForm.checkFormValidity();
            return;
          }

          const value = coachEmail.value.trim();
          if (value && ValidationUtils.isValidEmail(value)) {
            ValidationUtils.clearFieldValidation("signup-coachEmail");
            SignUpForm.validationState.coachEmail = true;
          } else if (value) {
            SignUpForm.validationState.coachEmail = false;
          } else {
            ValidationUtils.clearFieldValidation("signup-coachEmail");
            SignUpForm.validationState.coachEmail = false;
          }
          SignUpForm.checkFormValidity();
        });
      }
    },

    bindPasswordToggles: () => {
      // Password toggle
      const passwordToggle = document.getElementById("signup-passwordToggle");
      const passwordInput = document.getElementById("signup-password");
      if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener("click", () => {
          if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordToggle.textContent = "🙈";
          } else {
            passwordInput.type = "password";
            passwordToggle.textContent = "👁️";
          }
        });
      }

      // Confirm Password toggle
      const confirmToggle = document.getElementById(
        "signup-confirmPasswordToggle"
      );
      const confirmInput = document.getElementById("signup-confirmPassword");
      if (confirmToggle && confirmInput) {
        confirmToggle.addEventListener("click", () => {
          if (confirmInput.type === "password") {
            confirmInput.type = "text";
            confirmToggle.textContent = "🙈";
          } else {
            confirmInput.type = "password";
            confirmToggle.textContent = "👁️";
          }
        });
      }
    },

    bindRoleChange: () => {
      const roleSelect = document.getElementById("signup-role");
      const coachSelectionGroup = document.getElementById(
        "signup-coachSelectionGroup"
      );
      const coachEmailGroup = document.getElementById("signup-coachEmailGroup");

      if (roleSelect && coachSelectionGroup) {
        roleSelect.addEventListener("change", (e) => {
          if (e.target.value === "player") {
            coachSelectionGroup.style.display = "block";
          } else {
            coachSelectionGroup.style.display = "none";
            coachEmailGroup.style.display = "none";

            // Clear coach-related validation
            ValidationUtils.clearFieldValidation("signup-coachEmail");
            SignUpForm.validationState.coachEmail = true; // Not required for coaches

            // Clear radio button selections
            const hasCoachRadio = document.getElementById("signup-hasCoach");
            const noCoachRadio = document.getElementById("signup-noCoach");
            if (hasCoachRadio) hasCoachRadio.checked = false;
            if (noCoachRadio) noCoachRadio.checked = false;
          }
          SignUpForm.checkFormValidity();
        });
      }
    },

    bindCoachSelection: () => {
      const hasCoachRadio = document.getElementById("signup-hasCoach");
      const noCoachRadio = document.getElementById("signup-noCoach");
      const coachEmailGroup = document.getElementById("signup-coachEmailGroup");

      if (hasCoachRadio && coachEmailGroup) {
        hasCoachRadio.addEventListener("change", (e) => {
          if (e.target.checked) {
            coachEmailGroup.style.display = "block";
            SignUpForm.validationState.coachEmail = false; // Now required
            SignUpForm.checkFormValidity();
          }
        });
      }

      if (noCoachRadio && coachEmailGroup) {
        noCoachRadio.addEventListener("change", (e) => {
          if (e.target.checked) {
            coachEmailGroup.style.display = "none";
            ValidationUtils.clearFieldValidation("signup-coachEmail");

            // Clear coach email input
            const coachEmailInput =
              document.getElementById("signup-coachEmail");
            if (coachEmailInput) coachEmailInput.value = "";

            SignUpForm.validationState.coachEmail = true; // Not required
            SignUpForm.checkFormValidity();
          }
        });
      }
    },

    validateFirstName: () => {
      const firstName = document.getElementById("signup-firstName");
      if (!firstName) return false;

      const value = firstName.value.trim();
      if (!value) {
        ValidationUtils.showFieldError(
          "signup-firstName",
          "First name is required"
        );
        SignUpForm.validationState.firstName = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-firstName");
      SignUpForm.validationState.firstName = true;
      return true;
    },

    validateLastName: () => {
      const lastName = document.getElementById("signup-lastName");
      if (!lastName) return false;

      const value = lastName.value.trim();
      if (!value) {
        ValidationUtils.showFieldError(
          "signup-lastName",
          "Last name is required"
        );
        SignUpForm.validationState.lastName = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-lastName");
      SignUpForm.validationState.lastName = true;
      return true;
    },

    validateEmail: () => {
      const email = document.getElementById("signup-email");
      if (!email) return false;

      const value = email.value.trim();
      if (!value) {
        ValidationUtils.showFieldError("signup-email", "Email is required");
        SignUpForm.validationState.email = false;
        return false;
      }

      if (!ValidationUtils.isValidEmail(value)) {
        ValidationUtils.showFieldError(
          "signup-email",
          "Please enter a valid email address"
        );
        SignUpForm.validationState.email = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-email");
      SignUpForm.validationState.email = true;
      return true;
    },

    validatePassword: () => {
      const password = document.getElementById("signup-password");
      if (!password) return false;

      const value = password.value;
      if (!value) {
        ValidationUtils.showFieldError(
          "signup-password",
          "Password is required"
        );
        SignUpForm.validationState.password = false;
        return false;
      }

      if (!ValidationUtils.isValidPassword(value)) {
        ValidationUtils.showFieldError(
          "signup-password",
          "Password must contain at least 1 uppercase letter and 1 number"
        );
        SignUpForm.validationState.password = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-password");
      SignUpForm.validationState.password = true;
      return true;
    },

    validateConfirmPassword: () => {
      const password = document.getElementById("signup-password");
      const confirmPassword = document.getElementById("signup-confirmPassword");
      if (!password || !confirmPassword) return false;

      const passwordValue = password.value;
      const confirmValue = confirmPassword.value;

      if (!confirmValue) {
        if (passwordValue) {
          ValidationUtils.showFieldError(
            "signup-confirmPassword",
            "Please confirm your password"
          );
          SignUpForm.validationState.confirmPassword = false;
        } else {
          ValidationUtils.clearFieldValidation("signup-confirmPassword");
          SignUpForm.validationState.confirmPassword = false;
        }
        return false;
      }

      if (passwordValue !== confirmValue) {
        ValidationUtils.showFieldError(
          "signup-confirmPassword",
          "Passwords do not match"
        );
        SignUpForm.validationState.confirmPassword = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-confirmPassword");
      SignUpForm.validationState.confirmPassword = true;
      return true;
    },

    validateRole: () => {
      const role = document.getElementById("signup-role");
      if (!role) return false;

      const value = role.value;
      if (!value) {
        ValidationUtils.showFieldError(
          "signup-role",
          "Please select your role"
        );
        SignUpForm.validationState.role = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-role");
      SignUpForm.validationState.role = true;
      return true;
    },

    validateCoachEmail: () => {
      const hasCoachRadio = document.getElementById("signup-hasCoach");
      const coachEmail = document.getElementById("signup-coachEmail");

      // If player doesn't have a coach, this field is not required
      if (!hasCoachRadio || !hasCoachRadio.checked) {
        SignUpForm.validationState.coachEmail = true;
        return true;
      }

      if (!coachEmail) return false;

      const value = coachEmail.value.trim();
      if (!value) {
        ValidationUtils.showFieldError(
          "signup-coachEmail",
          "Coach email is required"
        );
        SignUpForm.validationState.coachEmail = false;
        return false;
      }

      if (!ValidationUtils.isValidEmail(value)) {
        ValidationUtils.showFieldError(
          "signup-coachEmail",
          "Please enter a valid email address"
        );
        SignUpForm.validationState.coachEmail = false;
        return false;
      }

      ValidationUtils.hideFieldError("signup-coachEmail");
      SignUpForm.validationState.coachEmail = true;
      return true;
    },

    checkFormValidity: () => {
      const isValid = Object.values(SignUpForm.validationState).every(
        (state) => state === true
      );
      const submitButton = document.getElementById("signup-submit");

      if (submitButton) {
        submitButton.disabled = !isValid;
      }

      return isValid;
    },

    collectFormData: () => {
      const firstName = document
        .getElementById("signup-firstName")
        ?.value.trim();
      const middleName =
        document.getElementById("signup-middleName")?.value.trim() || null;
      const lastName = document.getElementById("signup-lastName")?.value.trim();
      const email = document.getElementById("signup-email")?.value.trim();
      const password = document.getElementById("signup-password")?.value;
      const role = document.getElementById("signup-role")?.value;
      const hasCoachRadio = document.getElementById("signup-hasCoach");
      const coachEmail =
        document.getElementById("signup-coachEmail")?.value.trim() || null;

      return {
        name: {
          first: firstName,
          middle: middleName,
          last: lastName,
        },
        email: email,
        password: password, // Will be hashed in backend
        role: role,
        coachEmail: hasCoachRadio?.checked && coachEmail ? coachEmail : null,
        status: "pending", // For future coach approval system
      };
    },

    handleSubmit: async (e) => {
      e.preventDefault();

      // Validate all fields one final time
      const validations = [
        SignUpForm.validateFirstName(),
        SignUpForm.validateLastName(),
        SignUpForm.validateEmail(),
        SignUpForm.validatePassword(),
        SignUpForm.validateConfirmPassword(),
        SignUpForm.validateRole(),
        SignUpForm.validateCoachEmail(),
      ];

      const isFormValid = validations.every((result) => result === true);

      if (!isFormValid) {
        console.log("Form validation failed");
        return;
      }

      // Show loading state
      const submitButton = document.getElementById("signup-submit");
      if (submitButton) {
        submitButton.classList.add("loading");
        submitButton.disabled = true;
      }

      try {
        // Collect form data
        const userData = SignUpForm.collectFormData();

        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );

        const userId = userCredential.user.uid;

        // Create user document in Firestore
        await setDoc(doc(db, "users", userId), {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          coachEmail: userData.coachEmail,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log("User created successfully:", userId);

        // Show success message
        if (typeof showToast === "function") {
          showToast(
            `Account created successfully! Welcome ${userData.name.first}!`,
            "success"
          );
        } else {
          alert(
            `Account created successfully!\n\nWelcome ${userData.name.first}!`
          );
        }

        // Reset form and return to login
        SignUpForm.resetForm();
        FormToggle.showLogin();

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          if (userData.role === "coach") {
            window.location.href = "coach-dashboard.html";
          } else {
            window.location.href = "player-dashboard.html";
          }
        }, 1000);
      } catch (error) {
        console.error("Error creating user:", error);

        // Handle specific Firebase Auth errors
        let errorMessage = "Failed to create account. Please try again.";

        switch (error.code) {
          case "auth/email-already-in-use":
            errorMessage = "An account with this email address already exists.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "auth/operation-not-allowed":
            errorMessage =
              "Email/password accounts are not enabled. Please contact support.";
            break;
          case "auth/weak-password":
            errorMessage =
              "Password is too weak. Please choose a stronger password.";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error. Please check your internet connection.";
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred.";
        }

        if (typeof showToast === "function") {
          showToast(errorMessage, "error");
        } else {
          alert(errorMessage);
        }
      } finally {
        // Remove loading state
        if (submitButton) {
          submitButton.classList.remove("loading");
          submitButton.disabled = false;
        }
      }
    },

    resetForm: () => {
      const form = document.getElementById("signupForm");
      if (form) {
        form.reset();

        // Clear all validation states
        SignUpForm.validationState = {
          firstName: false,
          lastName: false,
          email: false,
          password: false,
          confirmPassword: false,
          role: false,
          coachEmail: true,
        };

        // Clear all field validations
        const fieldIds = [
          "signup-firstName",
          "signup-lastName",
          "signup-email",
          "signup-password",
          "signup-confirmPassword",
          "signup-role",
          "signup-coachEmail",
        ];

        fieldIds.forEach((fieldId) => {
          ValidationUtils.clearFieldValidation(fieldId);
        });

        // Hide dynamic sections
        const coachSelectionGroup = document.getElementById(
          "signup-coachSelectionGroup"
        );
        const coachEmailGroup = document.getElementById(
          "signup-coachEmailGroup"
        );
        const strengthContainer = document.getElementById(
          "signup-passwordStrengthContainer"
        );

        if (coachSelectionGroup) coachSelectionGroup.style.display = "none";
        if (coachEmailGroup) coachEmailGroup.style.display = "none";
        if (strengthContainer) strengthContainer.style.display = "none";

        // Reset password toggles
        const passwordToggle = document.getElementById("signup-passwordToggle");
        const confirmToggle = document.getElementById(
          "signup-confirmPasswordToggle"
        );
        if (passwordToggle) passwordToggle.textContent = "👁️";
        if (confirmToggle) confirmToggle.textContent = "👁️";

        // Disable submit button
        const submitButton = document.getElementById("signup-submit");
        if (submitButton) submitButton.disabled = true;

        console.log("Sign-up form reset");
      }
    },
  };

  // Login Form Handler
  const LoginForm = {
    init: () => {
      const form = document.getElementById("loginForm");
      if (!form) return;

      // Bind form submission
      form.addEventListener("submit", LoginForm.handleSubmit);

      // Bind Google Sign-In
      const googleBtn = document.getElementById("googleSignInBtn");
      if (googleBtn) {
        googleBtn.addEventListener("click", LoginForm.handleGoogleSignIn);
      }

      console.log("Login form initialized");
    },

    handleSubmit: async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        if (typeof showToast === "function") {
          showToast("Please enter both email and password", "error");
        } else {
          alert("Please enter both email and password");
        }
        return;
      }

      // Show loading state
      const submitButton = document.getElementById("authSubmitBtn");
      if (submitButton) {
        submitButton.classList.add("loading");
        submitButton.disabled = true;
      }

      try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));

        if (!userDoc.exists()) {
          throw new Error("User data not found. Please contact support.");
        }

        const userData = userDoc.data();
        console.log("Login successful:", userData);

        // Store user data in session storage
        sessionStorage.setItem("currentUserId", userId);
        sessionStorage.setItem("userRole", userData.role);
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({ id: userId, ...userData })
        );

        // Show success message
        if (typeof showToast === "function") {
          showToast(`Welcome back, ${userData.name.first}!`, "success");
        }

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          if (userData.role === "coach") {
            window.location.href = "coach-dashboard.html";
          } else {
            window.location.href = "player-dashboard.html";
          }
        }, 1000);
      } catch (error) {
        console.error("Error signing in:", error);

        // Handle specific Firebase Auth errors
        let errorMessage = "Failed to sign in. Please try again.";

        switch (error.code) {
          case "auth/user-disabled":
            errorMessage =
              "This account has been disabled. Please contact support.";
            break;
          case "auth/user-not-found":
            errorMessage = "No account found with this email address.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Please try again.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "auth/too-many-requests":
            errorMessage =
              "Too many failed login attempts. Please try again later.";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error. Please check your internet connection.";
            break;
          case "auth/invalid-credential":
            errorMessage =
              "Invalid email or password. Please check your credentials.";
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred.";
        }

        if (typeof showToast === "function") {
          showToast(errorMessage, "error");
        } else {
          alert(errorMessage);
        }
      } finally {
        // Remove loading state
        if (submitButton) {
          submitButton.classList.remove("loading");
          submitButton.disabled = false;
        }
      }
    },

    handleGoogleSignIn: async (e) => {
      e.preventDefault();

      // Show loading state
      const googleBtn = document.getElementById("googleSignInBtn");
      if (googleBtn) {
        googleBtn.style.opacity = "0.7";
        googleBtn.style.pointerEvents = "none";
      }

      try {
        // Sign in with Google
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user document exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        let userData;

        if (!userDoc.exists()) {
          // First time Google sign-in, create user document
          const nameParts = user.displayName
            ? user.displayName.split(" ")
            : ["User"];
          userData = {
            name: {
              first: nameParts[0] || "User",
              middle:
                nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : null,
              last: nameParts[nameParts.length - 1] || "",
            },
            email: user.email,
            role: "player", // Default role for Google sign-in
            coachEmail: null,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await setDoc(userDocRef, userData);
          console.log("New Google user created:", userData);
        } else {
          userData = userDoc.data();
          console.log("Existing Google user signed in:", userData);
        }

        // Store user data in session storage
        sessionStorage.setItem("currentUserId", user.uid);
        sessionStorage.setItem("userRole", userData.role);
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({ id: user.uid, ...userData })
        );

        // Show success message
        if (typeof showToast === "function") {
          showToast(`Welcome back, ${userData.name.first}!`, "success");
        }

        // Redirect to appropriate dashboard
        setTimeout(() => {
          if (userData.role === "coach") {
            window.location.href = "coach-dashboard.html";
          } else {
            window.location.href = "player-dashboard.html";
          }
        }, 1000);
      } catch (error) {
        console.error("Error with Google sign-in:", error);

        let errorMessage = "Failed to sign in with Google. Please try again.";

        switch (error.code) {
          case "auth/popup-closed-by-user":
            errorMessage = "Sign-in cancelled. Please try again.";
            break;
          case "auth/popup-blocked":
            errorMessage =
              "Popup blocked by browser. Please allow popups and try again.";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error. Please check your internet connection.";
            break;
          default:
            errorMessage =
              error.message ||
              "An unexpected error occurred during Google sign-in.";
        }

        if (typeof showToast === "function") {
          showToast(errorMessage, "error");
        } else {
          alert(errorMessage);
        }
      } finally {
        // Remove loading state
        if (googleBtn) {
          googleBtn.style.opacity = "1";
          googleBtn.style.pointerEvents = "auto";
        }
      }
    },
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize both forms
    SignUpForm.init();
    LoginForm.init();

    // Bind the single toggle link to handle both directions
    const authSwitchLink = document.getElementById("authSwitchLink");
    if (authSwitchLink) {
      authSwitchLink.addEventListener("click", (e) => {
        e.preventDefault();

        // Check which form is currently visible
        const loginForm = document.getElementById("loginForm");
        const signupForm = document.getElementById("signupForm");

        if (loginForm && !loginForm.classList.contains("hidden")) {
          // Login form is visible, switch to sign-up
          FormToggle.showSignUp();
        } else if (signupForm && !signupForm.classList.contains("hidden")) {
          // Sign-up form is visible, switch to login
          FormToggle.showLogin();
        }
      });
    }

    // Initialize with correct prompt text (login form is shown by default)
    FormToggle.updateFormPrompt(true);

    console.log("Login & Sign-up system with Firebase initialized");
  });
})();
