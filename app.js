// ====== DATA (puedes moverlos a /data/*.json si luego quieres) ======
const USERS = [
  { id: "LOC-001-CAJA1", name: "Asturias – Caja 1", pin: "123", role: "seller", location_id: "LOC-001", active: true }
];

// Productos (precios del menú, sin alterar)
const PRODUCTS = [
  { id: "PRD-EMP-POL", name: "Empanada de pollo",   category: "empanada", price: 2000, active: true },
  { id: "PRD-EMP-CAR", name: "Empanada de carne",   category: "empanada", price: 2000, active: true },
  { id: "PRD-EMP-QUE", name: "Empanada de queso",   category: "empanada", price: 2000, active: true },
  { id: "PRD-ARE-TRI", name: "Arepa trifásica",     category: "arepa",    price: 3000, active: true },
  { id: "PRD-ARE-RAN", name: "Arepa ranchera",      category: "arepa",    price: 3000, active: true },
  { id: "PRD-KIB-UNI", name: "Kibbe",               category: "pasaboca", price: 3500, active: true },
  { id: "PRD-JUG-COR", name: "Jugo natural de corozó",   category: "jugo", price: 2500, active: true },
  { id: "PRD-JUG-MAR", name: "Jugo natural de maracuyá", category: "jugo", price: 2500, active: true },
  { id: "PRD-JUG-AVE", name: "Jugo natural de avena",    category: "jugo", price: 2500, active: true }
];

// Combos (precios del menú)
const COMBOS = [
  { id: "CMB-001", name: "Combo 1",        price:  6000, active: true }, // 2 emp + 1 jugo
  { id: "CMB-002", name: "Combo 2",        price:  7000, active: true }, // 1 arepa + 1 emp + 1 jugo
  { id: "CMB-003", name: "Combo familiar", price: 22000, active: true }  // 4 emp + 3 arepas + 3 jugos
];

// Reglas de límite por combo (slots)
const SLOTS = [
  // Combo 1
  { id: "CBS-001", combo_id: "CMB-001", slot_name: "Empanadas", allowed_category: "empanada", qty_allowed: 2 },
  { id: "CBS-002", combo_id: "CMB-001", slot_name: "Jugos",     allowed_category: "jugo",     qty_allowed: 1 },
  // Combo 2
  { id: "CBS-003", combo_id: "CMB-002", slot_name: "Arepas",    allowed_category: "arepa",    qty_allowed: 1 },
  { id: "CBS-004", combo_id: "CMB-002", slot_name: "Empanadas", allowed_category: "empanada", qty_allowed: 1 },
  { id: "CBS-005", combo_id: "CMB-002", slot_name: "Jugos",     allowed_category: "jugo",     qty_allowed: 1 },
  // Combo familiar
  { id: "CBS-006", combo_id: "CMB-003", slot_name: "Empanadas", allowed_category: "empanada", qty_allowed: 4 },
  { id: "CBS-007", combo_id: "CMB-003", slot_name: "Arepas",    allowed_category: "arepa",    qty_allowed: 3 },
  { id: "CBS-008", combo_id: "CMB-003", slot_name: "Jugos",     allowed_category: "jugo",     qty_allowed: 3 }
];

// ====== UTILS ======
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const money = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

const state = {
  user: null,
  cart: [] // {product_id, name, qty, unit_price, is_from_combo, combo_id}
};

function toast(msg) {
  $("#toastMsg").textContent = msg;
  $("#modalToast").style.display = "flex";
}

// ====== BOOT ======
function boot() {
  // Login: lista de usuarios/puntos
  const sel = $("#userSelect");
  USERS.filter(u => u.active).forEach(u => {
    const o = document.createElement("option");
    o.value = u.id;
    o.textContent = u.name;
    sel.appendChild(o);
  });

  // Handlers principales
  $("#btnLogin").onclick = onLogin;
  $("#goVentas").onclick = () => { show("v-ventas"); renderCombos(); };
  $("#goMermas").onclick = () => { show("v-mermas"); renderMermas(); };

  // Ventas
  $("#tabCombos").onclick = renderCombos;
  $("#tabProductos").onclick = renderProductos;
  $("#btnBackVentas").onclick = () => show("v-home");
  $("#btnCobrar").onclick = openPago;

  // Pago
  $("#closePago").onclick = () => $("#modalPago").style.display = "none";
  $$("#modalPago [data-pay]").forEach(b => b.onclick = () => confirmarPago(b.dataset.pay));

  // Toast
  $("#closeToast").onclick = () => $("#modalToast").style.display = "none";

  updateTotal();
}

function show(viewId) {
  ["v-login","v-home","v-ventas","v-mermas"].forEach(id => { $("#" + id).style.display = (id === viewId) ? "block" : "none"; });
}

// ====== LOGIN ======
function onLogin() {
  const userId = $("#userSelect").value.trim();
  const pin = $("#pinInput").value.trim();
  const u = USERS.find(x => x.id === userId);
  if (!u) return toast("Selecciona un usuario");
  if (pin !== u.pin) return toast("PIN incorrecto");
  state.user = u;
  show("v-home");
}

