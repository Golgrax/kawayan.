import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, AlertTriangle, TrendingUp, DollarSign, Activity, MessageSquare, CheckSquare, Clock, CheckCircle, Trash2, Edit, Save, X, Search, Shield, Settings, Power, Download, Upload, Filter, User as UserIcon, Lock, Calendar, CreditCard, Moon, Sun, XCircle, Wallet } from 'lucide-react';
import UniversalDatabaseService from '../services/universalDatabaseService';
import { supportService } from '../services/supportService';
import { Ticket, User } from '../types';

const AdminDashboard: React.FC = () => {
  const [dbService] = useState(() => new UniversalDatabaseService());
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'helpdesk' | 'logs' | 'settings'>('overview');
  
  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPostsGenerated: 0,
    revenue: 0,
    cancelledTransactions: 0,
    pendingTransactions: 0,
    revenueData: [] as any[],
    churnData: [] as any[]
  });
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  });

  // Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Using 'any' to include balance
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User Management State
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [managingUser, setManagingUser] = useState<any | null>(null); // For Modal
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

  // Modal State
  const [manageAction, setManageAction] = useState<'balance' | 'subscription'>('balance');
  const [balanceForm, setBalanceForm] = useState({ amount: 0, reason: '' });
  const [subForm, setSubForm] = useState({ plan: 'FREE', expiresAt: '' });

  // Settings State
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true
  });

  const [adminProfile, setAdminProfile] = useState<{email: string, password: '', confirm: ''}>({
    email: 'admin@kawayan.ph',
    password: '',
    confirm: ''
  });
  
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    loadData();
  }, [dbService, dateRange]);

  const loadData = async () => {
    try {
      const [adminStats, userList, ticketList, logs] = await Promise.all([
        dbService.getAdminStats(dateRange.start, dateRange.end),
        dbService.getAllUsers(),
        dbService.getAllTicketsAdmin(),
        dbService.getAuditLogs(100)
      ]);
      setStats(adminStats);
      setUsers(userList);
      setTickets(ticketList);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  // --- Sorting & Filtering ---
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getFilteredAndSortedUsers = () => {
    let filtered = users.filter(u => 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (u.businessName && u.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nulls
      if (aVal === null) aVal = '';
      if (bVal === null) bVal = '';

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // --- Export Data ---
  const exportUsersToCSV = () => {
    const headers = ['ID,Email,Role,Business Name,Balance,Created At'];
    const rows = users.map(u => 
      `${u.id},${u.email},${u.role},"${u.businessName || ''}",${u.balance || 0},${u.createdAt}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kawayan_users_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Actions ---
  const handleUserUpdate = async (userId: string) => {
    try {
      await dbService.updateUser(userId, editForm);
      setEditingUser(null);
      setEditForm({});
      loadData(); 
    } catch (error) {
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure? This will delete ALL user data permanently.')) {
      try {
        await dbService.deleteUser(userId);
        loadData();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleAdjustBalance = async () => {
    if (!managingUser) return;
    try {
      await dbService.adminAdjustBalance(managingUser.id, balanceForm.amount, balanceForm.reason);
      alert('Balance adjusted');
      setManagingUser(null);
      loadData();
    } catch (error) {
      alert('Failed to adjust balance');
    }
  };

  const handleUpdateSubscription = async () => {
    if (!managingUser) return;
    try {
      await dbService.adminUpdateSubscription(managingUser.id, subForm.plan, subForm.expiresAt);
      alert('Subscription updated');
      setManagingUser(null);
      loadData();
    } catch (error) {
      alert('Failed to update subscription');
    }
  };

  const handleTicketStatus = (id: string, status: 'Open' | 'Pending' | 'Resolved') => {
    supportService.updateTicketStatus(id, status);
    dbService.getAllTicketsAdmin().then(setTickets);
  };

  const handleAdminProfileUpdate = () => {
    if (adminProfile.password !== adminProfile.confirm) {
      alert("Passwords do not match");
      return;
    }
    alert("Admin profile updated (Simulation)");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      
      {/* MANAGE USER MODAL */}
      {managingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Manage User</h3>
                <p className="text-xs text-slate-500">{managingUser.email}</p>
              </div>
              <button onClick={() => setManagingUser(null)}><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            
            <div className="p-2 flex gap-2 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
               <button 
                 onClick={() => setManageAction('balance')}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${manageAction === 'balance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                 Wallet Balance
               </button>
               <button 
                 onClick={() => setManageAction('subscription')}
                 className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${manageAction === 'subscription' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                 Subscription
               </button>
            </div>

            <div className="p-6">
              {manageAction === 'balance' ? (
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Current Balance</span>
                      <h2 className="text-3xl font-black text-slate-800 dark:text-white">₱{managingUser.balance.toLocaleString()}</h2>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Amount to Add (use negative to subtract)</label>
                      <input 
                        type="number" 
                        value={balanceForm.amount} 
                        onChange={(e) => setBalanceForm({...balanceForm, amount: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Reason / Reference</label>
                      <input 
                        type="text" 
                        value={balanceForm.reason} 
                        onChange={(e) => setBalanceForm({...balanceForm, reason: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                        placeholder="e.g. Manual Top-up"
                      />
                   </div>
                   <button onClick={handleAdjustBalance} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">Confirm Adjustment</button>
                </div>
              ) : (
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Plan</label>
                      <select 
                        value={subForm.plan} 
                        onChange={(e) => setSubForm({...subForm, plan: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      >
                        <option value="FREE">Free</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Expiry Date</label>
                      <input 
                        type="date" 
                        value={subForm.expiresAt} 
                        onChange={(e) => setSubForm({...subForm, expiresAt: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                   </div>
                   <button onClick={handleUpdateSubscription} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Update Subscription</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header & Nav */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Shield className="w-8 h-8 text-emerald-600"/> Administrator Panel
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive management of users, transactions, and system settings.</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
           {[ 
             { id: 'overview', label: 'Overview', icon: Activity },
             { id: 'users', label: 'Users', icon: Users },
             { id: 'helpdesk', label: 'Help Desk', icon: MessageSquare },
             { id: 'logs', label: 'Audit Logs', icon: Clock },
             { id: 'settings', label: 'Settings', icon: Settings },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition whitespace-nowrap ${ 
                 activeTab === tab.id 
                 ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
               }`}
             >
               <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4"/> Date Range:</span>
             <input 
               type="date" 
               value={dateRange.start} 
               onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm dark:text-white"
             />
             <span className="text-slate-400">-</span>
             <input 
               type="date" 
               value={dateRange.end} 
               onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
               className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm dark:text-white"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[ 
              { label: 'Total Revenue', value: `₱${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Active Sessions', value: stats.activeUsers, icon: Activity, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Posts Created', value: stats.totalPostsGenerated, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Cancelled Txns', value: stats.cancelledTransactions, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { label: 'Pending Txns', value: stats.pendingTransactions, icon: Wallet, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-xl ${stat.bg}`}>
                     <stat.icon className={`w-6 h-6 ${stat.color}`} />
                   </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-96">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6">Revenue Growth (Selected Period)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#0f172a'}} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-96 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white">Latest Activity</h3>
                <button onClick={() => setActiveTab('logs')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">View All</button>
              </div>
              <div className="flex-1 space-y-4 overflow-hidden">
                {auditLogs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="flex gap-3 border-b border-slate-50 dark:border-slate-700 pb-3 last:border-0">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg h-fit">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{log.user_id}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No activity recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64 dark:text-white"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={exportUsersToCSV}
                 className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
               >
                 <Download className="w-4 h-4"/> Export CSV
               </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                <tr>
                  {[ 
                    { key: 'email', label: 'User' },
                    { key: 'role', label: 'Role' },
                    { key: 'businessName', label: 'Business' },
                    { key: 'balance', label: 'Wallet Balance' },
                    { key: 'createdAt', label: 'Joined' },
                  ].map(h => (
                    <th key={h.key} className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition" onClick={() => handleSort(h.key)}>
                      <div className="flex items-center gap-1">
                        {h.label}
                        <Filter className={`w-3 h-3 ${sortConfig.key === h.key ? 'text-emerald-500' : 'opacity-30'}`} />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {getFilteredAndSortedUsers().map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white">{user.email}</div>
                      <div className="text-xs text-slate-400 font-mono">{user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser === user.id ? (
                        <select 
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 dark:text-white"
                          value={editForm.role || user.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="support">Support</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ 
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                          user.role === 'support' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {editingUser === user.id ? (
                        <input 
                          type="text" 
                          value={editForm.businessName || user.businessName || ''}
                          onChange={(e) => setEditForm({...editForm, businessName: e.target.value})}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 w-full dark:text-white"
                        />
                      ) : (
                        user.businessName || '—'
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      ₱{(user.balance || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => { setManagingUser(user); setBalanceForm({ amount: 0, reason: '' }); setSubForm({ plan: 'FREE', expiresAt: '' }); }}
                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 rounded transition" 
                        title="Manage Wallet/Sub"
                      >
                        <CreditCard className="w-4 h-4"/>
                      </button>
                      
                      {editingUser === user.id ? (
                        <>
                          <button onClick={() => handleUserUpdate(user.id)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"><Save className="w-4 h-4"/></button>
                          <button onClick={() => { setEditingUser(null); setEditForm({}); }} className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"><X className="w-4 h-4"/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingUser(user.id); setEditForm({}); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded transition"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 rounded transition"><Trash2 className="w-4 h-4"/></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HELP DESK TAB */}
      {activeTab === 'helpdesk' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
           <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {tickets.length === 0 ? (
                 <tr><td colSpan={6} className="text-center p-8 text-slate-400">No tickets found.</td></tr>
              ) : tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">#{ticket.ticketNum}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">{ticket.userEmail}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{ticket.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ 
                      ticket.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                      ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'
                    }`}>{ticket.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold border ${ 
                       ticket.status === 'Open' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                     }`}>{ticket.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ticket.status !== 'Resolved' && (
                      <button onClick={() => handleTicketStatus(ticket.id, 'Resolved')} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 ml-auto">
                        <CheckSquare className="w-3 h-3"/> Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400"/> System Audit Logs
            </h3>
            <div className="flex gap-2">
               <button 
                 onClick={() => loadData()}
                 className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 flex items-center gap-2"
               >
                 <Activity className="w-3.5 h-3.5"/> Refresh
               </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-slate-400 italic">No logs recorded.</td></tr>
                ) : auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                      {log.user_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold uppercase">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Power className="w-5 h-5 text-slate-500"/> System Status</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Maintenance Mode</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Disable access for non-admins.</p>
                  </div>
                  <button 
                    onClick={() => setSystemSettings({...systemSettings, maintenanceMode: !systemSettings.maintenanceMode})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${systemSettings.maintenanceMode ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>
               <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Allow Registrations</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">New users can sign up.</p>
                  </div>
                  <button 
                    onClick={() => setSystemSettings({...systemSettings, allowRegistrations: !systemSettings.allowRegistrations})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${systemSettings.allowRegistrations ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.allowRegistrations ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-500"/> Preferences</h3>
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                   <h4 className="font-bold text-slate-800 dark:text-white mb-2">Appearance</h4>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => !darkMode && toggleTheme()}
                       className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition ${darkMode ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-500'}`}
                     >
                       <Moon className="w-4 h-4"/> Dark
                     </button>
                     <button 
                       onClick={() => darkMode && toggleTheme()} 
                       className={`flex-1 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition ${!darkMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                     >
                       <Sun className="w-4 h-4"/> Light
                     </button>
                   </div>
                </div>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm md:col-span-2">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-slate-500"/> Admin Profile</h3>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                   <input type="text" value={adminProfile.email} disabled className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg p-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">New Password</label>
                     <input 
                       type="password" 
                       value={adminProfile.password}
                       onChange={(e) => setAdminProfile({...adminProfile, password: e.target.value as any})}
                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 dark:text-white"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm Password</label>
                     <input 
                       type="password" 
                       value={adminProfile.confirm}
                       onChange={(e) => setAdminProfile({...adminProfile, confirm: e.target.value as any})}
                       className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 dark:text-white"
                     />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleAdminProfileUpdate}
                    className="bg-slate-900 dark:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 dark:hover:bg-emerald-700"
                  >
                    Update Credentials
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
