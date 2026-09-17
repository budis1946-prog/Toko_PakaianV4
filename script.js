/*************************************************
 * TOKO BAJU - JAVASCRIPT
 *************************************************/

/*
 * GANTI DENGAN URL WEB APP APPS SCRIPT
 */
const API_URL =
  "https://script.google.com/macros/s/AKfycbwZOdXcLP7Uquczzp45QYGXPL2qLSgQspzP5SpJZH49gjvR7SQh7C1GxQc1aBAjnHAb/exec";

/*
 * NOMOR WHATSAPP TOKO
 *
 * Contoh:
 * 6281234567890
 */
const WHATSAPP_NUMBER = "6283160104255";

/*************************************************
 * GLOBAL
 *************************************************/

let products = [];

let currentUser = null;

let editId = null;

/*************************************************
 * ELEMENT
 *************************************************/

const loginPage = document.getElementById("loginPage");

const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");

const loginMessage = document.getElementById("loginMessage");

const usernameInput = document.getElementById("username");

const passwordInput = document.getElementById("password");

const logoutButton = document.getElementById("logoutButton");

const productModal = document.getElementById("productModal");

const productForm = document.getElementById("productForm");

const productIdInput = document.getElementById("productId");

const fotoInput = document.getElementById("foto");

const photoPreview = document.getElementById("photoPreview");

const namaInput = document.getElementById("nama");

const deskripsiInput = document.getElementById("deskripsi");

const hargaBeliInput = document.getElementById("hargaBeli");

const hargaJualInput = document.getElementById("hargaJual");

const profitPreview = document.getElementById("profitPreview");

const searchInput = document.getElementById("searchInput");

const statusFilter = document.getElementById("statusFilter");

const productContainer = document.getElementById("productContainer");

const loading = document.getElementById("loading");

const addProductButton = document.getElementById("addProductButton");

const adminDashboard = document.getElementById("adminDashboard");

const buyerInfo = document.getElementById("buyerInfo");

const userInfo = document.getElementById("userInfo");

/*************************************************
 * FORMAT RUPIAH
 *************************************************/

function rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(number) || 0);
}

/*************************************************
 * LOGIN
 *************************************************/

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = usernameInput.value.trim();

  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginMessage.textContent = "Username dan password wajib diisi.";

    return;
  }

  loginMessage.textContent = "Sedang login...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      body: JSON.stringify({
        action: "login",

        username: username,

        password: password,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      loginMessage.textContent = result.message || "Login gagal.";

      return;
    }

    currentUser = {
      username: result.username,

      role: String(result.role).toUpperCase(),
    };

    /*
     * Simpan sesi
     */

    localStorage.setItem("tokoBajuUser", JSON.stringify(currentUser));

    showApplication();
  } catch (error) {
    console.error(error);

    loginMessage.textContent = "Gagal terhubung ke API.";
  }
});

/*************************************************
 * CHECK SESSION
 *************************************************/

function checkSession() {
  try {
    const saved = localStorage.getItem("tokoBajuUser");

    if (saved) {
      currentUser = JSON.parse(saved);

      showApplication();
    } else {
      showLogin();
    }
  } catch (error) {
    localStorage.removeItem("tokoBajuUser");

    showLogin();
  }
}

/*************************************************
 * SHOW LOGIN
 *************************************************/

function showLogin() {
  loginPage.classList.remove("hidden");

  app.classList.add("hidden");
}

/*************************************************
 * SHOW APPLICATION
 *************************************************/

function showApplication() {
  loginPage.classList.add("hidden");

  app.classList.remove("hidden");

  userInfo.textContent = currentUser.username + " • " + currentUser.role;

  /*
   * ADMIN
   */

  if (currentUser.role === "ADMIN") {
    adminDashboard.classList.remove("hidden");

    buyerInfo.classList.add("hidden");

    addProductButton.classList.remove("hidden");

    statusFilter.classList.remove("hidden");
  } else {
    /*
     * BUYER
     */
    adminDashboard.classList.add("hidden");

    buyerInfo.classList.remove("hidden");

    addProductButton.classList.add("hidden");

    /*
     * Buyer tetap boleh filter READY/SOLD
     */

    statusFilter.classList.remove("hidden");
  }

  loadProducts();
}

