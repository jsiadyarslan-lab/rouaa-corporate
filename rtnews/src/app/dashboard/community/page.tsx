'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Mail, MessageSquare, Search,
  Star, Clock, Trash2, Edit3,
  CheckCircle2, AlertCircle, Inbox, UserCheck, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── TypeScript Interfaces ─────────────────────────────────
interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  createdAt: string;
}

interface SubscriberData {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;
  createdAt: string;
}

interface MessageData {
  id: string;
  name: string;
  email: string;
  message: string;
  subject: string;
  status: string;
  createdAt: string;
}

type CommunityData = UserData | SubscriberData | MessageData;

// ─── Skeleton Rows ─────────────────────────────────────────
function SkeletonRows({ cols = 5, rows = 4 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={cols} className="h-16 px-6">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-2 w-32 rounded" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg3)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton h-16 w-full rounded-xl mb-4" />
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/community?type=${type}`);
      if (!res.ok) throw new Error('فشل الاتصال');
      const result = await res.json();
      if (type === 'users') setUsers(result.users || []);
      else if (type === 'subscribers') setSubscribers(result.subscribers || []);
      else if (type === 'messages') setMessages(result.messages || []);
    } catch (err) {
      toast.error('فشل جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleUpdateStatus = async (id: string, type: string, updateData: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, ...updateData }),
      });
      if (res.ok) {
        toast.success('تم التحديث بنجاح');
        fetchData(activeTab);
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل التحديث');
      }
    } catch {
      toast.error('فشل التحديث');
    }
  };

  const handleDelete = async (id: string, type: string) => {
    const typeLabel = type === 'user' ? 'المستخدم' : type === 'subscriber' ? 'المشترك' : 'الرسالة';
    if (!confirm(`هل أنت متأكد من حذف ${typeLabel}؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/community?type=${type}&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('تم الحذف بنجاح');
        fetchData(activeTab);
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل الحذف');
      }
    } catch {
      toast.error('فشل الاتصال بالسيرفر');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditRole = async (user: UserData) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (newRole === 'admin') {
      if (!confirm(`هل تريد ترقية ${user.name || user.email} إلى مدير؟ سيحصل على صلاحيات كاملة.`)) return;
    } else {
      if (!confirm(`هل تريد إزالة صلاحيات المدير من ${user.name || user.email}؟`)) return;
    }
    await handleUpdateStatus(user.id, 'user', { role: newRole });
  };

  // Filter based on tab
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'users') {
      return users.filter(u =>
        (u.email?.toLowerCase().includes(q)) || (u.name?.toLowerCase().includes(q))
      );
    }
    if (activeTab === 'subscribers') {
      return subscribers.filter(s =>
        (s.email?.toLowerCase().includes(q)) || (s.name?.toLowerCase().includes(q))
      );
    }
    if (activeTab === 'messages') {
      return messages.filter(m =>
        (m.email?.toLowerCase().includes(q)) || (m.name?.toLowerCase().includes(q))
      );
    }
    return [];
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[24px] font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Users style={{ color: 'var(--purple)' }} size={24} />
          المجتمع والنمو
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text3)' }}>
          إدارة المستخدمين، المشتركين، ورسائل التواصل
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-[var(--bg3)] border border-[var(--border)] p-1 rounded-xl h-auto self-start">
            <TabsTrigger value="users" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[var(--purple2)] data-[state=active]:text-[var(--purple)]">
              <Users size={16} /> المستخدمون
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[var(--cyan2)] data-[state=active]:text-[var(--cyan)]">
              <Mail size={16} /> المشتركون
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[var(--gold2)] data-[state=active]:text-[var(--gold)]">
              <MessageSquare size={16} /> الرسائل
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text4)' }} />
            <Input
              placeholder="بحث بالإيميل أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-[13px] h-10 rounded-xl"
              style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}
            />
          </div>
        </div>

        {/* ═══ Users Tab ═══ */}
        <TabsContent value="users">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg3)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[600px]">
                <thead className="bg-[var(--bg4)]/50 text-[11px] font-bold" style={{ color: 'var(--text3)' }}>
                  <tr>
                    <th className="px-6 py-4">المستخدم</th>
                    <th className="px-6 py-4">الدور</th>
                    <th className="px-6 py-4">الخطة</th>
                    <th className="px-6 py-4">تاريخ الانضمام</th>
                    <th className="px-6 py-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50">
                  {loading ? (
                    <SkeletonRows cols={5} rows={4} />
                  ) : (filteredData as UserData[]).map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--bg4)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px]" style={{ background: 'linear-gradient(135deg, var(--purple), var(--cyan))' }}>
                            {user.name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{user.name || 'مستخدم'}</div>
                            <div className="text-[11px]" style={{ color: 'var(--text4)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={user.role === 'admin' ? 'bg-[var(--purple2)] text-[var(--purple)]' : 'bg-[var(--bg4)] text-[var(--text3)]'}>
                          {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--text2)' }}>
                          <Star size={14} className={user.plan === 'pro' ? 'text-[var(--gold)]' : 'text-[var(--text4)]'} />
                          {user.plan === 'pro' ? 'برو' : 'مجانية'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px]" style={{ color: 'var(--text3)' }}>
                        {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] hover:bg-[var(--purple)]/10 text-[var(--purple)]"
                            onClick={() => handleEditRole(user)}
                          >
                            <Edit3 size={12} className="ml-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[11px] hover:bg-[var(--bear)]/10 text-[var(--bear)]"
                            onClick={() => handleDelete(user.id, 'user')}
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} className="ml-1" />}
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && (filteredData as UserData[]).length === 0 && (
              <div className="py-16 text-center">
                <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--text4)' }} />
                <p className="text-[13px] font-medium" style={{ color: 'var(--text3)' }}>لا يوجد مستخدمون</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ Subscribers Tab ═══ */}
        <TabsContent value="subscribers">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg3)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[500px]">
                <thead className="bg-[var(--bg4)]/50 text-[11px] font-bold" style={{ color: 'var(--text3)' }}>
                  <tr>
                    <th className="px-6 py-4">البريد الإلكتروني</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">المصدر</th>
                    <th className="px-6 py-4">تاريخ الاشتراك</th>
                    <th className="px-6 py-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50">
                  {loading ? (
                    <SkeletonRows cols={5} rows={4} />
                  ) : (filteredData as SubscriberData[]).map((sub) => (
                    <tr key={sub.id} className="hover:bg-[var(--bg4)]/30 transition-colors">
                      <td className="px-6 py-4 text-[14px] font-bold" style={{ color: 'var(--text)' }}>{sub.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={sub.status === 'active' ? 'bg-[var(--bull)]/10 text-[var(--bull)]' : 'bg-[var(--bear)]/10 text-[var(--bear)]'}>
                          {sub.status === 'active' ? 'نشط' : 'ملغى'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[12px]" style={{ color: 'var(--text3)' }}>{sub.source}</td>
                      <td className="px-6 py-4 text-[12px]" style={{ color: 'var(--text3)' }}>
                        {new Date(sub.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] hover:bg-[var(--bear)]/10 text-[var(--bear)]"
                          onClick={() => handleDelete(sub.id, 'subscriber')}
                          disabled={deletingId === sub.id}
                        >
                          {deletingId === sub.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} className="ml-1" />}
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && (filteredData as SubscriberData[]).length === 0 && (
              <div className="py-16 text-center">
                <Mail size={36} className="mx-auto mb-3" style={{ color: 'var(--text4)' }} />
                <p className="text-[13px] font-medium" style={{ color: 'var(--text3)' }}>لا يوجد مشتركون</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ Messages Tab ═══ */}
        <TabsContent value="messages">
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <SkeletonCards count={3} />
            ) : (filteredData as MessageData[]).map((msg) => (
              <div key={msg.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg3)] hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold2)', color: 'var(--gold)' }}>
                      <Inbox size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{msg.name}</h4>
                      <p className="text-[12px]" style={{ color: 'var(--text4)' }}>{msg.email}</p>
                    </div>
                  </div>
                  <Badge className={msg.status === 'new' ? 'bg-[var(--gold)] text-black' : 'bg-[var(--bg4)] text-[var(--text4)]'}>
                    {msg.status === 'new' ? 'رسالة جديدة' : 'مقروءة'}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl text-[13px] leading-relaxed mb-4" style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>
                  {msg.message}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text4)' }}>
                    <Clock size={12} /> {new Date(msg.createdAt).toLocaleString('ar-SA')}
                  </div>
                  <div className="flex gap-2">
                    {msg.status === 'new' && (
                      <Button
                        onClick={() => handleUpdateStatus(msg.id, 'message', { status: 'read' })}
                        size="sm" className="h-8 px-4 text-[11px] font-bold" style={{ background: 'var(--gold)', color: 'black' }}
                      >
                        <CheckCircle2 size={12} className="ml-1" />
                        تعليم كمقروء
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[11px] hover:bg-[var(--bear)]/10 text-[var(--bear)]"
                      onClick={() => handleDelete(msg.id, 'message')}
                      disabled={deletingId === msg.id}
                    >
                      {deletingId === msg.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} className="ml-1" />}
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && (filteredData as MessageData[]).length === 0 && (
              <div className="py-20 text-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg3)]/30">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-[18px] font-bold" style={{ color: 'var(--text2)' }}>لا توجد رسائل حالياً</h3>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
