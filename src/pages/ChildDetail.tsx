import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, TrendingUp, MessageCircle, Clock, FileText } from 'lucide-react';
import { supabase, Child, Sponsorship, ProgressUpdate, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function ChildDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadChildData();
    }
  }, [id, user]);

  const loadChildData = async () => {
    try {
      const [childRes, sponsorshipRes, updatesRes, messagesRes] = await Promise.all([
        supabase.from('children').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('sponsorships')
          .select('*')
          .eq('child_id', id)
          .eq('sponsor_id', user?.id)
          .maybeSingle(),
        supabase
          .from('progress_updates')
          .select('*')
          .eq('child_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('messages')
          .select('*')
          .eq('child_id', id)
          .eq('sponsor_id', user?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (childRes.error) throw childRes.error;
      if (sponsorshipRes.error) throw sponsorshipRes.error;

      setChild(childRes.data);
      setSponsorship(sponsorshipRes.data);
      setProgressUpdates(updatesRes.data || []);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error('Error loading child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([
        {
          child_id: id,
          sponsor_id: user.id,
          sender_type: 'Sponsor',
          content: newMessage,
          status: 'Pending Review',
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      await loadChildData();
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (!child || !sponsorship) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">Child not found or you don't have access.</p>
          <Link to="/dashboard" className="text-red-600 hover:text-red-700 mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/dashboard" className="text-red-600 hover:text-red-700 mb-6 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-24">
            <div className="aspect-[3/4] overflow-hidden bg-gray-200">
              {child.photo_url ? (
                <img
                  src={child.photo_url}
                  alt={`${child.first_name} ${child.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {child.first_name} {child.last_name}
              </h1>

              <div className="space-y-3 text-gray-700">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-red-600" />
                  <span>{calculateAge(child.birthdate)} years old</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-red-600" />
                  <span>{child.location}</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-3 text-red-600" />
                  <span>English Level: {child.english_level}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Sponsorship Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-red-600">{sponsorship.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Amount:</span>
                    <span className="font-medium">${sponsorship.monthly_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Since:</span>
                    <span className="font-medium">{formatDate(sponsorship.start_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {child.first_name}</h2>
            <p className="text-gray-700 leading-relaxed">{child.bio}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-red-600" />
              Progress Timeline
            </h2>

            {progressUpdates.length === 0 ? (
              <p className="text-gray-600">No progress updates yet.</p>
            ) : (
              <div className="space-y-6">
                {progressUpdates.map((update) => (
                  <div key={update.id} className="border-l-4 border-red-500 pl-6 pb-6 relative">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-red-500"></div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{update.title}</h3>
                      <span className="text-sm text-gray-600">{formatDate(update.created_at)}</span>
                    </div>
                    {update.english_level_after && (
                      <p className="text-red-600 font-medium mb-2">
                        New Level: {update.english_level_after}
                      </p>
                    )}
                    <p className="text-gray-700 leading-relaxed">{update.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="w-6 h-6 mr-3 text-red-600" />
              Messages
            </h2>

            <form onSubmit={handleSendMessage} className="mb-8">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Write a message to ${child.first_name}...`}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-600">
                  Messages are reviewed by staff before being shared with the child.
                </p>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-600">No messages yet. Send a message to get started!</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.sender_type === 'Sponsor'
                        ? 'bg-red-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {message.sender_type === 'Sponsor' ? 'You' : child.first_name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {message.status === 'Pending Review' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            Pending Review
                          </span>
                        )}
                        <span className="text-sm text-gray-600">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
