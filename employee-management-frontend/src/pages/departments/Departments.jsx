import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Building2, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { departmentService } from '../../services/departmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { confirmAction } from '../../utils/confirm';
import DepartmentModal from './DepartmentModal';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await departmentService.list({ search, page });
      setDepartments(data.data.data);
      setMeta(data.data.meta);
    } catch {
      toast.error('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { setPage(1); }, [search]);

  const handleSave = () => { fetchDepartments(); setModalOpen(false); setEditing(null); };

  const handleDelete = async (dept) => {
    const ok = await confirmAction({
      title: 'Delete department?',
      text: `"${dept.name}" will be removed.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setDeleting(dept.id);
    try {
      await departmentService.delete(dept.id);
      toast.success('Department deleted.');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  const ActionBtn = ({ onClick, title, hoverColor, children, disabled }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="icon-tile w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40"
      onMouseEnter={e => !disabled && (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={e => (e.currentTarget.style.color = '')}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your organization's departments</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Department
        </Button>
      </div>

      {/* Search */}
      <div className="panel rounded-2xl p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search departments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="inp w-full pl-10"
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments found"
            description={search ? 'Try adjusting your search.' : 'Create your first department to get started.'}
            action={!search && (
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus size={14} /> Add Department
              </Button>
            )}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Department', 'Description', 'Employees', 'Status', ''].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="trow" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                          >
                            <Building2 size={16} className="text-blue-400" />
                          </div>
                          <span className="font-semibold text-slate-200">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 max-w-xs truncate text-sm">{dept.description || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-300">{dept.employee_count}</span>
                        <span className="text-xs text-slate-600 ml-1">active</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge className={dept.is_active ? 'badge-active' : 'badge-inactive'}>
                          {dept.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionBtn title="Edit" hoverColor="#A78BFA" onClick={() => { setEditing(dept); setModalOpen(true); }}>
                            <Edit2 size={14} />
                          </ActionBtn>
                          <ActionBtn
                            title="Delete"
                            hoverColor="#F87171"
                            onClick={() => handleDelete(dept)}
                            disabled={deleting === dept.id}
                          >
                            {deleting === dept.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-200">{dept.name}</p>
                      {dept.description && <p className="text-sm text-slate-500 mt-0.5">{dept.description}</p>}
                    </div>
                    <Badge className={dept.is_active ? 'badge-active' : 'badge-inactive'}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{dept.employee_count} active employees</span>
                    <div className="flex gap-1.5">
                      <ActionBtn title="Edit" hoverColor="#A78BFA" onClick={() => { setEditing(dept); setModalOpen(true); }}>
                        <Edit2 size={14} />
                      </ActionBtn>
                      <ActionBtn title="Delete" hoverColor="#F87171" onClick={() => handleDelete(dept)}>
                        <Trash2 size={14} />
                      </ActionBtn>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {meta && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 8px' }}>
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      <DepartmentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        department={editing}
      />
    </div>
  );
}
