'use client';

import { useState, useEffect } from 'react';
import { Award, Star, Gift, TrendingUp, Search, Plus, ThumbsUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/hrm/rewards`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRewards(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPRECIATION': return <ThumbsUp className="w-5 h-5 text-blue-600" />;
      case 'REWARD_POINTS': return <Star className="w-5 h-5 text-amber-500" />;
      case 'BONUS': return <Gift className="w-5 h-5 text-emerald-600" />;
      case 'PROMOTION_RECOMMENDATION': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default: return <Award className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'APPRECIATION': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'REWARD_POINTS': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'BONUS': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'PROMOTION_RECOMMENDATION': return 'bg-purple-100 dark:bg-purple-900/30';
      default: return 'bg-indigo-100 dark:bg-indigo-900/30';
    }
  };

  const filtered = rewards.filter(r => 
    !search || 
    r.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appreciations & Rewards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recognize top performers and manage company awards.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" />
          Give Reward
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name or award title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Rewards Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Start recognizing your team's hard work.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((reward) => (
            <div key={reward.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${getBgColor(reward.type)}`}>
                    {getIcon(reward.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{reward.title}</h3>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{reward.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  "{reward.description}"
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                    {reward.employee?.name?.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{reward.employee?.name}</p>
                    <p className="text-xs text-gray-500">{new Date(reward.date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {(reward.points || reward.amount) && (
                  <div className="text-right">
                    {reward.points && (
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+{reward.points} Pts</span>
                    )}
                    {reward.amount && (
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">₹{reward.amount}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
