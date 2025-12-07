import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifier } from '../contexts/NotificationContext';
import api from '../services/api';
import { 
    UserCircleIcon,
    CameraIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const { notify } = useNotifier();
    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || '',
        email: user?.email || ''
    });
    const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!isEditing) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            processFile(file);
        }
    };

    const processFile = (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            notify('Please select an image file', 'alert');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            notify('Image size must be less than 5MB', 'alert');
            return;
        }

        setSelectedFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        processFile(file);
    };

    const handleRemoveAvatar = () => {
        setSelectedFile(null);
        setAvatarPreview(user?.avatarUrl || null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            formData.append('phoneNumber', profileData.phoneNumber);
            
            // Add avatar if selected
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            const updatedUser = await api.updateUserProfile(formData);
            
            // Update user context with new data
            updateUser(updatedUser);
            setAvatarPreview(updatedUser.avatarUrl || null);
            setSelectedFile(null);
            setIsEditing(false); // Exit edit mode after save
            
            notify('Profile updated successfully!', 'info');
        } catch (error) {
            notify(`Failed to update profile: ${error.message}`, 'alert');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        // Reset to original values
        setProfileData({
            name: user?.name || '',
            phoneNumber: user?.phoneNumber || '',
            email: user?.email || ''
        });
        setAvatarPreview(user?.avatarUrl || null);
        setSelectedFile(null);
        setIsEditing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            notify('New passwords do not match', 'alert');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            notify('Password must be at least 6 characters', 'alert');
            return;
        }

        setIsChangingPassword(true);

        try {
            await api.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setIsEditingPassword(false); // Exit edit mode after save

            notify('Password changed successfully!', 'info');
        } catch (error) {
            notify(`Failed to change password: ${error.message}`, 'alert');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleCancelPasswordEdit = () => {
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setIsEditingPassword(false);
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                {/* Header */}
                <header className="mb-4">
                    <h1 className="text-2xl font-bold text-black dark:text-white">Profil Saya</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Kelola informasi profil dan keamanan akun Anda</p>
                </header>

                {/* Grid Layout: Kiri-Kanan */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT COLUMN - Profile Information */}
                    <div className="space-y-6">
                        {/* Profile Information Section */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 md:p-6 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-black dark:text-white">Informasi Profil</h2>
                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Profil
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                        Batal
                                    </button>
                                )}
                            </div>
                    
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                {/* Avatar Upload */}
                                <div 
                                    className={`flex flex-col items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-800 transition-all ${
                                        isDragging ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-400 dark:border-indigo-600 rounded-lg p-4' : ''
                                    }`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <div className="relative group">
                                        {avatarPreview ? (
                                            <img 
                                                src={avatarPreview}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-full object-cover border-3 border-indigo-600 dark:border-indigo-400"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-3 border-indigo-600 dark:border-indigo-400">
                                                <UserCircleIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        )}
                                        
                                        {/* Upload overlay */}
                                        <button
                                            type="button"
                                            onClick={handleAvatarClick}
                                            disabled={!isEditing}
                                            className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            <CameraIcon className="w-6 h-6 text-white" />
                                        </button>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {isEditing ? (
                                        <div className="flex flex-col items-center gap-3 w-full">
                                            {!selectedFile ? (
                                                <button
                                                    type="button"
                                                    onClick={handleAvatarClick}
                                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                                >
                                                    Pilih Foto Profil
                                                </button>
                                            ) : (
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={handleAvatarClick}
                                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        Ganti Foto
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveAvatar}
                                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 dark:hover:border-red-500 transition-colors"
                                                    >
                                                        Batalkan
                                                    </button>
                                                </div>
                                            )}
                                            <div className="text-center space-y-1">
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                    Format: JPG, PNG, atau GIF • Maksimal 5MB
                                                </p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                    Drag & drop foto ke area avatar di atas
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-slate-400 text-center bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-lg">
                                            Klik tombol "Edit Profil" untuk mengubah foto
                                        </p>
                                    )}
                                </div>

                                {/* Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1.5">
                                        Nama Lengkap
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        disabled={!isEditing}
                                        value={profileData.name}
                                        onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))}
                                        className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800" 
                                        placeholder="John Doe"
                                    />
                                </div>

                                {/* Phone Number Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1.5">
                                        Nomor Telepon
                                    </label>
                                    <input 
                                        type="tel"
                                        disabled={!isEditing}
                                        value={profileData.phoneNumber}
                                        onChange={(e) => setProfileData(prev => ({...prev, phoneNumber: e.target.value}))}
                                        className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800" 
                                        placeholder="+62 812 3456 7890"
                                    />
                                </div>

                                {/* Email Display (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1.5">
                                        Email
                                    </label>
                                    <input 
                                        type="email"
                                        value={profileData.email}
                                        disabled
                                        className="w-full bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-slate-400 cursor-not-allowed" 
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                        Email tidak dapat diubah
                                    </p>
                                </div>

                                {/* Save Button */}
                                {isEditing && (
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            type="submit" 
                                            disabled={isUpdating}
                                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckIcon className="w-4 h-4" />
                                                    Simpan Perubahan
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Password & Account Info */}
                    <div className="space-y-6">
                        {/* Change Password Section */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 md:p-6 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-black dark:text-white">Ubah Password</h2>
                        {!isEditingPassword ? (
                            <button
                                type="button"
                                onClick={() => setIsEditingPassword(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Ubah Password
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleCancelPasswordEdit}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                    Batal
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1.5">
                                Password Saat Ini
                            </label>
                            <input 
                                type="password"
                                required
                                disabled={!isEditingPassword}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800" 
                                placeholder="••••••••"
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1.5">
                                Password Baru
                            </label>
                            <input 
                                type="password"
                                required
                                disabled={!isEditingPassword}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800" 
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1.5">
                                Konfirmasi Password Baru
                            </label>
                            <input 
                                type="password"
                                required
                                disabled={!isEditingPassword}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800" 
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Password Requirements */}
                        {isEditingPassword && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2.5">
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1.5">
                                    Password harus:
                                </p>
                                <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1 ml-4 list-disc">
                                    <li>Minimal 6 karakter</li>
                                    <li>Gunakan kombinasi huruf dan angka untuk keamanan lebih baik</li>
                                </ul>
                            </div>
                        )}

                        {/* Change Password Button */}
                        {isEditingPassword && (
                            <div className="flex justify-end pt-2">
                                <button 
                                    type="submit" 
                                    disabled={isChangingPassword}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
                                >
                                    {isChangingPassword ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Mengubah...
                                        </>
                                    ) : (
                                        'Ubah Password'
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                        {/* Account Information */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 md:p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Informasi Akun</h2>
                            <div className="space-y-9">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">Role</span>
                                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase">
                                        {user?.role || 'Organizer'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">User ID</span>
                                    <span className="font-mono text-xs text-gray-500 dark:text-slate-500 break-all text-right ml-4">
                                        {user?.id || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
