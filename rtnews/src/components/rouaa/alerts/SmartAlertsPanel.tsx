// ─── Smart Alerts Panel ──────────────────────────────────────
// UI component for creating and managing smart alerts
// Supports: price, sentiment, breaking, keyword alerts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Bell, BellRing, TrendingUp, TrendingDown, Zap,
  Plus, Trash2, Loader2, AlertCircle, Newspaper, Search,
} from 'lucide-react';

interface SmartAlert {
  id: string;
  alertType: string;
  symbol?: string | null;
  condition: string;
  threshold?: number | null;
  keywords?: string | null;
  isActive: boolean;
  isTriggered: boolean;
  lastTriggeredAt?: string | null;
  createdAt: string;
}

const ALERT_TYPES = [
  { value: 'price', label: 'سعري', icon: TrendingUp, color: 'var(--bull)' },
  { value: 'sentiment', label: 'مشاعر السوق', icon: Zap, color: 'var(--gold)' },
  { value: 'breaking', label: 'أخبار عاجلة', icon: Newspaper, color: 'var(--bear)' },
  { value: 'custom', label: 'مخصص', icon: Search, color: 'var(--cyan)' },
];

const CONDITIONS = [
  { value: 'above', label: 'أعلى من' },
  { value: 'below', label: 'أدنى من' },
  { value: 'change_pct', label: 'تغير بنسبة %' },
  { value: 'keywords', label: 'يحتوي كلمات' },
];

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'SPX', 'NDX', 'DJI', 'CL', 'NG'];

interface SmartAlertsPanelProps {
  userId?: string;
}

export default function SmartAlertsPanel({ userId }: SmartAlertsPanelProps) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [alertType, setAlertType] = useState('price');
  const [symbol, setSymbol] = useState('EUR/USD');
  const [condition, setCondition] = useState('above');
  const [threshold, setThreshold] = useState('');
  const [keywords, setKeywords] = useState('');

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/smart-alerts?userId=${userId}&active=true`);
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreate = async () => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setCreating(true);
    try {
      const body: any = { userId, alertType };
      if (alertType === 'price') {
        body.symbol = symbol;
        body.condition = condition;
        body.threshold = parseFloat(threshold);
        if (isNaN(body.threshold)) {
          toast.error('يرجى إدخال قيمة صحيحة');
          setCreating(false);
          return;
        }
      } else if (alertType === 'custom' || alertType === 'breaking') {
        body.condition = 'keywords';
        body.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
        if (body.keywords.length === 0) {
          toast.error('يرجى إدخال كلمة مفتاحية واحدة على الأقل');
          setCreating(false);
          return;
        }
      } else {
        body.condition = condition;
        if (threshold) body.threshold = parseFloat(threshold);
      }

      const res = await fetch('/api/smart-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('تم إنشاء التنبيه بنجاح');
        setShowForm(false);
        setThreshold('');
        setKeywords('');
        fetchAlerts();
      } else {
        toast.error(data.error || 'فشل إنشاء التنبيه');
      }
    } catch {
      toast.error('فشل إنشاء التنبيه');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/smart-alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف التنبيه');
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch {
      toast.error('فشل حذف التنبيه');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/smart-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a));
      }
    } catch {
      toast.error('فشل تحديث التنبيه');
    }
  };

  const getTypeInfo = (type: string) => ALERT_TYPES.find(t => t.value === type) || ALERT_TYPES[0];

  if (!userId) {
    return (
      <Card style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
        <CardContent className="p-6 text-center">
          <Bell size={32} style={{ color: 'var(--text4)', margin: '0 auto 12px' }} />
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>سجّل الدخول لإنشاء تنبيهات ذكية</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing size={18} style={{ color: 'var(--cyan)' }} />
          <h3 className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>التنبيهات الذكية</h3>
          <Badge className="text-[9px]" style={{ background: 'var(--cyan2)', color: 'var(--cyan)' }}>
            {alerts.length} تنبيه
          </Badge>
        </div>
        <Button
          size="sm"
          className="text-[11px] gap-1.5"
          style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={12} /> تنبيه جديد
        </Button>
      </div>

      {/* Create Alert Form */}
      {showForm && (
        <Card style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>نوع التنبيه</Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger className="text-[12px] h-8" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {alertType === 'price' && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>الرمز</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger className="text-[12px] h-8" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMBOLS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {alertType === 'price' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>الشرط</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="text-[12px] h-8" style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>القيمة</Label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="1.0850"
                    className="text-[12px] h-8"
                    style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            )}

            {(alertType === 'custom' || alertType === 'breaking') && (
              <div className="space-y-1">
                <Label className="text-[11px] font-bold" style={{ color: 'var(--text2)' }}>كلمات مفتاحية (مفصولة بفواصل)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="فائدة، بنك مركزي، تضخم"
                  className="text-[12px] h-8"
                  style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="text-[11px] gap-1.5"
                style={{ background: 'linear-gradient(135deg, var(--cyan), var(--purple))', color: 'white' }}
              >
                {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                إنشاء التنبيه
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="text-[11px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text2)' }}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
      ) : alerts.length === 0 ? (
        <Card style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
          <CardContent className="p-4 text-center">
            <AlertCircle size={24} style={{ color: 'var(--text4)', margin: '0 auto 8px' }} />
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>لا توجد تنبيهات. أنشئ تنبيهاً ذكياً للمتابعة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const typeInfo = getTypeInfo(alert.alertType);
            const Icon = typeInfo.icon;
            return (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  opacity: alert.isActive ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${typeInfo.color}15` }}>
                    <Icon size={14} style={{ color: typeInfo.color }} />
                  </div>
                  <div>
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                      {typeInfo.label}
                      {alert.symbol && ` — ${alert.symbol}`}
                    </span>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>
                      {alert.condition === 'above' ? 'أعلى من' : alert.condition === 'below' ? 'أدنى من' : alert.condition === 'change_pct' ? 'تغير بنسبة' : 'كلمات مفتاحية'}
                      {alert.threshold && ` ${alert.threshold}`}
                      {alert.isTriggered && ' ✓ تم التفعيل'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={alert.isActive} onCheckedChange={() => handleToggle(alert.id, alert.isActive)} />
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(alert.id)} className="text-[10px] p-1 h-6" style={{ color: 'var(--bear)' }}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
