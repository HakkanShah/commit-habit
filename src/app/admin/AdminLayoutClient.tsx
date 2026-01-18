'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, Users, MessageSquare, LogOut, ChevronRight, Mail } from 'lucide-react'

export function AdminLayoutClient({
    children,
    adminName
}: {
    children: React.ReactNode
    adminName: string | null
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar on route change
    useEffect(() => {
        setSidebarOpen(false)
    }, [pathname])

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [sidebarOpen])

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/feedback', icon: MessageSquare, label: 'Testimonials' },
        { href: '/admin/email', icon: Mail, label: 'Email' },
    ]

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0d1117] to-[#161b22] text-white">
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 lg:hidden">
                <div className="bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/5">
                    <div className="flex items-center justify-between px-4 h-14">
                        <Link href="/" className="flex items-center gap-1.5">
                            <span className="text-lg font-bold">
                                C<span className="text-[#39d353]">●</span>mmit
                                <span className="text-[#39d353]">Habit</span>
                            </span>
                        </Link>

                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed top-0 right-0 h-full w-72 bg-[#0d1117] border-l border-white/5 z-50 transform transition-transform duration-300 ease-out lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <div>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full">
                                ADMIN
                            </span>
                            <p className="text-xs text-gray-500 mt-1 truncate">{adminName}</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {navItems.map(({ href, icon: Icon, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(href)
                                    ? 'bg-[#39d353]/10 text-[#39d353]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{label}</span>
                                {isActive(href) && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        ))}
                    </nav>

                    {/* Exit Button */}
                    <div className="p-3 border-t border-white/5">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Exit Admin</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Desktop Layout */}
            <div className="hidden lg:flex">
                {/* Desktop Sidebar */}
                <aside className="fixed inset-y-0 left-0 w-64 bg-[#0d1117] border-r border-white/5">
                    <div className="flex flex-col h-full">
                        {/* Logo */}
                        <div className="p-6 border-b border-white/5">
                            <Link href="/" className="flex items-center gap-2">
                                <span className="text-xl font-bold">
                                    C<span className="text-[#39d353]">●</span>mmit
                                    <span className="text-[#39d353]">Habit</span>
                                </span>
                            </Link>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full">
                                    ADMIN
                                </span>
                                <span className="text-xs text-gray-500 truncate">{adminName}</span>
                            </div>
                        </div>

                        {/* Nav Items */}
                        <nav className="flex-1 p-4 space-y-1">
                            {navItems.map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(href)
                                        ? 'bg-gradient-to-r from-[#39d353]/20 to-transparent text-[#39d353]'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Exit Button */}
                        <div className="p-4 border-t border-white/5">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Exit Admin</span>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 min-h-screen">
                    <div className="max-w-5xl mx-auto p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Content */}
            <main className="lg:hidden px-4 py-5">
                {children}
            </main>
        </div>
    )
}
