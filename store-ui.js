import { isSupabaseConfigured } from "./supabase-config.js";
import { getStoreSession, supabase } from "./supabase-client.js";
import { categories as localCategories, products as localProducts } from "./store-catalog.js";

const categoryTabs = document.querySelector("#category-tabs");
const productGrid = document.querySelector("#product-grid");
const shopCount = document.querySelector("#shop-count");
const storeStatus = document.querySelector("#store-status");
const bagLink = document.querySelector(".bag-link");
const cartDialog = document.querySelector("#cart-dialog");
const quizDialog = document.querySelector("#quiz-dialog");
const journalDialog = document.querySelector("#journal-dialog");
const authDialog = document.querySelector("#auth-dialog");
const cartContent = document.querySelector("#cart-content");
const cartSubtotal = document.querySelector("#cart-subtotal");
const checkoutButton = document.querySelector("#checkout-button");
const checkoutFeedback = document.querySelector("#checkout-feedback");
const quizForm = document.querySelector("#quiz-form");
const quizResult = document.querySelector("#quiz-result");
const journalMatch = document.querySelector("#journal-match");
const journalOrders = document.querySelector("#journal-orders");

// Auth Elements
const authForm = document.querySelector("#auth-form");
const authTitle = document.querySelector("#auth-title");
const authEmailInput = document.querySelector("#auth-email");
const authPasswordInput = document.querySelector("#auth-password");
const authSubmitBtn = document.querySelector("#auth-submit");
const authSubmitText = document.querySelector("#auth-submit-text");
const authFeedback = document.querySelector("#auth-feedback");
const authSuccess = document.querySelector("#auth-success");
const authTabs = document.querySelector("#auth-tabs");
const authLinkingNote = document.querySelector("#auth-linking-note");
const authToggleBtn = document.querySelector("#auth-toggle-btn");
const authToggleText = document.querySelector("#auth-toggle-text");
const authLoggedInView = document.querySelector("#auth-logged-in-view");
const authUserEmailDisplay = document.querySelector("#auth-user-email");
const logoutBtn = document.querySelector("#logout-btn");

let user;
let storeData;
let categories = [...localCategories];
let products = [...localProducts];
let cartItems = [];
let orders = [];
let latestMatch = null;
let selectedCategory = "all";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

let currentAuthMode = "signin";

function setAuthMode(mode) {
  currentAuthMode = mode;
  clearAuthMessages();

  const isSignUp = mode === "signup";
  if (authTitle) authTitle.textContent = isSignUp ? "Create account" : "Sign in";
  if (authSubmitText) authSubmitText.textContent = isSignUp ? "Create account" : "Sign in";
  if (authLinkingNote) authLinkingNote.hidden = !isSignUp;
  if (authToggleText) authToggleText.textContent = isSignUp ? "Already have an account?" : "Don't have an account yet?";
  if (authToggleBtn) authToggleBtn.textContent = isSignUp ? "Sign in" : "Create one";

  authTabs?.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    const isSelected = tab.dataset.authTab === mode;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
  });
}

function clearAuthMessages() {
  if (authFeedback) {
    authFeedback.textContent = "";
    authFeedback.hidden = true;
  }
  if (authSuccess) {
    authSuccess.textContent = "";
    authSuccess.hidden = true;
  }
}

function showAuthError(message) {
  if (!authFeedback) return;
  authFeedback.textContent = message;
  authFeedback.hidden = false;
  if (authSuccess) authSuccess.hidden = true;
}

function showAuthSuccess(message) {
  if (!authSuccess) return;
  authSuccess.textContent = message;
  authSuccess.hidden = false;
  if (authFeedback) authFeedback.hidden = true;
}

