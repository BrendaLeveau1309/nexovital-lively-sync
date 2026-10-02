import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, Clock3, HeartPulse, History, Home, LocateFixed, LogOut, MapPin, Menu, Navigation, ShieldCheck, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullScreenMap } from "@/components/nexovital/full-screen-map";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "NexoVital — Donación de sangre" },
    { name: "description", content: "Encuentra centros de donación, responde solicitudes compatibles y sigue cada donación." },
    { property: "og:title", content: "NexoVital — Donación de sangre" },
    { property: "og:description", content: "Una red cercana que conecta donantes, familias y centros de salud." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: NexoVitalApp,
});

type View = "home" | "tracking" | "history" | "account";
type AuthMode = "login" | "register" | "recover";

const timeline = ["Emparejamiento aceptado", "En camino", "En establecimiento", "En tamizaje", "Donación realizada", "Exitosa"];

function NexoVitalApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [view, setView] = useState<View>("home");
  const [role, setRole] = useState<"donor" | "requester">("donor");
  const [showMatch, setShowMatch] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [showAvailability, setShowAvailability] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!authenticated || !showMatch || role !== "donor") return;
    const deadline = Date.now() + secondsLeft * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) { setShowMatch(false); setShowAvailability(false); }
    }, 250);
    return () => window.clearInterval(timer);
  }, [authenticated, showMatch, role]);

  if (!authenticated) return <AuthScreen mode={authMode} setMode={setAuthMode} onDemo={() => setAuthenticated(true)} />;

  return (
    <main className="relative mx-auto h-[100svh] w-full max-w-[480px] overflow-hidden bg-background shadow-panel">
      {view === "home" && (
        <>
          <FullScreenMap />
          <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4">
            <div className="glass-panel flex items-center justify-between rounded-2xl border border-border/60 p-3">
              <Button size="icon" variant="ghost" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu /></Button>
              <div className="min-w-0 flex-1 px-2">
                 <h1 className="truncate text-base font-black text-primary">NexoVital</h1>
                 <p className="truncate text-xs font-bold text-muted-foreground">{role === "donor" ? "Donante" : "Solicitante"} · Hola, Valeria</p>
              </div>
              {role === "donor" && <span className="rounded-xl bg-destructive px-3 py-2 text-sm font-black text-destructive-foreground">O+</span>}
              <Button size="icon" variant="ghost" aria-label="Notificaciones"><Bell /></Button>
            </div>
          </header>

          {role === "donor" ? (
            <>
              <div className="absolute left-4 top-24 z-10 flex gap-2">
                <span className="glass-panel rounded-full px-3 py-2 text-xs font-bold"><HeartPulse className="mr-1 inline size-4 text-primary" />4 donaciones</span>
                <span className="glass-panel rounded-full px-3 py-2 text-xs font-bold"><LocateFixed className="mr-1 inline size-4 text-primary" />3 centros cerca</span>
              </div>
               {showMatch && secondsLeft > 0 && (
                <section className="glass-panel absolute inset-x-4 bottom-24 z-20 rounded-3xl border border-primary/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-extrabold uppercase text-primary">Solicitud compatible</p><h2 className="mt-1 text-lg font-black">Hospital Dos de Mayo</h2></div>
                     <span role="timer" aria-label={`Tiempo restante: ${secondsLeft} segundos`} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-black"><Clock3 className="size-3.5" />00:{String(secondsLeft).padStart(2, "0")}</span>
                  </div>
                  <div className="my-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <Info label="Distancia" value="2.4 km" /><Info label="Requiere" value="O+" /><Info label="Urgencia" value="Alta" urgent />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="lg" onClick={() => setShowMatch(false)}>Rechazar</Button>
                    <Button variant="vivid" size="lg" onClick={() => setShowAvailability(true)}>Aceptar</Button>
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="glass-panel absolute inset-x-4 bottom-24 z-20 rounded-3xl border border-border/70 p-5">
              <p className="text-xs font-extrabold uppercase text-primary">Buscar donantes</p>
              <h2 className="mt-1 text-xl font-black">Ingresa tu código</h2>
              <p className="mt-1 text-sm text-muted-foreground">Lo encontrarás en la solicitud entregada por el hospital.</p>
              <div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-xl border bg-surface px-4 py-3 font-bold uppercase" placeholder="Ej. NV-28491" maxLength={12} /><Button variant="vivid" size="lg"><Navigation />Buscar</Button></div>
            </section>
          )}
        </>
      )}
      {view === "tracking" && <Tracking role={role} />}
      {view === "history" && <HistoryView />}
      {view === "account" && <Account role={role} onRoleChange={setRole} />}

      <nav className="safe-bottom glass-panel absolute inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t px-2 pt-2">
        <NavItem active={view === "home"} icon={Home} label="Inicio" onClick={() => setView("home")} />
        <NavItem active={view === "tracking"} icon={Navigation} label="Tracking" onClick={() => setView("tracking")} />
        <NavItem active={view === "history"} icon={History} label="Historial" onClick={() => setView("history")} />
        <NavItem active={view === "account"} icon={UserRound} label="Cuenta" onClick={() => setView("account")} />
      </nav>

      {showAvailability && <Modal title="¿Cuándo podrías donar?" onClose={() => setShowAvailability(false)}><p className="mb-4 text-sm text-muted-foreground">Indica una fecha estimada para que el hospital prepare tu llegada.</p><input type="datetime-local" className="w-full rounded-xl border bg-surface px-4 py-3" /><Button className="mt-4 w-full" variant="vivid" size="lg" onClick={() => { setShowAvailability(false); setShowMatch(false); setView("tracking"); }}>Confirmar disponibilidad</Button></Modal>}
      {menuOpen && <SideMenu role={role} setRole={setRole} onClose={() => setMenuOpen(false)} onLogout={() => setAuthenticated(false)} />}
    </main>
  );
}

function AuthScreen({ mode, setMode, onDemo }: { mode: AuthMode; setMode: (mode: AuthMode) => void; onDemo: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const documentNumber = String(form.get("document") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!/^\w{6,20}$/.test(documentNumber) || password.length < 8) { setMessage("Revisa el documento y usa una contraseña de al menos 8 caracteres."); setBusy(false); return; }
    setMessage("Para ingresar con documento, primero crea tu cuenta con un correo válido."); setBusy(false);
  };
  const googleLogin = async () => { setBusy(true); const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (result.error) setMessage("No pudimos iniciar con Google. Intenta nuevamente."); else if (!result.redirected) onDemo(); setBusy(false); };
  const recover = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get("email") ?? "").trim(); if (!email.includes("@")) return setMessage("Ingresa un correo válido."); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); setMessage(error ? "No pudimos enviar el enlace." : "Revisa tu correo: te enviamos un enlace seguro."); };

  return <main className="min-h-[100svh] bg-background px-5 py-8 subtle-grid"><div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-md flex-col justify-center">
    <div className="mb-8 flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-brand"><HeartPulse /></div><div><p className="text-2xl font-black">NexoVital</p><p className="text-sm text-muted-foreground">Donar nos conecta</p></div></div>
    <section className="rounded-3xl border bg-card p-6 shadow-panel">
      <p className="text-xs font-extrabold uppercase text-primary">{mode === "login" ? "Bienvenido de vuelta" : mode === "register" ? "Únete a la red" : "Recupera tu acceso"}</p>
      <h1 className="mt-2 text-3xl font-black">{mode === "login" ? "Inicia sesión" : mode === "register" ? "Crea tu cuenta" : "Nueva contraseña"}</h1>
      {mode === "login" && <form className="mt-6 space-y-4" onSubmit={submitLogin}><FieldSelect label="Tipo de documento" name="type" options={["DNI","CE","Pasaporte"]}/><Field label="Número de documento" name="document" placeholder="Ingresa tu documento" /><Field label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres"/><button type="button" onClick={() => setMode("recover")} className="text-sm font-bold text-primary">¿Olvidaste tu contraseña?</button><Button className="w-full" variant="vivid" size="lg" disabled={busy}>Iniciar sesión</Button><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>o continúa con<span className="h-px flex-1 bg-border"/></div><Button className="w-full" variant="outline" size="lg" type="button" onClick={googleLogin}>G&nbsp; Continuar con Google</Button><Button className="w-full" variant="ghost" type="button" onClick={() => setMode("register")}>Crear una cuenta</Button></form>}
      {mode === "register" && <RegisterForm onDone={() => setMode("login")} setMessage={setMessage} />}
      {mode === "recover" && <form className="mt-6 space-y-4" onSubmit={recover}><p className="text-sm text-muted-foreground">Enviaremos un enlace seguro al correo registrado.</p><Field label="Correo electrónico" name="email" type="email" placeholder="nombre@correo.com"/><Button className="w-full" variant="vivid" size="lg">Enviar enlace</Button><Button className="w-full" variant="ghost" type="button" onClick={() => setMode("login")}>Cancelar</Button></form>}
      {message && <p role="status" className="mt-4 rounded-xl bg-muted p-3 text-sm font-semibold">{message}</p>}
    </section>
    <Button variant="ghost" className="mt-4" onClick={onDemo}>Explorar prototipo <ChevronRight /></Button>
    <a href="/backoffice" className="mt-2 text-center text-xs font-bold text-muted-foreground">Acceso para personal de salud</a>
  </div></main>;
}