/*************************************************
 * LOGOUT
 *************************************************/

logoutButton.addEventListener("click", function () {
  if (!confirm("Apakah Anda ingin keluar?")) {
    return;
  }

  currentUser = null;

  localStorage.removeItem("tokoBajuUser");

  products = [];

  productContainer.innerHTML = "";

  showLogin();

  usernameInput.value = "";

  passwordInput.value = "";
});

/*************************************************
 * LOAD PRODUCTS
 *************************************************/

async function loadProducts() {
  loading.style.display = "block";

  productContainer.innerHTML = "";

  try {
    const url =
      API_URL + "?action=list&role=" + encodeURIComponent(currentUser.role);

    const response = await fetch(url);

    const result = await response.json();

    /*
     * Jika API mengembalikan
     * {success:false}
     */

    if (result.success === false) {
      throw new Error(result.message || "Gagal mengambil data.");
    }

    products = Array.isArray(result) ? result : result.data || [];

    renderProducts();
  } catch (error) {
    console.error(error);

    productContainer.innerHTML = `
            <div class="empty">

                <div style="font-size:50px">
                    ⚠️
                </div>

                <h3>
                    Gagal memuat data
                </h3>

                <p>
                    Periksa URL API dan koneksi internet.
                </p>

                <br>

                <button
                    class="btn btn-primary"
                    onclick="loadProducts()">

                    🔄 Coba Lagi

                </button>

            </div>
        `;
  } finally {
    loading.style.display = "none";
  }
}

/*************************************************
 * RENDER PRODUCTS
 *
 * SUMMARY MENGIKUTI FILTER
 *************************************************/

function renderProducts() {
  const search = searchInput.value.toLowerCase().trim();

  const status = statusFilter.value;

  const filtered = products.filter(function (product) {
    const cocokNama = String(product.nama || "")
      .toLowerCase()
      .includes(search);

    const cocokStatus = status === "ALL" || product.status === status;

    return cocokNama && cocokStatus;
  });

  /*
   * Summary mengikuti
   * data yang sedang tampil.
   */

  if (currentUser.role === "ADMIN") {
    updateDashboard(filtered);
  }

  if (filtered.length === 0) {
    productContainer.innerHTML = `

            <div class="empty">

                <div style="font-size:50px">
                    👕
                </div>

                <h3>
                    Produk tidak ditemukan
                </h3>

                <p>
                    Tidak ada produk yang sesuai dengan filter.
                </p>

            </div>

        `;

    return;
  }

  productContainer.innerHTML = filtered
    .map(function (product) {
      return createProductHTML(product);
    })
    .join("");
}

/*************************************************
 * CREATE PRODUCT HTML
 *************************************************/