function setAuthLoading(loading) {
  if (authSubmitBtn) {
    authSubmitBtn.disabled = loading;
    if (authSubmitText) {
      if (loading) {
        authSubmitText.textContent = currentAuthMode === "signup" ? "Creating account..." : "Signing in...";
      } else {
        authSubmitText.textContent = currentAuthMode === "signup" ? "Create account" : "Sign in";
      }
    }
  }
  if (authEmailInput) authEmailInput.disabled = loading;
  if (authPasswordInput) authPasswordInput.disabled = loading;
}

function updateAccountUI(currentUser) {
  const isEmailUser = Boolean(currentUser && !currentUser.is_anonymous && currentUser.email);
  const email = currentUser?.email || "";

  document.querySelectorAll(".account-btn").forEach((btn) => {
    btn.classList.toggle("is-authenticated", isEmailUser);
    const label = btn.querySelector(".account-btn-label");
    if (label) {
      label.textContent = isEmailUser ? email.split("@")[0] : "Sign in";
      label.title = isEmailUser ? email : "Sign in";
    }
    btn.setAttribute("aria-label", isEmailUser ? `Account, ${email}` : "Sign in to your account");
  });

  document.querySelectorAll(".mobile-nav-account").forEach((btn) => {
    btn.textContent = isEmailUser ? `Account (${email.split("@")[0]})` : "Sign in";
  });

  if (authLoggedInView && authForm && authTabs) {
    if (isEmailUser) {
      authForm.hidden = true;
      authTabs.hidden = true;
      if (authLinkingNote) authLinkingNote.hidden = true;
      authLoggedInView.hidden = false;
      if (authUserEmailDisplay) authUserEmailDisplay.textContent = email;
      if (authTitle) authTitle.textContent = "Your account";
    } else {
      authForm.hidden = false;
      authTabs.hidden = false;
      authLoggedInView.hidden = true;
      setAuthMode(currentAuthMode);
    }
  }
}

function formatAuthError(error) {
  if (!error) return "An unexpected error occurred.";
  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();

  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Your email has not been confirmed yet. Please check your inbox and click the verification link.";
  }
  if (code === "user_already_exists" || msg.includes("user already registered") || msg.includes("already exists")) {
    return "An account with this email already exists. Switch to Sign in above to log in.";
  }
  if (msg.includes("weak_password") || msg.includes("at least 6 characters") || msg.includes("password should be")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code === "over_email_send_rate_limit" || msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Email rate limit reached for this hour. If you just created an account, check your inbox or wait a moment.";
  }
  if (code === "email_address_invalid" || msg.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  return error.message || "Authentication failed. Please try again.";
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);
}

