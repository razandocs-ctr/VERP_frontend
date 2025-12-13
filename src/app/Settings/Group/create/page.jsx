'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axios';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MODULES = [
    { id: 'login', label: 'Login', parent: null },
    { id: 'dashboard', label: 'Dashboard', parent: null },
    {
        id: 'hrm',
        label: 'HRM',
        parent: null,
        children: [
            {
                id: 'hrm_employees',
                label: 'Employees',
                parent: 'hrm',
                children: [
                    { id: 'hrm_employees_add', label: 'Add Employee', parent: 'hrm_employees' },
                    { id: 'hrm_employees_list', label: 'Employee List', parent: 'hrm_employees' },
                    {
                        id: 'hrm_employees_view',
                        label: 'View Employee',
                        parent: 'hrm_employees',
                        children: [
                            { id: 'hrm_employees_view_basic', label: 'Basic Details', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_personal', label: 'Personal Details', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_passport', label: 'Passport', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_visa', label: 'Visa', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_education', label: 'Education', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_experience', label: 'Experience', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_work', label: 'Work Details', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_salary', label: 'Salary', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_bank', label: 'Bank Details', parent: 'hrm_employees_view' },
                            { id: 'hrm_employees_view_emergency', label: 'Emergency Contacts', parent: 'hrm_employees_view' },
                        ]
                    }
                ]
            },
            { id: 'hrm_attendance', label: 'Attendance', parent: 'hrm' },
            { id: 'hrm_leave', label: 'Leave', parent: 'hrm' },
            { id: 'hrm_ncr', label: 'NCR', parent: 'hrm' },
        ]
    },
    { id: 'crm', label: 'CRM', parent: null },
    { id: 'purchases', label: 'Purchases', parent: null },
    { id: 'accounts', label: 'Accounts', parent: null },
    { id: 'production', label: 'Production', parent: null },
    { id: 'reports', label: 'Reports', parent: null },
    {
        id: 'settings',
        label: 'Settings',
        parent: null,
        children: [
            { id: 'settings_user_group', label: 'Create User & Group', parent: 'settings' }
        ]
    },
];

const PERMISSION_TYPES = [
    { id: 'isActive', label: 'Active' },
    { id: 'isCreate', label: 'Create' },
    { id: 'isEdit', label: 'Edit' },
    { id: 'isDelete', label: 'Delete' },
];