function createProductHTML(product) {
  const isAdmin = currentUser.role === "ADMIN";

  const isSold = String(product.status || "").toUpperCase() === "SOLD";

  /*
   * FOTO
   */

  let imageHTML = "";

  if (product.foto) {
    imageHTML = `

            <img
                class="product-image"
                src="${escapeAttribute(product.foto)}"
                alt="${escapeAttribute(product.nama)}"
                loading="lazy"
                onclick="showImage('${escapeAttribute(product.foto)}')"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >

            <div
                class="no-image"
                style="display:none">

                🖼️

            </div>

        `;
  } else {
    imageHTML = `

            <div class="no-image">

                👕 

            </div>

        `;
  }

  /*
   * ADMIN
   */

  if (isAdmin) {
    return `

        <article class="product-card">

            ${imageHTML}

            <div class="product-body">

                <div class="product-name">

                    ${escapeHTML(product.nama)}

                </div>


                <div class="product-description">

                    ${escapeHTML(product.deskripsi || "Tidak ada deskripsi.")}

                </div>


                <div class="price-row">

                    <span class="price-label">
                        Harga Beli
                    </span>

                    <span class="price-value">
                        ${rupiah(product.hargaBeli)}
                    </span>

                </div>


                <div class="price-row">

                    <span class="price-label">
                        Harga Jual
                    </span>

                    <span class="price-value sale-price">
                        ${rupiah(product.hargaJual)}
                    </span>

                </div>


                <div class="price-row">

                    <span class="price-label">
                        Profit
                    </span>

                    <span class="price-value profit">

                        ${rupiah(product.profit)}

                    </span>

                </div>


                <span class="status ${isSold ? "status-sold" : "status-ready"}">

                    ${isSold ? "SOLD" : "READY"}

                </span>


                <div class="product-actions">

                    ${
                      !isSold
                        ? `

                            <button
                                class="btn btn-success"
                                onclick="markSold('${escapeAttribute(product.id)}')">

                                ✓ SOLD

                            </button>

                        `
                        : ""
                    }


                    <button
                        class="btn btn-primary"
                        onclick="editProduct('${escapeAttribute(product.id)}')">

                        ✏️ Edit

                    </button>


                    <button
                        class="btn btn-danger"
                        onclick="deleteProduct('${escapeAttribute(product.id)}')">

                        🗑️ Hapus

                    </button>

                </div>

            </div>

        </article>

        `;
  }

  /*
   * BUYER
   *
   * Hanya:
   * Foto
   * Nama
   * Deskripsi
   * Harga Jual
   * Tombol WhatsApp
   */

  return `

        <article class="product-card">

            ${imageHTML}

            <div class="product-body">

                <div class="product-name">

                    ${escapeHTML(product.nama)}

                </div>


                <div class="product-description">

                    ${escapeHTML(product.deskripsi || "Tidak ada deskripsi.")}

                </div>


                <div class="price-row">

                    <span class="price-label">
                        Harga
                    </span>

                    <span class="price-value sale-price">

                        ${rupiah(product.hargaJual)}

                    </span>

                </div>


                <span class="status ${isSold ? "status-sold" : "status-ready"}">

                    ${isSold ? "SOLD" : "READY"}

                </span>


                ${
                  !isSold
                    ? `

                        <div class="product-actions">

                            <button
                                class="btn btn-whatsapp"
                                onclick="beliWhatsApp('${escapeAttribute(product.id)}')">

                                🛒 Beli via WhatsApp

                            </button>

                        </div>

                    `
                    : `

                        <div class="product-actions">

                            <button
                                class="btn btn-secondary"
                                disabled>

                                Produk Sudah Terjual

                            </button>

                        </div>

                    `
                }

            </div>

        </article>

    `;
}

/*************************************************
 * DASHBOARD
 *************************************************/

function updateDashboard(data = products) {
  const total = data.length;

  const ready = data.filter(function (product) {
    return String(product.status).toUpperCase() === "READY";
  }).length;

  const sold = data.filter(function (product) {
    return String(product.status).toUpperCase() === "SOLD";
  }).length;

  /*
   * Total modal:
   *
   * Harga Beli seluruh barang
   * TERMASUK barang SOLD
   */

  const totalModal = data.reduce(function (sum, product) {
    return sum + Number(product.hargaBeli || 0);
  }, 0);

  /*
   * Total penjualan:
   * hanya SOLD
   */

  const totalPenjualan = data
    .filter(function (product) {
      return String(product.status).toUpperCase() === "SOLD";
    })
    .reduce(function (sum, product) {
      return sum + Number(product.hargaJual || 0);
    }, 0);

  /*
   * Total profit:
   * hanya SOLD
   */

  const totalProfit = data
    .filter(function (product) {
      return String(product.status).toUpperCase() === "SOLD";
    })
    .reduce(function (sum, product) {
      return sum + Number(product.profit || 0);
    }, 0);

  document.getElementById("totalProduk").textContent = total;

  document.getElementById("totalReady").textContent = ready;

  document.getElementById("totalSold").textContent = sold;

  document.getElementById("totalModal").textContent = rupiah(totalModal);

  document.getElementById("totalPenjualan").textContent =
    rupiah(totalPenjualan);

  document.getElementById("totalProfit").textContent = rupiah(totalProfit);
}

