import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { DataTable, Column } from '../components/DataTable';
import { StarRating } from '../components/StarRating';
import { Modal } from '../components/Modal';
import { showToast } from '../components/Toast';
import { createUserSchema, createStoreSchema } from '../validators/schemas';
import { User, Store, AdminStats, Role } from '../types';
import { Users, Store as StoreIcon, Star, Plus, ShieldCheck, User as UserIcon, Eye, EyeOff, Sparkles, CheckCircle2, Lock, Trash2, AlertTriangle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Active view tab: 'users' | 'stores'
  const [activeTab, setActiveTab] = useState<'users' | 'stores'>('users');

  // Users Table State
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSortBy, setUsersSortBy] = useState('createdAt');
  const [usersOrder, setUsersOrder] = useState<'asc' | 'desc'>('desc');
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>('');

  // Stores Table State
  const [storesPage, setStoresPage] = useState(1);
  const [storesSearch, setStoresSearch] = useState('');
  const [storesSortBy, setStoresSortBy] = useState('createdAt');
  const [storesOrder, setStoresOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form State - Add User
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userRole, setUserRole] = useState<Role>('USER');
  const [addUserErrors, setAddUserErrors] = useState<Record<string, string>>({});

  // Form State - Add Store
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeOwnerId, setStoreOwnerId] = useState('');
  const [addStoreErrors, setAddStoreErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: statsData } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.stats;
    }
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users', usersPage, usersSearch, usersSortBy, usersOrder, usersRoleFilter],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          page: usersPage,
          limit: 10,
          search: usersSearch,
          sortBy: usersSortBy,
          order: usersOrder,
          role: usersRoleFilter || undefined
        }
      });
      return res.data;
    }
  });

  const { data: storesData, isLoading: isStoresLoading } = useQuery({
    queryKey: ['admin-stores', storesPage, storesSearch, storesSortBy, storesOrder],
    queryFn: async () => {
      const res = await api.get('/admin/stores', {
        params: {
          page: storesPage,
          limit: 10,
          search: storesSearch,
          sortBy: storesSortBy,
          order: storesOrder
        }
      });
      return res.data;
    }
  });

  // Query all users for Store Owner dropdown selector in Add Store Modal
  const { data: allUsersForSelect } = useQuery({
    queryKey: ['all-users-select'],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { limit: 100 } });
      return res.data.data as User[];
    },
    enabled: isAddStoreModalOpen
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/users', data);
      return res.data;
    },
    onSuccess: () => {
      showToast('User created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsAddUserModalOpen(false);
      resetUserForm();
    },
    onError: (err: any) => {
      const apiErr = err.response?.data?.error;
      if (apiErr?.fields) {
        const formatted: Record<string, string> = {};
        Object.entries(apiErr.fields).forEach(([k, v]) => {
          formatted[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
        });
        setAddUserErrors(formatted);
      } else {
        showToast(apiErr?.message || 'Failed to create user', 'error');
      }
    }
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/stores', data);
      return res.data;
    },
    onSuccess: () => {
      showToast('Store created successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAddStoreModalOpen(false);
      resetStoreForm();
    },
    onError: (err: any) => {
      const apiErr = err.response?.data?.error;
      if (apiErr?.fields) {
        const formatted: Record<string, string> = {};
        Object.entries(apiErr.fields).forEach(([k, v]) => {
          formatted[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
        });
        setAddStoreErrors(formatted);
      } else {
        showToast(apiErr?.message || 'Failed to create store', 'error');
      }
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      showToast('User deleted successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      setUserToDelete(null);
    },
    onError: (err: any) => {
      const apiErr = err.response?.data?.error;
      showToast(apiErr?.message || 'Failed to delete user', 'error');
    }
  });

  const resetUserForm = () => {
    setUserName('');
    setUserEmail('');
    setUserAddress('');
    setUserPassword('');
    setUserRole('USER');
    setAddUserErrors({});
  };

  const resetStoreForm = () => {
    setStoreName('');
    setStoreEmail('');
    setStoreAddress('');
    setStoreOwnerId('');
    setAddStoreErrors({});
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserErrors({});
    const validation = createUserSchema.safeParse({
      name: userName,
      email: userEmail,
      address: userAddress,
      password: userPassword,
      role: userRole
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        errors[issue.path.join('.')] = issue.message;
      });
      setAddUserErrors(errors);
      return;
    }

    createUserMutation.mutate(validation.data);
  };

  const handleAddStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddStoreErrors({});
    const validation = createStoreSchema.safeParse({
      name: storeName,
      email: storeEmail,
      address: storeAddress,
      ownerId: storeOwnerId
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        errors[issue.path.join('.')] = issue.message;
      });
      setAddStoreErrors(errors);
      return;
    }

    createStoreMutation.mutate(validation.data);
  };

  const handleViewUserDetail = async (userId: string) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUserDetail(res.data.user);
    } catch {
      showToast('Failed to fetch user details', 'error');
    }
  };

  // User Table Columns
  const userColumns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (u) => (
        <div>
          <p className="font-semibold text-white">{u.name}</p>
          <p className="text-xs text-slate-400">{u.email}</p>
        </div>
      )
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (u) => {
        if (u.role === 'ADMIN')
          return (
            <span className="px-3 py-1 text-xs font-bold rounded-full glow-pill-admin">
              ADMIN
            </span>
          );
        if (u.role === 'STORE_OWNER')
          return (
            <span className="px-3 py-1 text-xs font-bold rounded-full glow-pill-owner">
              STORE OWNER
            </span>
          );
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full glow-pill-user">
            NORMAL USER
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewUserDetail(u.id);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white transition-all shadow-md cursor-pointer"
            title="View User Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUserToDelete(u);
            }}
            disabled={u.id === currentUser?.id}
            className={`p-2 rounded-xl transition-all shadow-md ${
              u.id === currentUser?.id
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                : 'bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/30 text-rose-400 hover:text-white cursor-pointer'
            }`}
            title={u.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete User'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Store Table Columns
  const storeColumns: Column<Store>[] = [
    {
      key: 'name',
      label: 'Store Name',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-white">{s.name}</p>
          <p className="text-xs text-slate-400">{s.email}</p>
        </div>
      )
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    {
      key: 'overallRating',
      label: 'Overall Rating',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          <StarRating rating={s.overallRating} size="sm" />
          <span className="font-extrabold text-amber-400 text-xs">{s.overallRating.toFixed(1)}</span>
          <span className="text-xs text-slate-500 font-semibold">({s.totalRatings || 0})</span>
        </div>
      )
    },
    {
      key: 'owner',
      label: 'Owner Name',
      render: (s) => s.owner?.name || '—'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header & Actions */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-bold text-purple-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Governance Portal
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">System Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Manage users, roles, stores, and platform metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add New User</span>
            </button>

            <button
              onClick={() => setIsAddStoreModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 gradient-btn-primary text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Store</span>
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card-3d rounded-3xl p-6 flex items-center gap-5 shadow-2xl border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Users</p>
              <p className="text-3xl font-black text-white tracking-tight">{statsData?.totalUsers ?? '—'}</p>
            </div>
          </div>

          <div className="glass-card-3d rounded-3xl p-6 flex items-center gap-5 shadow-2xl border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg">
              <StoreIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Stores</p>
              <p className="text-3xl font-black text-white tracking-tight">{statsData?.totalStores ?? '—'}</p>
            </div>
          </div>

          <div className="glass-card-3d rounded-3xl p-6 flex items-center gap-5 shadow-2xl border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <Star className="w-7 h-7 fill-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ratings Submitted</p>
              <p className="text-3xl font-black text-white tracking-tight">{statsData?.totalRatings ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'stores'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>Stores Directory</span>
          </button>
        </div>

        {/* Users Table View */}
        {activeTab === 'users' && (
          <DataTable
            columns={userColumns}
            data={usersData?.data || []}
            totalItems={usersData?.meta?.total || 0}
            page={usersPage}
            limit={10}
            sortBy={usersSortBy}
            order={usersOrder}
            onPageChange={setUsersPage}
            onSortChange={(key) => {
              if (usersSortBy === key) {
                setUsersOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              } else {
                setUsersSortBy(key);
                setUsersOrder('asc');
              }
            }}
            searchQuery={usersSearch}
            onSearchChange={setUsersSearch}
            searchPlaceholder="Search users by name, email, or address..."
            isLoading={isUsersLoading}
            filterComponent={
              <select
                value={usersRoleFilter}
                onChange={(e) => setUsersRoleFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">NORMAL USER</option>
                <option value="STORE_OWNER">STORE OWNER</option>
              </select>
            }
          />
        )}

        {/* Stores Table View */}
        {activeTab === 'stores' && (
          <DataTable
            columns={storeColumns}
            data={storesData?.data || []}
            totalItems={storesData?.meta?.total || 0}
            page={storesPage}
            limit={10}
            sortBy={storesSortBy}
            order={storesOrder}
            onPageChange={setStoresPage}
            onSortChange={(key) => {
              if (storesSortBy === key) {
                setStoresOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              } else {
                setStoresSortBy(key);
                setStoresOrder('asc');
              }
            }}
            searchQuery={storesSearch}
            onSearchChange={setStoresSearch}
            searchPlaceholder="Search stores by name, email, or address..."
            isLoading={isStoresLoading}
          />
        )}
      </main>

      {/* Modal: Add User */}
      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Add New User">
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Full Name (20–60 chars)
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Benjamin Franklin Roosevelt"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            {addUserErrors.name && <p className="mt-1 text-xs text-rose-400">{addUserErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            {addUserErrors.email && <p className="mt-1 text-xs text-rose-400">{addUserErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Address (Max 400 chars)
            </label>
            <textarea
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="Full address details"
              rows={2}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            {addUserErrors.address && <p className="mt-1 text-xs text-rose-400">{addUserErrors.address}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showUserPassword ? 'text' : 'password'}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="8–16 chars, 1 uppercase, 1 special char"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowUserPassword(!showUserPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-1"
                title={showUserPassword ? 'Hide password' : 'Show password'}
              >
                {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {addUserErrors.password && <p className="mt-1 text-xs text-rose-400">{addUserErrors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Assignable Role
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as Role)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="USER">Normal User</option>
              <option value="ADMIN">System Administrator</option>
              <option value="STORE_OWNER">Store Owner</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="px-5 py-2 gradient-btn-primary text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Store */}
      <Modal isOpen={isAddStoreModalOpen} onClose={() => setIsAddStoreModalOpen(false)} title="Add New Store">
        <form onSubmit={handleAddStoreSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Store Name (20–60 chars)
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Apex Electronics & Tech Hub"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            {addStoreErrors.name && <p className="mt-1 text-xs text-rose-400">{addStoreErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Store Email Address
            </label>
            <input
              type="email"
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              placeholder="store@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            {addStoreErrors.email && <p className="mt-1 text-xs text-rose-400">{addStoreErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Address (Max 400 chars)
            </label>
            <textarea
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="Store location address"
              rows={2}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            {addStoreErrors.address && <p className="mt-1 text-xs text-rose-400">{addStoreErrors.address}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Assign Store Owner
            </label>
            <select
              value={storeOwnerId}
              onChange={(e) => setStoreOwnerId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Select Store Owner...</option>
              {allUsersForSelect?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) [{u.role}]
                </option>
              ))}
            </select>
            {addStoreErrors.ownerId && <p className="mt-1 text-xs text-rose-400">{addStoreErrors.ownerId}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddStoreModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStoreMutation.isPending}
              className="px-5 py-2 gradient-btn-primary text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: User Full Detail */}
      <Modal
        isOpen={!!selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
        title="User Profile & Store Breakdown"
      >
        {selectedUserDetail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg">
                {selectedUserDetail.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{selectedUserDetail.name}</h4>
                <p className="text-xs text-slate-400">{selectedUserDetail.email}</p>
                <div className="mt-1">
                  {selectedUserDetail.role === 'ADMIN' ? (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full glow-pill-admin">
                      ADMIN
                    </span>
                  ) : selectedUserDetail.role === 'STORE_OWNER' ? (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full glow-pill-owner">
                      STORE OWNER
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full glow-pill-user">
                      NORMAL USER
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p>
                <p className="text-sm text-slate-200 mt-0.5">{selectedUserDetail.address}</p>
              </div>

              {selectedUserDetail.role === 'STORE_OWNER' && selectedUserDetail.storeDetail && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                    <StoreIcon className="w-4 h-4" />
                    Associated Store Metrics
                  </h5>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Store Name</p>
                      <p className="text-sm font-bold text-white">
                        {selectedUserDetail.storeDetail.storeName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Store Address</p>
                      <p className="text-xs text-slate-300">
                        {selectedUserDetail.storeDetail.storeAddress}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Aggregate Score</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={selectedUserDetail.storeDetail.averageRating} size="sm" />
                          <span className="text-xs font-extrabold text-amber-400">
                            {selectedUserDetail.storeDetail.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Reviews</p>
                        <p className="text-sm font-black text-white">
                          {selectedUserDetail.storeDetail.totalRatingsSubmitted}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirm User Deletion"
      >
        {userToDelete && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-300">Are you sure you want to delete this user?</h4>
                <p className="text-xs text-rose-300/80 leading-relaxed">
                  This action is permanent and cannot be undone. All associated ratings, sessions, and store references will be removed.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">User Name:</span>
                <span className="font-bold text-white">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-bold text-slate-300">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Role:</span>
                <span className="font-bold text-indigo-400">{userToDelete.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteUserMutation.mutate(userToDelete.id)}
                disabled={deleteUserMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
