(() => {
  const catalog = window.RIYASAT_PRODUCTS;

  const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
  const safe = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );
  const getCart = () =>
    JSON.parse(localStorage.getItem("riyasat-cart") || "[]");
  const getLikes = () =>
    JSON.parse(localStorage.getItem("riyasat-likes") || "[]");

  async function loadSharedLayout() {
    const headerTarget = document.querySelector("[data-shared-header]");
    const footerTarget = document.querySelector("[data-shared-footer]");

    if (!headerTarget || !footerTarget) {
      throw new Error(
        "Shared header and footer placeholders are required on every page.",
      );
    }

    const [headerResponse, footerResponse] = await Promise.all([
      fetch("site-header.html"),
      fetch("site-footer.html"),
    ]);

    if (!headerResponse.ok || !footerResponse.ok) {
      throw new Error(
        `Unable to load shared site layout (${headerResponse.status}, ${footerResponse.status}).`,
      );
    }

    [headerTarget.innerHTML, footerTarget.innerHTML] = await Promise.all([
      headerResponse.text(),
      footerResponse.text(),
    ]);

    initializeMobileNavigation();
    document.documentElement.dataset.siteLayoutReady = "true";
    document.dispatchEvent(new Event("site-layout:ready"));
  }

  function initializeMobileNavigation() {
    const navigation = document.getElementById("siteNavigation");
    const topbar = navigation?.closest(".topbar");
    const toggle = topbar?.querySelector(".mobile-menu-toggle");

    if (!navigation || !topbar || !toggle) {
      throw new Error(
        "The shared navigation requires its mobile menu controls.",
      );
    }

    const setMenuOpen = (open) => {
      topbar.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu",
      );
    };

    toggle.addEventListener("click", () => {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!topbar.contains(event.target)) setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        toggle.getAttribute("aria-expanded") === "true"
      ) {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1000) setMenuOpen(false);
    });
  }

  function addToCart(id, colour = "", size = "", quantity = 1) {
    const cart = getCart();
    const existing = cart.find(
      (item) => item.id === id && item.colour === colour && item.size === size,
    );
    if (existing) existing.quantity += quantity;
    else cart.push({ id, colour, size, quantity });
    localStorage.setItem("riyasat-cart", JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const quantity = getCart().reduce(
      (total, item) => total + Number(item.quantity),
      0,
    );
    document.querySelectorAll("[data-cart-count]").forEach((counter) => {
      counter.textContent = String(quantity);
    });
  }

  function markActiveNavigation() {
    const currentFile = location.pathname.split("/").pop() || "index.html";
    const activeFile =
      currentFile === "product.html" ? "shop.html" : currentFile;
    document.querySelectorAll(".nav-links a[href]").forEach((link) => {
      const linkedFile = link
        .getAttribute("href")
        .split("?")[0]
        .split("/")
        .pop();
      const active = linkedFile === activeFile;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function toggleLike(id) {
    const likes = getLikes();
    const index = likes.indexOf(id);
    if (index >= 0) likes.splice(index, 1);
    else likes.push(id);
    localStorage.setItem("riyasat-likes", JSON.stringify(likes));
  }

  function productCard(product) {
    const liked = getLikes().includes(product.id);
    return `<article class="product-card ${product.soldOut ? "sold" : ""}">
    <a class="product-card-link" href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${safe(product.name)}">
      <div class="product-image" style="background-image:linear-gradient(rgba(15,15,15,.12),rgba(15,15,15,.18)),url('${product.image}')">
        ${product.soldOut ? '<span class="sold-out-badge">Sold out</span>' : ""}
      </div>
      <div class="product-info">
        <div class="product-head"><h3>${safe(product.name)}</h3></div>
        <div class="product-meta">${safe(product.category)} / ${safe(product.fit)}</div>
        <span class="product-fit">${safe(product.fit)}</span>
        <ul class="product-specs"><li><span>Colours</span>${product.colors.map(safe).join(", ")}</li><li><span>Sizes</span>${product.sizes.map(safe).join(", ")}</li></ul>
      </div>
    </a>
    <div class="product-footer product-actions"><strong class="price">${money(product.price)}</strong><div class="action-row">
      <button class="text-button page-add" type="button" data-id="${product.id}" ${product.soldOut ? "disabled" : ""}>Add to cart</button>
      <button class="text-button page-like ${liked ? "is-liked" : ""}" type="button" data-id="${product.id}" aria-label="${liked ? "Unlike" : "Like"} ${safe(product.name)}" aria-pressed="${liked}">${liked ? "♥" : "♡"}</button>
    </div></div>
  </article>`;
  }

  function bindProductButtons() {
    document.querySelectorAll(".page-add").forEach((button) =>
      button.addEventListener("click", () => {
        addToCart(button.dataset.id);
        button.textContent = "Added";
        window.setTimeout(() => {
          button.textContent = "Add to cart";
        }, 1000);
      }),
    );
    document.querySelectorAll(".page-like").forEach((button) =>
      button.addEventListener("click", () => {
        toggleLike(button.dataset.id);
        if (document.body.dataset.page === "favorites") {
          renderFavorites();
          return;
        }
        const liked = getLikes().includes(button.dataset.id);
        button.classList.toggle("is-liked", liked);
        button.setAttribute("aria-pressed", String(liked));
        button.textContent = liked
          ? button.id === "detailLike"
            ? "♥ Liked"
            : "♥"
          : button.id === "detailLike"
            ? "♡ Like"
            : "♡";
      }),
    );
  }

  function renderShop() {
    const grid = document.getElementById("pageProductGrid");
    if (!grid) return;
    let filter = "all";
    const sort = document.getElementById("pageSort");
    const redraw = () => {
      let products =
        filter === "all"
          ? [...catalog]
          : catalog.filter((product) => product.categoryKey === filter);
      if (sort.value === "low-high") products.sort((a, b) => a.price - b.price);
      if (sort.value === "high-low") products.sort((a, b) => b.price - a.price);
      grid.innerHTML = products.map(productCard).join("");
      bindProductButtons();
    };
    document.querySelectorAll("[data-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        filter = button.dataset.filter;
        document
          .querySelectorAll("[data-filter]")
          .forEach((item) =>
            item.classList.toggle("is-active", item === button),
          );
        redraw();
      }),
    );
    sort.addEventListener("change", redraw);
    redraw();
  }

  function renderProduct() {
    const view = document.getElementById("productView");
    if (!view) return;
    const product = catalog.find(
      (entry) => entry.id === new URLSearchParams(location.search).get("id"),
    );
    const missing = document.getElementById("productNotFound");
    if (!product) {
      view.classList.add("hidden");
      missing.classList.remove("hidden");
      return;
    }
    const add = document.getElementById("detailAdd");
    if (!add) return;
    document.title = `${product.name} | Riyasat`;
    document.getElementById("detailImage").style.backgroundImage =
      `linear-gradient(rgba(15,15,15,.1),rgba(15,15,15,.2)),url('${product.image}')`;
    document.getElementById("detailCategory").textContent =
      `${product.category} / Limited drop`;
    document.getElementById("detailName").textContent = product.name;
    document.getElementById("detailPrice").textContent = money(product.price);
    document.getElementById("detailDescription").textContent =
      product.description;
    document.getElementById("detailFitSizes").innerHTML =
      `<strong>Fit:</strong> ${safe(product.fit)} &nbsp; <strong>Sizes:</strong> ${product.sizes.map(safe).join(", ")}`;
    document.getElementById("detailColorsText").textContent =
      product.colors.join(", ");
    document.getElementById("detailColour").innerHTML = product.colors
      .map((color) => `<option>${safe(color)}</option>`)
      .join("");
    document.getElementById("detailSize").innerHTML = product.sizes
      .map((size) => `<option>${safe(size)}</option>`)
      .join("");
    add.disabled = product.soldOut;
    add.textContent = product.soldOut ? "Sold out" : "Add to cart";
    add.addEventListener("click", () => {
      const quantity = Math.min(
        5,
        Math.max(
          1,
          Number(document.getElementById("detailQuantity").value) || 1,
        ),
      );
      addToCart(
        product.id,
        document.getElementById("detailColour").value,
        document.getElementById("detailSize").value,
        quantity,
      );
      add.textContent = "Added to cart";
    });
    const like = document.getElementById("detailLike");
    const liked = getLikes().includes(product.id);
    like.dataset.id = product.id;
    like.setAttribute("aria-pressed", String(liked));
    like.classList.toggle("is-liked", liked);
    like.textContent = liked ? "♥ Liked" : "♡ Like";
    bindProductButtons();
  }

  function renderCart() {
    const rows = document.getElementById("cartItems");
    if (!rows) return;
    const cart = getCart();
    const empty = document.getElementById("cartEmpty");
    const layout = document.getElementById("cartLayout");
    if (!cart.length) {
      empty.classList.remove("hidden");
      layout.classList.add("hidden");
      return;
    }
    empty.classList.add("hidden");
    layout.classList.remove("hidden");
    rows.innerHTML = cart
      .map((item, index) => {
        const product = catalog.find((entry) => entry.id === item.id);
        if (!product) return "";
        return `<article class="cart-row"><a class="cart-image" href="product.html?id=${encodeURIComponent(product.id)}" style="background-image:url('${product.image}')"></a>
      <div class="cart-row-info"><a href="product.html?id=${encodeURIComponent(product.id)}"><h2>${safe(product.name)}</h2></a><p>${item.colour ? safe(item.colour) : "Choose colour on product page"}${item.size ? ` · ${safe(item.size)}` : ""}</p><strong>${money(product.price)}</strong></div>
      <div class="cart-quantity"><button type="button" data-cart-action="minus" data-index="${index}" aria-label="Decrease quantity">−</button><span>${Number(item.quantity)}</span><button type="button" data-cart-action="plus" data-index="${index}" aria-label="Increase quantity">+</button></div>
      <button class="text-button" type="button" data-cart-action="remove" data-index="${index}">Remove</button></article>`;
      })
      .join("");
    const total = cart.reduce(
      (sum, item) =>
        sum +
        (catalog.find((entry) => entry.id === item.id)?.price || 0) *
          Number(item.quantity),
      0,
    );
    document.getElementById("cartTotal").textContent = money(total);
    document.getElementById("cartShipping").textContent =
      total >= 3000
        ? "Free shipping unlocked"
        : `Free shipping above ${money(3000)}`;
    document.querySelectorAll("[data-cart-action]").forEach((button) =>
      button.addEventListener("click", () => {
        const updatedCart = getCart();
        const index = Number(button.dataset.index);
        const item = updatedCart[index];
        if (!item) return;
        if (button.dataset.cartAction === "remove")
          updatedCart.splice(index, 1);
        if (button.dataset.cartAction === "minus") {
          item.quantity = Number(item.quantity) - 1;
          if (item.quantity < 1) updatedCart.splice(index, 1);
        }
        if (button.dataset.cartAction === "plus")
          item.quantity = Number(item.quantity) + 1;
        localStorage.setItem("riyasat-cart", JSON.stringify(updatedCart));
        updateCartCount();
        renderCart();
      }),
    );
  }

  function renderFavorites() {
    const grid = document.getElementById("favoriteGrid");
    if (!grid) return;
    const empty = document.getElementById("favoriteEmpty");
    const products = catalog.filter((product) =>
      getLikes().includes(product.id),
    );
    grid.innerHTML = products.map(productCard).join("");
    empty.classList.toggle("hidden", products.length > 0);
    grid.classList.toggle("hidden", products.length === 0);
    bindProductButtons();
  }

  function attachOrderEvents() {
    const form = document.getElementById("standaloneOrder");
    const piece = document.getElementById("o-piece");
    const colour = document.getElementById("o-colour");
    const size = document.getElementById("o-size");
    const quantity = document.getElementById("o-quantity");
    const selectedProduct = () =>
      catalog.find((product) => product.id === piece.value);
    const updateSummary = () => {
      const product = selectedProduct();
      const qty = Number(quantity.value) || 1;
      const total = product.price * qty;
      document.getElementById("o-piece-label").textContent = product.name;
      document.getElementById("o-price").textContent = money(product.price);
      document.getElementById("o-qty-label").textContent = String(qty);
      document.getElementById("o-total").textContent = money(total);
      document.getElementById("o-shipping").textContent =
        total >= 3000
          ? "Free shipping unlocked."
          : "Free shipping on orders above ₹3,000.";
    };
    const updateOptions = () => {
      const product = selectedProduct();
      colour.innerHTML = product.colors
        .map((item) => `<option>${safe(item)}</option>`)
        .join("");
      size.innerHTML = product.sizes
        .map((item) => `<option>${safe(item)}</option>`)
        .join("");
      updateSummary();
    };
    const selectedId = new URLSearchParams(location.search).get("id");
    if (catalog.some((product) => product.id === selectedId))
      piece.value = selectedId;
    piece.addEventListener("change", updateOptions);
    quantity.addEventListener("input", updateSummary);
    updateOptions();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = {
        name: document.getElementById("o-name").value.trim(),
        phone: document.getElementById("o-phone").value.trim(),
        email: document.getElementById("o-email").value.trim(),
        instagram: document.getElementById("o-instagram").value.trim(),
        address: document.getElementById("o-address").value.trim(),
        city: document.getElementById("o-city").value.trim(),
        pincode: document.getElementById("o-pincode").value.trim(),
        qty: Number(quantity.value),
        payment: document.querySelector('input[name="payment"]:checked'),
        consent: document.getElementById("o-consent").checked,
      };
      const errors = {
        name: values.name ? "" : "Please enter your full name.",
        phone: /^\d{10}$/.test(values.phone)
          ? ""
          : "Phone number must contain exactly 10 digits.",
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
          ? ""
          : "Please enter a valid email address.",
        instagram:
          !values.instagram || values.instagram.startsWith("@")
            ? ""
            : "Instagram handle must start with @.",
        piece: piece.value ? "" : "Please choose a piece.",
        colour: colour.value ? "" : "Please choose a colour.",
        size: size.value ? "" : "Please choose a size.",
        quantity:
          values.qty >= 1 && values.qty <= 5
            ? ""
            : "Quantity must be between 1 and 5.",
        address: values.address ? "" : "Delivery address is required.",
        city: values.city ? "" : "Please enter your city.",
        pincode: /^\d{6}$/.test(values.pincode)
          ? ""
          : "Pincode must contain exactly 6 digits.",
        payment: values.payment ? "" : "Please select a payment preference.",
        consent: values.consent ? "" : "Consent is required to continue.",
      };
      let valid = true;
      Object.entries(errors).forEach(([field, message]) => {
        const errorNode = form.querySelector(`[data-error-for="${field}"]`);
        if (errorNode) errorNode.textContent = message;
        if (message) valid = false;
      });
      if (!valid) return;
      const product = selectedProduct();
      const total = product.price * values.qty;
      form.classList.add("hidden");
      const success = document.getElementById("standaloneOrderSuccess");
      document.getElementById("summaryPiece").textContent = product.name;
      document.getElementById("summaryColour").textContent = colour.value;
      document.getElementById("summarySize").textContent = size.value;
      document.getElementById("summaryQuantity").textContent = String(
        values.qty,
      );
      document.getElementById("summaryTotal").textContent = money(total);
      document.getElementById("summaryCity").textContent = values.city;
      success.classList.remove("hidden");
    });
  }

  function attachContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = {
        name: document.getElementById("contactName").value.trim(),
        email: document.getElementById("contactEmail").value.trim(),
        phone: document.getElementById("contactPhone").value.trim(),
        subject: document.getElementById("contactSubject").value,
        message: document.getElementById("contactMessage").value.trim(),
      };
      const errors = {
        contactName: values.name ? "" : "Please enter your name.",
        contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
          ? ""
          : "Please enter a valid email address.",
        contactPhone:
          !values.phone || /^\d{10}$/.test(values.phone)
            ? ""
            : "Phone number must contain exactly 10 digits.",
        contactSubject: values.subject ? "" : "Please choose a subject.",
        contactMessage: values.message ? "" : "Please enter a message.",
      };

      let valid = true;
      Object.entries(errors).forEach(([field, message]) => {
        const input = document.getElementById(field);
        const error = form.querySelector(`[data-error-for="${field}"]`);
        if (input) input.classList.toggle("invalid", Boolean(message));
        if (error) error.textContent = message;
        if (message) valid = false;
      });
      if (!valid) return;

      const messages = JSON.parse(
        localStorage.getItem("riyasat-contact-messages") || "[]",
      );
      messages.push({ ...values, submittedAt: new Date().toISOString() });
      localStorage.setItem(
        "riyasat-contact-messages",
        JSON.stringify(messages),
      );
      form.classList.add("hidden");
      document.getElementById("contactSuccess").classList.remove("hidden");
    });
  }

  function initializePage() {
    markActiveNavigation();
    updateCartCount();
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle && document.body.dataset.page !== "home") {
      themeToggle.addEventListener("click", () => {
        document.body.dataset.theme =
          document.body.dataset.theme === "light" ? "dark" : "light";
        themeToggle.textContent =
          document.body.dataset.theme === "light" ? "☾" : "☀";
      });
    }
    renderShop();
    renderProduct();
    renderCart();
    renderFavorites();
    if (document.getElementById("standaloneOrder")) attachOrderEvents();
    attachContactForm();
  }

  document.addEventListener("site-layout:ready", initializePage, {
    once: true,
  });
  loadSharedLayout();
})();