function RegisterForm({ onDone, setMessage }: { onDone: () => void; setMessage: (value: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const f = new FormData(event.currentTarget); const email=String(f.get("email")??"").trim(); const password=String(f.get("password")??""); if (!email.includes("@") || password.length < 8 || password !== String(f.get("confirm")??"")) return setMessage("Revisa el correo y confirma una contraseña de al menos 8 caracteres."); const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }); setMessage(error ? "No pudimos crear la cuenta." : "Revisa tu correo para confirmar la cuenta. Luego podrás iniciar sesión."); if (!error) setTimeout(onDone, 1800); };
  return <form className="mt-6 grid grid-cols-2 gap-3" onSubmit={submit}><FieldSelect label="Documento" name="type" options={["DNI","CE","Pasaporte"]}/><Field label="Número" name="document" placeholder="Documento"/><div className="col-span-2"><Field label="Nombres y apellidos" name="name" placeholder="Se completará al validar"/></div><div className="col-span-2"><Field label="Correo" name="email" type="email" placeholder="nombre@correo.com"/></div><div className="col-span-2"><Field label="Teléfono" name="phone" placeholder="999 999 999"/></div><FieldSelect label="Grupo" name="blood" options={["A","B","AB","O"]}/><FieldSelect label="Factor Rh" name="rh" options={["+","-"]}/><div className="col-span-2"><Field label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres"/></div><div className="col-span-2"><Field label="Confirmar" name="confirm" type="password" placeholder="Repite la contraseña"/></div><label className="col-span-2 flex gap-2 text-xs text-muted-foreground"><input type="checkbox" required/>Acepto los términos y la política de privacidad.</label><Button className="col-span-2" variant="vivid" size="lg">Crear cuenta</Button><Button className="col-span-2" variant="ghost" type="button" onClick={onDone}>Cancelar</Button></form>;
}

