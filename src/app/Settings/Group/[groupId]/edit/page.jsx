'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/utils/axios';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
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

export default function EditGroupPage() {
    const router = useRouter();
    const params = useParams();
    const groupId = params?.groupId;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [users, setUsers] = useState([]);
    const [groupUserSet, setGroupUserSet] = useState(new Set());
    const [expandedModules, setExpandedModules] = useState({});
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        title: '',
        description: ''
    });
    const [addUsersModalOpen, setAddUsersModalOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsersInModal, setSelectedUsersInModal] = useState([]);
    const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        selectedUsers: [],
        permissions: {}
    });

    useEffect(() => {
        if (groupId) {
            fetchGroupData();
        }
    }, [groupId]);

    // Fetch users after group data is loaded (so we have group name)
    useEffect(() => {
        if (groupId && formData.name) {
            fetchUsers();
        }
    }, [groupId, formData.name]);

    const fetchGroupData = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/User/groups/${groupId}`);
            const group = response.data.group || response.data;

            // Extract user IDs from group.users ONLY
            const userIds = (group.users || []).map(u =>
                String(u._id || u.id || u)
            );

            setGroupUserSet(new Set(userIds));

            // Initialize permissions with defaults (all false except dashboard)
            const defaultPermissions = {};
            // Convert existing permissions to new format (isActive, isCreate, isEdit, isDelete)
            if (group.permissions && Object.keys(group.permissions).length > 0) {
                Object.keys(group.permissions).forEach(moduleId => {
                    const oldPerm = group.permissions[moduleId];
                    // Convert old format to new format
                    defaultPermissions[moduleId] = {
                        isActive: oldPerm?.isActive ?? (oldPerm?.full || oldPerm?.view || false),
                        isCreate: oldPerm?.isCreate ?? (oldPerm?.full || oldPerm?.create || false),
                        isEdit: oldPerm?.isEdit ?? (oldPerm?.full || oldPerm?.edit || false),
                        isDelete: oldPerm?.isDelete ?? (oldPerm?.full || oldPerm?.delete || false)
                    };
                });
            }
            // Ensure dashboard is always active by default
            defaultPermissions.dashboard = {
                isActive: true,
                isCreate: false,
                isEdit: false,
                isDelete: false
            };

            setFormData({
                name: group.name || '',
                selectedUsers: userIds, // default checked users
                permissions: defaultPermissions
            });
        } catch (err) {
            console.error('Error fetching group:', err);
            setAlertDialog({
                open: true,
                title: 'Error',
                description: err.response?.data?.message || 'Failed to load group data'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            // Fetch all users (except Administrators)
            const response = await axiosInstance.get('/User', {
                params: { limit: 1000, status: 'All' }
            });
            // Filter: ONLY show users that belong to the current group
            // Users without any group will NOT be shown here
            const groupUsers = (response.data.users || []).filter(user => {
                // Exclude Administrators
                if (user.isAdministrator) {
                    return false;
                }

                // Get current group name from formData
                const currentGroupName = formData.name;

                // Get user's group ID
                const userGroupId = user.groupId || user.group?._id || user.group;
                const userGroupIdString = userGroupId?.toString ? userGroupId.toString() : String(userGroupId || '');
                const currentGroupIdString = groupId?.toString ? groupId.toString() : String(groupId || '');

                // User must have a group to be shown (exclude users without group)
                const hasGroup = user.groupName || userGroupId;
                if (!hasGroup) {
                    return false; // Don't show users without any group
                }

                // User belongs to current group if:
                // 1. groupName matches current group name, OR
                // 2. groupId matches current groupId
                const groupNameMatches = user.groupName && currentGroupName &&
                    user.groupName.toLowerCase().trim() === currentGroupName.toLowerCase().trim();
                const groupIdMatches = userGroupIdString === currentGroupIdString;

                return groupNameMatches || groupIdMatches;
            });
            setUsers(groupUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
            setAlertDialog({
                open: true,
                title: 'Error',
                description: 'Failed to load users'
            });
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
        setFormData(prev => ({
            ...prev,
            selectedUsers: prev.selectedUsers.includes(userId)
                ? prev.selectedUsers.filter(id => id !== userId)
                : [...prev.selectedUsers, userId]
        }));
    };

    const fetchAvailableUsers = async () => {
        try {
            setLoadingAvailableUsers(true);
            // Fetch all users
            const response = await axiosInstance.get('/User', {
                params: { limit: 1000, status: 'All' }
            });
            // Filter users without a group (exclude Administrators - they don't need groups)
            // Use the same logic as create group page
            const usersWithoutGroup = (response.data.users || []).filter(user => {
                // Exclude Administrators (they have all permissions automatically)
                if (user.isAdministrator) {
                    return false;
                }
                // User has no group if groupId is null, undefined, or empty
                return !user.groupId || user.groupId === null;
            });
            setAvailableUsers(usersWithoutGroup);
            setSelectedUsersInModal([]);
        } catch (err) {
            console.error('Error fetching available users:', err);
            setAlertDialog({
                open: true,
                title: 'Error',
                description: 'Failed to load available users'
            });
        } finally {
            setLoadingAvailableUsers(false);
        }
    };

    const handleOpenAddUsersModal = () => {
        setAddUsersModalOpen(true);
        fetchAvailableUsers();
    };

    const handleToggleUserInModal = (userId) => {
        setSelectedUsersInModal(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddUsersToGroup = async () => {
        if (selectedUsersInModal.length === 0) {
            setAlertDialog({
                open: true,
                title: 'No Users Selected',
                description: 'Please select at least one user to add.'
            });
            return;
        }

        try {
            setSubmitting(true);
            // Add selected users to existing selectedUsers
            const updatedUsers = [...formData.selectedUsers, ...selectedUsersInModal];

            const payload = {
                name: formData.name.trim(),
                users: updatedUsers,
                permissions: formData.permissions
            };

            await axiosInstance.patch(`/User/groups/${groupId}`, payload);

            // Refresh group data and users list
            await fetchGroupData();
            await fetchUsers();

            setAddUsersModalOpen(false);
            setSelectedUsersInModal([]);
        } catch (err) {
            console.error('Error adding users to group:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to add users to group';
            setAlertDialog({
                open: true,
                title: 'Error',
                description: errorMessage
            });
        } finally {
            setSubmitting(false);
        }
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
                                    aria-label={isExpanded ? `Collapse ${module.label}` : `Expand ${module.label}`}
                                    title={isExpanded ? `Collapse ${module.label}` : `Expand ${module.label}`}
                                >
                                    {isExpanded ? (
                                        <ChevronDown size={16} aria-hidden="true" />
                                    ) : (
                                        <ChevronRight size={16} aria-hidden="true" />
                                    )}
                                </button>
                            )}
                            {!hasSubmodules && level > 0 && <span className="w-4" />}
                            <span className="text-sm font-medium text-gray-900">
                                {module.label}
                            </span>
                        </div>
                    </td>
                    {PERMISSION_TYPES.map((perm) => {
                        const checkboxId = `permission-${module.id}-${perm.id}`;
                        return (
                            <td key={perm.id} className="px-4 py-3 text-center">
                                <label htmlFor={checkboxId} className="sr-only">
                                    {module.label} - {perm.label} permission
                                </label>
                                <input
                                    type="checkbox"
                                    id={checkboxId}
                                    name={`permission-${module.id}-${perm.id}`}
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
                                    aria-label={`${module.label} - ${perm.label} permission`}
                                    title={`${module.label} - ${perm.label} permission`}
                                />
                            </td>
                        );
                    })}
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
            // First, clear all users from this group by setting users to empty array
            // Then update with only the selected users
            const payload = {
                name: formData.name.trim(),
                users: formData.selectedUsers, // This will replace all users - backend should handle clearing first
                permissions: formData.permissions
            };

            // The backend should handle: clear all users from group, then add selected users
            // If backend doesn't handle this automatically, we may need to make two API calls
            await axiosInstance.patch(`/User/groups/${groupId}`, payload);
            router.push('/Settings/Group');
        } catch (err) {
            console.error('Error updating group:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update group';
            setAlertDialog({
                open: true,
                title: 'Error',
                description: errorMessage
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F2F6F9]">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Navbar />
                    <div className="p-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                            Loading group data...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F2F6F9]">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Group</h1>
                        <p className="text-gray-600">Update group information, users and permissions.</p>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-8">
                                {/* Group Name */}
                                <div>
                                    <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Group Name
                                    </label>
                                    <input
                                        type="text"
                                        id="group-name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter group name"
                                        autoComplete="organization"
                                        aria-describedby={errors.name ? 'group-name-error' : undefined}
                                        aria-invalid={errors.name ? 'true' : 'false'}
                                    />
                                    {errors.name && (
                                        <p id="group-name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
                                    )}
                                </div>

                                {/* Select Users */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Users in Group
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleOpenAddUsersModal}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                                        >
                                            + Add Users
                                        </button>
                                    </div>
                                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                                        {users.length === 0 ? (
                                            <div className="text-center text-gray-500 py-4">No users in this group</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {users.map((user) => {
                                                    const userId = String(user._id || user.id);
                                                    const isInCurrentGroup = groupUserSet.has(userId);

                                                    return (
                                                        <div
                                                            key={userId}
                                                            className={`flex items-center gap-3 p-2 hover:bg-gray-100 rounded ${isInCurrentGroup ? 'bg-blue-50' : ''}`}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {user.username || user.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {user.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Note: Users currently in this group are displayed above.
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
                                                {MODULES.map((module) =>
                                                    renderModuleRow(module, 0)
                                                )}
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
                                    {submitting ? 'Updating...' : 'Update Group'}
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

            {/* Add Users Modal */}
            <AlertDialog open={addUsersModalOpen} onOpenChange={setAddUsersModalOpen}>
                <AlertDialogContent className="sm:max-w-[500px] rounded-[22px] border-gray-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add Users to Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select users without a group to add them to this group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                        {loadingAvailableUsers ? (
                            <div className="text-center text-gray-500 py-8">Loading users...</div>
                        ) : availableUsers.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No users available without a group</div>
                        ) : (
                            <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                                <div className="space-y-2">
                                    {availableUsers.map((user) => {
                                        const userId = String(user._id || user.id);
                                        const checkboxId = `modal-user-${userId}`;
                                        const isSelected = selectedUsersInModal.includes(userId);

                                        return (
                                            <label
                                                key={userId}
                                                htmlFor={checkboxId}
                                                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={checkboxId}
                                                    name={`modal-user-${userId}`}
                                                    checked={isSelected}
                                                    onChange={() => handleToggleUserInModal(userId)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    aria-label={`Select user ${user.username || user.name}`}
                                                    title={`Select user ${user.username || user.name}`}
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
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setAddUsersModalOpen(false);
                            setSelectedUsersInModal([]);
                        }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAddUsersToGroup}
                            disabled={submitting || selectedUsersInModal.length === 0}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Adding...' : `Add ${selectedUsersInModal.length > 0 ? `(${selectedUsersInModal.length})` : ''}`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
