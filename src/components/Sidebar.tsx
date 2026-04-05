import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  Scan, 
  BarChart3, 
  Mail,
  ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/results', icon: BarChart3 },
  { name: 'Manual Scanner', href: '/scan', icon: Scan },
  { name: 'Email Accounts', href: '/accounts', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white w-64 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">ReplyRadar</h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-slate-900 text-white border border-slate-700" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        &copy; 2024 ReplyRadar v1.0
      </div>
    </div>
  );
}
