'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axios';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
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

export default function CreateUserPage() {
    const router = useRouter();
    const [creationMode, setCreationMode] = useState('employee'); // 'employee' or 'new'
    const [employees, setEmployees] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        title: '',
        description: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        employeeId: '',
        username: '',
        email: '',
        name: '',
        password: '',
        status: 'Active',
        group: '',
    });

    useEffect(() => {
        fetchEmployees();
        fetchGroups();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axiosInstance.get('/Employee', {
                params: { limit: 1000 }
            });
            if (response.data.employees) {
                setEmployees(response.data.employees || []);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await axiosInstance.get('/User/groups/all');
            if (response.data.groups) {
                setGroups(response.data.groups || []);
            }
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleEmployeeSelect = (e) => {
        const selectedEmployeeId = e.target.value;
        setFormData(prev => ({
            ...prev,
            employeeId: selectedEmployeeId
        }));

        // Auto-fill username, email and name from selected employee
        if (selectedEmployeeId) {
            const employee = employees.find(emp => emp.employeeId === selectedEmployeeId);
            if (employee) {
                setFormData(prev => ({
                    ...prev,
                    username: employee.email?.split('@')[0] || employee.employeeId || '',
                    email: employee.email || '',
                    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || ''
                }));
            }
        }
    };

    const validatePassword = (password) => {
        if (!password || password.trim() === '') {
            return 'Password is required';
        }
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const validateForm = () => {
        const newErrors = {};

        if (creationMode === 'employee') {
            if (!formData.employeeId) {
                newErrors.employeeId = 'Employee is required';
            }
        } else {
            if (!formData.name || formData.name.trim() === '') {
                newErrors.name = 'Name is required';
            }
            if (!formData.email || formData.email.trim() === '') {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }
        }

        if (!formData.username || formData.username.trim() === '') {
            newErrors.username = 'Username is required';
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            newErrors.password = passwordError;
        }

        // Group is optional - no validation needed

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Check if form is valid for button disable state
    const isFormValid = () => {
        if (creationMode === 'employee') {
            return formData.employeeId && formData.username && formData.password &&
                !validatePassword(formData.password);
        } else {
            return formData.name && formData.email && formData.username &&
                formData.password && !validatePassword(formData.password);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            let payload = {
                username: formData.username.trim(),
                password: formData.password,
                status: 'Active', // Default status
                group: formData.group || null, // Optional
            };

            if (creationMode === 'employee') {
                // Get employee details for name and email
                const employee = employees.find(emp => emp.employeeId === formData.employeeId);
                if (employee) {
                    payload.employeeId = formData.employeeId;
                    payload.name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeId;
                    payload.email = employee.email || `${formData.username}@example.com`;
                }
            } else {
                payload.name = formData.name.trim();
                payload.email = formData.email.trim().toLowerCase();
            }

            await axiosInstance.post('/User', payload);
            router.push('/Settings/User');
        } catch (err) {
            console.error('Error creating user:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create user';
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
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New User</h1>
                    </div>

                    {/* Main Form Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {/* Creation Mode Selection */}
                        <div className="mb-6">
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="creationMode"
                                        value="employee"
                                        checked={creationMode === 'employee'}
                                        onChange={(e) => {
                                            setCreationMode(e.target.value);
                                            // Clear form data when switching modes
                                            setFormData({
                                                employeeId: '',
                                                username: '',
                                                email: '',
                                                name: '',
                                                password: '',
                                                status: 'Active',
                                                group: '',
                                            });
                                            setErrors({});
                                        }}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-gray-700 font-medium">Create user from existing employee</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="creationMode"
                                        value="new"
                                        checked={creationMode === 'new'}
                                        onChange={(e) => {
                                            setCreationMode(e.target.value);
                                            // Clear form data when switching modes
                                            setFormData({
                                                employeeId: '',
                                                username: '',
                                                email: '',
                                                name: '',
                                                password: '',
                                                status: 'Active',
                                                group: '',
                                            });
                                            setErrors({});
                                        }}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-gray-700 font-medium">Create new user</span>
                                </label>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Employee Selection (only for employee mode) */}
                                {creationMode === 'employee' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Employee
                                        </label>
                                        <select
                                            name="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleEmployeeSelect}
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.employeeId ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select</option>
                                            {employees.map((emp) => (
                                                <option key={emp.employeeId} value={emp.employeeId}>
                                                    {emp.employeeId} - {emp.firstName} {emp.lastName}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.employeeId && (
                                            <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                                        )}
                                    </div>
                                )}

                                {/* Name and Email (only for new user mode) */}
                                {creationMode === 'new' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Enter full name"
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Enter email address"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Username and Password (2 columns) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter username"
                                        />
                                        {errors.username && (
                                            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter password"
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">
                                            Password must be at least 8 characters with uppercase, lowercase, and number.
                                        </p>
                                    </div>
                                </div>

                                {/* Group */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Group
                                    </label>
                                    <select
                                        name="group"
                                        value={formData.group}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.group ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select</option>
                                        {groups.map((group) => (
                                            <option key={group._id} value={group._id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.group && (
                                        <p className="mt-1 text-sm text-red-600">{errors.group}</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={submitting || !isFormValid()}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create'}
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

