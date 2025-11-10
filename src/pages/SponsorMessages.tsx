import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import { supabase, Child, Message } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

type ChildWithMessages = Child & {
  messages: Message[];
};

export default function SponsorMessages() {
  const [searchParams] = useSearchParams();
  const childIdParam = searchParams.get('childId');
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildWithMessages[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(childIdParam);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    try {
      const { data: sponsorships, error: sponsorshipError } = await supabase
        .from('sponsorships')
        .select('child_id, children(*)')
        .eq('sponsor_id', user?.id)
        .eq('status', 'Active');

      if (sponsorshipError) throw sponsorshipError;

      const childrenData = await Promise.all(
        (sponsorships || []).map(async (sponsorship: any) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('child_id', sponsorship.children.id)
            .eq('sponsor_id', user?.id)
            .order('created_at', { ascending: true });

          return {
            ...sponsorship.children,
            messages: messages || [],
          };
        })
      );

      setChildren(childrenData);

      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0].id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChild || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([
        {
          child_id: selectedChild,
          sponsor_id: user.id,
          sender_type: 'Sponsor',
          content: newMessage,
          status: 'Pending Review',
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      await loadMessages();
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const currentChild = children.find((c) => c.id === selectedChild);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (children.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Messages Yet</h2>
          <p className="text-gray-600 mb-6">
            You need to sponsor a child before you can send messages.
          </p>
          <Link
            to="/children"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            View Available Children
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-lg text-gray-600">Communicate with your sponsored children</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Children</h2>
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedChild === child.id
                      ? 'bg-red-100 border-2 border-red-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {child.first_name} {child.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {child.messages.length} message{child.messages.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[600px]">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentChild?.first_name} {currentChild?.last_name}
              </h2>
              <p className="text-gray-600">All messages are reviewed by staff before delivery</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!currentChild?.messages || currentChild.messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                currentChild.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'Sponsor' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-lg ${
                        message.sender_type === 'Sponsor'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="mb-2">{message.content}</p>
                      <div className="flex items-center justify-between text-xs opacity-75">
                        <span>{formatDate(message.created_at)}</span>
                        {message.status === 'Pending Review' && (
                          <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Send a message to ${currentChild?.first_name}...`}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
