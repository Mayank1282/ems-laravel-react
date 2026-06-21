import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { statusColor, employmentTypeColor, employmentTypeLabel, formatCurrency, formatDate } from '../../utils/helpers';
import EmployeeModal from './EmployeeModal';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchEmployee = async () => {
    try {
      const { data } = await employeeService.get(id);
      setEmployee(data.data);
    } catch {
      toast.error('Employee not found.');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
    departmentService.all().then(({ data }) => setDepartments(data.data));
  }, [id]);

  const handleSave = () => { setModalOpen(false); fetchEmployee(); };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!employee) return null;

  const infoRows = [
    { icon: Mail, label: 'Email', value: employee.email },
    { icon: Phone, label: 'Phone', value: employee.phone ? `${employee.country_code ? employee.country_code + ' ' : ''}${employee.phone}` : '—' },
    { icon: MapPin, label: 'Address', value: employee.address || '—' },
    { icon: Calendar, label: 'Date of Birth', value: formatDate(employee.date_of_birth) },
    { icon: Calendar, label: 'Hire Date', value: formatDate(employee.hire_date) },
    { icon: Briefcase, label: 'Job Title', value: employee.job_title || '—' },
    { icon: DollarSign, label: 'Salary', value: employee.salary ? formatCurrency(employee.salary, employee.salary_currency) : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/employees"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 transition-all flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-100 tracking-tight truncate">{employee.full_name}</h1>
          <p className="text-sm text-slate-500 font-mono">{employee.employee_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="p-6 flex flex-col items-center text-center gap-4">
          <Avatar name={employee.full_name} src={employee.avatar_url} size="xl" />
          <div>
            <h2 className="text-lg font-bold text-slate-100">{employee.full_name}</h2>
            <p className="text-sm text-slate-500">{employee.job_title || 'No title'}</p>
            <p className="text-sm text-violet-400 mt-1">{employee.department?.name || 'No department'}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Badge className={statusColor[employee.status]}>
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
            </Badge>
            <Badge className={employmentTypeColor[employee.employment_type]}>
              {employmentTypeLabel[employee.employment_type]}
            </Badge>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="secondary" size="sm" className="w-full justify-center">
            <Edit2 size={14} /> Edit Employee
          </Button>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-base font-bold text-slate-100 mb-5">Employee Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...infoRows, { icon: Briefcase, label: 'Gender', value: employee.gender || '—', cap: true }].map(({ icon: Icon, label, value, cap }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.13)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  <Icon size={15} className="text-violet-400" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-slate-600">{label}</dt>
                  <dd className={`text-sm font-medium text-slate-200 mt-0.5 break-words ${cap ? 'capitalize' : ''}`}>{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        employee={employee}
        departments={departments}
      />
    </div>
  );
}
