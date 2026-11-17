'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InterviewScorecardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interview, setInterview] = useState<any>(null);

  const [formData, setFormData] = useState({
    communication: 5,
    technicalKnowledge: 5,
    problemSolving: 5,
    relevantExperience: 5,
    confidence: 5,
    roleUnderstanding: 5,
    cultureFit: 5,
    overallSuitability: 5,
    strengths: '',
    weaknesses: '',
    technicalNotes: '',
    salaryRecommendation: '',
    recommendation: 'HOLD',
  });

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/hrm/interviews/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setInterview(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/hrm/interviews/${params.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit scorecard');
      }
      
      toast.success('Scorecard submitted successfully');
      router.push('/admin/hr/interviews');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading...</div>;
  if (!interview) return <div className="p-12 text-center text-red-500">Interview not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/hr/interviews" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interviewer Scorecard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Evaluate {interview.candidate?.fullName} for {interview.jobOpening?.title}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Round</span>
            <span className="font-medium text-gray-900 dark:text-white">{interview.roundName}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Date</span>
            <span className="font-medium text-gray-900 dark:text-white">{new Date(interview.date).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">Mode</span>
            <span className="font-medium text-gray-900 dark:text-white">{interview.mode.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Ratings (1 - 10)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {[
              { id: 'communication', label: 'Communication Skills' },
              { id: 'technicalKnowledge', label: 'Technical / Domain Knowledge' },
              { id: 'problemSolving', label: 'Problem Solving' },
              { id: 'relevantExperience', label: 'Relevant Experience' },
              { id: 'confidence', label: 'Confidence' },
              { id: 'roleUnderstanding', label: 'Role Understanding' },
              { id: 'cultureFit', label: 'Culture Fit' },
              { id: 'overallSuitability', label: 'Overall Suitability' },
            ].map((metric) => (
              <div key={metric.id}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{(formData as any)[metric.id]} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  name={metric.id}
                  value={(formData as any)[metric.id]}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Feedback</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Strengths</label>
              <textarea name="strengths" rows={2} value={formData.strengths} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Areas of Improvement (Weaknesses)</label>
              <textarea name="weaknesses" rows={2} value={formData.weaknesses} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technical / Detailed Notes</label>
              <textarea name="technicalNotes" rows={3} value={formData.technicalNotes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Final Recommendation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verdict *</label>
              <select name="recommendation" required value={formData.recommendation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="STRONG_HIRE">Strong Hire</option>
                <option value="HIRE">Hire</option>
                <option value="HOLD">Hold / Waitlisted</option>
                <option value="REJECT">Reject</option>
                <option value="STRONG_REJECT">Strong Reject</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary Recommendation (Optional)</label>
              <input type="number" name="salaryRecommendation" value={formData.salaryRecommendation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50">
            {submitting ? 'Submitting...' : <><CheckCircle className="w-5 h-5" /> Submit Scorecard</>}
          </button>
        </div>
      </form>
    </div>
  );
}
