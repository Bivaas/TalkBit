import React, { useState, useEffect } from 'react';
import { db, auth, ADMIN_EMAIL } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import Login from './Login';

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    author: 'Admin'
  });

  // Check authentication status on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotices(noticesData);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const categories = [
    { value: 'all', label: 'All Categories', color: 'gray' },
    { value: 'announcement', label: 'Announcement', color: 'blue' },
    { value: 'update', label: 'Update', color: 'green' },
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
    { value: 'general', label: 'General', color: 'purple' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'high', label: 'High', color: 'red' }
  ];

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  const getPriorityColor = (priority) => {
    const pri = priorities.find(p => p.value === priority);
    return pri ? pri.color : 'gray';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is admin
    if (!isAdmin) {
      alert('Only admin users can post notices');
      return;
    }
    
    try {
      if (editingNotice) {
        const noticeRef = doc(db, 'notices', editingNotice.id);
        // Don't update the date when editing - keep the original creation date
        await updateDoc(noticeRef, {
          ...formData
        });
      } else {
        await addDoc(collection(db, 'notices'), {
          ...formData,
          date: new Date().toISOString(),
          read: false
        });
      }
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        author: 'Admin'
      });
      setEditingNotice(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error adding/updating document: ", error);
    }
  };

  const handleEdit = (notice) => {
    if (!isAdmin) {
      alert('Only admin users can edit notices');
      return;
    }
    
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      author: notice.author
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert('Only admin users can delete notices');
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      author: 'Admin'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Inline SVG icons
  const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );

  const XIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const FilterIcon = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );

  const ChevronDownIcon = ({ className }) => (
    <svg className={`h-4 w-4 transform transition-transform ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const BellIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-2.5 rounded-xl shadow-lg">
                <BellIcon />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notice Board</h1>
                <p className="text-xs text-slate-400">Announcements & Updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-sm font-medium border border-amber-500/30 backdrop-blur">
                  <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                  <span>Admin</span>
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:shadow-xl transition-all duration-200 hover:shadow-blue-500/50 font-medium"
                >
                  <PlusIcon />
                  <span>New Notice</span>
                </button>
              )}
              
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="hidden sm:inline text-slate-400">{user?.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
                title="Sign out"
              >
                <LogoutIcon />
                
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 w-full">
        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-8 border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-slate-400 backdrop-blur transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all text-white font-medium backdrop-blur"
              >
                <FilterIcon />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDownIcon className={showFilters ? 'rotate-180' : 'transition-transform'} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="sm:hidden flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-xl transition-all shadow-lg"
                >
                  <PlusIcon />
                </button>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur ${
                      selectedCategory === cat.value
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notices Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotices.map(notice => (
            <div
              key={notice.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300 overflow-hidden border border-white/20 group"
            >
              <div className={`h-1.5 bg-gradient-to-r ${
                notice.category === 'announcement' ? 'from-blue-400 to-cyan-400' :
                notice.category === 'update' ? 'from-green-400 to-emerald-400' :
                notice.category === 'maintenance' ? 'from-yellow-400 to-orange-400' :
                'from-purple-400 to-pink-400'
              }`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-2 line-clamp-2">{notice.title}</h3>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur ${
                        notice.category === 'announcement' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' :
                        notice.category === 'update' ? 'bg-green-500/30 text-green-200 border border-green-400/50' :
                        notice.category === 'maintenance' ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/50' :
                        'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                      }`}>
                        {categories.find(c => c.value === notice.category)?.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-bold text-xs uppercase backdrop-blur ${
                        notice.priority === 'high' 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                          : notice.priority === 'normal'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                      }`}>
                        {notice.priority}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-all"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-all"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-300 text-sm mb-4 line-clamp-3 leading-relaxed">{notice.content}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-1.5">
                    <UserIcon />
                    <span>{notice.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon />
                    <span>{formatDate(notice.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotices.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 backdrop-blur border border-white/20">
              <SearchIcon />
            </div>
            <p className="text-slate-400 text-lg font-medium">No notices found</p>
            <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      {/* Form Modal - Only show for admin */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="sticky top-0 bg-slate-800/95 border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur">
              <h2 className="text-2xl font-bold text-white">
                {editingNotice ? 'Edit Notice' : 'Create New Notice'}
              </h2>
              <button
                onClick={handleFormCancel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <XIcon />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-slate-400 backdrop-blur transition-all"
                  placeholder="Enter notice title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Content
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-slate-400 backdrop-blur resize-none transition-all"
                  placeholder="Write your notice content here..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur transition-all"
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white backdrop-blur transition-all"
                  >
                    {priorities.map(pri => (
                      <option key={pri.value} value={pri.value}>{pri.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-slate-400 backdrop-blur transition-all"
                  placeholder="Author name"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="px-6 py-2 border border-white/20 text-slate-300 rounded-lg hover:bg-white/10 transition-all backdrop-blur font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-200 font-medium"
                >
                  {editingNotice ? 'Update Notice' : 'Create Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur border-t border-white/10 py-4 sm:py-6 mt-auto w-full">
        <div className="max-w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            Made by{' '}
            <a
              href="https://bivaasbaral.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-cyan-300 font-medium transition-colors duration-200"
            >
              Bivaas Baral
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}