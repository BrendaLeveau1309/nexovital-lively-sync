import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Activity, Building2, ChevronRight, ClipboardPlus, Droplets, HeartPulse, LayoutDashboard, LogOut, Search, UserPlus, Users, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/backoffice")({
  head: () => ({ meta: [
    { title: "Backoffice — NexoVital" },
    { name: "description", content: "Gestión segura de establecimientos, solicitudes y procesos de donación de NexoVital." },
    { property: "og:title", content: "Backoffice — NexoVital" },
    { property: "og:description", content: "Operación hospitalaria y administración de la red NexoVital." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Backoffice,
});

type Section = "dashboard" | "requests" | "process" | "staff" | "centers";
type Role = "hospital" | "admin";
type DialogKind = "request" | "staff" | "center" | null;

type Center = { name: string; address: string; active: boolean };
type StaffMember = { name: string; document: string; center: string; active: boolean };
type Request = {
  code: string; patient: string; patientDoc: string; blood: string; rh: string;
  units: number; fulfilled: number; urgency: string; status: "En proceso" | "Atendida" | "Cancelada";
  created: string; closed: string | null;
  donations: { alias: string; status: string; result: string }[];
};

const initialCenters: Center[] = [
  { name: "Hospital Nacional Dos de Mayo", address: "Av. Grau 13, Lima", active: true },
  { name: "Hospital Edgardo Rebagliati", address: "Av. Rebagliati 490, Jesús María", active: true },
  { name: "Clínica Internacional", address: "Av. Washington 1475, Lima", active: false },
];
const initialStaff: StaffMember[] = [
  { name: "Ana Torres", document: "DNI 45612378", center: "Hospital Nacional Dos de Mayo", active: true },
  { name: "Carlos Ruiz", document: "DNI 41236789", center: "Hospital Edgardo Rebagliati", active: true },
  { name: "María Vega", document: "DNI 70981234", center: "Clínica Internacional", active: false },
];
const initialRequests: Request[] = [
  { code: "NV-28491", patient: "J. Quispe", patientDoc: "DNI 45678912", blood: "O", rh: "+", units: 3, fulfilled: 2, urgency: "Alta", status: "En proceso", created: "28 sep 2026", closed: null, donations: [{ alias: "Donante 1", status: "En camino", result: "Pendiente" }, { alias: "Donante 2", status: "Exitosa", result: "Donación exitosa" }] },
  { code: "NV-28473", patient: "M. Flores", patientDoc: "DNI 40881234", blood: "A", rh: "+", units: 2, fulfilled: 2, urgency: "Media", status: "Atendida", created: "20 sep 2026", closed: "22 sep 2026", donations: [{ alias: "Donante 1", status: "Exitosa", result: "Donación exitosa" }] },
  { code: "NV-28441", patient: "R. Paredes", patientDoc: "DNI 71234560", blood: "B", rh: "-", units: 1, fulfilled: 0, urgency: "Baja", status: "Cancelada", created: "10 sep 2026", closed: "11 sep 2026", donations: [] },
];

const donorHistoryDemo = [
  { date: "12 jun 2026", place: "Clínica Internacional", result: "Exitosa", hb: "13.8", bp: "120/80", pulse: 72 },
  { date: "03 ene 2026", place: "Hospital Rebagliati", result: "Exitosa", hb: "13.2", bp: "118/78", pulse: 70 },
];

function Backoffice() {
  const [entered, setEntered] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [role, setRole] = useState<Role>("hospital");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [requests, setRequests] = useState(initialRequests);
  const [centers, setCenters] = useState(initialCenters);
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [recover, setRecover] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [processStep, setProcessStep] = useState<"identify" | "tamizaje" | "donacion" | "validacion">("identify");
  const [processError, setProcessError] = useState("");

  const open = (kind: DialogKind) => { setNotice(""); setDialog(kind); };
  const navigate = (next: Section) => { setSection(next); setNotice(""); setQuery(""); setSearch(""); setDetail(null); };
  const toggleRole = () => { setRole(role === "admin" ? "hospital" : "admin"); navigate("dashboard"); };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    if (dialog === "request") {
      const code = `NV-${Math.floor(10000 + Math.random() * 90000)}`;
      const blood = String(data.get("blood") ?? "O");
      setRequests(current => [{
        code, patient: name, patientDoc: String(data.get("patientDoc") ?? ""), blood: blood.replace(/[+-]/, ""), rh: blood.includes("-") ? "-" : "+",
        units: Number(data.get("units") ?? 1), fulfilled: 0, urgency: String(data.get("urgency") ?? "Media"),
        status: "En proceso", created: "hoy", closed: null, donations: [],
      }, ...current]);
      setDialog(null); setNewCode(code); navigate("requests");
      return;
    }
    if (dialog === "staff") { setStaff(current => [{ name, document: String(data.get("document") ?? ""), center: String(data.get("center") ?? ""), active: true }, ...current]); navigate("staff"); }
    if (dialog === "center") { setCenters(current => [{ name, address: String(data.get("address") ?? ""), active: true }, ...current]); navigate("centers"); }
    setDialog(null); setNotice("Registro guardado en esta demostración.");
  };

  const toggleCenter = (name: string) => setCenters(cs => cs.map(c => c.name === name ? { ...c, active: !c.active } : c));
  const toggleStaff = (doc: string) => setStaff(ss => ss.map(s => s.document === doc ? { ...s, active: !s.active } : s));

  if (!entered) return <main className="grid min-h-screen place-items-center bg-primary p-5"><section className="w-full max-w-md rounded-lg border bg-card p-7 shadow-panel"><div className="mb-7 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground"><HeartPulse /></span><div><h1 className="text-2xl font-black">NexoVital</h1><p className="text-sm text-muted-foreground">Acceso institucional</p></div></div>{recover ? <form onSubmit={event => { event.preventDefault(); setNotice("Si el correo está registrado, recibirás instrucciones para recuperar tu acceso."); }}><h2 className="font-bold">Recuperar acceso</h2><label className="mt-4 block text-sm font-bold">Correo institucional<input type="email" required className="mt-2 w-full rounded-lg border px-4 py-3" placeholder="nombre@hospital.pe" /></label><Button className="mt-5 w-full" variant="vivid">Enviar instrucciones</Button><Button type="button" className="mt-2 w-full" variant="ghost" onClick={() => { setRecover(false); setNotice(""); }}>Volver</Button></form> : <form onSubmit={event => { event.preventDefault(); setEntered(true); setNotice(""); }}><label className="text-sm font-bold">Tipo de documento<select className="mt-2 w-full rounded-lg border bg-surface px-4 py-3"><option>DNI</option><option>CE</option><option>Pasaporte</option></select></label><label className="mt-4 block text-sm font-bold">Número de documento<input required className="mt-2 w-full rounded-lg border px-4 py-3" placeholder="Ingresa tu documento" /></label><label className="mt-4 block text-sm font-bold">Contraseña<input required type="password" className="mt-2 w-full rounded-lg border px-4 py-3" placeholder="••••••••" /></label><Button type="button" variant="link" className="mt-3 px-0" onClick={() => setRecover(true)}>¿Olvidaste tu contraseña?</Button><Button className="mt-6 w-full" variant="vivid" size="lg">Iniciar sesión</Button><Button type="button" className="mt-2 w-full" variant="ghost" onClick={() => setEntered(true)}>Explorar demostración</Button><Button type="button" className="mt-1 w-full" variant="ghost" onClick={toggleRole}>Vista demo: {role === "admin" ? "Administrador" : "Personal hospitalario"}</Button></form>}{notice && <p role="status" className="mt-3 text-sm text-primary">{notice}</p>}<Link to="/" className="mt-4 block text-center text-xs font-bold text-muted-foreground">Volver a la app móvil</Link></section></main>;

  const items: { id: Section; label: string; icon: LucideIcon }[] = role === "admin" ? [{ id: "dashboard", label: "Inicio", icon: LayoutDashboard }, { id: "staff", label: "Personal de salud", icon: UserPlus }, { id: "centers", label: "Establecimientos", icon: Building2 }] : [{ id: "dashboard", label: "Inicio", icon: LayoutDashboard }, { id: "requests", label: "Solicitudes", icon: Droplets }, { id: "process", label: "Proceso activo", icon: Activity }];

  const centerResults = centers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const requestResults = requests.filter(r =>
    r.code.toLowerCase().includes(query.toLowerCase()) &&
    (statusFilter === "Todos" || r.status === statusFilter) &&
    (!dateFilter || r.created.includes(dateFilter))
  );
  const detailRequest = detail ? requests.find(r => r.code === detail) : null;

  const identifyProcess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim().toUpperCase();
    const doc = String(data.get("donorDoc") ?? "").trim();
    const match = requests.find(r => r.code === code && r.status === "En proceso");
    if (!match || doc.length < 6) { setProcessError("No encontramos un proceso activo con ese código y DNI."); return; }
    setProcessError(""); setProcessStep("tamizaje");
  };

  return <main className="flex min-h-screen bg-background"><aside className="hidden w-64 shrink-0 border-r bg-surface p-5 md:flex md:flex-col"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><HeartPulse /></span><b className="text-xl">NexoVital</b></div><p className="mt-8 text-xs font-extrabold uppercase text-muted-foreground">{role === "admin" ? "Administración" : "Hospital Dos de Mayo"}</p><nav className="mt-4 space-y-1">{items.map(({ id, label, icon: Icon }) => <Button key={id} className="w-full justify-start" variant={section === id ? "secondary" : "ghost"} onClick={() => navigate(id)}><Icon />{label}</Button>)}</nav><Button className="mt-auto justify-start" variant="ghost" onClick={() => setEntered(false)}><LogOut />Cerrar sesión</Button></aside><section className="min-w-0 flex-1"><header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-surface px-5 py-3 lg:px-8"><div><p className="text-xs font-extrabold uppercase text-primary">{role === "admin" ? "Administrador" : "Personal hospitalario"}</p><h1 className="text-xl font-black">NexoVital <span className="font-medium text-muted-foreground">/ Panel operativo</span></h1></div><div className="flex items-center gap-2"><Button variant="outline" onClick={toggleRole}>Cambiar rol demo</Button><span className="grid size-10 place-items-center rounded-full bg-accent font-black">VM</span></div></header><nav className="flex gap-1 overflow-x-auto border-b bg-surface px-4 py-2 md:hidden">{items.map(({ id, label }) => <Button key={id} size="sm" variant={section === id ? "secondary" : "ghost"} onClick={() => navigate(id)}>{label}</Button>)}<Button size="icon" variant="ghost" aria-label="Cerrar sesión" onClick={() => setEntered(false)}><LogOut /></Button></nav><div className="p-5 lg:p-8">{notice && <p role="status" className="mb-5 rounded-lg bg-accent p-3 text-sm font-bold text-accent-foreground">{notice}</p>}

      {section === "dashboard" && <>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-primary">NexoVital</p><h2 className="mt-1 text-3xl font-black">{role === "admin" ? "Red de establecimientos" : "Buenos días, Valeria"}</h2><p className="mt-1 text-muted-foreground">{role === "admin" ? "Busca un establecimiento y gestiona las cuentas de su personal." : "Estas son las atenciones que requieren seguimiento."}</p></div><Button variant="vivid" size="lg" onClick={() => open(role === "admin" ? "staff" : "request")}><ClipboardPlus />{role === "admin" ? "Registrar personal" : "Nueva solicitud"}</Button></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">{((role === "admin" ? [[String(centers.filter(c => c.active).length), "Establecimientos activos", Building2], [String(staff.filter(s => s.active).length), "Cuentas activas", Users], [String(staff.filter(s => !s.active).length), "Cuentas desactivadas", UserPlus]] : [[String(requests.length), "Solicitudes", Droplets], ["2", "Donantes en camino", Users], ["1", "En tamizaje", Activity]]) as [string, string, LucideIcon][]).map(([value, label, Icon]) => <article key={label} className="rounded-lg border bg-card p-5"><Icon className="text-primary" /><p className="mt-4 text-3xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></article>)}</div>
        <div className="mt-7 border-t pt-6">
          <h3 className="text-lg font-black">{role === "admin" ? "Buscar por establecimiento" : "Actividad reciente"}</h3>
          <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); }}><div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-surface px-4"><Search className="size-4 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} className="w-full py-3" placeholder={role === "admin" ? "Nombre del establecimiento" : "Código de solicitud"} /></div><Button variant="vivid">Buscar</Button></form>
          {role === "admin" ? (query ? (centerResults.length ? centerResults.map(c => <div key={c.name} className="mt-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><b>{c.name}</b><p className="text-xs text-muted-foreground">{c.address}</p></div><span className={`text-xs font-black ${c.active ? "text-primary" : "text-muted-foreground"}`}>{c.active ? "ACTIVO" : "INACTIVO"}</span></div>
            <div className="mt-3 space-y-2 border-t pt-3">{staff.filter(s => s.center === c.name).map(s => <div key={s.document} className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{s.name} · {s.document}</span><Button size="sm" variant={s.active ? "outline" : "vivid"} onClick={() => toggleStaff(s.document)}>{s.active ? "Desactivar" : "Activar"}</Button></div>)}{!staff.some(s => s.center === c.name) && <p className="text-sm text-muted-foreground">Sin personal registrado.</p>}</div>
          </div>) : <p className="mt-4 text-sm text-muted-foreground">No se encontraron establecimientos.</p>) : <p className="mt-4 text-sm text-muted-foreground">Ingresa el nombre de un establecimiento para consultar sus cuentas activas.</p>)
          : (query ? (requests.filter(r => r.code.toLowerCase().includes(query.toLowerCase())).map(r => <Button key={r.code} variant="ghost" className="mt-3 flex h-auto w-full items-center justify-between rounded-lg border bg-card p-4 text-left" onClick={() => setDetail(r.code)}><span className="min-w-0 truncate font-bold">{r.code} · {r.status}</span><ChevronRight /></Button>)) : requests.slice(0, 3).map(r => <Button key={r.code} variant="ghost" className="mt-3 flex h-auto w-full items-center justify-between rounded-lg border bg-card p-4 text-left" onClick={() => setDetail(r.code)}><span className="min-w-0 truncate font-bold">{r.code} · {r.status}</span><ChevronRight /></Button>))}
        </div>
      </>}

      {section === "requests" && <>
        <h2 className="text-3xl font-black">Gestión de solicitudes</h2><p className="text-muted-foreground">Requerimientos del establecimiento.</p>
        <Button className="mt-5" variant="vivid" onClick={() => open("request")}><ClipboardPlus />Nueva solicitud</Button>
        <div className="mt-6 flex flex-wrap gap-2">
          <form className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-surface px-4" onSubmit={e => { e.preventDefault(); setQuery(search.trim()); }}><Search className="size-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2.5" placeholder="Buscar por código" /></form>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border bg-surface px-3 py-2.5 text-sm font-semibold">{["Todos", "En proceso", "Atendida", "Cancelada"].map(x => <option key={x}>{x}</option>)}</select>
          <input value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border bg-surface px-3 py-2.5 text-sm font-semibold" placeholder="Fecha (ej. 28 sep)" />
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border bg-card"><div className="grid min-w-[540px] grid-cols-4 gap-2 bg-muted p-4 text-xs font-extrabold uppercase"><span>Código</span><span>Estado</span><span>Unidades</span><span>Acción</span></div>{requestResults.map(r => <div key={r.code} className="grid min-w-[540px] grid-cols-4 items-center gap-2 border-t p-4 text-sm"><b>{r.code}</b><span>{r.status}</span><span>{r.fulfilled} / {r.units}</span><Button size="sm" variant="outline" onClick={() => setDetail(r.code)}>Ver detalle</Button></div>)}{!requestResults.length && <p className="p-4 text-sm text-muted-foreground">Sin resultados para los filtros aplicados.</p>}</div>
      </>}

      {section === "process" && <>
        <h2 className="text-3xl font-black">Registro de proceso activo</h2><p className="text-muted-foreground">Registra cada etapa de la atención del donante.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border bg-card p-5">
            <ol className="flex flex-wrap gap-2 text-xs font-black">{[["identify", "Identificación"], ["tamizaje", "Tamizaje"], ["donacion", "Donación"], ["validacion", "Validación final"]].map(([id, label], i) => <li key={id} className={`rounded-full px-3 py-1.5 ${processStep === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}. {label}</li>)}</ol>
            {processStep === "identify" && <form className="mt-5" onSubmit={identifyProcess}>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Código de solicitud<input name="code" required className="mt-2 w-full rounded-lg border p-3" placeholder="NV-28491" /></label><label className="text-sm font-bold">DNI del donante<input name="donorDoc" required className="mt-2 w-full rounded-lg border p-3" placeholder="Documento del donante" /></label></div>
              <Button className="mt-5" variant="vivid">Validar proceso activo</Button>
              {processError && <p role="alert" className="mt-3 rounded-lg bg-muted p-3 text-sm font-semibold">{processError}</p>}
            </form>}
            {processStep === "tamizaje" && <form className="mt-5" onSubmit={e => { e.preventDefault(); setProcessStep("donacion"); }}>
              <h3 className="font-black">Tamizaje</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">{["Hemoglobina", "Presión arterial", "Pulso"].map(x => <label key={x} className="text-sm font-bold">{x}<input required className="mt-2 w-full rounded-lg border p-3" placeholder="Registrar" /></label>)}</div>
              <Button className="mt-5" variant="vivid">Guardar y continuar</Button>
            </form>}
            {processStep === "donacion" && <div className="mt-5">
              <h3 className="font-black">Donación</h3>
              <p className="mt-2 text-sm text-muted-foreground">Confirma que la extracción se realizó según protocolo.</p>
              <Button className="mt-5" variant="vivid" onClick={() => setProcessStep("validacion")}>Donación realizada, continuar</Button>
            </div>}
            {processStep === "validacion" && <form className="mt-5" onSubmit={e => { e.preventDefault(); setProcessStep("identify"); setNotice("Validación final registrada. El donante y el solicitante fueron notificados."); }}>
              <h3 className="font-black">Validación final</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold">Resultado<select className="mt-2 w-full rounded-lg border bg-surface p-3"><option>Donación exitosa</option><option>Donación no exitosa</option></select></label>
                <label className="text-sm font-bold">Aptitud del donante<select className="mt-2 w-full rounded-lg border bg-surface p-3"><option>APTO</option><option>NO APTO TEMPORALMENTE</option><option>NO APTO PERMANENTEMENTE</option></select></label>
                <label className="text-sm font-bold sm:col-span-2">Motivo<input className="mt-2 w-full rounded-lg border p-3" placeholder="Opcional si la donación fue exitosa" /></label>
                <label className="text-sm font-bold">Fecha inicio<input type="date" className="mt-2 w-full rounded-lg border p-3" /></label>
                <label className="text-sm font-bold">Fecha fin<input type="date" className="mt-2 w-full rounded-lg border p-3" /></label>
              </div>
              <Button className="mt-5" variant="vivid">Registrar validación</Button>
            </form>}
          </div>
          <aside className="rounded-lg border bg-card p-5"><h3 className="font-black">Historial de donaciones</h3><p className="mt-1 text-sm text-muted-foreground">Consulta limitada al donante validado.</p>{processStep === "identify" ? <p className="mt-3 text-sm text-muted-foreground">Valida el código y DNI para consultar los antecedentes.</p> : donorHistoryDemo.map(x => <div key={x.date} className="mt-3 rounded-lg bg-muted p-3 text-sm"><p className="font-bold">{x.date} · {x.result}</p><p className="text-xs text-muted-foreground">{x.place} · Hb {x.hb} · {x.bp} · {x.pulse} ppm</p></div>)}</aside>
        </div>
      </>}

      {section === "staff" && <>
        <h2 className="text-3xl font-black">Personal de salud</h2><p className="text-muted-foreground">Cuentas asociadas a un establecimiento, con acceso aislado por hospital.</p>
        <Button className="mt-5" variant="vivid" onClick={() => open("staff")}><UserPlus />Registrar personal</Button>
        <div className="mt-6 space-y-3">{staff.map(s => <div key={s.document} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"><div><b>{s.name}</b><p className="text-xs text-muted-foreground">{s.document} · {s.center}</p><p className={`text-xs font-black ${s.active ? "text-primary" : "text-muted-foreground"}`}>{s.active ? "ACTIVO" : "INACTIVO"}</p></div><Button variant={s.active ? "outline" : "vivid"} size="sm" onClick={() => toggleStaff(s.document)}>{s.active ? "Desactivar" : "Activar"}</Button></div>)}</div>
      </>}

      {section === "centers" && <>
        <h2 className="text-3xl font-black">Establecimientos</h2><p className="text-muted-foreground">Centros que participan en la red.</p>
        <Button className="mt-5" variant="vivid" onClick={() => open("center")}><Building2 />Nuevo establecimiento</Button>
        <div className="mt-6 space-y-3">{centers.map(c => <div key={c.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"><div><b>{c.name}</b><p className="text-xs text-muted-foreground">{c.address}</p><p className={`text-xs font-black ${c.active ? "text-primary" : "text-muted-foreground"}`}>{c.active ? "ACTIVO" : "INACTIVO"}</p></div><Button variant={c.active ? "outline" : "vivid"} size="sm" onClick={() => toggleCenter(c.name)}>{c.active ? "Desactivar" : "Activar"}</Button></div>)}</div>
      </>}
    </div></section>

    {newCode && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={() => setNewCode(null)}><section role="dialog" aria-modal="true" aria-label="Solicitud creada" className="w-full max-w-md rounded-lg bg-card p-6 text-center shadow-panel" onClick={e => e.stopPropagation()}><p className="text-xs font-extrabold uppercase text-primary">Solicitud registrada</p><p className="mt-3 text-4xl font-black">{newCode}</p><p className="mt-2 text-sm text-muted-foreground">Entrega este código al solicitante para que inicie la búsqueda de donantes.</p><Button className="mt-5 w-full" variant="vivid" onClick={() => setNewCode(null)}>Entendido</Button></section></div>}

    {(dialog || detail) && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={() => { setDialog(null); setDetail(null); }}><section role="dialog" aria-modal="true" aria-label={detail ? "Detalle" : "Nuevo registro"} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-card p-6 shadow-panel" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-black">{detail ?? (dialog === "request" ? "Nueva solicitud" : dialog === "staff" ? "Registrar personal" : "Nuevo establecimiento")}</h2><Button size="icon" variant="ghost" aria-label="Cerrar" onClick={() => { setDialog(null); setDetail(null); }}><X /></Button></div>
      {detailRequest ? <>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <InfoBox label="Paciente" value={detailRequest.patient} /><InfoBox label="Documento" value={detailRequest.patientDoc} />
          <InfoBox label="Grupo y Rh" value={`${detailRequest.blood}${detailRequest.rh}`} /><InfoBox label="Urgencia" value={detailRequest.urgency} />
          <InfoBox label="Unidades requeridas" value={String(detailRequest.units)} /><InfoBox label="Atendidas" value={String(detailRequest.fulfilled)} />
          <InfoBox label="Pendientes" value={String(detailRequest.units - detailRequest.fulfilled)} /><InfoBox label="Estado" value={detailRequest.status} />
          <InfoBox label="Creación" value={detailRequest.created} />{detailRequest.closed && <InfoBox label={detailRequest.status === "Cancelada" ? "Cancelación" : "Cierre"} value={detailRequest.closed} />}
        </div>
        <h3 className="mt-5 text-sm font-extrabold uppercase text-muted-foreground">Donaciones asociadas</h3>
        {detailRequest.donations.length ? detailRequest.donations.map(d => <div key={d.alias} className="mt-2 flex items-center justify-between rounded-lg bg-muted p-3 text-sm"><b>{d.alias}</b><span>{d.status} · {d.result}</span></div>) : <p className="mt-2 text-sm text-muted-foreground">Sin donaciones registradas.</p>}
        <Button className="mt-5" variant="outline" onClick={() => setDetail(null)}>Cerrar detalle</Button>
      </> : detail ? <>
        <p className="mt-4 text-sm text-muted-foreground">Registro de demostración.</p>
        <Button className="mt-5" variant="outline" onClick={() => setDetail(null)}>Cerrar detalle</Button>
      </> : <form className="mt-5 space-y-4" onSubmit={save}>
        {dialog === "request" && <>
          <label className="block text-sm font-bold">Nombre del paciente<input required name="name" className="mt-2 w-full rounded-lg border p-3" placeholder="Nombres y apellidos" /></label>
          <label className="block text-sm font-bold">DNI del paciente<input required name="patientDoc" className="mt-2 w-full rounded-lg border p-3" placeholder="Documento" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">Grupo sanguíneo<select name="blood" className="mt-2 w-full rounded-lg border bg-surface p-3">{["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="block text-sm font-bold">Unidades<input name="units" type="number" min="1" max="20" defaultValue="1" required className="mt-2 w-full rounded-lg border p-3" /></label>
          </div>
          <label className="block text-sm font-bold">Nivel de urgencia<select name="urgency" className="mt-2 w-full rounded-lg border bg-surface p-3">{["Alta", "Media", "Baja"].map(x => <option key={x}>{x}</option>)}</select></label>
        </>}
        {dialog === "staff" && <>
          <label className="block text-sm font-bold">Nombre del personal<input required name="name" className="mt-2 w-full rounded-lg border p-3" placeholder="Nombres y apellidos" /></label>
          <label className="block text-sm font-bold">Documento<input required name="document" className="mt-2 w-full rounded-lg border p-3" placeholder="DNI / CE / Pasaporte" /></label>
          <label className="block text-sm font-bold">Establecimiento<select name="center" className="mt-2 w-full rounded-lg border bg-surface p-3">{centers.filter(c => c.active).map(x => <option key={x.name}>{x.name}</option>)}</select></label>
        </>}
        {dialog === "center" && <>
          <label className="block text-sm font-bold">Nombre del establecimiento<input required name="name" className="mt-2 w-full rounded-lg border p-3" placeholder="Ingresa el nombre" /></label>
          <label className="block text-sm font-bold">Dirección<input required name="address" className="mt-2 w-full rounded-lg border p-3" placeholder="Dirección" /></label>
        </>}
        <Button className="w-full" variant="vivid">Guardar</Button>
      </form>}
    </section></div>}
  </main>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-black">{value}</p></div>;
}