function responsiveImage(image, alt, sizes) {
  const source = String(image || "");
  const base = source.endsWith(".webp") ? source.slice(0, -5) : null;
  const srcset = base
    ? ` srcset="${escapeHtml(`${base}-640.webp 640w, ${base}-1280.webp 1280w, ${source} 1800w`)}"`
    : "";
  return `<img src="${escapeHtml(source)}"${srcset} sizes="${sizes}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
}

function setStatus(message, isError = false) {
  if (!storeStatus) return;
  storeStatus.textContent = message;
  storeStatus.classList.toggle("is-error", isError);
}

function showDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function renderCategories() {
  const tabs = [{ id: "all", name: "All" }, ...categories];
  categoryTabs.innerHTML = tabs.map((category) => `
    <button class="category-tab${category.id === selectedCategory ? " is-selected" : ""}"
      type="button" data-category="${escapeHtml(category.id)}" aria-pressed="${category.id === selectedCategory}">
      ${escapeHtml(category.name)}
    </button>`).join("");
}

function renderProducts() {
  const visibleProducts = selectedCategory === "all"
    ? products
    : products.filter((product) => product.categoryId === selectedCategory);
  if (shopCount) shopCount.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"}`;
  if (!visibleProducts.length) {
    productGrid.innerHTML = `<p class="catalog-message">${products.length ? "No products in this category yet." : "No products are available in this category."}</p>`;
    return;
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="store-product">
      <div class="store-product-image">${responsiveImage(product.image, product.imageAlt || product.name, "(max-width: 760px) 42vw, 22vw")}</div>
      <p class="store-product-category">${escapeHtml(categoryNames.get(product.categoryId) || "Rosaliaaa")}</p>
      <h3>${escapeHtml(product.name)}</h3>
      ${product.shade ? `<p class="store-product-shade"><span class="shade-swatch" style="--shade:${escapeHtml(product.shade.color)}"></span>${escapeHtml(product.shade.name)}</p>` : ""}
      <p class="store-product-description">${escapeHtml(product.description)}</p>
      <div class="store-product-buy"><span class="store-product-price">${formatPrice(product.price)}</span>
        <button type="button" data-add-product="${escapeHtml(product.id)}">Add to bag</button>
      </div>
    </article>`).join("");
}

function renderCart() {
  const count = cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  bagLink.querySelector(".bag-count").textContent = String(count);
  bagLink.setAttribute("aria-label", `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`);
  checkoutButton.disabled = cartItems.length === 0;
  if (!cartItems.length) {
    cartContent.innerHTML = `<p class="catalog-message">${user ? "Your bag is empty." : "Enable Supabase anonymous sign-in to save your bag."}</p>`;
  } else {
    cartContent.innerHTML = cartItems.map((item) => `
      <article class="cart-line">
        ${responsiveImage(item.image, "", "64px")}
        <div><h3>${escapeHtml(item.name)}</h3><p>${Number(item.quantity)} × ${formatPrice(item.price)}</p></div>
        <button class="cart-remove" type="button" data-remove-product="${escapeHtml(item.id)}">Remove</button>
      </article>`).join("");
  }
  const subtotal = cartItems.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
  cartSubtotal.textContent = formatPrice(subtotal);
}

function renderMatch(match, heading = "Your latest match") {
  if (!match) {
    journalMatch.innerHTML = '<p class="catalog-message">Your first match will appear here.</p>';
    return;
  }
  journalMatch.innerHTML = `
    <div class="match-card">${responsiveImage(match.image, "", "84px")}
      <div><h4>${escapeHtml(match.name)}</h4><p>${escapeHtml(match.description || "A Rosaliaaa pick from your product match.")}</p></div>
    </div>`;
  if (quizResult) {
    quizResult.innerHTML = `<h3>${escapeHtml(heading)}</h3>${journalMatch.innerHTML}
      <button class="text-link quiz-match-add" type="button" data-add-product="${escapeHtml(match.productId || match.id)}">Add to bag <span aria-hidden="true">↗</span></button>`;
  }
}

function renderOrders() {
  if (!orders.length) {
    journalOrders.innerHTML = '<p class="catalog-message">No past orders yet.</p>';
    return;
  }
  journalOrders.innerHTML = orders.map((order) => {
    const date = order.createdAt ? new Date(order.createdAt) : null;
    const dateText = date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date) : "Recently placed";
    const itemText = order.items.map((item) => `${Number(item.quantity)} × ${escapeHtml(item.name)}`).join(", ");
    return `<article class="order-entry"><strong>${formatPrice(order.subtotal)}</strong><p>${dateText} · ${itemText}</p><p>Status: ${escapeHtml(order.status || "placed")}</p></article>`;
  }).join("");
}

function getRecommendation(answers) {
  return [...products].sort((first, second) => {
    const score = (product) => (product.categoryId === answers.category ? 4 : 0)
      + (product.tags?.includes(answers.mood) ? 2 : 0)
      + (product.tags?.includes(answers.need) ? 1 : 0);
    return score(second) - score(first) || first.name.localeCompare(second.name);
  })[0];
}

async function handleStoreError(error) {
  console.error("Rosaliaaa store error:", error);
  const message = error.code === "42501" || error.status === 403
    ? "Supabase rejected this request. Check the project's RLS policies and anonymous sign-in setting."
    : error.message || "The store could not reach Supabase. Check the project configuration and database migration.";
  setStatus(message, true);
}

categoryTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  selectedCategory = button.dataset.category;
  renderCategories();
  renderProducts();
});

productGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (button) addProductToCart(button.dataset.addProduct, button);
});

quizResult?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (button) addProductToCart(button.dataset.addProduct, button);
});

async function addProductToCart(productId, button) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  if (!user || !storeData) {
    setStatus("The catalog is ready. Enable Supabase anonymous sign-in to save your bag and orders.", true);
    return;
  }
  button.disabled = true;
  try {
    await storeData.addCartItem(user.id, product);
    button.textContent = "Added";
  } catch (error) {
    await handleStoreError(error);
  } finally {
    button.disabled = false;
  }
}

cartContent.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove-product]");
  if (!button || !user || !storeData) return;
  button.disabled = true;
  try {
    await storeData.removeCartItem(user.id, button.dataset.removeProduct);
  } catch (error) {
    await handleStoreError(error);
    button.disabled = false;
  }
});

bagLink?.addEventListener("click", (event) => {
  event.preventDefault();
  showDialog(cartDialog);
});

document.querySelectorAll("[data-open-auth]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    clearAuthMessages();
    if (user && !user.is_anonymous) {
      updateAccountUI(user);
    } else {
      setAuthMode("signin");
    }
    showDialog(authDialog);
  });
});

authTabs?.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-auth-tab]");
  if (!tab) return;
  setAuthMode(tab.dataset.authTab);
});

authToggleBtn?.addEventListener("click", () => {
  setAuthMode(currentAuthMode === "signin" ? "signup" : "signin");
});

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = authEmailInput?.value?.trim();
  const password = authPasswordInput?.value;

  if (!email || !password) return;

  setAuthLoading(true);
  clearAuthMessages();

  try {
    const { supabase } = await getStoreSession();

    if (currentAuthMode === "signup") {
      // Step 3: Link the current anonymous session so user.id remains identical!
      if (user && user.is_anonymous) {
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          email,
          password,
        });

        if (updateError) throw updateError;

        const updatedUser = updateData.user;
        user = updatedUser;
        updateAccountUI(user);

        if (updatedUser && !updatedUser.email_confirmed_at) {
          showAuthSuccess(
            `Account created! A confirmation link has been sent to ${email}. Check your inbox to complete verification.`
          );
        } else {
          showAuthSuccess("Account created and linked to your bag and journal!");
          setTimeout(() => authDialog?.close(), 1600);
        }
      } else {
        const { data: signData, error: signError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signError) throw signError;

        if (signData.user && !signData.user.email_confirmed_at) {
          showAuthSuccess(
            `Account created! A confirmation link has been sent to ${email}. Check your inbox to confirm your email.`
          );
        } else {
          showAuthSuccess("Account created successfully!");
          setTimeout(() => authDialog?.close(), 1600);
        }
      }
    } else {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      user = signInData.user;
      updateAccountUI(user);
      showAuthSuccess("Signed in successfully!");
      setTimeout(() => authDialog?.close(), 1200);
    }
  } catch (err) {
    showAuthError(formatAuthError(err));
  } finally {
    setAuthLoading(false);
  }
});

logoutBtn?.addEventListener("click", async () => {
  if (logoutBtn) logoutBtn.disabled = true;
  clearAuthMessages();
  try {
    const { supabase } = await getStoreSession();
    await supabase.auth.signOut();

    // Immediately re-establish a fresh anonymous session
    const { data: anonData } = await supabase.auth.signInAnonymously();
    user = anonData?.user;
    updateAccountUI(user);

    cartItems = [];
    orders = [];
    latestMatch = null;
    renderCart();
    renderOrders();
    renderMatch(null);

    setStatus("Signed out. New visitor session created.");
    authDialog?.close();
  } catch (err) {
    console.error("Sign out error:", err);
    showAuthError("Failed to sign out. Please try again.");
  } finally {
    if (logoutBtn) logoutBtn.disabled = false;
  }
});

document.querySelectorAll("[data-open-quiz]").forEach((button) => button.addEventListener("click", () => {
  quizResult.innerHTML = "";
  showDialog(quizDialog);
}));
document.querySelectorAll("[data-open-journal]").forEach((button) => button.addEventListener("click", () => {
  renderMatch(latestMatch);
  renderOrders();
  showDialog(journalDialog);
}));
document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));

quizForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!products.length) {
    quizResult.textContent = "There are no products to match right now.";
    return;
  }
  const answers = Object.fromEntries(new FormData(quizForm));
  const product = getRecommendation(answers);
  if (!product) return;
  latestMatch = { ...product, productId: product.id };
  renderMatch(latestMatch, "A match for you");
  if (!user || !storeData) {
    setStatus("Your match is ready. Enable Supabase anonymous sign-in to save it to your journal.", true);
    return;
  }
  try {
    await storeData.saveLatestMatch(user.id, product, answers);
  } catch (error) {
    await handleStoreError(error);
    quizResult.insertAdjacentHTML("beforeend", '<p class="dialog-feedback">The match was found but could not be saved to your journal.</p>');
  }
});

checkoutButton.addEventListener("click", async () => {
  if (!user || !storeData || !cartItems.length) return;
  checkoutButton.disabled = true;
  checkoutFeedback.textContent = "Saving your order...";
  try {
    const order = await storeData.placeOrder(user.id);
    checkoutFeedback.textContent = `Order recorded. Subtotal: ${formatPrice(order.subtotal)}. No payment was collected.`;
  } catch (error) {
    await handleStoreError(error);
    checkoutFeedback.textContent = error.message || "Your order could not be saved.";
  } finally {
    checkoutButton.disabled = cartItems.length === 0;
  }
});

async function initializeStore() {
  if (categoryTabs && productGrid) {
    renderCategories();
    renderProducts();
  }
  renderCart();
  if (!isSupabaseConfigured()) {
    setStatus("Local catalog ready. Configure Supabase to save your cart, journal, and orders.");
    return;
  }
  try {
    const data = await import("./store-data.js");
    storeData = data;
    const session = await getStoreSession();
    user = session.user;
    updateAccountUI(user);
    setStatus(user.is_anonymous ? "Supabase connected. Your cart and journal are tied to this visitor session." : "Connected to your Rosaliaaa account.");

    // Listen to session changes
    session.supabase.auth.onAuthStateChange(async (event, currentSession) => {
      const authUser = currentSession?.user;
      if (authUser) {
        user = authUser;
        updateAccountUI(user);
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (user && !user.is_anonymous && storeData) {
          try {
            await storeData.watchCart(user.id, (items) => {
              cartItems = items;
              renderCart();
            }, handleStoreError);
            await storeData.watchOrders(user.id, (items) => {
              orders = items;
              renderOrders();
            }, handleStoreError);
            latestMatch = await storeData.loadLatestMatch(user.id);
            renderMatch(latestMatch);
          } catch (e) {
            console.error("Error updating user store data:", e);
          }
        }
      }
    });

    try {
      const catalog = await storeData.loadCatalog();
      if (catalog.categories.length && catalog.products.length) {
        categories = catalog.categories;
        products = catalog.products;
        renderCategories();
        renderProducts();
      }
    } catch (error) {
      console.error("Supabase product catalog is not available:", error);
      setStatus("Supabase sign-in works. Apply the SQL migration to load the database catalog; local products are shown meanwhile.", true);
    }

    await storeData.watchCart(user.id, (items) => {
      cartItems = items;
      renderCart();
    }, handleStoreError);
    await storeData.watchOrders(user.id, (items) => {
      orders = items;
      renderOrders();
    }, handleStoreError);
    latestMatch = await storeData.loadLatestMatch(user.id);
    renderMatch(latestMatch);
  } catch (error) {
    await handleStoreError(error);
    setStatus(`Local catalog ready. Supabase sign-in failed: ${error.message}`, true);
  }
}

initializeStore();
