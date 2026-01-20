import React, { useEffect, useState } from 'react';
import { 
  Users, RefreshCcw, ExternalLink, Heart, 
  Image as ImageIcon, UserPlus, Zap, BarChart3,
  Facebook, Instagram, MessageCircle, X, Eye, 
  UserMinus, MousePointer2, TrendingUp
} from 'lucide-react';
import { socialService, SocialPlatformData } from '../services/socialService';

const InsightsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState<'facebook' | 'instagram' | 'tiktok' | null>(null);
  const [modalUsername, setModalUsername] = useState('');
  const [platformData, setPlatformData] = useState<SocialPlatformData[]>([]);

  useEffect(() => {
    loadData();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'KAWAYAN_STATS_UPDATED_CLIENT') {
        const stats = event.data.data;
        socialService.updateStats(stats.platform, stats);
        loadData();
        setLoading(false);
        setShowSyncModal(false);
        setModalUsername('');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadData = async () => {
    const data: SocialPlatformData[] = [];
    const status = await socialService.fetchConnectionStatus();
    const platforms: ('facebook' | 'instagram' | 'tiktok')[] = ['facebook', 'instagram', 'tiktok'];
    
    for (const p of platforms) {
      if (status[p]) {
        const insights = await socialService.getInsights(p);
        if (insights) data.push(insights);
      }
    }
    setPlatformData(data);
  };

  const openSyncModal = (platform: 'facebook' | 'instagram' | 'tiktok') => {
    const existing = platformData.find(p => p.platform === platform);
    if (existing && existing.username) {
        // If already connected, just sync directly without modal
        handleSync(platform, existing.username);
    } else {
        setTargetPlatform(platform);
        setShowSyncModal(true);
    }
  };

  const handleSync = async (platform: 'facebook' | 'instagram' | 'tiktok', username: string) => {
    setLoading(true);
    await socialService.connectAccount(platform, username);
    window.postMessage({
      type: 'KAWAYAN_UPDATE_STATS',
      platform: platform,
      username: username
    }, '*');
  };

  const handleDisconnect = async (platform: string) => {
    if (window.confirm(`Disconnect ${platform}?`)) {
      await socialService.disconnectAccount(platform);
      loadData();
    }
  };

  const MetricBox = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
      <div className={`${color} mb-1 opacity-80`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">{label}</p>
      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
        {typeof value === 'number' ? value.toLocaleString() : value || '0'}
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Social Insights</h1>
          <p className="text-slate-500 font-medium">Automated data sync via Kawayan Extension.</p>
        </div>

        <div className="flex bg-white dark:bg-slate-800 p-2 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 gap-2">
            {[
              { id: 'facebook', icon: Facebook, color: 'hover:bg-[#1877F2]' },
              { id: 'instagram', icon: Instagram, color: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]' },
              { id: 'tiktok', icon: MessageCircle, color: 'hover:bg-black' }
            ].map((p) => (
              <button 
                key={p.id}
                onClick={() => openSyncModal(p.id as any)}
                className={`p-4 rounded-2xl transition-all ${p.color} hover:text-white text-slate-400 bg-slate-50 dark:bg-slate-900 flex items-center gap-2 font-bold text-sm shadow-sm`}
              >
                <p.icon className="w-5 h-5" />
                <span className="hidden sm:inline capitalize">Add {p.id}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Stats Display */}
      <div className="grid grid-cols-1 gap-8">
        {platformData.length === 0 ? (
          <div className="py-32 text-center bg-white dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
            <BarChart3 className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">No Channels Connected</h3>
            <p className="text-slate-500 text-sm mt-1">Select a platform above to start syncing your data.</p>
          </div>
        ) : (
          platformData.map((data) => (
            <div key={data.platform} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden group">
              <div className="flex flex-col lg:flex-row">
                {/* Header Sidebar */}
                <div className={`lg:w-64 p-8 flex flex-col justify-between items-center text-center border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 ${
                  data.platform === 'facebook' ? 'bg-blue-50/30' : 
                  data.platform === 'instagram' ? 'bg-rose-50/30' : 
                  'bg-slate-50/30'
                }`}>
                  <div className="space-y-4">
                    <div className={`p-5 rounded-3xl shadow-2xl mx-auto w-fit ${
                      data.platform === 'facebook' ? 'bg-[#1877F2]' : 
                      data.platform === 'instagram' ? 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]' : 
                      'bg-black'
                    } text-white`}>
                      {data.platform === 'facebook' ? <Facebook className="w-8 h-8" /> : 
                       data.platform === 'instagram' ? <Instagram className="w-8 h-8" /> : 
                       <MessageCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white capitalize">{data.platform}</h3>
                      <p className="text-sm font-bold text-emerald-500">@{data.username}</p>
                    </div>
                  </div>

                  <div className="w-full space-y-2 mt-8">
                    <button 
                      onClick={() => handleSync(data.platform as any, data.username || '')}
                      className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button 
                      onClick={() => handleDisconnect(data.platform)}
                      className="w-full py-3 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Detailed Metrics Grid */}
                <div className="flex-1 p-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  <MetricBox label="Followers" value={data.followers} icon={Users} color="text-indigo-500" />
                  
                  {data.platform === 'facebook' && (
                    <>
                      <MetricBox label="Views" value={(data as any).views} icon={Eye} color="text-emerald-500" />
                      <MetricBox label="Viewers" value={(data as any).viewers} icon={Users} color="text-blue-500" />
                      <MetricBox label="Interactions" value={(data as any).interactions} icon={Heart} color="text-rose-500" />
                      <MetricBox label="Visits" value={(data as any).visits} icon={MousePointer2} color="text-amber-500" />
                      <MetricBox label="Follows" value={(data as any).follows} icon={UserPlus} color="text-cyan-500" />
                      <MetricBox label="Unfollows" value={(data as any).unfollows} icon={UserMinus} color="text-slate-400" />
                      <MetricBox label="Net Follows" value={(data as any).netFollows} icon={TrendingUp} color="text-green-500" />
                    </>
                  )}

                  {data.platform === 'instagram' && (
                    <>
                      <MetricBox label="Following" value={data.following} icon={UserPlus} color="text-purple-500" />
                      <MetricBox label="Posts" value={(data as any).posts} icon={ImageIcon} color="text-orange-500" />
                    </>
                  )}

                  {data.platform === 'tiktok' && (
                    <>
                      <MetricBox label="Likes" value={data.likes} icon={Heart} color="text-rose-500" />
                      <MetricBox label="Following" value={data.following} icon={UserPlus} color="text-purple-500" />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSyncModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-2xl ${
                targetPlatform === 'facebook' ? 'bg-[#1877F2]' : 
                targetPlatform === 'instagram' ? 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]' : 
                'bg-black'
              }`}>
                {targetPlatform === 'facebook' ? <Facebook className="w-10 h-10" /> : 
                 targetPlatform === 'instagram' ? <Instagram className="w-10 h-10" /> : 
                 <MessageCircle className="w-10 h-10" />}
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize">Connect {targetPlatform}</h2>
              <p className="text-slate-500 mt-1">Enter your handle to begin syncing.</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">@</span>
                <input 
                  type="text" 
                  autoFocus
                  value={modalUsername}
                  onChange={(e) => setModalUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-10 pr-6 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-lg font-bold outline-none focus:border-emerald-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSync(targetPlatform!, modalUsername)}
                />
              </div>
              <button 
                onClick={() => handleSync(targetPlatform!, modalUsername)}
                className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20"
              >
                Start Data Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex flex-col items-center justify-center text-white">
           <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce mb-6">
              <RefreshCcw className="w-10 h-10 text-white animate-spin" />
           </div>
           <p className="text-2xl font-black">Syncing Live Data...</p>
           <p className="text-slate-300 mt-2">The extension is working its magic.</p>
        </div>
      )}
    </div>
  );
};

export default InsightsDashboard;
