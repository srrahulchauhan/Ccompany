import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "../../context/StoreContext";
import { useSearchParams } from "react-router-dom";
import { dateKey, monthKey } from "../../utils/date";
import { isEmploymentAttendanceLocked } from "../../utils/workPayroll";
import { CompanyPicker, MonthPicker, StatCard, WorkModal } from "./WorkUI";

const statuses = ["Present", "Absent", "Half Day", "Paid Leave", "Weekly Off", "Holiday", "Overtime"];
const pad = (value) => String(value).padStart(2, "0");

export default function CompanyAttendance() {
  const { data, add, update, remove, setWorkPreferences, toggleEmploymentLock } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const companies = data.workCompanies;
  const initialCompany = companies.some((company) => company.id === data.workPreferences.selectedCompanyId) ? data.workPreferences.selectedCompanyId : companies.find((company) => company.active)?.id || "all";
  const [companyId, setCompanyId] = useState(initialCompany);
  const [month, setMonth] = useState(searchParams.get("month") || data.workPreferences.selectedMonth || monthKey());
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [modal, setModal] = useState(null);
  const [attendanceView, setAttendanceView] = useState("all");
  const scopedEmployments = useMemo(() => data.workEmployees.filter((employee) => {
    if (companyId !== "all" && employee.companyId !== companyId) return false;
    return employee.joiningDate <= selectedDate && (employee.status === "Active" || (employee.endDate && selectedDate <= employee.endDate));
  }), [data.workEmployees, companyId, selectedDate]);
  const monthRecords = data.workAttendance.filter((record) => (companyId === "all" || record.companyId === companyId) && record.date.slice(0, 7) === month);
  const selectedRecords = monthRecords.filter((record) => record.date === selectedDate);
  const displayedHistory = monthRecords.filter((record) => attendanceView === "all"
    || (attendanceView === "present" ? ["Present", "Overtime"].includes(record.status)
      : attendanceView === "absent" ? record.status === "Absent"
        : attendanceView === "half" ? record.status === "Half Day"
          : attendanceView === "leave" ? record.status === "Paid Leave" : true));
  const recordedEmploymentIds = new Set(selectedRecords.map((record) => record.employmentId));
  const calendar = useMemo(() => {
    const [year, value] = month.split("-").map(Number);
    const total = new Date(year, value, 0).getDate();
    const offset = new Date(year, value - 1, 1).getDay();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, index) => `${month}-${pad(index + 1)}`)];
  }, [month]);
  const counts = {
    present: monthRecords.filter((record) => record.status === "Present" || record.status === "Overtime").length,
    absent: monthRecords.filter((record) => record.status === "Absent").length,
    half: monthRecords.filter((record) => record.status === "Half Day").length,
    leave: monthRecords.filter((record) => record.status === "Paid Leave").length,
    working: monthRecords.filter((record) => !["Weekly Off", "Holiday"].includes(record.status)).length,
  };
  const formFields = [
    { name: "employmentId", label: "Employee", type: "select", required: true, options: scopedEmployments.map((employee) => ({ value: employee.id, label: `${employee.name} · ${employee.employeeId}` })) },
    { name: "date", label: "Attendance date", type: "date", required: true },
    { name: "status", label: "Attendance status", type: "select", options: statuses },
    { name: "hours", label: "Regular hours", type: "number", min: 0, max: 24, step: 0.25 },
    { name: "overtimeHours", label: "Overtime hours", type: "number", min: 0, max: 24, step: 0.25 },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
  ];
  const save = (values) => {
    const employment = data.workEmployees.find((employee) => employee.id === values.employmentId);
    if (!employment) { toast.error("Choose a valid employee employment."); return; }
    if (values.date < employment.joiningDate || (employment.endDate && values.date > employment.endDate)) { toast.error("Attendance date must fall within the employment period."); return; }
    if (values.status === "Overtime" && Number(values.overtimeHours) <= 0) { toast.error("Enter overtime hours when attendance status is Overtime."); return; }
    try {
      if (modal?.id) { update("workAttendance", modal.id, { ...values, companyId: employment.companyId }); toast.success("Attendance updated."); }
      else { add("workAttendance", { ...values, companyId: employment.companyId }); toast.success("Attendance marked."); }
      setModal(null);
    } catch (error) { toast.error(error.message || "Unable to save attendance."); }
  };
  const mark = (employee) => {
    const employeeCompany = companies.find((company) => company.id === employee.companyId);
    if (!employeeCompany?.active && !(employee.status === "Left" && employee.historyUnlocked)) {
      toast.error("This company is inactive. Activate it before recording new attendance."); return;
    }
    if (isEmploymentAttendanceLocked(employee, selectedDate) && !employee.historyUnlocked) {
      toast.error("Historical attendance is locked. Unlock the employment history to make corrections."); return;
    }
    const existing = selectedRecords.find((record) => record.employmentId === employee.id);
    setModal(existing
      ? { ...existing, employmentId: employee.id, mode: "edit" }
      : { employmentId: employee.id, date: selectedDate, status: "Present", hours: 8, overtimeHours: 0 });
  };
  const changeMonth = (step) => {
    const [year, value] = month.split("-").map(Number);
    const next = new Date(year, value - 1 + step, 1);
    const nextMonth = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
    setMonth(nextMonth); setSelectedDate(`${nextMonth}-01`); setWorkPreferences({ selectedMonth: nextMonth });
  };
  const changeCompany = (value) => { setCompanyId(value); setWorkPreferences({ selectedCompanyId: value }); };
  const selectedCompany = companies.find((company) => company.id === companyId);
  return <div className="page-wrap work-page">
    <div className="page-heading"><div><p className="eyebrow">DATE-WISE TIME TRACKING</p><h1>Company attendance</h1><p className="page-subtitle">Select a company and month to mark, review, or correct employee attendance.</p></div><div className="heading-actions"><button className="btn btn-primary" onClick={() => setModal({ date: selectedDate, status: "Present", hours: 8, overtimeHours: 0 })}><Plus size={16} /> Mark attendance</button></div></div>
    <div className="work-month-toolbar"><div><CalendarCheck size={17} /><span>{selectedCompany?.name || "All companies"} · attendance</span></div><div className="work-toolbar-controls"><CompanyPicker companies={companies} value={companyId} includeAll onChange={changeCompany} /><MonthPicker value={month} onChange={(value) => { setMonth(value); setSelectedDate(`${value}-01`); setWorkPreferences({ selectedMonth: value }); const params = new URLSearchParams(searchParams); params.set("month", value); setSearchParams(params); }} label="Attendance month" /></div></div>
    <div className="work-stats-grid work-stats-five"><StatCard label="Present days" value={counts.present} note="Filter present and overtime" tone="green" onClick={() => setAttendanceView("present")} active={attendanceView === "present"} /><StatCard label="Absent days" value={counts.absent} note="Filter absent records" tone="amber" onClick={() => setAttendanceView("absent")} active={attendanceView === "absent"} /><StatCard label="Half days" value={counts.half} note="Filter half-day records" tone="blue" onClick={() => setAttendanceView("half")} active={attendanceView === "half"} /><StatCard label="Paid leaves" value={counts.leave} note="Filter paid leave records" tone="purple" onClick={() => setAttendanceView("leave")} active={attendanceView === "leave"} /><StatCard label="Working records" value={counts.working} note={`${monthRecords.length} total entries · show all`} tone="blue" onClick={() => setAttendanceView("all")} active={attendanceView === "all"} /></div>
    <div className="attendance-work-grid">
      <section className="panel attendance-calendar-panel"><div className="panel-heading"><div><h2>Monthly attendance calendar</h2><p>Select a date to mark or inspect records.</p></div><div className="calendar-month-nav"><button onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={17} /></button><b>{new Date(`${month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</b><button onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={17} /></button></div></div>
        <div className="attendance-calendar"><div className="calendar-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{calendar.map((date, index) => {
          if (!date) return <span className="calendar-blank" key={`empty-${index}`} />;
          const records = monthRecords.filter((record) => record.date === date);
          const hasPresent = records.some((record) => ["Present", "Overtime"].includes(record.status));
          const hasAbsent = records.some((record) => record.status === "Absent");
          const hasLeave = records.some((record) => record.status === "Paid Leave");
          return <button key={date} className={`calendar-day ${selectedDate === date ? "calendar-day-selected" : ""} ${date === dateKey() ? "calendar-day-today" : ""}`} onClick={() => setSelectedDate(date)}><span>{Number(date.slice(-2))}</span>{records.length > 0 && <i className={`${hasAbsent ? "calendar-dot-amber" : hasLeave ? "calendar-dot-purple" : hasPresent ? "calendar-dot-green" : "calendar-dot-muted"}`} />}</button>;
        })}</div></div>
        <div className="calendar-legend"><span><i className="calendar-dot-green" />Present</span><span><i className="calendar-dot-amber" />Absent</span><span><i className="calendar-dot-purple" />Paid leave</span><span><i className="calendar-dot-muted" />Other</span></div>
      </section>
      <section className="panel attendance-date-panel"><div className="panel-heading"><div><h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</h2><p>{selectedRecords.length} attendance records for this date</p></div><button className="btn btn-secondary btn-small" onClick={() => setModal({ date: selectedDate, status: "Present", hours: 8, overtimeHours: 0 })}><Plus size={14} /> Add entry</button></div>
        <div className="date-attendance-list">{scopedEmployments.map((employee) => {
          const record = selectedRecords.find((item) => item.employmentId === employee.id);
          const locked = isEmploymentAttendanceLocked(employee, selectedDate) && !employee.historyUnlocked;
          const inactiveBlocked = !companies.find((company) => company.id === employee.companyId)?.active && !(employee.status === "Left" && employee.historyUnlocked);
          return <div key={employee.id} className="date-attendance-row"><span className="work-person-avatar">{employee.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span><div className="date-attendance-person"><b>{employee.name}</b><small>{employee.designation}</small></div>{record ? <span className={`status-pill attendance-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}>{record.status}</span> : <span className="work-muted">Not marked</span>}<button className="btn btn-secondary btn-small" disabled={locked || inactiveBlocked} onClick={() => mark(employee)}>{record ? <Pencil size={13} /> : <Plus size={13} />}{record ? "Edit" : "Mark"}</button></div>;
        })}{scopedEmployments.length === 0 && <div className="work-empty work-empty-compact"><b>No employees for this date</b><p>Choose another date or add an active employment.</p></div>}</div>
      </section>
    </div>
    <section className="panel work-table-panel attendance-history-panel"><div className="work-table-toolbar"><div><h2>Attendance history</h2><p>Showing {displayedHistory.length} of {monthRecords.length} records for {month}</p></div><span className="lock-info">Locked historical records can only be changed after unlocking the employment history.</span></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Employee</th><th>Company</th><th>Status</th><th>Regular hours</th><th>Overtime</th><th>Actions</th></tr></thead><tbody>{[...displayedHistory].sort((a, b) => b.date.localeCompare(a.date)).map((record) => {
      const employee = data.workEmployees.find((item) => item.id === record.employmentId);
      const locked = isEmploymentAttendanceLocked(employee, record.date) && !employee?.historyUnlocked;
      return <tr key={record.id}><td>{record.date}</td><td>{employee?.name || "Deleted employment"}</td><td>{companies.find((item) => item.id === record.companyId)?.name || "Archived"}</td><td><span className={`status-pill attendance-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}>{record.status}</span></td><td>{record.hours || 0}</td><td>{record.overtimeHours || 0}</td><td><div className="row-actions work-row-actions"><button title={locked ? "Attendance is locked" : "Edit attendance"} disabled={locked} onClick={() => { setSelectedDate(record.date); setModal({ ...record, mode: "edit" }); }}><Pencil size={15} /></button><button title={locked ? "Attendance is locked" : "Delete attendance"} className="action-delete" disabled={locked} onClick={() => { if (!window.confirm("Delete this attendance record? Salary calculations will update.")) return; try { remove("workAttendance", record.id); toast.success("Attendance record deleted."); } catch (error) { toast.error(error.message); } }}><Trash2 size={15} /></button>{locked && <button title="Unlock employment history" onClick={() => { toggleEmploymentLock(employee.id); toast.success("Historical attendance unlocked."); }}><ShieldCheckIcon /></button>}</div></td></tr>;
    })}{displayedHistory.length === 0 && <tr><td colSpan="7"><div className="empty-state"><div className="empty-icon"><CalendarCheck size={22} /></div><b>No attendance records for this filter</b><p>Choose another attendance card or mark a new record.</p></div></td></tr>}</tbody></table></div></section>
    {modal && <WorkModal title={modal.id ? "Edit attendance record" : "Mark attendance"} fields={formFields} initial={{ ...modal, date: modal.date || selectedDate, status: modal.status || "Present", hours: modal.hours ?? 8, overtimeHours: modal.overtimeHours ?? 0 }} onClose={() => setModal(null)} onSave={save} submitLabel={modal.id ? "Save attendance" : "Mark attendance"} />}
  </div>;
}

function ShieldCheckIcon() {
  return <CalendarCheck size={15} />;
}
