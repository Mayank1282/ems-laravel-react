import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Users, Edit2, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import { statusColor, employmentTypeColor, employmentTypeLabel, formatCurrency, formatDate } from '../../utils/helpers';
import { confirmAction } from '../../utils/confirm';
import EmployeeModal from './EmployeeModal';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    departmentService.all().then(({ data }) => setDepartments(data.data));
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (deptFilter) params.department_id = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await employeeService.list(params);
      setEmployees(data.data.data);
      setMeta(data.data.meta);
    } catch {
      toast.error('Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter, page]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { setPage(1); }, [search, deptFilter, statusFilter]);

  const handleSave = () => { fetchEmployees(); setModalOpen(false); setEditing(null); };

  const handleDelete = async (emp) => {
    const ok = await confirmAction({
      title: 'Delete employee?',
      text: `"${emp.full_name}" and their account will be permanently removed. This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setDeleting(emp.id);
    try {
      await employeeService.delete(emp.id);
      toast.success('Employee deleted.');
      fetchEmployees();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">
            {meta ? `${meta.total} employee${meta.total !== 1 ? 's' : ''} total` : 'Manage your team'}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex-shrink-0">
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="panel rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, code or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inp w-full pl-10"
            />
          </div>
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-full sm:w-44">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-36">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={search || deptFilter || statusFilter ? 'Try adjusting your search or filters.' : 'Add your first employee to get started.'}
            action={!search && !deptFilter && !statusFilter && (
              <Button onClick={() => setModalOpen(true)} size="sm"><Plus size={14} /> Add Employee</Button>
            )}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Employee', 'Department', 'Job Title', 'Type', 'Hire Date', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="trow" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.full_name} src={emp.avatar_url} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-200 text-sm">{emp.full_name}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-mono">{emp.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{emp.department?.name || '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{emp.job_title || '—'}</td>
                      <td className="px-5 py-4">
                        <Badge className={employmentTypeColor[emp.employment_type]}>
                          {employmentTypeLabel[emp.employment_type]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(emp.hire_date)}</td>
                      <td className="px-5 py-4">
                        <Badge className={statusColor[emp.status]}>
                          {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/employees/${emp.id}`}>
                            <ActionBtn title="View" hoverColor="#38BDF8">
                              <Eye size={14} />
                            </ActionBtn>
                          </Link>
                          <ActionBtn
                            title="Edit"
                            hoverColor="#A78BFA"
                            onClick={() => { setEditing(emp); setModalOpen(true); }}
                          >
                            <Edit2 size={14} />
                          </ActionBtn>
                          <ActionBtn
                            title="Delete"
                            hoverColor="#F87171"
                            onClick={() => handleDelete(emp)}
                            disabled={deleting === emp.id}
                          >
                            {deleting === emp.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.04)' }}>
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.full_name} src={emp.avatar_url} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{emp.full_name}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{emp.employee_code} · {emp.department?.name || '—'}</p>
                      </div>
                    </div>
                    <Badge className={statusColor[emp.status]}>{emp.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={employmentTypeColor[emp.employment_type]}>
                      {employmentTypeLabel[emp.employment_type]}
                    </Badge>
                    <div className="flex gap-1.5">
                      <Link to={`/employees/${emp.id}`}>
                        <ActionBtn title="View" hoverColor="#38BDF8"><Eye size={14} /></ActionBtn>
                      </Link>
                      <ActionBtn
                        title="Edit"
                        hoverColor="#A78BFA"
                        onClick={() => { setEditing(emp); setModalOpen(true); }}
                      >
                        <Edit2 size={14} />
                      </ActionBtn>
                      <ActionBtn
                        title="Delete"
                        hoverColor="#F87171"
                        onClick={() => handleDelete(emp)}
                      >
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

      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        employee={editing}
        departments={departments}
      />
    </div>
  );
}
