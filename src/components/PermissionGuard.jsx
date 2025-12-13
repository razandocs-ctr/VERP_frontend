'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAnyPermission, isAdmin } from '@/utils/permissions';

/**
 * Permission Guard Component
 * Redirects users who don't have permission to access a page
 * @param {string} moduleId - The module ID to check permission for
 * @param {string} permissionType - The permission type ('view', 'create', 'edit', 'delete', 'full')
 * @param {ReactNode} children - The content to render if user has permission
 */
export default function PermissionGuard({ moduleId, permissionType = 'view', children, redirectTo = '/dashboard' }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Handle client-side mounting to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Dashboard is always accessible
        if (moduleId === 'dashboard') {
            return;
        }

        // Admin has access to everything
        if (isAdmin()) {
            return;
        }

        // Check if user has permission
        const hasAccess = hasAnyPermission(moduleId);

        if (!hasAccess) {
            // Redirect to dashboard if no permission
            router.replace(redirectTo);
        }
    }, [moduleId, router, redirectTo, mounted]);

    // During SSR or before mount, render children to prevent hydration mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    // Dashboard is always accessible
    if (moduleId === 'dashboard') {
        return <>{children}</>;
    }

    // Admin has access to everything
    if (isAdmin()) {
        return <>{children}</>;
    }

    // Check if user has permission
    const hasAccess = hasAnyPermission(moduleId);

    if (!hasAccess) {
        return null; // Don't render content if no permission
    }

    return <>{children}</>;
}