/*************************************************
 * ADD PRODUCT BUTTON
 *************************************************/

addProductButton.addEventListener("click", function () {
  openModal();
});

/*************************************************
 * OPEN MODAL
 *************************************************/

function openModal(product = null) {
  productModal.classList.add("active");

  photoPreview.innerHTML = "";

  editId = null;

  productForm.reset();

  productIdInput.value = "";

  if (product) {
    editId = product.id;

    document.getElementById("modalTitle").textContent = "Edit Produk";

    productIdInput.value = product.id;

    namaInput.value = product.nama || "";

    deskripsiInput.value = product.deskripsi || "";

    hargaBeliInput.value = product.hargaBeli || 0;

    hargaJualInput.value = product.hargaJual || 0;

    if (product.foto) {
      photoPreview.innerHTML = `

                <img
                    src="${escapeAttribute(product.foto)}"
                    alt="Preview"
                >

            `;
    }
  } else {
    document.getElementById("modalTitle").textContent = "Tambah Produk";
  }

  updateProfitPreview();
}

/*************************************************
 * CLOSE MODAL
 *************************************************/

function closeModal() {
  productModal.classList.remove("active");

  editId = null;

  productForm.reset();

  photoPreview.innerHTML = "";
}

/*************************************************
 * EDIT PRODUCT
 *************************************************/

function editProduct(id) {
  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    alert("Produk tidak ditemukan.");

    return;
  }

  openModal(product);
}

/*************************************************
 * PRODUCT FORM
 *************************************************/

productForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const nama = namaInput.value.trim();

  const deskripsi = deskripsiInput.value.trim();

  const hargaBeli = Number(hargaBeliInput.value);

  const hargaJual = Number(hargaJualInput.value);

  if (!nama) {
    alert("Nama produk wajib diisi.");

    return;
  }

  if (hargaBeli < 0 || hargaJual < 0) {
    alert("Harga tidak valid.");

    return;
  }

  const file = fotoInput.files[0];

  if (file && file.size > 5 * 1024 * 1024) {
    alert("Foto terlalu besar. Maksimal 5 MB.");

    return;
  }

  try {
    const button = productForm.querySelector("button[type='submit']");

    button.disabled = true;

    button.textContent = "Menyimpan...";

    let fotoBase64 = "";

    let fileName = "";

    if (file) {
      fotoBase64 = await compressImage(file);

      fileName = file.name;
    }

    const data = {
      action: editId ? "update" : "add",

      role: currentUser.role,

      id: editId,

      nama: nama,

      deskripsi: deskripsi,

      hargaBeli: hargaBeli,

      hargaJual: hargaJual,

      fotoBase64: fotoBase64,

      fileName: fileName,
    };

    const result = await postData(data);

    if (!result.success) {
      throw new Error(result.message || "Gagal menyimpan.");
    }

    alert(result.message || "Data berhasil disimpan.");

    closeModal();

    await loadProducts();
  } catch (error) {
    console.error(error);

    alert(error.message || "Terjadi kesalahan.");
  } finally {
    const button = productForm.querySelector("button[type='submit']");

    button.disabled = false;

    button.textContent = "💾 Simpan";
  }
});

/*************************************************
 * MARK SOLD
 *************************************************/

