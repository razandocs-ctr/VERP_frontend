'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Layers,
    ShoppingCart,
    FileText,
    Factory,
    BarChart3,
    Settings,
    ChevronRight,
    Search
} from 'lucide-react';
import { hasAnyPermission, isAdmin, getUserPermissions } from '@/utils/permissions';

// Menu items with their permission mappings
const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionModule: 'dashboard' },
    {
        id: 'HRM',
        label: 'HRM',
        icon: Users,
        permissionModule: 'hrm',
        submenu: [
            { label: 'Employees', permissionModule: 'hrm_employees_list' },
            { label: 'Attendance', permissionModule: 'hrm_attendance' },
            { label: 'Leave', permissionModule: 'hrm_leave' },
            { label: 'NCR', permissionModule: 'hrm_ncr' }
        ]
    },
    { id: 'CRM', label: 'CRM', icon: Layers, permissionModule: 'crm' },
    { id: 'Purchases', label: 'Purchases', icon: ShoppingCart, permissionModule: 'purchases' },
    { id: 'Accounts', label: 'Accounts', icon: FileText, permissionModule: 'accounts' },
    { id: 'Production', label: 'Production', icon: Factory, permissionModule: 'production' },
    { id: 'Reports', label: 'Reports', icon: BarChart3, permissionModule: 'reports' },
    {
        id: 'Settings',
        label: 'Settings',
        icon: Settings,
        permissionModule: 'settings',
        submenu: [
            { label: 'User', permissionModule: 'settings_user_group' },
            { label: 'Group', permissionModule: 'settings_user_group' },
            { label: 'Logout', permissionModule: null } // Logout doesn't need permission
        ]
    }
];

