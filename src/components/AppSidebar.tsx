
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  ClipboardList,
  GraduationCap,
  CalendarCheck,
  UserCheck,
  BarChart3,
  Megaphone,
  Briefcase,
  ShieldQuestion,
  Bell,
  User,
  HelpCircle,
  FileText,
  TrendingUp,
  Users,
  FolderOpen,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  // Student
  { href: '/student', icon: LayoutDashboard, label: 'Dashboard', roles: ['student'] },
  { href: '/student/profile', icon: User, label: 'Profile', roles: ['student'] },
  { href: '/student/notices', icon: Bell, label: 'Notices', roles: ['student'] },
  { href: '/student/library', icon: BookOpen, label: 'Digital Library', roles: ['student'] },
  { href: '/student/doubts', icon: HelpCircle, label: 'Anonymous Doubts', roles: ['student'] },
  { href: '/student/chat/general', icon: MessageSquare, label: 'Chat Room', roles: ['student'] },
  { href: '/student/assignments', icon: ClipboardList, label: 'Assignments', roles: ['student'] },
  { href: '/student/marks', icon: GraduationCap, label: 'Marks', roles: ['student'] },
  { href: '/student/escalations', icon: AlertTriangle, label: 'Escalations', roles: ['student'] },
  { href: '/student/events', icon: Briefcase, label: 'Events', roles: ['student'] },

  // Teacher
  { href: '/teacher', icon: LayoutDashboard, label: 'Dashboard', roles: ['teacher'] },
  { href: '/teacher/notifications', icon: Bell, label: 'Notices', roles: ['teacher'] },
  { href: '/teacher/attendance', icon: CalendarCheck, label: 'Attendance', roles: ['teacher'] },
  { href: '/teacher/marks', icon: GraduationCap, label: 'Marks', roles: ['teacher'] },
  { href: '/teacher/assignments', icon: FileText, label: 'Assignments', roles: ['teacher'] },
  { href: '/teacher/progress', icon: TrendingUp, label: 'Student Progress', roles: ['teacher'] },
  { href: '/teacher/projects', icon: Award, label: 'Projects', roles: ['teacher'] },
  { href: '/teacher/curriculum', icon: FolderOpen, label: 'Curriculum', roles: ['teacher'] },
  { href: '/teacher/materials', icon: BookOpen, label: 'Materials', roles: ['teacher'] },
  { href: '/teacher/doubts', icon: ShieldQuestion, label: 'Anonymous Doubts', roles: ['teacher'] },
  { href: '/teacher/leaves', icon: CalendarCheck, label: 'Leave Requests', roles: ['teacher'] },
  { href: '/teacher/escalations', icon: AlertTriangle, label: 'Escalations', roles: ['teacher'] },
  { href: '/teacher/events', icon: Briefcase, label: 'Events', roles: ['teacher'] },


  // HOD
  { href: '/hod', icon: LayoutDashboard, label: 'Dashboard', roles: ['hod'] },
  { href: '/hod/notifications', icon: Bell, label: 'Notices', roles: ['hod'] },
  { href: '/hod/faculty', icon: Users, label: 'Faculty Management', roles: ['hod'] },
  { href: '/hod/analytics', icon: BarChart3, label: 'Analytics', roles: ['hod'] },
  { href: '/hod/curriculum', icon: FolderOpen, label: 'Curriculum', roles: ['hod'] },
  { href: '/hod/projects', icon: Award, label: 'Projects', roles: ['hod'] },
  { href: '/hod/escalations', icon: AlertTriangle, label: 'Escalations', roles: ['hod'] },

  // Principal
  { href: '/principal', icon: LayoutDashboard, label: 'Dashboard', roles: ['principal'] },
  { href: '/principal/kpi', icon: BarChart3, label: 'KPIs', roles: ['principal'] },
  { href: '/principal/projects', icon: Award, label: 'Projects', roles: ['principal'] },
  { href: '/principal/notices', icon: Megaphone, label: 'Notices', roles: ['principal'] },
  { href: '/principal/events', icon: Briefcase, label: 'Events', roles: ['principal'] },
];

export default function AppSidebar({ role, isMobile = false }: { role: Role, isMobile?: boolean }) {
  const pathname = usePathname();
  const userNavItems = navItems.filter(item => item.roles.includes(role));

  const navClass = cn(
    "flex flex-col gap-2",
    isMobile ? "p-4" : "border-r bg-card"
  )

  const linkClass = "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary";
  const activeLinkClass = "bg-muted text-primary";

  return (
    <nav className={navClass}>
      {isMobile && (
         <Link
          href="#"
          className="mb-4 flex items-center gap-2 text-lg font-semibold"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>CampusConnect</span>
        </Link>
      )}
      {userNavItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(linkClass, pathname.startsWith(item.href) && item.href !== '/' ? activeLinkClass : pathname === item.href ? activeLinkClass : '')}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
