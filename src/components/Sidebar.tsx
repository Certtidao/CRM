import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clientes", label: "Clientes", icon: Users, end: false },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-brand-navy px-3 py-4 text-white">
      <div className="mb-6 px-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
          Certtidão
        </div>
        <div className="text-sm font-semibold">CRM</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${
                isActive ? "bg-white/10 text-brand-green" : "text-white/80 hover:bg-white/5"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-3">
        {user?.email && (
          <div className="mb-2 truncate px-1 text-xs text-white/50">{user.email}</div>
        )}
        <button
          onClick={signOut}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-[13px] text-white/80 hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