export default function CreateGroupPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState({});
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        title: '',
        description: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        selectedUsers: [],
        permissions: {
            // Default: dashboard is active, all others false
            dashboard: {
                isActive: true,
                isCreate: false,
                isEdit: false,
                isDelete: false
            }
        }
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Fetch all users
            const response = await axiosInstance.get('/User', {
                params: { limit: 1000, status: 'All' }
            });
            // Filter users without a group (exclude Administrators - they don't need groups)
            const usersWithoutGroup = (response.data.users || []).filter(user => {
                // Exclude Administrators (they have all permissions automatically)
                if (user.isAdministrator) {
                    return false;
                }
                // User has no group if groupId is null, undefined, or empty
                return !user.groupId || user.groupId === null;
            });
            setUsers(usersWithoutGroup);
        } catch (err) {
            console.error('Error fetching users:', err);
            setAlertDialog({
                open: true,
                title: 'Error',
                description: 'Failed to load users'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleUserToggle = (userId) => {
        setFormData(prev => {
            const selectedUsers = prev.selectedUsers.includes(userId)
                ? prev.selectedUsers.filter(id => id !== userId)
                : [...prev.selectedUsers, userId];
            return { ...prev, selectedUsers };
        });
    };

    const handlePermissionChange = (moduleId, permissionType, checked) => {
        setFormData(prev => {
            const permissions = { ...prev.permissions };
            if (!permissions[moduleId]) {
                permissions[moduleId] = {
                    isActive: false,
                    isCreate: false,
                    isEdit: false,
                    isDelete: false
                };
            }
            permissions[moduleId][permissionType] = checked;

            // If "isActive" is checked, it enables the section
            // If "isActive" is unchecked, uncheck all others
            if (permissionType === 'isActive') {
                if (!checked) {
                    // If Active is unchecked, uncheck all permissions
                    permissions[moduleId] = {
                        isActive: false,
                        isCreate: false,
                        isEdit: false,
                        isDelete: false
                    };
                }
            } else {
                // If any permission other than "isActive" is checked, automatically check "isActive"
                if (checked) {
                    permissions[moduleId].isActive = true;
                } else {
                    // If all other permissions are unchecked, uncheck "isActive"
                    const allUnchecked = ['isCreate', 'isEdit', 'isDelete'].every(
                        p => p === permissionType ? false : !permissions[moduleId][p]
                    );
                    if (allUnchecked) {
                        permissions[moduleId].isActive = false;
                    }
                }
            }

            return { ...prev, permissions };
        });
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const hasChildren = (module) => {
        return module.children && module.children.length > 0;
    };

    const renderModuleRow = (module, level = 0) => {
        const isExpanded = expandedModules[module.id];
        const hasSubmodules = hasChildren(module);
        const indentClass = level === 0 ? '' : level === 1 ? 'pl-8' : level === 2 ? 'pl-16' : 'pl-24';

        return (
            <React.Fragment key={module.id}>
                <tr className="hover:bg-gray-50">
                    <td className={`px-4 py-3 ${indentClass}`}>
                        <div className="flex items-center gap-2">
                            {hasSubmodules && (
                                <button
                                    type="button"
                                    onClick={() => toggleModule(module.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {isExpanded ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </button>
                            )}
                            {!hasSubmodules && level > 0 && <span className="w-4" />}
                            <span className="text-sm font-medium text-gray-900">
                                {module.label}
                            </span>
                        </div>
                    </td>
                    {PERMISSION_TYPES.map((perm) => (
                        <td key={perm.id} className="px-4 py-3 text-center">
                            <input
                                type="checkbox"
                                checked={
                                    formData.permissions[module.id]?.[perm.id] || false
                                }
                                onChange={(e) =>
                                    handlePermissionChange(
                                        module.id,
                                        perm.id,
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </td>
                    ))}
                </tr>
                {hasSubmodules && isExpanded && module.children?.map((child) =>
                    renderModuleRow(child, level + 1)
                )}
            </React.Fragment>
        );
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Group name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                users: formData.selectedUsers,
                permissions: formData.permissions,
                status: 'Active'
            };

            await axiosInstance.post('/User/groups', payload);
            router.push('/Settings/Group');
        } catch (err) {
            console.error('Error creating group:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create group';
            setAlertDialog({
                open: true,
                title: 'Error',
                description: errorMessage
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: '#F2F6F9' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Group</h1>
                        <p className="text-gray-600">Create a new user group, assign users and set permissions.</p>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-8">
                                {/* Group Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Group Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter group name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Select Users */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Users
                                    </label>
                                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                                        {loading ? (
                                            <div className="text-center text-gray-500 py-4">Loading users...</div>
                                        ) : users.length === 0 ? (
                                            <div className="text-center text-gray-500 py-4">No available users</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {users.map((user) => (
                                                    <label
                                                        key={user.id}
                                                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.selectedUsers.includes(user.id)}
                                                            onChange={() => handleUserToggle(user.id)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.username || user.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {user.name}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Note: Users already assigned to another group will not appear in this list.
                                    </p>
                                </div>

                                {/* Module Permissions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Module Permissions
                                    </label>
                                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                                        Module
                                                    </th>
                                                    {PERMISSION_TYPES.map((perm) => (
                                                        <th
                                                            key={perm.id}
                                                            className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase"
                                                        >
                                                            {perm.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {MODULES.map((module, index, array) => {
                                                    const isLast = index === array.length - 1;
                                                    return renderModuleRow(module, 0, isLast, []);
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create Group'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/Settings/Group')}
                                    className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Alert Dialog */}
            <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog((prev) => ({ ...prev, open }))}>
                <AlertDialogContent className="sm:max-w-[425px] rounded-[22px] border-gray-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertDialog({ open: false, title: '', description: '' })}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