function Tracking({ role }: { role: "donor" | "requester" }) { return <div className="h-full overflow-y-auto px-5 pb-28 pt-8"><p className="text-xs font-extrabold uppercase text-primary">Seguimiento activo</p><h1 className="mt-1 text-3xl font-black">{role === "donor" ? "Tu donación" : "Solicitud NV-28491"}</h1><div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground shadow-brand"><p className="text-sm opacity-80">Hospital Dos de Mayo · 2.4 km</p><div className="mt-3 flex items-end justify-between"><span className="text-4xl font-black">O+</span><span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">Urgencia alta</span></div></div><div className="mt-7 space-y-0">{timeline.map((item,i)=><div key={item} className="flex gap-4"><div className="flex flex-col items-center"><span className={`grid size-8 place-items-center rounded-full ${i<=1?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>{i<1?"✓":i+1}</span>{i<timeline.length-1&&<span className={`h-12 w-0.5 ${i<1?"bg-primary":"bg-border"}`}/>}</div><div><p className="font-extrabold">{item}</p><p className="text-xs text-muted-foreground">{i===1?"Estado actual":i<1?"Completado":"Pendiente"}</p></div></div>)}</div><Button className="mt-4 w-full" variant="outline">Cancelar proceso</Button></div>; }
function HistoryView(){return <div className="h-full overflow-y-auto px-5 pb-28 pt-8"><p className="text-xs font-extrabold uppercase text-primary">Tu impacto</p><h1 className="mt-1 text-3xl font-black">Historial</h1><div className="mt-5 grid grid-cols-3 gap-2"><Info label="Última" value="12 jun"/><Info label="Próxima" value="12 dic"/><Info label="Exitosas" value="4"/></div><div className="mt-6 space-y-3">{[["12 jun 2026","Clínica Internacional","CONCRETADA"],["03 ene 2026","Hospital Rebagliati","CONCRETADA"],["18 oct 2025","Hospital Loayza","CANCELADA"]].map(r=><article key={r[0]} className="rounded-2xl border bg-card p-4"><div className="flex justify-between"><div><p className="font-black">{r[1]}</p><p className="text-sm text-muted-foreground">{r[0]} · O+</p></div><span className="text-xs font-black text-primary">{r[2]}</span></div><div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span>Hb 13.8</span><span>120/80</span><span>72 ppm</span></div></article>)}</div></div>}
function Account({role,onRoleChange}:{role:"donor"|"requester";onRoleChange:(r:"donor"|"requester")=>void}){return <div className="h-full overflow-y-auto px-5 pb-28 pt-8"><p className="text-xs font-extrabold uppercase text-primary">Mi cuenta</p><h1 className="mt-1 text-3xl font-black">Valeria Mendoza</h1><div className="mt-5 rounded-2xl border bg-card p-4"><p className="text-sm font-bold">Usar NexoVital como</p><div className="mt-3 grid grid-cols-2 gap-2"><Button variant={role==="donor"?"vivid":"outline"} onClick={()=>onRoleChange("donor")}>Donante</Button><Button variant={role==="requester"?"vivid":"outline"} onClick={()=>onRoleChange("requester")}>Solicitante</Button></div></div>{["DNI 72918421","O positivo","valeria@email.com","+51 987 654 321","Donante disponible","Estado: APTO"].map(x=><div key={x} className="flex items-center justify-between border-b py-4 font-semibold"><span>{x}</span><ChevronRight className="size-4 text-muted-foreground"/></div>)}</div>}
function SideMenu({role,setRole,onClose,onLogout}:{role:"donor"|"requester";setRole:(r:"donor"|"requester")=>void;onClose:()=>void;onLogout:()=>void}){return <div className="absolute inset-0 z-50 bg-foreground/20" onClick={onClose}><aside className="h-full w-[84%] bg-surface p-5 shadow-panel" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><b className="text-xl">NexoVital</b><Button size="icon" variant="ghost" onClick={onClose}><X/></Button></div><div className="mt-8 rounded-2xl bg-accent p-4"><p className="text-xs font-bold text-primary">MODO ACTUAL</p><p className="text-xl font-black">{role==="donor"?"Donante":"Solicitante"}</p><Button className="mt-3 w-full" variant="outline" onClick={()=>{setRole(role==="donor"?"requester":"donor");onClose();}}>Cambiar de modo</Button></div>{["Mi perfil","Gestionar notificaciones","Información para donar","Términos y condiciones","Política de privacidad"].map(x=><button key={x} className="flex w-full items-center justify-between border-b py-4 text-left font-bold">{x}<ChevronRight className="size-4"/></button>)}<Button className="mt-8 w-full" variant="ghost" onClick={onLogout}><LogOut/>Cerrar sesión</Button></aside></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="absolute inset-0 z-50 grid place-items-end bg-foreground/30 p-4"><div className="w-full rounded-3xl bg-surface p-5 shadow-panel"><div className="flex justify-between"><h2 className="text-xl font-black">{title}</h2><Button size="icon" variant="ghost" onClick={onClose}><X/></Button></div>{children}</div></div>}
function Info({label,value,urgent=false}:{label:string;value:string;urgent?:boolean}){return <div className="rounded-xl bg-muted p-3"><p className="text-muted-foreground">{label}</p><p className={`mt-1 font-black ${urgent?"text-destructive":"text-foreground"}`}>{value}</p></div>}
function NavItem({active,icon:Icon,label,onClick}:{active:boolean;icon:typeof Home;label:string;onClick:()=>void}){return <button onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active?"text-primary":"text-muted-foreground"}`}><Icon className="size-5"/>{label}</button>}
function Field({label,name,type="text",placeholder}:{label:string;name:string;type?:string;placeholder:string}){return <label className="block text-sm font-bold">{label}<input name={name} type={type} required maxLength={255} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border bg-surface px-4 py-3 font-normal"/></label>}
function FieldSelect({label,name,options}:{label:string;name:string;options:string[]}){return <label className="block text-sm font-bold">{label}<select name={name} className="mt-1.5 w-full rounded-xl border bg-surface px-3 py-3 font-normal">{options.map(x=><option key={x}>{x}</option>)}</select></label>}
