import { formatCurrency } from './helpers';

const COMPANY = {
  name: 'Acme Corporation Pvt. Ltd.',
  address: '4th Floor, Innovation Tower, MG Road, Bengaluru 560001',
  email: 'payroll@acmecorp.example',
};

const monthLabel = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

/**
 * Open a formatted salary slip in a new window and trigger the browser's
 * print dialog (user can "Save as PDF"). No external dependency needed.
 */
export function generatePayslip(payroll, employee = {}) {
  const name = employee.name
    || `${payroll.employee?.first_name ?? ''} ${payroll.employee?.last_name ?? ''}`.trim()
    || 'Employee';
  const code = employee.employee_code || payroll.employee?.employee_code || '—';
  const designation = employee.job_title || payroll.employee?.job_title || 'Employee';

  const cur = payroll.currency || 'USD';
  const money = (n) => formatCurrency(n, cur);
  const base = Number(payroll.base_salary) || 0;
  const arrears = Number(payroll.arrears) || 0;
  const overtime = Number(payroll.overtime) || 0;
  const deduction = Number(payroll.leave_deduction) || 0;
  const net = Number(payroll.net_salary) || 0;
  const grossEarnings = base + arrears + overtime;

  const row = (label, value, opts = {}) => `
    <tr>
      <td style="padding:9px 14px;${opts.bold ? 'font-weight:700;' : ''}">${label}</td>
      <td style="padding:9px 14px;text-align:right;${opts.bold ? 'font-weight:700;' : ''}${opts.color ? `color:${opts.color};` : ''}">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Payslip - ${name} - ${monthLabel(payroll.period_month)}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; font-family:'Segoe UI',Arial,sans-serif; }
  body { background:#f1f5f9; padding:32px; color:#1e293b; }
  .slip { max-width:720px; margin:0 auto; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,.1); }
  .head { background:linear-gradient(135deg,#7C3AED,#4338CA); color:#fff; padding:28px 32px; display:flex; justify-content:space-between; align-items:flex-start; }
  .head h1 { font-size:22px; font-weight:800; }
  .head p { font-size:12px; opacity:.85; margin-top:4px; max-width:280px; }
  .badge { background:rgba(255,255,255,.18); padding:6px 14px; border-radius:8px; font-size:13px; font-weight:700; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; padding:24px 32px; border-bottom:1px solid #e2e8f0; }
  .meta div { font-size:13px; }
  .meta .lbl { color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
  .meta .val { font-weight:600; margin-top:2px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  .section-title { padding:14px 14px 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#7C3AED; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:0; }
  .grid2 > div { padding:8px 18px 18px; }
  .grid2 > div:first-child { border-right:1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  .net { background:#ecfdf5; border-top:2px solid #10b981; padding:20px 32px; display:flex; justify-content:space-between; align-items:center; }
  .net .label { font-size:13px; color:#065f46; font-weight:600; }
  .net .amount { font-size:26px; font-weight:800; color:#047857; }
  .foot { padding:18px 32px; font-size:11px; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; }
  @media print { body { background:#fff; padding:0; } .slip { box-shadow:none; border-radius:0; } .noprint { display:none; } }
  .noprint { text-align:center; margin:24px auto 0; max-width:720px; }
  .btn { background:#7C3AED; color:#fff; border:none; padding:11px 26px; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; }
</style></head>
<body>
  <div class="slip">
    <div class="head">
      <div>
        <h1>${COMPANY.name}</h1>
        <p>${COMPANY.address}</p>
        <p>${COMPANY.email}</p>
      </div>
      <div class="badge">Payslip</div>
    </div>

    <div class="meta">
      <div><div class="lbl">Employee</div><div class="val">${name}</div></div>
      <div><div class="lbl">Employee Code</div><div class="val">${code}</div></div>
      <div><div class="lbl">Designation</div><div class="val">${designation}</div></div>
      <div><div class="lbl">Pay Period</div><div class="val">${monthLabel(payroll.period_month)}</div></div>
      ${payroll.pay_date ? `<div><div class="lbl">Pay Date</div><div class="val">${new Date(payroll.pay_date).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}</div></div>` : ''}
    </div>

    <div class="grid2">
      <div>
        <div class="section-title">Earnings</div>
        <table>
          ${row('Basic Salary', money(base))}
          ${row('Increment Arrears', arrears > 0 ? money(arrears) : '—')}
          ${row('Overtime', overtime > 0 ? money(overtime) : '—')}
          ${row('Gross Earnings', money(grossEarnings), { bold: true })}
        </table>
      </div>
      <div>
        <div class="section-title">Deductions</div>
        <table>
          ${row('Leave Deduction', deduction > 0 ? money(deduction) : '—')}
          ${row('Paid Leave Days', String(payroll.paid_leave_days ?? 0))}
          ${row('Total Deductions', money(deduction), { bold: true })}
        </table>
      </div>
    </div>

    <div class="net">
      <span class="label">NET PAYABLE</span>
      <span class="amount">${money(net)}</span>
    </div>

    <div class="foot">
      This is a system-generated payslip and does not require a signature.<br/>
      Generated on ${new Date().toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' })}.
    </div>
  </div>

  <div class="noprint">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