async function markSold(id) {
  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    return;
  }

  if (!confirm(`Tandai "${product.nama}" sebagai SOLD?`)) {
    return;
  }

  try {
    const result = await postData({
      action: "sold",

      role: currentUser.role,

      id: id,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    alert("Produk berhasil ditandai SOLD.");

    await loadProducts();
  } catch (error) {
    console.error(error);

    alert(error.message || "Gagal mengubah status.");
  }
}

/*************************************************
 * DELETE
 *************************************************/

async function deleteProduct(id) {
  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    return;
  }

  if (!confirm(`Hapus produk "${product.nama}"?`)) {
    return;
  }

  try {
    const result = await postData({
      action: "delete",

      role: currentUser.role,

      id: id,
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    alert("Produk berhasil dihapus.");

    await loadProducts();
  } catch (error) {
    console.error(error);

    alert(error.message || "Gagal menghapus produk.");
  }
}

/*************************************************
 * BUY WHATSAPP
 *************************************************/

function beliWhatsApp(id) {
  const product = products.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!product) {
    alert("Produk tidak ditemukan.");

    return;
  }

  if (String(product.status).toUpperCase() === "SOLD") {
    alert("Maaf, produk ini sudah terjual.");

    return;
  }

  /*
   * Pesan WhatsApp
   */

  const message =
    `Halo Ashera.id 👋\n\n` +
    `Saya ingin membeli produk berikut:\n\n` +
    `Produk: ${product.nama}\n` +
    `Harga: ${rupiah(product.hargaJual)}\n` +
    `ID Produk: ${product.id}\n\n` +
    `Apakah produk ini masih tersedia?`;

  const url =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

  window.open(url, "_blank");
}

/*************************************************
 * POST DATA
 *************************************************/

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify(data),
  });

  return await response.json();
}

/*************************************************
 * COMPRESS IMAGE
 *************************************************/

function compressImage(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const image = new Image();

      image.onload = function () {
        const maxWidth = 1200;

        let width = image.width;

        let height = image.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);

          width = maxWidth;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;

        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0, width, height);

        const result = canvas.toDataURL("image/jpeg", 0.75);

        resolve(result);
      };

      image.onerror = reject;

      image.src = event.target.result;
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/*************************************************
 * PHOTO PREVIEW
 *************************************************/

fotoInput.addEventListener("change", function () {
  const file = fotoInput.files[0];

  if (!file) {
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Foto terlalu besar. Maksimal 5 MB.");

    fotoInput.value = "";

    return;
  }

  const reader = new FileReader();

  reader.onload = function (event) {
    photoPreview.innerHTML = `

                    <img
                        src="${event.target.result}"
                        alt="Preview Foto"
                    >

                `;
  };

  reader.readAsDataURL(file);
});

/*************************************************
 * PROFIT PREVIEW
 *************************************************/

hargaBeliInput.addEventListener("input", updateProfitPreview);

hargaJualInput.addEventListener("input", updateProfitPreview);

function updateProfitPreview() {
  const beli = Number(hargaBeliInput.value) || 0;

  const jual = Number(hargaJualInput.value) || 0;

  const profit = jual - beli;

  profitPreview.textContent = rupiah(profit);
}

/*************************************************
 * SEARCH
 *************************************************/

searchInput.addEventListener("input", renderProducts);

/*************************************************
 * FILTER
 *************************************************/

statusFilter.addEventListener("change", renderProducts);

/*************************************************
 * IMAGE VIEWER
 *************************************************/

function showImage(imageUrl) {
  const viewer = document.getElementById("imageViewer");

  const image = document.getElementById("largeImage");

  image.src = imageUrl;

  viewer.classList.add("active");
}

function closeImageViewer() {
  const viewer = document.getElementById("imageViewer");

  viewer.classList.remove("active");
}

/*************************************************
 * ESCAPE HTML
 *************************************************/

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*************************************************
 * ESCAPE ATTRIBUTE
 *************************************************/

function escapeAttribute(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}

/*************************************************
 * CLOSE MODAL WHEN CLICK OUTSIDE
 *************************************************/

productModal.addEventListener("click", function (event) {
  if (event.target === productModal) {
    closeModal();
  }
});

/*************************************************
 * CLOSE IMAGE WITH ESC
 *************************************************/

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();

    closeImageViewer();
  }
});

/*************************************************
 * START APPLICATION
 *************************************************/

checkSession();
