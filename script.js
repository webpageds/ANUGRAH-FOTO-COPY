(() => {
  "use strict";

  // Nomor WhatsApp admin dalam format internasional tanpa tanda +.
  const WHATSAPP_NUMBER = "6285722210313";
  const CART_STORAGE_KEY = "anugrah-fotocopy-cart-v1";

  // Harga sengaja null karena daftar harga resmi belum diberikan.
  // Isi angka dalam rupiah di kolom price jika harga sudah dikonfirmasi pemilik.
  const services = [
    { id: "fotocopy", name: "Foto Copy", category: "Print & Dokumen", price: null, unit: "per lembar", emoji: "📄", description: "Salinan dokumen untuk kebutuhan kuliah, kantor, dan administrasi." },
    { id: "print-warna", name: "Print Warna", category: "Print & Dokumen", price: null, unit: "per lembar", emoji: "🖨️", description: "Cetak dokumen berwarna untuk tugas, materi, atau kebutuhan lainnya." },
    { id: "print-a3", name: "Print A3", category: "Print & Dokumen", price: null, unit: "per lembar", emoji: "🗂️", description: "Layanan cetak ukuran A3. Spesifikasi dan harga konfirmasi ke admin." },
    { id: "scan", name: "Scan Dokumen", category: "Print & Dokumen", price: null, unit: "per dokumen", emoji: "📑", description: "Digitalisasi dokumen fisik. Tanyakan format file dan media pengiriman." },
    { id: "hard-cover-skripsi", name: "Hard Cover Skripsi", category: "Jilid", price: null, unit: "per buku", emoji: "📘", description: "Penjilidan skripsi dengan hard cover. Warna dan detail sesuai ketentuan kampus." },
    { id: "hard-cover-tesis", name: "Hard Cover Tesis", category: "Jilid", price: null, unit: "per buku", emoji: "📕", description: "Penjilidan tesis dengan hard cover. Konfirmasikan spesifikasi sebelum memesan." },
    { id: "hard-cover-disertasi", name: "Hard Cover Disertasi", category: "Jilid", price: null, unit: "per buku", emoji: "📚", description: "Penjilidan disertasi dengan hard cover dan detail finishing pilihan." },
    { id: "jilid-spiral", name: "Jilid Spiral", category: "Jilid", price: null, unit: "per buku", emoji: "📒", description: "Jilid spiral untuk modul, laporan, materi, dan dokumen." },
    { id: "jilid-lakban", name: "Jilid Lakban", category: "Jilid", price: null, unit: "per buku", emoji: "📓", description: "Pilihan jilid lakban untuk dokumen dan laporan." },
    { id: "soft-cover", name: "Soft Cover", category: "Jilid", price: null, unit: "per buku", emoji: "📔", description: "Penjilidan soft cover untuk tugas, laporan, dan dokumen." },
    { id: "pas-foto", name: "Cetak Pas Foto", category: "Cetak Khusus", price: null, unit: "per set", emoji: "🪪", description: "Cetak pas foto. Tanyakan ukuran, latar, dan jumlah cetakan." },
    { id: "brosur", name: "Cetak Brosur", category: "Cetak Khusus", price: null, unit: "per pesanan", emoji: "📰", description: "Cetak materi promosi. Jumlah, ukuran, dan jenis kertas memengaruhi harga." },
    { id: "sertifikat", name: "Cetak Sertifikat", category: "Cetak Khusus", price: null, unit: "per lembar", emoji: "🏅", description: "Cetak sertifikat untuk acara, pelatihan, dan kegiatan." },
    { id: "burning-cd", name: "Burning CD", category: "Lainnya", price: null, unit: "per keping", emoji: "💿", description: "Penyalinan data ke CD. Tanyakan ketersediaan media dan kapasitas." },
    { id: "laminating", name: "Laminating", category: "Lainnya", price: null, unit: "per lembar", emoji: "✨", description: "Laminating untuk membantu melindungi dokumen dan cetakan." },
    { id: "jurnal", name: "Jurnal", category: "Lainnya", price: null, unit: "per pesanan", emoji: "📖", description: "Layanan terkait jurnal. Jelaskan kebutuhan dan detail dokumen kepada admin." },
    { id: "atk-materai", name: "ATK & Materai", category: "Lainnya", price: null, unit: "per item", emoji: "✏️", description: "Kebutuhan alat tulis kantor dan materai. Stok dikonfirmasi ke admin." }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const rupiah = value => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  let activeCategory = "Semua";
  let searchTerm = "";
  let toastTimer;
  let cart = loadCart();

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.map(item => {
        const service = services.find(entry => entry.id === item.id);
        const qty = Number(item.qty);
        return service && Number.isInteger(qty) && qty > 0
          ? { id: service.id, qty: Math.min(qty, 999) }
          : null;
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (error) { /* Storage may be unavailable in private browsing. */ }
  }

  function getService(id) { return services.find(service => service.id === id); }
  function getCartEntries() { return cart.map(item => ({ ...getService(item.id), qty: item.qty })).filter(item => item.id); }
  function countItems() { return cart.reduce((sum, item) => sum + item.qty, 0); }
  function knownSubtotal() {
    return getCartEntries().reduce((sum, item) => item.price === null ? sum : sum + item.price * item.qty, 0);
  }
  function hasUnknownPrice() { return getCartEntries().some(item => item.price === null); }
  function formatPrice(service) { return service.price === null ? "Tanya admin" : rupiah(service.price); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function renderServices() {
    const grid = $("#serviceGrid");
    const filtered = services.filter(service => {
      const matchesCategory = activeCategory === "Semua" || service.category === activeCategory;
      const haystack = (service.name + " " + service.category + " " + service.description).toLocaleLowerCase("id-ID");
      return matchesCategory && haystack.includes(searchTerm);
    });
    grid.innerHTML = filtered.map(service => `
      <article class="service-card">
        <div class="service-illustration" aria-hidden="true"><span class="service-emoji">${service.emoji}</span></div>
        <div class="service-category">${escapeHTML(service.category)}</div>
        <h3>${escapeHTML(service.name)}</h3>
        <p class="service-description">${escapeHTML(service.description)}</p>
        <div class="service-card-bottom">
          <div class="service-price">${service.price === null ? "Harga layanan" : "Mulai dari"}<strong>${escapeHTML(formatPrice(service))}</strong><small>${escapeHTML(service.unit)}</small></div>
          <button class="add-button" data-add="${service.id}" aria-label="Tambah ${escapeHTML(service.name)} ke keranjang" title="Tambah ke keranjang">+</button>
        </div>
      </article>`).join("");
    $("#emptyResults").hidden = filtered.length > 0;
    grid.hidden = filtered.length === 0;
  }

  function updateCartCount() {
    const count = countItems();
    $("#cartCount").textContent = count > 99 ? "99+" : count;
    $("#drawerCount").textContent = `(${count})`;
    $("#summaryCount").textContent = `${count} item`;
  }

  function renderCart() {
    const entries = getCartEntries();
    const empty = entries.length === 0;
    $("#cartEmpty").hidden = !empty;
    $("#cartItems").hidden = empty;
    $("#drawerFooter").hidden = empty;
    updateCartCount();
    if (empty) {
      $("#cartItems").innerHTML = "";
      return;
    }
    $("#cartItems").innerHTML = entries.map(item => `
      <article class="cart-line">
        <div class="cart-line-icon" aria-hidden="true">${item.emoji}</div>
        <div>
          <h3>${escapeHTML(item.name)}</h3>
          <div class="cart-unit">${item.price === null ? "Harga dikonfirmasi admin" : escapeHTML(rupiah(item.price)) + " / " + escapeHTML(item.unit)}</div>
          <div class="cart-line-actions">
            <div class="qty-control" aria-label="Jumlah ${escapeHTML(item.name)}">
              <button type="button" data-qty-minus="${item.id}" aria-label="Kurangi jumlah">−</button>
              <span>${item.qty}</span>
              <button type="button" data-qty-plus="${item.id}" aria-label="Tambah jumlah">+</button>
            </div>
            <button type="button" class="remove-item" data-remove="${item.id}">Hapus</button>
          </div>
        </div>
        <div class="cart-line-total">${item.price === null ? "Tanya admin" : escapeHTML(rupiah(item.price * item.qty))}</div>
      </article>`).join("");
    $("#cartSubtotal").textContent = hasUnknownPrice() ? (knownSubtotal() ? rupiah(knownSubtotal()) + " + konfirmasi" : "Perlu konfirmasi") : rupiah(knownSubtotal());
  }

  function renderCheckoutSummary() {
    const entries = getCartEntries();
    $("#checkoutSummaryItems").innerHTML = entries.map(item => `
      <div class="summary-item"><span>${escapeHTML(item.name)} × ${item.qty}</span><strong>${item.price === null ? "Tanya admin" : escapeHTML(rupiah(item.price * item.qty))}</strong></div>`).join("");
    $("#summaryCount").textContent = `${countItems()} item`;
    $("#checkoutSubtotal").textContent = hasUnknownPrice() ? (knownSubtotal() ? rupiah(knownSubtotal()) + " + konfirmasi" : "Perlu konfirmasi admin") : rupiah(knownSubtotal());
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function openCart() {
    $("#cartDrawer").classList.add("open");
    $("#cartDrawer").setAttribute("aria-hidden", "false");
    $("#drawerOverlay").hidden = false;
    requestAnimationFrame(() => $("#drawerOverlay").classList.add("visible"));
    document.body.classList.add("drawer-open");
    $("#closeCart").focus();
  }

  function closeCart() {
    $("#cartDrawer").classList.remove("open");
    $("#cartDrawer").setAttribute("aria-hidden", "true");
    $("#drawerOverlay").classList.remove("visible");
    document.body.classList.remove("drawer-open");
    setTimeout(() => { if (!$("#cartDrawer").classList.contains("open")) $("#drawerOverlay").hidden = true; }, 260);
  }

  function openCheckout() {
    if (!cart.length) {
      showToast("Keranjang kamu masih kosong.");
      return;
    }
    renderCheckoutSummary();
    closeCart();
    const dialog = $("#checkoutDialog");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-open");
    setTimeout(() => $("#customerName").focus(), 30);
  }

  function closeCheckout() {
    const dialog = $("#checkoutDialog");
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
  }

  function buildWhatsAppMessage(formData) {
    const entries = getCartEntries();
    const lines = [
      "Halo Anugrah Foto Copy! Saya mau pesan layanan berikut:",
      "",
      "Nama: " + formData.name
    ];
    if (formData.phone) lines.push("Nomor WhatsApp: " + formData.phone);
    lines.push("", "DETAIL PESANAN");
    entries.forEach((item, index) => {
      lines.push(
        (index + 1) + ". " + item.name,
        "   Jumlah: " + item.qty + " " + item.unit,
        "   Harga: " + (item.price === null ? "Mohon konfirmasi admin" : rupiah(item.price) + " x " + item.qty + " = " + rupiah(item.price * item.qty))
      );
    });
    lines.push(
      "",
      "Subtotal item dengan harga terdaftar: " + rupiah(knownSubtotal()),
      "Catatan subtotal: " + (hasUnknownPrice() ? "Belum termasuk layanan yang memerlukan konfirmasi harga." : "Harga mengikuti katalog website dan tetap dapat dikonfirmasi admin."),
      "Metode penerimaan: " + formData.method,
      "Catatan tambahan: " + (formData.notes || "-"),
      "",
      "Mohon konfirmasi harga final, ketersediaan layanan, dan estimasi pengerjaan. Terima kasih!"
    );
    return lines.join("\n");
  }

  function addToCart(id) {
    const service = getService(id);
    if (!service) return;
    const item = cart.find(entry => entry.id === id);
    if (item) item.qty = Math.min(item.qty + 1, 999);
    else cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    showToast(service.name + " ditambahkan ke keranjang.");
  }

  function changeQty(id, delta) {
    const item = cart.find(entry => entry.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(999, item.qty + delta));
    saveCart();
    renderCart();
  }

  function removeItem(id) {
    const service = getService(id);
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
    if (service) showToast(service.name + " dihapus dari keranjang.");
  }

  $("#serviceSearch").addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLocaleLowerCase("id-ID");
    renderServices();
  });

  $("#categoryTabs").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    $$(".category-tab").forEach(tab => {
      const selected = tab === button;
      tab.classList.toggle("selected", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    renderServices();
  });

  $("#serviceGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
  });

  $("#cartItems").addEventListener("click", event => {
    const plus = event.target.closest("[data-qty-plus]");
    const minus = event.target.closest("[data-qty-minus]");
    const remove = event.target.closest("[data-remove]");
    if (plus) changeQty(plus.dataset.qtyPlus, 1);
    if (minus) changeQty(minus.dataset.qtyMinus, -1);
    if (remove) removeItem(remove.dataset.remove);
  });

  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#drawerOverlay").addEventListener("click", closeCart);
  $("#browseServices").addEventListener("click", () => {
    closeCart();
    document.querySelector("#layanan").scrollIntoView({ behavior: "smooth" });
  });
  $("#checkoutButton").addEventListener("click", openCheckout);
  $("#clearCart").addEventListener("click", () => {
    cart = [];
    saveCart();
    renderCart();
    showToast("Keranjang berhasil dikosongkan.");
  });
  $("#closeCheckout").addEventListener("click", closeCheckout);
  $("#checkoutDialog").addEventListener("click", event => {
    if (event.target === $("#checkoutDialog")) closeCheckout();
  });
  $("#checkoutDialog").addEventListener("close", () => document.body.classList.remove("dialog-open"));

  $("#checkoutForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!cart.length) {
      closeCheckout();
      showToast("Keranjang kosong. Tambahkan layanan terlebih dahulu.");
      return;
    }
    if (!$("#priceConsent").checked) {
      showToast("Mohon konfirmasi bahwa harga akan dicek admin.");
      return;
    }
    const name = $("#customerName").value.trim();
    if (!name) {
      $("#customerName").focus();
      showToast("Nama pelanggan perlu diisi.");
      return;
    }
    const phone = $("#customerPhone").value.trim();
    const message = buildWhatsAppMessage({
      name,
      phone,
      method: $("#orderMethod").value,
      notes: $("#orderNotes").value.trim()
    });
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    // Open synchronously from the submit gesture to reduce popup-blocker issues.
    const whatsappWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      closeCheckout();
      showToast("Pesan disiapkan. Tekan Kirim di WhatsApp untuk mengirim order.");
    } else {
      // If pop-ups are blocked, navigate current tab to WhatsApp.
      window.location.href = url;
    }
  });

  $("#menuToggle").addEventListener("click", () => {
    const menu = $("#mainNav");
    const open = menu.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
    $("#menuToggle").setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  });

  $$(".nav-link").forEach(link => link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }));

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeCart();
      if ($("#checkoutDialog").open) closeCheckout();
    }
  });

  $("#year").textContent = new Date().getFullYear();
  renderServices();
  renderCart();
})();