const logoPath = '/assets/employee/Sidebar_Top_Icon.png';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const [openMenu, setOpenMenu] = useState('');
    const [mounted, setMounted] = useState(false);

    // Handle client-side mounting to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Determine which menu should be open based on current pathname
    useEffect(() => {
        if (!pathname || !mounted) return;

        // Check if we're on an Employee page
        if (pathname.startsWith('/Employee')) {
            setOpenMenu('HRM');
        }
        // Check if we're on a Settings page
        else if (pathname.startsWith('/Settings')) {
            setOpenMenu('Settings');
        }
        // Check if we're on Dashboard - don't set openMenu for dashboard as it has no submenu
        // The active state is handled separately in the render
        else if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
            setOpenMenu(''); // Dashboard has no submenu, so don't set openMenu
        }
        // Add more conditions for other pages as needed
        else {
            // Don't auto-open any menu if not on a known page
            setOpenMenu('');
        }
    }, [pathname, mounted]);

    const toggleSidebar = () => setIsOpen((prev) => !prev);

    const handleSubmenuClick = (parentId, subItem) => {
        if (parentId === 'HRM' && subItem.label === 'Employees') {
            router.push('/Employee');
        } else if (parentId === 'Settings' && subItem.label === 'User') {
            router.push('/Settings/User');
        } else if (parentId === 'Settings' && subItem.label === 'Group') {
            router.push('/Settings/Group');
        } else if (parentId === 'Settings' && subItem.label === 'Logout') {
            // Clear all localStorage items
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('employeeUser');
                localStorage.removeItem('userPermissions');
                localStorage.removeItem('tokenExpiresIn');
            }
            // Redirect to login
            router.push('/login');
        }
    };

    // Determine if a subsection is active based on pathname
    const isSubmenuActive = (parentId, subItem) => {
        if (parentId === 'HRM' && subItem.label === 'Employees') {
            return pathname?.startsWith('/Employee');
        } else if (parentId === 'Settings' && subItem.label === 'User') {
            return pathname?.startsWith('/Settings/User');
        } else if (parentId === 'Settings' && subItem.label === 'Group') {
            return pathname?.startsWith('/Settings/Group');
        }
        return false;
    };

    // Check if menu item should be visible based on permissions
    const isMenuItemVisible = (item) => {
        // During SSR or before mount, show all items to prevent hydration mismatch
        if (!mounted) {
            return true;
        }

        // Dashboard is always visible
        if (item.id === 'dashboard') {
            return true;
        }

        // Settings is always visible (contains Logout button)
        if (item.id === 'Settings') {
            return true;
        }

        // Admin sees everything
        if (isAdmin()) {
            return true;
        }

        // Check if user has isActive permission for this module
        if (item.permissionModule) {
            const permissions = getUserPermissions();
            const modulePermission = permissions[item.permissionModule];

            // Check if module is active (isActive must be true)
            if (modulePermission && modulePermission.isActive === true) {
                return true;
            }

            // Also check child modules
            const childModules = Object.keys(permissions).filter(key => key.startsWith(item.permissionModule + '_'));
            for (const childModuleId of childModules) {
                const childPermission = permissions[childModuleId];
                if (childPermission && childPermission.isActive === true) {
                    return true;
                }
            }

            return false;
        }

        // If no permission module specified, show it (shouldn't happen)
        return false;
    };

    // Check if submenu item should be visible
    const isSubmenuItemVisible = (subItem) => {
        // During SSR or before mount, show all items to prevent hydration mismatch
        if (!mounted) {
            return true;
        }

        // Logout is always visible
        if (subItem.label === 'Logout') {
            return true;
        }

        // Admin sees everything
        if (isAdmin()) {
            return true;
        }

        // Check if user has isActive permission for this submenu item
        if (subItem.permissionModule) {
            const permissions = getUserPermissions();
            const modulePermission = permissions[subItem.permissionModule];

            // Check if module is active (isActive must be true)
            if (modulePermission && modulePermission.isActive === true) {
                return true;
            }

            return false;
        }

        return false;
    };

    return (
        <>
            {/* Sidebar Container */}
            <div
                className={`fixed top-0 left-0 h-screen bg-[#141622] text-gray-200 shadow-2xl transition-all duration-300 overflow-y-auto z-40 ${isOpen ? 'w-64' : 'w-0'
                    }`}
            >
                {isOpen && (
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="p-5 flex items-center justify-between border-b border-gray-700/50">
                            <Image
                                src={logoPath}
                                alt="ViS Logo"
                                width={100}
                                height={100}
                                className="object-contain"
                                style={{ height: 'auto' }}
                                priority
                            />
                            <button
                                onClick={toggleSidebar}
                                className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                            >
                                <ChevronRight size={18} className="transition-transform duration-300 rotate-180" />
                            </button>
                        </div>

                        {/* Profile */}
                        <div className="p-4 border-b border-gray-700/50 flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                PP
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white">Peter Parker</p>
                                <p className="text-xs text-gray-400">Python Developer</p>
                                <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400" />
                                    online
                                </p>
                            </div>
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <Settings size={18} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4">
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-full bg-[#252943] border border-gray-700/50 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Menu */}
                        <nav className="flex-1 px-3 pb-4">
                            {menuItems.map((item) => {
                                // Only show menu items user has permission for
                                if (!isMenuItemVisible(item)) {
                                    return null;
                                }

                                const Icon = item.icon;
                                const isMenuOpen = openMenu === item.id;
                                // Check if any submenu item is active
                                const hasActiveSubmenu = item.submenu?.some(sub => isSubmenuActive(item.id, sub));
                                const isActive = isMenuOpen || hasActiveSubmenu;

                                // Check if dashboard is active
                                const isDashboardActive = item.id === 'dashboard' && pathname === '/dashboard';
                                const finalIsActive = isActive || isDashboardActive;

                                return (
                                    <div key={item.id} className="mb-1">
                                        <button
                                            onClick={() => {
                                                if (item.id === 'dashboard') {
                                                    router.push('/dashboard');
                                                } else if (item.submenu) {
                                                    setOpenMenu(isMenuOpen ? '' : item.id);
                                                }
                                            }}
                                            className={`flex items-center w-full px-4 py-3 rounded-lg transition-all group ${finalIsActive
                                                ? 'bg-[#5e6c93] text-white shadow-lg'
                                                : 'text-gray-400 hover:bg-[#252943] hover:text-white'
                                                }`}
                                        >
                                            <Icon size={20} className={`shrink-0 ${finalIsActive ? 'text-white' : ''}`} />
                                            <span className={`ml-3 text-sm font-medium flex-1 text-left ${finalIsActive ? 'text-white' : ''}`}>{item.label}</span>
                                            {item.submenu && (
                                                <ChevronRight
                                                    size={18}
                                                    className={`transition-transform shrink-0 ${(isMenuOpen || hasActiveSubmenu) ? 'rotate-90' : ''}`}
                                                />
                                            )}
                                        </button>

                                        {item.submenu && (isMenuOpen || hasActiveSubmenu) && (
                                            <div className="ml-11 mt-1 space-y-1">
                                                {item.submenu.map((subItem, idx) => {
                                                    // Only show submenu items user has permission for
                                                    if (!isSubmenuItemVisible(subItem)) {
                                                        return null;
                                                    }

                                                    const isSubActive = isSubmenuActive(item.id, subItem);
                                                    const isLogout = subItem.label === 'Logout';
                                                    return (
                                                        <button
                                                            key={`${item.id}-${idx}`}
                                                            onClick={() => handleSubmenuClick(item.id, subItem)}
                                                            className={`flex items-center w-full px-3 py-2 text-sm transition-colors group ${isLogout
                                                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                                                : isSubActive
                                                                    ? 'text-white font-medium rounded'
                                                                    : 'text-gray-400 hover:text-white'
                                                                }`}
                                                            style={{ backgroundColor: 'lab(0 0 0 / 0)' }}
                                                        >
                                                            <span className={`mr-2 ${isSubActive ? 'text-white' : isLogout ? 'text-red-400' : 'text-gray-600'}`}>-</span>
                                                            {subItem.label}
                                                            <ChevronRight
                                                                size={16}
                                                                className={`ml-auto transition-opacity ${isSubActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>

            {/* Toggle Button when collapsed */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="fixed top-5 left-5 z-50 w-[36px] h-[36px] rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                    <ChevronRight size={18} className="transition-transform duration-300" />
                </button>
            )}

            {/* Content spacer */}
            <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`} />
        </>
    );
}
