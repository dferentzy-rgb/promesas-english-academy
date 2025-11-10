import { useEffect, useState } from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

type MessageWithDetails = {
  id: string;
  content: string;
  status: string;
  created_at: string;
  sender_type: string;
  child: {
    first_name: string;
    last_name: string;
  };
  sponsor: {
    full_name: string;
  };
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          child:children(first_name, last_name),
          sponsor:users_profile(full_name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'Pending Review');
      }

      const { data, error } = await query;
      if (error) throw error;

      setMessages(data as any || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status })
        .eq('id', messageId);

      if (error) throw error;
      await loadMessages();
    } catch (error: any) {
      alert(error.message || 'Failed to update message');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-700';
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Message Moderation</h1>
        <p className="text-lg text-gray-600">Review and approve messages between sponsors and children</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">Show:</span>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'pending'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Messages
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Messages Found</h2>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'All messages have been reviewed!'
              : 'No messages in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-gray-900">
                      {message.sponsor.full_name} → {message.child.first_name} {message.child.last_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(message.status)}`}>
                      {message.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Sent by: {message.sender_type}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(message.created_at)}</p>
                </div>

                {message.status === 'Pending Review' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateMessageStatus(message.id, 'Approved')}
                      className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      title="Approve"
                    >
                      <Check className="w-5 h-5 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => updateMessageStatus(message.id, 'Rejected')}
                      className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      title="Reject"
                    >
                      <X className="w-5 h-5 mr-1" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
