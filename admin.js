function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}

// === CLIENTES ===
async function cargarClientes() {
  const data = await apiGet("clientes");
  renderTabla("tablaClientes", data, "clientes");
}
async function guardarCliente(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  await apiPost("clientes", form);
  e.target.reset();
  cargarClientes();
}

// === REPARTIDORES ===
async function cargarRepartidores() {
  const data = await apiGet("repartidores");
  renderTabla("tablaRepartidores", data, "repartidores");
}
async function guardarRepartidor(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  await apiPost("repartidores", form);
  e.target.reset();
  cargarRepartidores();
}

// === PEDIDOS ===
async function cargarPedidos() {
  const data = await apiGet("pedidos");
  renderTabla("tablaPedidos", data, "pedidos");
}
async function guardarPedido(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  await apiPost("pedidos", form);
  e.target.reset();
  cargarPedidos();
}

// === ENTREGAS ===
async function cargarEntregas() {
  const data = await apiGet("entregas");
  renderTabla("tablaEntregas", data, "entregas");
}

// === RUTAS ===
async function cargarRutas() {
  const data = await apiGet("rutas");
  renderTabla("tablaRutas", data, "rutas");
}
async function guardarRuta(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target).entries());
  await apiPost("rutas", form);
  e.target.reset();
  cargarRutas();
}

// === Render Genérico ===
function renderTabla(id, datos, tipo) {
  const tabla = document.getElementById(id);
  if (!datos || datos.length === 0) {
    tabla.innerHTML = "<tr><td colspan='5'>Sin registros</td></tr>";
    return;
  }
  const keys = Object.keys(datos[0]);
  let html = "<tr>" + keys.map(k => `<th>${k}</th>`).join("") + "<th>Acción</th></tr>";
  for (const row of datos) {
    html += "<tr>" + keys.map(k => `<td>${row[k]}</td>`).join("") +
      `<td><button onclick="eliminarRegistro('${tipo}', ${row.id})">🗑️</button></td></tr>`;
  }
  tabla.innerHTML = html;
}

async function eliminarRegistro(tabla, id) {
  if (confirm("¿Eliminar registro?")) {
    await apiDelete(tabla, id);
    if (tabla === "clientes") cargarClientes();
    if (tabla === "repartidores") cargarRepartidores();
    if (tabla === "pedidos") cargarPedidos();
    if (tabla === "rutas") cargarRutas();
  }
}

cargarClientes();
