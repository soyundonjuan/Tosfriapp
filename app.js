// Datos iniciales (según tu requerimiento)
const PUNTOS = [
  { id: "asturias", name: "Asturias", pin: "1234" }
];

const $ = (s) => document.querySelector(s);
const toast = (m) => {
  const t = $("#toast");
  t.textContent = m; t.style.display = "block";
  setTimeout(()=> t.style.display = "none", 1800);
};

// Rellenar select y wiring
document.addEventListener("DOMContentLoaded", () => {
  const sel = $("#pvSelect");
  PUNTOS.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id; o.textContent = p.name;
    sel.appendChild(o);
  });

  const pinInput = $("#pinInput");
  const btnGo = $("#btnGo");

  // Habilitar botón solo si hay selección y 4 dígitos
  const validate = () => {
    const goodSel = sel.value !== "";
    const goodPin = /^\d{4}$/.test(pinInput.value.trim());
    btnGo.disabled = !(goodSel && goodPin);
  };
  sel.addEventListener("change", validate);
  pinInput.addEventListener("input", (e) => {
    // Solo números, máx 4
    e.target.value = e.target.value.replace(/\D+/g, "").slice(0, 4);
    validate();
  });

  // Enter para enviar
  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btnGo.disabled) btnGo.click();
  });

  // Clic en flecha: validar y continuar
  btnGo.addEventListener("click", () => {
    const punto = PUNTOS.find(p => p.id === sel.value);
    const pin = $("#pinInput").value.trim();
    if (!punto) return toast("Selecciona un punto de venta");
    if (pin !== punto.pin) return toast("PIN incorrecto");

    // ✅ Acceso concedido: ir al frame 2 (venta-home)
showFrame("venta-home");        // <- navega al segundo frame
if (typeof updateVentaCounters === "function") {
  updateVentaCounters();        // <- inicializa contadores en 0
}
// Si no quieres mostrar el toast, quítalo:
 // toast("Acceso concedido");
  });

  // Init estado del botón
  validate();
});



// ======== Estado simple para contadores de este frame ========
const VentaState = {
  combos: 0,
  productos: 0
};

// Actualiza contadores visuales
function updateVentaCounters(){
  const c1 = document.getElementById("countCombos");
  const c2 = document.getElementById("countProductos");
  if (c1) c1.textContent = String(VentaState.combos);
  if (c2) c2.textContent = String(VentaState.productos);
}

// ======== Navegación básica entre frames ========
// Reutiliza tu show() si ya la tienes. Si no, añade esta:
function showFrame(idToShow){
  // login: #v-login, venta-home: #venta-home, etc.
  const ids = ["v-login","venta-home"]; // agrega más cuando tengas más frames
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === idToShow) ? "block" : "none";
  });
}

// ======== Wiring de este frame ========
document.addEventListener("DOMContentLoaded", () => {
  // Cuando el login sea exitoso, muestra la home de venta.
  // Si ya tienes otra función onLogin, asegúrate de llamar a showFrame('venta-home') allí.
  const btnGo = document.getElementById("btnGo");
  if (btnGo && !btnGo._ventaHooked){
    btnGo._ventaHooked = true;
    btnGo.addEventListener("click", () => {
      // si tu onLogin ya valida, aquí solo navega:
      // show('v-home');  -> reemplaza por:
      showFrame("venta-home");
      updateVentaCounters();
    });
  }

  // Botones topbar
  const btnSalir = document.getElementById("btnSalir");
  if (btnSalir){
    btnSalir.addEventListener("click", () => {
      // volver al login
      showFrame("v-login");
    });
  }
  const btnReportar = document.getElementById("btnReportar");
  if (btnReportar){
    btnReportar.addEventListener("click", () => {
      // ir al frame de mermas (cuando lo tengas); por ahora, usa toast
      if (typeof toast === "function") toast("Ir a Reportar (mermas/devoluciones)");
      // showFrame("mermas-frame");
    });
  }

  // Botones principales
  const btnCombos = document.getElementById("btnCombos");
  if (btnCombos){
    btnCombos.addEventListener("click", () => {
      // aquí navegarás a la pantalla de combos
      if (typeof toast === "function") toast("Ir a selección de Combos");
      // showFrame("venta-combos");
    });
  }

  const btnProductos = document.getElementById("btnProductos");
  if (btnProductos){
    btnProductos.addEventListener("click", () => {
      // aquí navegarás a la pantalla de productos
      if (typeof toast === "function") toast("Ir a selección de Productos");
      // showFrame("venta-productos");
    });
  }

  const btnRegistrar = document.getElementById("btnRegistrar");
  if (btnRegistrar){
    btnRegistrar.addEventListener("click", () => {
      // aquí navegarás al detalle de la venta / cobro
      if (typeof toast === "function") toast("Ir a Detalle / Registrar");
      // showFrame("venta-detalle");
    });
  }
});

// ======== Hooks para cuando implementes los frames siguientes ========
// Llama a estas funciones desde tus pantallas de "Combos" y "Productos" para
// que se reflejen los contadores en la home:
function addCombo(count = 1){
  VentaState.combos += count;
  updateVentaCounters();
}
function addProducto(count = 1){
  VentaState.productos += count;
  updateVentaCounters();
}
