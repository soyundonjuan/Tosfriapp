/* ========= Datos de acceso ========= */
const PUNTOS = [{ id: "asturias", name: "Asturias", pin: "1234" }];

/* ========= Utilidades ========= */
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const toast = (m) => {
  const t = $("#toast");
  t.textContent = m;
  t.style.display = "block";
  setTimeout(() => t.style.display = "none", 1800);
};

/* ========= Estado de venta (contadores) ========= */
const VentaState = { combos: 0, productos: 0 };

function updateVentaCounters(){
  const c1 = $("#countCombos");
  const c2 = $("#countProductos");
  if (c1) c1.textContent = String(VentaState.combos);
  if (c2) c2.textContent = String(VentaState.productos);
}

/* ========= Navegación entre frames ========= */
function showFrame(idToShow){
  const ids = ["v-login", "venta-home"]; // añade aquí nuevos ids cuando sumes más frames
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === idToShow) ? "block" : "none";
  });
}

/* ========= Login ========= */
function wireLogin(){
  const sel = $("#pvSelect");
  const pinInput = $("#pinInput");
  const btnGo = $("#btnGo");

  const validate = () => {
    const goodSel = sel && sel.value !== "";
    const goodPin = /^\d{4}$/.test(pinInput.value.trim());
    btnGo.disabled = !(goodSel && goodPin);
  };

  pinInput.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D+/g, "").slice(0, 4);
    validate();
  });
  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btnGo.disabled) btnGo.click();
  });

  btnGo.addEventListener("click", () => {
    const punto = PUNTOS.find(p => p.id === sel.value || p.name === sel.value);
    const pin = pinInput.value.trim();
    if (!punto) return toast("Selecciona un punto de venta");
    if (pin !== punto.pin) return toast("PIN incorrecto");

    // Ir al frame 2
    showFrame("venta-home");
    updateVentaCounters();
  });

  validate();
}

/* ========= Home de venta ========= */
function wireVentaHome(){
  $("#btnSalir")?.addEventListener("click", () => showFrame("v-login"));
  $("#btnReportar")?.addEventListener("click", () => {
    // Aquí navegarás a 'mermas' cuando lo implementemos:
    toast("Ir a Reportar (mermas/devoluciones)");
  });

  $("#btnCombos")?.addEventListener("click", () => {
    // Aquí abrirás la pantalla de selección de combos
    toast("Ir a selección de Combos");
    // showFrame("venta-combos");
  });

  $("#btnProductos")?.addEventListener("click", () => {
    // Aquí abrirás la pantalla de selección de productos
    toast("Ir a selección de Productos");
    // showFrame("venta-productos");
  });

  $("#btnRegistrar")?.addEventListener("click", () => {
    // Aquí abrirás el detalle/checkout
    toast("Ir a Detalle / Registrar");
    // showFrame("venta-detalle");
  });
}

/* ========= API para futuros frames ========= */
function addCombo(count = 1){ VentaState.combos += count; updateVentaCounters(); }
function addProducto(count = 1){ VentaState.productos += count; updateVentaCounters(); }

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", () => {
  wireLogin();
  wireVentaHome();
});
