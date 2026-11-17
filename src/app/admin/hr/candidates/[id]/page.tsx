'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, FileText, Calendar, Mail, Phone, Briefcase, DollarSign, Clock, MapPin, Edit, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/hrm/candidates/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCandidate(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [params.id]);

  const handleConvert = async () => {
    if (!confirm('Convert this candidate to a full Employee? This action will generate an Employee Code and move them to active staff.')) return;
    try {
      setConverting(true);
      const res = await fetch(`/api/admin/hrm/candidates/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to convert candidate');
      }
      
      toast.success('Successfully converted to Employee!');
      router.push('/admin/hr/employees');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setConverting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OFFER_ACCEPTED': return 'bg-emerald-100 text-emerald-800';
      case 'JOINED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'APPLIED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-indigo-100 text-indigo-800';
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading...</div>;
  if (!candidate) return <div className="p-12 text-center text-red-500">Candidate not found</div>;

  const hasAcceptedOffer = candidate.offers?.some((o: any) => o.status === 'ACCEPTED');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/hr/candidates" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{candidate.fullName}</h1>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                {candidate.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {candidate.candidateId} • Applied: {new Date(candidate.appliedAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
          
          {candidate.status !== 'JOINED' && (
            <button 
              onClick={handleConvert}
              disabled={!hasAcceptedOffer || converting}
              className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors
                ${(!hasAcceptedOffer || converting) ? 'bg-emerald-400 opacity-60 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              title={!hasAcceptedOffer ? "Candidate must accept an offer first" : ""}
            >
              {converting ? 'Converting...' : <><UserPlus className="w-4 h-4" /> Convert to Employee</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Current Role</p>
                  <p className="font-medium text-gray-900 dark:text-white">{candidate.currentDesignation || 'N/A'} at {candidate.currentCompany || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium text-gray-900 dark:text-white">{candidate.totalExperience || 0} Years</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Current / Expected CTC</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {candidate.currentSalary ? `₹${candidate.currentSalary}` : 'N/A'} / {candidate.expectedSalary ? `₹${candidate.expectedSalary}` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Notice Period</p>
                  <p className="font-medium text-gray-900 dark:text-white">{candidate.noticePeriod ? `${candidate.noticePeriod} Days` : 'Immediate'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {candidate.skills ? candidate.skills.split(',').map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm">
                    {skill.trim()}
                  </span>
                )) : <span className="text-sm text-gray-400">No skills listed</span>}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Interview History</h2>
              <Link href={`/admin/hr/interviews/new?candidateId=${candidate.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                + Schedule
              </Link>
            </div>
            
            {(!candidate.interviews || candidate.interviews.length === 0) ? (
              <p className="text-gray-500 text-sm">No interviews scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {candidate.interviews.map((intv: any) => (
                  <div key={intv.id} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{intv.roundName}</p>
                      <p className="text-sm text-gray-500">{new Date(intv.date).toLocaleString()} • {intv.mode}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {intv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Contact & Status */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Info</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${candidate.email}`} className="text-sm text-indigo-600 hover:underline">{candidate.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{candidate.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{[candidate.city, candidate.state].filter(Boolean).join(', ') || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Offers</h2>
            {(!candidate.offers || candidate.offers.length === 0) ? (
              <p className="text-gray-500 text-sm mb-4">No offers generated.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {candidate.offers.map((offer: any) => (
                  <div key={offer.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">₹{offer.salary}/mo</span>
                      <span className={`text-xs font-bold ${offer.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-amber-600'}`}>{offer.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">Sent: {new Date(offer.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
            
            <button className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
              Generate Offer Letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
