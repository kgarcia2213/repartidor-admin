async function importarExcel(tabla) {
  const input = document.getElementById(`excel${tabla.charAt(0).toUpperCase() + tabla.slice(1)}`);
  const file = input.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(firstSheet);

  for (const row of json) {
    await apiPost(tabla, row);
  }
  alert(`Importados ${json.length} registros de ${tabla}`);
  if (tabla === "clientes") cargarClientes();
  if (tabla === "repartidores") cargarRepartidores();
  if (tabla === "pedidos") cargarPedidos();
  if (tabla === "rutas") cargarRutas();
}
