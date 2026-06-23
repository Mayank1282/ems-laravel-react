import { useEffect, useRef, useState } from 'react';
import { Camera, Save, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email });
  }, [user]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = isAdmin ? { name: form.name } : form;
      const { data } = await profileService.update(payload);
      updateUser(data.data);
      toast.success('Profile updated.');
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setErrors(res.errors);
      else toast.error(res?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max file size is 2MB.'); return; }

    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const { data } = await profileService.uploadAvatar(formData);
      updateUser({ ...user, avatar_url: data.data.avatar_url });
      toast.success('Avatar updated.');
    } catch {
      toast.error('Failed to upload avatar.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings</p>
      </div>

      {/* Avatar card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5">
          <div className="relative flex-shrink-0">
            <Avatar name={user?.name} src={user?.avatar_url} size="xl" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full text-white flex items-center justify-center transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#4338CA)', boxShadow: '0 4px 14px rgba(124,58,237,0.5)' }}
            >
              {uploading ? (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-100">{user?.name}</h2>
            {!isAdmin && <p className="text-sm text-slate-500 break-all">{user?.email}</p>}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Shield size={14} className="text-violet-400" />
              <span className="text-sm font-semibold text-violet-400 capitalize">{user?.role}</span>
            </div>
            <p className="text-xs text-slate-600 mt-2">JPG, PNG, WEBP — max 2MB</p>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <User size={15} className="text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Account Information</h3>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={errors.name?.[0]}
              required
            />
            {!isAdmin && (
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email?.[0]}
                required
              />
            )}
          </div>
          <div className="pt-1">
            <Button type="submit" loading={saving}>
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
