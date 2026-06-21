import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { departmentService } from '../../services/departmentService';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function DepartmentModal({ isOpen, onClose, onSave, department }) {
  const [form, setForm] = useState({ name: '', description: '', is_active: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!department;

  useEffect(() => {
    if (department) {
      setForm({ name: department.name, description: department.description || '', is_active: department.is_active });
    } else {
      setForm({ name: '', description: '', is_active: true });
    }
    setErrors({});
  }, [department, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((err) => ({ ...err, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await departmentService.update(department.id, form);
        toast.success('Department updated.');
      } else {
        await departmentService.create(form);
        toast.success('Department created.');
      }
      onSave();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else toast.error(data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Department' : 'Add Department'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Department Name *"
          name="name"
          placeholder="e.g. Engineering"
          value={form.name}
          onChange={handleChange}
          error={errors.name?.[0]}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
          <textarea
            name="description"
            placeholder="Brief description..."
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="inp w-full resize-none"
          />
          {errors.description && <p className="text-xs text-red-400">{errors.description[0]}</p>}
        </div>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-4 h-4 accent-violet-600 rounded"
          />
          <span className="text-sm font-medium text-slate-300">Active Department</span>
        </label>
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 justify-center">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1 justify-center">
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