// ====== VENTAS ======
function updateTotal() {
  const t = state.cart.reduce((s, i) => s + (Number(i.unit_price || 0) * Number(i.qty || 0)), 0);
  $("#cartTotal").textContent = money(t);
}

function renderCombos() {
  const cont = $("#ventasContent");
  cont.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid cols-2";
  COMBOS.filter(c => c.active).forEach(c => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = `${c.name} — ${money(Number(c.price))}`;
    b.onclick = () => openCombo(c);
    grid.appendChild(b);
  });
  cont.appendChild(grid);
}

function openCombo(combo) {
  const cont = $("#ventasContent");
  cont.innerHTML = "";

  const h = document.createElement("div");
  h.className = "h2";
  h.textContent = `${combo.name} (${money(combo.price)})`;
  cont.appendChild(h);

  const picks = {}; // slot.id -> [product_id]
  const slots = SLOTS.filter(s => s.combo_id === combo.id);

  slots.forEach(slot => {
    const box = document.createElement("div");
    box.className = "card";

    const t = document.createElement("div");
    t.className = "h2";
    t.textContent = `${slot.slot_name} (máx. ${slot.qty_allowed})`;
    box.appendChild(t);

    const grid = document.createElement("div");
    grid.className = "grid cols-2";

    PRODUCTS
      .filter(p => p.active && p.category === slot.allowed_category)
      .forEach(p => {
        const btn = document.createElement("button");
        btn.className = "btn ghost";
        btn.textContent = `${p.name} — ${money(p.price)}`;
        btn.onclick = () => {
          const arr = picks[slot.id] || [];
          if (arr.length >= slot.qty_allowed) return toast("Límite alcanzado");
          picks[slot.id] = [...arr, p.id];
          btn.style.filter = "brightness(1.1)";
        };
        grid.appendChild(btn);
      });

    box.appendChild(grid);
    cont.appendChild(box);
  });

  const row = document.createElement("div");
  row.className = "grid cols-2";
  row.style.marginTop = "10px";

  const add = document.createElement("button");
  add.className = "btn";
  add.textContent = "Agregar al carrito";
  add.onclick = () => {
    // Validar que cada slot esté completo
    for (const s of slots) {
      const arr = picks[s.id] || [];
      if (arr.length !== s.qty_allowed) return toast(`Selecciona exactamente ${s.qty_allowed} en ${s.slot_name}`);
    }
    // Desglosar ítems (precio unitario = precio de cada producto)
    for (const s of slots) {
      (picks[s.id] || []).forEach(pid => {
        const prod = PRODUCTS.find(pp => pp.id === pid);
        state.cart.push({
          product_id: pid,
          name: prod.name,
          qty: 1,
          unit_price: Number(prod.price),
          is_from_combo: true,
          combo_id: combo.id
        });
      });
    }
    updateTotal();
    toast("Combo agregado");
  };

  const back = document.createElement("button");
  back.className = "btn";
  back.textContent = "Volver";
  back.onclick = renderCombos;

  row.appendChild(add);
  row.appendChild(back);
  cont.appendChild(row);
}

function renderProductos() {
  const cont = $("#ventasContent");
  cont.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid cols-2";

  PRODUCTS.filter(p => p.active).forEach(p => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = `${p.name} — ${money(p.price)}`;
    b.onclick = () => {
      state.cart.push({
        product_id: p.id,
        name: p.name,
        qty: 1,
        unit_price: Number(p.price),
        is_from_combo: false
      });
      updateTotal();
    };
    grid.appendChild(b);
  });

  cont.appendChild(grid);
}

// ====== COBRO ======
function openPago() {
  if (state.cart.length === 0) return toast("El carrito está vacío");
  $("#modalPago").style.display = "flex";
}

function confirmarPago(metodo) {
  // Aquí conectarías backend (Firestore/Supabase). En esta versión mock, solo vaciamos el carrito.
  state.cart = [];
  updateTotal();
  $("#modalPago").style.display = "none";
  toast(`Venta registrada (${metodo})`);
}

// ====== MERMAS ======
function renderMermas() {
  const sel = $("#mermaProducto");
  sel.innerHTML = "";
  PRODUCTS.filter(p => p.active).forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name;
    sel.appendChild(o);
  });

  const mot = $("#mermaMotivo");
  mot.innerHTML = "";
  ["Se partió","Quemado","Caducidad","Otro"].forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    mot.appendChild(o);
  });

  $("#btnBackMermas").onclick = () => show("v-home");
  $("#btnGuardarMerma").onclick = () => {
    const pid = $("#mermaProducto").value;
    const qty = Number($("#mermaQty").value || 0);
    if (!pid || qty <= 0) return toast("Completa producto y cantidad");
    // En producción: persistir merma y descontar inventario del producto del punto actual
    toast("Merma registrada");
    $("#mermaQty").value = 1;
    $("#mermaNota").value = "";
  };
}

// Init
document.addEventListener("DOMContentLoaded", boot);
