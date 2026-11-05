import { useEffect, useRef, useState } from "react";
import {
  Archive, ArrowDownToLine, ArrowRight, BarChart3, Bell, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronLeft, ChevronRight, Clock3, Download, FileText, MapPin, Pencil, Plus, Search, Trash2,
  Upload, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ExcelJS from "exceljs";
import toast from "react-hot-toast";
import { JobTrackerProvider, jobTrackerCollections, jobTrackerToday, useJobTracker } from "./JobTrackerContext";
import "./job-tracker.css";

const APPLICATION_STATUSES = [
  "Applied", "Under Review", "Invitation Received", "Shortlisted", "HR Screening", "Technical Round",
  "Manager Round", "Final Round", "Interview Scheduled", "Interview Completed", "Selected", "Rejected",
  "On Hold", "No Response", "Joined",
];
const PIPELINE_COLUMNS = [
  "Applied", "Under Review", "Invitation Received", "Shortlisted", "Interview Scheduled",
  "Interview Completed", "Selected", "Rejected", "Joined",
];
const PIPELINE_GROUP = {
  "HR Screening": "Shortlisted", "Technical Round": "Interview Scheduled", "Manager Round": "Interview Scheduled",
  "Final Round": "Interview Scheduled", "On Hold": "Under Review", "No Response": "Under Review",
};
const INTERVIEW_ROUNDS = ["HR Round", "Technical Round 1", "Technical Round 2", "Practical / Coding Test", "Manager Round", "Final HR Round"];
const INTERVIEW_RESULTS = ["Pending", "Passed", "Failed", "Selected", "Rejected", "Next Round Scheduled"];
const INTERVIEW_STATUSES = ["Scheduled", "Completed", "Missed", "Rescheduled", "Cancelled"];
const INVITATION_TYPES = ["Phone Call", "Email Invitation", "WhatsApp Invitation", "LinkedIn Message", "Walk-in Interview", "Direct HR Contact"];
const INVITATION_STATUSES = ["Received", "Accepted", "Declined", "Rescheduled"];
const OFFER_STATUSES = ["Offer Received", "Negotiation", "Accepted", "Declined", "Joined"];
const PREPARATION_CATEGORIES = ["JavaScript", "React", "MERN Stack", "HTML & CSS", "HR Interview", "Company-specific", "Coding Test", "Personal Revision"];
const CHART_COLORS = ["#5e54d5", "#30b58c", "#55a0e8", "#f0a441", "#dc6b91", "#7d71df", "#33a9b5", "#9b83d9"];
const NAV_ITEMS = [
  ["Overview", BarChart3], ["Companies", Building2], ["Applications", BriefcaseBusiness], ["Pipeline", ArrowRight], ["Invitations", Bell],
  ["Interviews", CalendarDays], ["Company visits", MapPin], ["Rejections", Archive], ["Offers", Check],
  ["Preparation", FileText], ["Reports", Download], ["Backup", Upload],
];

const companyFields = [
  { name: "name", label: "Company name", required: true },
  { name: "website", label: "Company website", type: "url" },
  { name: "location", label: "Company location" },
  { name: "address", label: "Office address", type: "textarea", wide: true },
  { name: "hrName", label: "HR / recruiter name" },
  { name: "hrMobile", label: "HR mobile number", type: "tel" },
  { name: "hrEmail", label: "HR email", type: "email" },
  { name: "notes", label: "Notes", type: "textarea", wide: true },
];
const applicationFields = [
  { name: "companyName", label: "Company name", required: true, company: true },
  { name: "companyWebsite", label: "Company website", type: "url" },
  { name: "companyLocation", label: "Company location" },
  { name: "officeAddress", label: "Office address", type: "textarea", wide: true },
  { name: "hrName", label: "HR / recruiter name" },
  { name: "hrMobile", label: "HR mobile number", type: "tel" },
  { name: "hrEmail", label: "HR email", type: "email" },
  { name: "jobRole", label: "Job role / designation", required: true },
  { name: "jobType", label: "Job type", type: "select", options: ["Full Time", "Part Time", "Internship"] },
  { name: "department", label: "Department" },
  { name: "experienceRequired", label: "Experience required" },
  { name: "salaryCtc", label: "Salary / CTC" },
  { name: "expectedSalary", label: "Expected salary" },
  { name: "jobSource", label: "Job source", type: "select", options: ["Naukri", "LinkedIn", "Indeed", "Walk-in", "Referral", "Other"] },
  { name: "applicationDate", label: "Application date", type: "date", required: true, defaultValue: jobTrackerToday() },
  { name: "resumeVersion", label: "Resume version" },
  { name: "status", label: "Application status", type: "select", options: APPLICATION_STATUSES, defaultValue: "Applied" },
  { name: "statusNote", label: "Status history note (optional)" },
  { name: "jobDescription", label: "Job description", type: "textarea", wide: true },
  { name: "rejectionDate", label: "Rejection date", type: "date" },
  { name: "rejectionStage", label: "Rejection stage" },
  { name: "rejectionReason", label: "Rejection reason", type: "textarea", wide: true },
  { name: "hrFeedback", label: "HR feedback", type: "textarea", wide: true },
  { name: "interviewRoundsCompleted", label: "Interview rounds completed", type: "number", min: 0 },
  { name: "reapplyDate", label: "Reapply eligibility date", type: "date" },
  { name: "notes", label: "Notes", type: "textarea", wide: true },
  { name: "allowDuplicate", label: "Allow another application for this company and role", type: "checkbox" },
];
const invitationFields = [
  { name: "companyName", label: "Company name", required: true, company: true },
  { name: "applicationId", label: "Link application", type: "select", options: "applications" },
  { name: "invitationDate", label: "Invitation date", type: "date", required: true, defaultValue: jobTrackerToday() },
  { name: "invitationType", label: "Invitation type", type: "select", options: INVITATION_TYPES, required: true },
  { name: "hrName", label: "HR name" },
  { name: "hrContact", label: "HR contact", type: "tel" },
  { name: "interviewDate", label: "Interview date", type: "date" },
  { name: "interviewTime", label: "Interview time", type: "time" },
  { name: "interviewLocation", label: "Interview location" },
  { name: "interviewMode", label: "Interview mode", type: "select", options: ["Online", "Offline"] },
  { name: "meetingLink", label: "Meeting link", type: "url" },
  { name: "status", label: "Invitation status", type: "select", options: INVITATION_STATUSES, defaultValue: "Received" },
  { name: "notes", label: "Notes", type: "textarea", wide: true },
];
const interviewFields = [
  { name: "companyName", label: "Company name", required: true, company: true },
  { name: "applicationId", label: "Link application", type: "select", options: "applications" },
  { name: "jobRole", label: "Job role" },
  { name: "round", label: "Interview round", type: "select", options: INTERVIEW_ROUNDS, required: true },
  { name: "date", label: "Interview date", type: "date", required: true, defaultValue: jobTrackerToday() },
  { name: "time", label: "Interview time", type: "time", required: true },
  { name: "mode", label: "Interview mode", type: "select", options: ["Online", "Offline"] },
  { name: "officeAddress", label: "Office address", type: "textarea", wide: true },
  { name: "mapLink", label: "Google Maps location link", type: "url" },
  { name: "hrContact", label: "HR contact number", type: "tel" },
  { name: "interviewerName", label: "Interviewer name" },
  { name: "instructions", label: "Interview instructions", type: "textarea", wide: true },
  { name: "requiredDocuments", label: "Required documents", type: "textarea", wide: true },
  { name: "status", label: "Interview status", type: "select", options: INTERVIEW_STATUSES, defaultValue: "Scheduled" },
  { name: "result", label: "Interview result", type: "select", options: INTERVIEW_RESULTS, defaultValue: "Pending" },
  { name: "remindOneDay", label: "Reminder: 1 day before", type: "checkbox", defaultValue: true },
  { name: "remindThreeHours", label: "Reminder: 3 hours before", type: "checkbox", defaultValue: true },
  { name: "remindThirtyMinutes", label: "Reminder: 30 minutes before", type: "checkbox", defaultValue: true },
  { name: "questionsAsked", label: "Questions asked", type: "textarea", wide: true },
  { name: "topicsAsked", label: "Topics asked", type: "textarea", wide: true },
  { name: "unansweredQuestions", label: "Questions I could not answer", type: "textarea", wide: true },
  { name: "rating", label: "Performance rating (1–10)", type: "number", min: 1, max: 10 },
  { name: "improvements", label: "Improvements needed", type: "textarea", wide: true },
  { name: "notes", label: "Interview notes", type: "textarea", wide: true },
];
const visitFields = [
  { name: "companyName", label: "Company name", required: true, company: true },
  { name: "officeAddress", label: "Office address", type: "textarea", wide: true },
  { name: "mapLink", label: "Google Maps location link", type: "url" },
  { name: "visitDate", label: "Visit date", type: "date", required: true, defaultValue: jobTrackerToday() },
  { name: "purpose", label: "Visit purpose" },
  { name: "contactPerson", label: "Contact person" },
  { name: "travelNotes", label: "Travel notes", type: "textarea", wide: true },
  { name: "interviewResult", label: "Interview result" },
  { name: "nextVisitDate", label: "Next visit date", type: "date" },
];
const offerFields = [
  { name: "companyName", label: "Company name", required: true, company: true },
  { name: "applicationId", label: "Link application", type: "select", options: "applications" },
  { name: "jobRole", label: "Job role", required: true },
  { name: "offeredCtc", label: "Offered CTC", type: "number", min: 0 },
  { name: "inHandSalary", label: "In-hand salary", type: "number", min: 0 },
  { name: "joiningDate", label: "Joining date", type: "date" },
  { name: "offerLetter", label: "Offer letter link", type: "url" },
  { name: "offerReceivedDate", label: "Offer received date", type: "date", defaultValue: jobTrackerToday() },
  { name: "offerStatus", label: "Offer status", type: "select", options: OFFER_STATUSES, defaultValue: "Offer Received" },
  { name: "notes", label: "Notes", type: "textarea", wide: true },
];
const preparationFields = [
  { name: "category", label: "Category", type: "select", options: PREPARATION_CATEGORIES, required: true },
  { name: "question", label: "Question / topic", required: true },
  { name: "answer", label: "Answer / notes", type: "textarea", wide: true },
  { name: "status", label: "Revision status", type: "select", options: ["Pending", "Revised"], defaultValue: "Pending" },
];
const FIELD_CONFIG = {
  companies: companyFields,
  applications: applicationFields,
  invitations: invitationFields,
  interviews: interviewFields,
  visits: visitFields,
  offers: offerFields,
  preparation: preparationFields,
};
const COLLECTION_LABELS = {
  companies: "Company", applications: "Job application", invitations: "Job invitation", interviews: "Interview",
  visits: "Company visit", offers: "Job offer", preparation: "Preparation note",
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formatDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const interviewTime = (item) => item.date && item.time ? new Date(`${item.date}T${item.time}`) : null;
const remainingTime = (item) => {
  const date = interviewTime(item);
  if (!date) return "Time not set";
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (minutes < 0) return "Passed";
  if (minutes < 60) return `In ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `In ${hours}h ${minutes % 60}m`;
  return `In ${Math.floor(hours / 24)}d ${hours % 24}h`;
};
const companyApplicationId = (application) => application.applicationId || application.id;
const pipelineStatus = (status) => PIPELINE_GROUP[status] || status;
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const monthTitle = (date) => date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

function RecordModal({ collection, record, data, onClose, onSave }) {
  const fields = FIELD_CONFIG[collection];
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [
    field.name,
    record?.[field.name] ?? field.defaultValue ?? (field.type === "checkbox" ? false : ""),
  ])));
  const [error, setError] = useState("");
  const updateValue = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));
  const submit = (event) => {
    event.preventDefault();
    const invalid = fields.find((field) => field.required && !String(values[field.name] ?? "").trim());
    if (invalid) { setError(`${invalid.label} is required.`); return; }
    if (values.hrEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.hrEmail)) { setError("Enter a valid HR email address."); return; }
    if (collection === "interviews" && values.rating && (Number(values.rating) < 1 || Number(values.rating) > 10)) { setError("Performance rating must be between 1 and 10."); return; }
    const cleaned = { ...values };
    fields.forEach((field) => {
      if (field.type === "number") cleaned[field.name] = cleaned[field.name] === "" ? "" : Number(cleaned[field.name]);
      if (field.type === "checkbox") cleaned[field.name] = Boolean(cleaned[field.name]);
    });
    onSave(cleaned);
  };
  const companyNames = [...new Set(data.companies.map((company) => company.name).filter(Boolean))];
  const applicationOptions = [
    { value: "", label: "Not linked" },
    ...data.applications.map((application) => ({
      value: application.id,
      label: `${companyApplicationId(application)} · ${application.companyName} · ${application.jobRole}`,
    })),
  ];
  return <div className="jt-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="jt-modal" role="dialog" aria-modal="true" aria-labelledby="jt-modal-title">
      <header className="jt-modal-head">
        <div><p className="jt-eyebrow">{record ? "UPDATE RECORD" : "NEW RECORD"}</p><h2 id="jt-modal-title">{record ? `Edit ${COLLECTION_LABELS[collection].toLowerCase()}` : `Add ${COLLECTION_LABELS[collection].toLowerCase()}`}</h2></div>
        <button className="jt-icon-button" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button>
      </header>
      <form onSubmit={submit}>
        <div className="jt-form-grid">
          {fields.map((field) => {
            const options = field.options === "applications" ? applicationOptions : field.options;
            return <label key={field.name} className={`jt-field ${field.wide || field.type === "textarea" ? "jt-field-wide" : ""} ${field.type === "checkbox" ? "jt-check-field" : ""}`}>
              {field.type === "checkbox"
                ? <><input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => updateValue(field.name, event.target.checked)} /><span>{field.label}</span></>
                : <><span>{field.label}{field.required && <i> *</i>}</span>
                  {field.type === "textarea"
                    ? <textarea rows={3} value={values[field.name] ?? ""} onChange={(event) => updateValue(field.name, event.target.value)} />
                    : field.type === "select"
                      ? <select required={field.required} value={values[field.name] ?? ""} onChange={(event) => updateValue(field.name, event.target.value)}>
                        {(options || []).map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}
                      </select>
                      : <input list={field.company ? "jt-company-list" : undefined} type={field.type || "text"} min={field.min} max={field.max} required={field.required} value={values[field.name] ?? ""} onChange={(event) => updateValue(field.name, event.target.value)} />}
                </>}
            </label>;
          })}
          <datalist id="jt-company-list">{companyNames.map((name) => <option key={name} value={name} />)}</datalist>
        </div>
        {error && <p className="jt-form-error">{error}</p>}
        <footer className="jt-modal-actions"><button type="button" className="jt-button jt-button-light" onClick={onClose}>Cancel</button><button type="submit" className="jt-button jt-button-primary">{record ? "Save changes" : `Create ${COLLECTION_LABELS[collection].toLowerCase()}`}</button></footer>
      </form>
    </section>
  </div>;
}

function DataTable({ rows, columns, onEdit, onDelete, emptyText, extraActions }) {
  return <div className="jt-table-wrap"><table className="jt-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th className="jt-actions-head">Actions</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "—"}</td>)}<td><div className="jt-row-actions">
      {extraActions?.(row)}
      <button type="button" title="Edit" onClick={() => onEdit(row)}><Pencil size={15} /></button>
      <button type="button" title="Delete" className="jt-delete-action" onClick={() => onDelete(row)}><Trash2 size={15} /></button>
    </div></td></tr>)}
    {!rows.length && <tr><td colSpan={columns.length + 1}><div className="jt-empty-state"><BriefcaseBusiness size={21} /><b>No records yet</b><span>{emptyText}</span></div></td></tr>}</tbody>
  </table></div>;
}

function JobDashboard({ data, onAdd, onNavigate }) {
  const today = jobTrackerToday();
  const applications = data.applications;
  const interviews = data.interviews;
  const selected = applications.filter((item) => ["Selected", "Joined"].includes(item.status)).length;
  const scheduled = interviews.filter((item) => ["Scheduled", "Rescheduled"].includes(item.status) && item.date >= today);
  const counts = [
    ["Total Companies Applied", new Set(applications.map((item) => (item.companyName || "").trim().toLowerCase()).filter(Boolean)).size, BriefcaseBusiness, "purple"],
    ["Total Job Applications", applications.length, FileText, "blue"],
    ["Job Invitations Received", data.invitations.length, Bell, "amber"],
    ["Shortlisted Applications", applications.filter((item) => ["Shortlisted", "HR Screening", "Technical Round", "Manager Round", "Final Round"].includes(item.status)).length, Check, "green"],
    ["Interviews Scheduled", scheduled.length, CalendarDays, "purple"],
    ["Interviews Completed", interviews.filter((item) => item.status === "Completed").length, Check, "blue"],
    ["Rejected Applications", applications.filter((item) => item.status === "Rejected" && !item.archived).length, X, "red"],
    ["Selected Applications", selected, Check, "green"],
    ["Job Offers Received", data.offers.length, BriefcaseBusiness, "amber"],
    ["Total Companies Visited", new Set(data.visits.map((item) => (item.companyName || "").trim().toLowerCase()).filter(Boolean)).size, MapPin, "blue"],
  ];
  const lastMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date);
    return { month: date.toLocaleDateString("en-IN", { month: "short" }), Applications: applications.filter((item) => String(item.applicationDate || "").slice(0, 7) === key).length };
  });
  const statusData = APPLICATION_STATUSES.map((status) => ({ name: status, value: applications.filter((item) => item.status === status && !item.archived).length })).filter((item) => item.value);
  const companyStats = [...new Set(interviews.map((item) => item.companyName).filter(Boolean))]
    .map((company) => ({ company, Interviews: interviews.filter((item) => item.companyName === company).length, Selected: applications.filter((item) => item.companyName === company && ["Selected", "Joined"].includes(item.status)).length }))
    .sort((a, b) => b.Interviews - a.Interviews).slice(0, 6);
  const upcoming = [...scheduled].sort((a, b) => interviewTime(a) - interviewTime(b)).slice(0, 4);
  const shortcuts = [
    ["Add Company", "companies"], ["Add Job Application", "applications"], ["Add Job Invitation", "invitations"],
    ["Schedule Interview", "interviews"], ["Record Interview Result", "interviews"], ["Add Company Visit", "visits"], ["Add Job Offer", "offers"],
  ];
  const performance = [
    ["Interviews given", interviews.length],
    ["HR interviews", interviews.filter((item) => item.round === "HR Round" || item.round === "Final HR Round").length],
    ["Technical interviews", interviews.filter((item) => item.round?.startsWith("Technical")).length],
    ["Coding tests", interviews.filter((item) => item.round === "Practical / Coding Test").length],
    ["Passed rounds", interviews.filter((item) => ["Passed", "Selected", "Next Round Scheduled"].includes(item.result)).length],
    ["Pending results", interviews.filter((item) => !item.result || item.result === "Pending").length],
  ];
  return <div className="jt-dashboard">
    <div className="jt-page-heading"><div><p className="jt-eyebrow">JOB SEARCH WORKSPACE</p><h1>Job & interview dashboard</h1><p>Keep applications, invitations, interviews, and offers in one place.</p></div><div className="jt-heading-actions"><button className="jt-button jt-button-light" onClick={() => onNavigate("Pipeline")}>View pipeline <ArrowRight size={15} /></button><button className="jt-button jt-button-primary" onClick={() => onAdd("applications")}><Plus size={16} /> Add application</button></div></div>
    <div className="jt-stat-grid">{counts.map(([label, value, Icon, tone]) => <button key={label} className="jt-stat-card" onClick={() => onNavigate(label.includes("Interview") ? "Interviews" : label.includes("Offer") ? "Offers" : label.includes("Rejected") ? "Rejections" : "Applications")}><span className={`jt-stat-icon jt-${tone}`}><Icon size={17} /></span><small>{label}</small><b>{value}</b></button>)}</div>
    <section className="jt-performance-strip">{performance.map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</section>
    <div className="jt-chart-grid">
      <section className="jt-panel"><div className="jt-section-heading"><div><h2>Monthly applications</h2><p>Applications submitted in the last six months</p></div></div><div className="jt-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={lastMonths}><defs><linearGradient id="jtApplications" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6558d3" stopOpacity={0.24} /><stop offset="100%" stopColor="#6558d3" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#eef0f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="Applications" stroke="#6558d3" strokeWidth={2.5} fill="url(#jtApplications)" /></AreaChart></ResponsiveContainer></div></section>
      <section className="jt-panel"><div className="jt-section-heading"><div><h2>Interview vs selection</h2><p>Interview outcomes at a glance</p></div></div><div className="jt-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: "Interviews", Count: interviews.length }, { name: "Selections", Count: selected }]}><CartesianGrid stroke="#eef0f5" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="Count" fill="#6558d3" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="jt-panel"><div className="jt-section-heading"><div><h2>Application status</h2><p>Current pipeline distribution</p></div></div><div className="jt-chart jt-chart-donut">{statusData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={76} paddingAngle={3}>{statusData.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="jt-empty-note">Application statuses will appear here.</p>}</div></section>
      <section className="jt-panel"><div className="jt-section-heading"><div><h2>Company interview stats</h2><p>Interviews and selections by company</p></div></div><div className="jt-chart">{companyStats.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={companyStats} layout="vertical" margin={{ left: 10 }}><CartesianGrid stroke="#eef0f5" horizontal={false} /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} /><YAxis dataKey="company" type="category" width={95} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="Interviews" fill="#6558d3" radius={[0, 5, 5, 0]} /><Bar dataKey="Selected" fill="#30b58c" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : <p className="jt-empty-note">Interview statistics will appear here.</p>}</div></section>
    </div>
    <div className="jt-bottom-grid">
      <section className="jt-panel"><div className="jt-section-heading"><div><h2>Upcoming interviews</h2><p>Scheduled interviews and reminders</p></div><button className="jt-link-button" onClick={() => onNavigate("Interviews")}>See calendar <ArrowRight size={14} /></button></div>
        {upcoming.length ? <div className="jt-upcoming-list">{upcoming.map((item) => <div className="jt-upcoming-item" key={item.id}><span className="jt-upcoming-date"><b>{formatDate(item.date)}</b><small>{item.time}</small></span><span className="jt-upcoming-main"><b>{item.companyName} · {item.jobRole || "Interview"}</b><small>{item.round} · {item.mode || "Mode not set"}</small></span><span className="jt-countdown"><Clock3 size={13} />{remainingTime(item)}</span></div>)}</div> : <div className="jt-empty-state"><CalendarDays size={21} /><b>No upcoming interviews</b><span>Scheduled interviews will appear here automatically.</span></div>}
      </section>
      <section className="jt-panel"><div className="jt-section-heading"><div><h2>Quick actions</h2><p>Start tracking a new step</p></div></div><div className="jt-quick-actions">{shortcuts.map(([label, collection]) => <button key={label} onClick={() => onAdd(collection)}><Plus size={14} />{label}</button>)}</div></section>
    </div>
  </div>;
}

function ApplicationsView({ applications, search, setSearch, statusFilter, setStatusFilter, onEdit, onDelete }) {
  const rows = applications.filter((application) =>
    (!statusFilter || application.status === statusFilter) &&
    (!search || `${application.applicationId} ${application.companyName} ${application.jobRole} ${application.jobSource}`.toLowerCase().includes(search.toLowerCase())),
  );
  return <section className="jt-panel jt-view-panel">
    <div className="jt-view-toolbar"><div><h2>Job applications</h2><p>{rows.length} of {applications.length} applications · status history is saved automatically</p></div><div className="jt-filters"><label className="jt-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, role, ID..." /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter applications by status"><option value="">All statuses</option>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div></div>
    <DataTable rows={rows} onEdit={onEdit} onDelete={onDelete} emptyText="Add your first application to start tracking your job search." columns={[
      { key: "applicationId", label: "Application ID", render: (row) => <b className="jt-id">{companyApplicationId(row)}</b> },
      { key: "companyName", label: "Company", render: (row) => <span className="jt-primary-cell"><b>{row.companyName}</b><small>{row.companyLocation || row.location || "Location not added"}</small></span> },
      { key: "jobRole", label: "Role" },
      { key: "applicationDate", label: "Applied", render: (row) => formatDate(row.applicationDate) },
      { key: "jobSource", label: "Source" },
      { key: "status", label: "Status", render: (row) => <span className={`jt-badge ${badgeClass(row.status)}`}>{row.status}</span> },
      { key: "history", label: "History", render: (row) => <details className="jt-history"><summary>{row.statusHistory?.length || 0} updates</summary><div>{(row.statusHistory || []).slice().reverse().map((entry, index) => <p key={`${entry.date}-${index}`}><b>{entry.status}</b><small>{formatDate(entry.date)} · {entry.note}</small></p>)}</div></details> },
    ]} />
  </section>;
}

function PipelineView({ applications, onStatusChange, onEdit, onDelete }) {
  const [draggedId, setDraggedId] = useState("");
  return <div className="jt-pipeline-wrap"><div className="jt-pipeline-hint">Drag applications between stages. Each move is added to the application status history.</div><div className="jt-pipeline">
    {PIPELINE_COLUMNS.map((column) => {
      const rows = applications.filter((application) => pipelineStatus(application.status) === column && !application.archived);
      return <section className="jt-pipeline-column" key={column} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || draggedId; if (id) onStatusChange(id, column); setDraggedId(""); }}>
        <header><span>{column}</span><b>{rows.length}</b></header>
        <div className="jt-pipeline-cards">{rows.map((application) => <article key={application.id} className="jt-pipeline-card" draggable onDragStart={(event) => { setDraggedId(application.id); event.dataTransfer.setData("text/plain", application.id); }}>
          <div className="jt-card-title"><b>{application.companyName}</b><span>{companyApplicationId(application)}</span></div>
          <p>{application.jobRole}</p><small>{formatDate(application.applicationDate)} · {application.jobSource || "Source not set"}</small>
          {application.status !== column && <span className={`jt-badge ${badgeClass(application.status)}`}>{application.status}</span>}
          <div className="jt-pipeline-actions"><select aria-label={`Move ${application.companyName} application to another status`} value={application.status} onChange={(event) => onStatusChange(application.id, event.target.value, "Status changed in pipeline")}>{APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select><button title="Edit application" onClick={() => onEdit(application)}><Pencil size={14} /></button><button title="Delete application" className="jt-delete-action" onClick={() => onDelete(application)}><Trash2 size={14} /></button></div>
        </article>)}</div>
      </section>;
    })}
  </div></div>;
}

function InterviewsView({ interviews, selectedDate, setSelectedDate, onEdit, onDelete }) {
  const [calendarMode, setCalendarMode] = useState("month");
  const [filter, setFilter] = useState("all");
  const date = new Date(`${selectedDate}T12:00:00`);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthCells = [
    ...Array((firstDay.getDay() + 6) % 7).fill(null),
    ...Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, index) => `${monthKey(date)}-${String(index + 1).padStart(2, "0")}`),
  ];
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const item = new Date(weekStart);
    item.setDate(weekStart.getDate() + index);
    return `${item.getFullYear()}-${String(item.getMonth() + 1).padStart(2, "0")}-${String(item.getDate()).padStart(2, "0")}`;
  });
  const visibleDates = calendarMode === "day" ? [selectedDate] : calendarMode === "week" ? weekDates : monthCells.filter(Boolean);
  const visibleRows = interviews.filter((item) => {
    if (!visibleDates.includes(item.date)) return false;
    if (filter === "upcoming") return ["Scheduled", "Rescheduled"].includes(item.status) && item.date >= jobTrackerToday();
    if (filter === "completed") return item.status === "Completed";
    if (filter === "missed") return item.status === "Missed" || (["Scheduled", "Rescheduled"].includes(item.status) && item.date < jobTrackerToday());
    if (filter === "rescheduled") return item.status === "Rescheduled";
    return true;
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const movePeriod = (step) => {
    const next = new Date(date);
    next.setDate(next.getDate() + (calendarMode === "month" ? 1 : calendarMode === "week" ? step * 7 : step));
    if (calendarMode === "month") next.setMonth(next.getMonth() + step);
    setSelectedDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`);
  };
  const rowsForDate = (day) => interviews.filter((item) => item.date === day);
  return <section className="jt-panel jt-view-panel">
    <div className="jt-calendar-toolbar"><div><h2>Interview schedule</h2><p>Calendar and interview outcomes update from your tracker</p></div><div className="jt-calendar-controls"><div className="jt-toggle-group">{["day", "week", "month"].map((mode) => <button key={mode} className={calendarMode === mode ? "is-selected" : ""} onClick={() => setCalendarMode(mode)}>{mode[0].toUpperCase() + mode.slice(1)}</button>)}</div><input aria-label="Selected calendar date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div></div>
    {calendarMode === "month" && <div className="jt-month-heading"><button onClick={() => movePeriod(-1)} aria-label="Previous month"><ChevronLeft size={17} /></button><b>{monthTitle(date)}</b><button onClick={() => movePeriod(1)} aria-label="Next month"><ChevronRight size={17} /></button></div>}
    {calendarMode === "month" && <div className="jt-calendar"><div className="jt-calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <b key={day}>{day}</b>)}</div><div className="jt-calendar-days">{monthCells.map((day, index) => day
      ? <button type="button" key={day} className={`${day === selectedDate ? "is-selected" : ""} ${day === jobTrackerToday() ? "is-today" : ""}`} onClick={() => setSelectedDate(day)}><span>{Number(day.slice(-2))}</span>{rowsForDate(day).slice(0, 2).map((item) => <i key={item.id} title={`${item.time} · ${item.companyName}`}>{item.time} {item.companyName}</i>)}{rowsForDate(day).length > 2 && <small>+{rowsForDate(day).length - 2} more</small>}</button>
      : <span className="jt-calendar-blank" key={`blank-${index}`} />)}</div></div>}
    {calendarMode === "week" && <div className="jt-week-strip">{weekDates.map((day) => <button key={day} className={day === selectedDate ? "is-selected" : ""} onClick={() => setSelectedDate(day)}><small>{new Date(`${day}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" })}</small><b>{Number(day.slice(-2))}</b><i>{rowsForDate(day).length} interview{rowsForDate(day).length === 1 ? "" : "s"}</i></button>)}</div>}
    <div className="jt-view-toolbar jt-interview-list-heading"><div><h3>{calendarMode === "day" ? formatDate(selectedDate) : "Interview details"}</h3><p>{visibleRows.length} matching interviews</p></div><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter interviews"><option value="all">All interviews</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="missed">Missed</option><option value="rescheduled">Rescheduled</option></select></div>
    <DataTable rows={visibleRows} onEdit={onEdit} onDelete={onDelete} emptyText="Schedule an interview to add it to this calendar." columns={[
      { key: "date", label: "Date & time", render: (row) => <span className="jt-primary-cell"><b>{formatDate(row.date)}</b><small>{row.time}</small></span> },
      { key: "companyName", label: "Company / role", render: (row) => <span className="jt-primary-cell"><b>{row.companyName}</b><small>{row.jobRole || row.round}</small></span> },
      { key: "round", label: "Round" },
      { key: "mode", label: "Mode" },
      { key: "interviewerName", label: "Contact person", render: (row) => row.interviewerName || row.hrContact || "—" },
      { key: "result", label: "Result", render: (row) => <span className={`jt-badge ${badgeClass(row.result)}`}>{row.result || "Pending"}</span> },
      { key: "remaining", label: "Remaining time", render: (row) => remainingTime(row) },
      { key: "location", label: "Location", render: (row) => row.mapLink ? <a className="jt-map-link" href={row.mapLink} target="_blank" rel="noreferrer"><MapPin size={13} /> Map</a> : row.officeAddress || "—" },
    ]} />
  </section>;
}

function badgeClass(status = "") {
  const value = String(status).toLowerCase();
  if (["selected", "joined", "accepted", "passed", "revised", "completed"].includes(value)) return "jt-badge-green";
  if (["rejected", "failed", "missed", "declined"].includes(value)) return "jt-badge-red";
  if (["scheduled", "shortlisted", "invitation received", "offer received", "rescheduled", "negotiation"].includes(value)) return "jt-badge-purple";
  if (["on hold", "no response", "pending", "under review"].includes(value)) return "jt-badge-amber";
  return "jt-badge-blue";
}

function CollectionView({ title, description, rows, columns, emptyText, onEdit, onDelete, extraActions }) {
  const [query, setQuery] = useState("");
  const visible = rows.filter((item) => !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return <section className="jt-panel jt-view-panel"><div className="jt-view-toolbar"><div><h2>{title}</h2><p>{visible.length} records · {description}</p></div><label className="jt-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></label></div><DataTable rows={visible} columns={columns} onEdit={onEdit} onDelete={onDelete} emptyText={emptyText} extraActions={extraActions} /></section>;
}

function RejectionsView({ applications, onEdit, onDelete, onArchive }) {
  const [showArchived, setShowArchived] = useState(false);
  const rows = applications.filter((application) => application.status === "Rejected" && Boolean(application.archived) === showArchived);
  return <section className="jt-panel jt-view-panel"><div className="jt-view-toolbar"><div><h2>Rejected applications</h2><p>Track feedback, rejection stages, and reapply dates</p></div><button className={`jt-button jt-button-light ${showArchived ? "is-active" : ""}`} onClick={() => setShowArchived((value) => !value)}><Archive size={14} />{showArchived ? "Showing archived" : "Show archived"}</button></div>
    <DataTable rows={rows} onEdit={onEdit} onDelete={onDelete} emptyText={showArchived ? "No archived rejections." : "Applications moved to Rejected will appear here."} extraActions={(row) => <button type="button" title={row.archived ? "Restore rejection" : "Archive rejection"} onClick={() => onArchive(row)}><Archive size={15} /></button>} columns={[
      { key: "companyName", label: "Company", render: (row) => <span className="jt-primary-cell"><b>{row.companyName}</b><small>{row.jobRole}</small></span> },
      { key: "rejectionDate", label: "Rejection date", render: (row) => formatDate(row.rejectionDate) },
      { key: "rejectionStage", label: "Stage" },
      { key: "rejectionReason", label: "Reason", render: (row) => row.rejectionReason || "—" },
      { key: "hrFeedback", label: "HR feedback", render: (row) => row.hrFeedback || "—" },
      { key: "interviewRoundsCompleted", label: "Rounds completed" },
      { key: "reapplyDate", label: "Reapply date", render: (row) => formatDate(row.reapplyDate) },
    ]} />
  </section>;
}

function PreparationView({ rows, onEdit, onDelete, onToggle }) {
  const [category, setCategory] = useState("all");
  const visible = rows.filter((item) => category === "all" || item.category === category);
  return <section className="jt-panel jt-view-panel"><div className="jt-view-toolbar"><div><h2>Job preparation notes</h2><p>Organize questions, answers, and revision progress</p></div><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{PREPARATION_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="jt-prep-grid">{visible.map((item) => <article className="jt-prep-card" key={item.id}><header><span className={`jt-badge ${badgeClass(item.status)}`}>{item.status}</span><span className="jt-prep-category">{item.category}</span></header><h3>{item.question}</h3><p>{item.answer || "No answer or revision notes yet."}</p><footer><button className="jt-button jt-button-light jt-small" onClick={() => onToggle(item)}>{item.status === "Revised" ? "Mark pending" : "Mark revised"}</button><button title="Edit note" onClick={() => onEdit(item)}><Pencil size={14} /></button><button title="Delete note" className="jt-delete-action" onClick={() => onDelete(item)}><Trash2 size={14} /></button></footer></article>)}{!visible.length && <div className="jt-empty-state"><FileText size={22} /><b>No preparation notes yet</b><span>Add questions and revision notes to prepare for interviews.</span></div>}</div>
  </section>;
}

function getReportRange(period, startDate, endDate) {
  const todayDate = new Date(`${jobTrackerToday()}T12:00:00`);
  if (period === "custom") return { start: startDate, end: endDate };
  if (period === "daily") return { start: jobTrackerToday(), end: jobTrackerToday() };
  if (period === "yearly") return { start: `${todayDate.getFullYear()}-01-01`, end: `${todayDate.getFullYear()}-12-31` };
  if (period === "weekly") {
    const monday = new Date(todayDate);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: dateString(monday), end: dateString(sunday) };
  }
  return { start: `${monthKey(todayDate)}-01`, end: dateString(new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)) };
}
const dateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function ReportsView({ data }) {
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(`${monthKey(new Date())}-01`);
  const [endDate, setEndDate] = useState(jobTrackerToday());
  const range = getReportRange(period, startDate, endDate);
  const withinRange = (value) => Boolean(value && value >= range.start && value <= range.end);
  const applications = data.applications.filter((item) => withinRange(item.applicationDate));
  const interviews = data.interviews.filter((item) => withinRange(item.date));
  const visits = data.visits.filter((item) => withinRange(item.visitDate));
  const offers = data.offers.filter((item) => withinRange(item.offerReceivedDate));
  const completed = interviews.filter((item) => item.status === "Completed");
  const passed = interviews.filter((item) => ["Passed", "Selected", "Next Round Scheduled"].includes(item.result)).length;
  const selected = applications.filter((item) => ["Selected", "Joined"].includes(item.status)).length;
  const rejected = applications.filter((item) => item.status === "Rejected").length;
  const appsWithInterviews = new Set(interviews.map((item) => item.applicationId).filter(Boolean)).size;
  const averageRounds = appsWithInterviews ? interviews.length / appsWithInterviews : 0;
  const sourceStats = [...new Set(applications.map((item) => item.jobSource).filter(Boolean))].map((source) => ({
    source,
    applications: applications.filter((item) => item.jobSource === source).length,
    selections: applications.filter((item) => item.jobSource === source && ["Selected", "Joined"].includes(item.status)).length,
  }));
  const companyStats = [...new Set(applications.map((item) => item.companyName).filter(Boolean))].map((company) => ({
    company,
    applications: applications.filter((item) => item.companyName === company).length,
    interviews: data.interviews.filter((item) => item.companyName === company && withinRange(item.date)).length,
    selections: applications.filter((item) => item.companyName === company && ["Selected", "Joined"].includes(item.status)).length,
  }));
  const monthlyInterviewStats = [...new Set(interviews.map((item) => String(item.date || "").slice(0, 7)).filter(Boolean))]
    .sort()
    .map((month) => ({
      month: new Date(`${month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      count: interviews.filter((item) => String(item.date || "").startsWith(month)).length,
    }));
  const reportRows = [
    ["Metric", "Value"],
    ["Date range", `${range.start || "—"} to ${range.end || "—"}`],
    ["Total applications", applications.length],
    ["Interviews", interviews.length],
    ["Interview success rate", completed.length ? `${Math.round((passed / completed.length) * 100)}%` : "0%"],
    ["Rejection rate", applications.length ? `${Math.round((rejected / applications.length) * 100)}%` : "0%"],
    ["Selection rate", applications.length ? `${Math.round((selected / applications.length) * 100)}%` : "0%"],
    ["Average interview rounds", averageRounds.toFixed(1)],
    ["Company visits", visits.length],
    ["Job offers", offers.length],
  ];
  const exportCsv = () => {
    const csvRows = [
      ["Company", "Role", "Application ID", "Application date", "Source", "Status", "Interviews", "Offer status"],
      ...applications.map((application) => [
        application.companyName, application.jobRole, companyApplicationId(application), application.applicationDate,
        application.jobSource, application.status,
        data.interviews.filter((item) => item.applicationId === application.id && withinRange(item.date)).length,
        data.offers.find((item) => item.applicationId === application.id)?.offerStatus || "",
      ]),
    ];
    downloadCsv("job-tracker-report.csv", csvRows);
  };
  const exportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const summary = workbook.addWorksheet("Summary");
      summary.addRows(reportRows);
      summary.getColumn(1).width = 28;
      summary.getColumn(2).width = 34;
      const appSheet = workbook.addWorksheet("Applications");
      appSheet.addRow(["Company", "Role", "Application ID", "Date", "Source", "Status"]);
      applications.forEach((application) => appSheet.addRow([application.companyName, application.jobRole, companyApplicationId(application), application.applicationDate, application.jobSource, application.status]));
      const interviewSheet = workbook.addWorksheet("Interviews");
      interviewSheet.addRow(["Company", "Role", "Round", "Date", "Time", "Status", "Result"]);
      interviews.forEach((interview) => interviewSheet.addRow([interview.companyName, interview.jobRole, interview.round, interview.date, interview.time, interview.status, interview.result]));
      const visitSheet = workbook.addWorksheet("Company Visits");
      visitSheet.addRow(["Company", "Address", "Visit date", "Purpose", "Contact", "Result"]);
      visits.forEach((visit) => visitSheet.addRow([visit.companyName, visit.officeAddress, visit.visitDate, visit.purpose, visit.contactPerson, visit.interviewResult]));
      const offerSheet = workbook.addWorksheet("Offers");
      offerSheet.addRow(["Company", "Role", "Offered CTC", "In-hand salary", "Joining date", "Status"]);
      offers.forEach((offer) => offerSheet.addRow([offer.companyName, offer.jobRole, offer.offeredCtc, offer.inHandSalary, offer.joiningDate, offer.offerStatus]));
      [appSheet, interviewSheet, visitSheet, offerSheet].forEach((sheet) => {
        sheet.columns.forEach((column) => { column.width = Math.max(16, Math.min(28, String(column.header || "").length + 8)); });
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF242A53" } };
        sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + sheet.columnCount)}1` };
      });
      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob("job-tracker-report.xlsx", buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      toast.success("Job report exported to Excel.");
    } catch (error) {
      console.error("Could not export job tracker report.", error);
      toast.error("Unable to export the Excel report.");
    }
  };
  return <section className="jt-panel jt-view-panel jt-report-view">
    <div className="jt-view-toolbar"><div><h2>Reports & analytics</h2><p>Filter applications, interviews, visits, and offers by date</p></div><div className="jt-report-actions"><button className="jt-button jt-button-light" onClick={exportCsv}><ArrowDownToLine size={14} /> CSV</button><button className="jt-button jt-button-light" onClick={exportExcel}><Download size={14} /> Excel</button><button className="jt-button jt-button-light" onClick={() => window.print()}><FileText size={14} /> PDF / Print</button></div></div>
    <div className="jt-report-filters"><label>Period<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Custom range</option></select></label>{period === "custom" && <><label>From<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>To<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></>}<span>{range.start || "—"} to {range.end || "—"}</span></div>
    <div className="jt-report-kpis">{reportRows.slice(2).map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div>
    <div className="jt-report-grid">
      <div className="jt-report-table-block"><h3>Company-wise applications</h3><div className="jt-table-wrap"><table className="jt-table"><thead><tr><th>Company</th><th>Applications</th><th>Interviews</th><th>Selections</th></tr></thead><tbody>{companyStats.map((row) => <tr key={row.company}><td>{row.company}</td><td>{row.applications}</td><td>{row.interviews}</td><td>{row.selections}</td></tr>)}{!companyStats.length && <tr><td colSpan="4">No application activity in this range.</td></tr>}</tbody></table></div></div>
      <div className="jt-report-table-block"><h3>Job source performance</h3><div className="jt-table-wrap"><table className="jt-table"><thead><tr><th>Source</th><th>Applications</th><th>Selections</th><th>Rate</th></tr></thead><tbody>{sourceStats.map((row) => <tr key={row.source}><td>{row.source}</td><td>{row.applications}</td><td>{row.selections}</td><td>{Math.round(row.selections / row.applications * 100)}%</td></tr>)}{!sourceStats.length && <tr><td colSpan="4">No source data in this range.</td></tr>}</tbody></table></div></div>
      <div className="jt-report-table-block"><h3>Company visit history</h3><div className="jt-table-wrap"><table className="jt-table"><thead><tr><th>Company</th><th>Date</th><th>Purpose</th><th>Result</th></tr></thead><tbody>{visits.map((visit) => <tr key={visit.id}><td>{visit.companyName}</td><td>{formatDate(visit.visitDate)}</td><td>{visit.purpose || "—"}</td><td>{visit.interviewResult || "—"}</td></tr>)}{!visits.length && <tr><td colSpan="4">No visits in this range.</td></tr>}</tbody></table></div></div>
      <div className="jt-report-table-block"><h3>Monthly interview count</h3><div className="jt-table-wrap"><table className="jt-table"><thead><tr><th>Month</th><th>Interviews</th></tr></thead><tbody>{monthlyInterviewStats.map((row) => <tr key={row.month}><td>{row.month}</td><td>{row.count}</td></tr>)}{!monthlyInterviewStats.length && <tr><td colSpan="2">No interviews in this range.</td></tr>}</tbody></table></div></div>
      <div className="jt-report-table-block"><h3>Job offer comparison</h3><div className="jt-table-wrap"><table className="jt-table"><thead><tr><th>Company / role</th><th>CTC</th><th>In-hand</th><th>Joining</th><th>Status</th></tr></thead><tbody>{offers.map((offer) => <tr key={offer.id}><td>{offer.companyName} · {offer.jobRole}</td><td>{formatMoney(offer.offeredCtc)}</td><td>{formatMoney(offer.inHandSalary)}</td><td>{formatDate(offer.joiningDate)}</td><td>{offer.offerStatus}</td></tr>)}{!offers.length && <tr><td colSpan="5">No offers in this range.</td></tr>}</tbody></table></div></div>
    </div>
  </section>;
}

function BackupView({ data, onReplace, onClear }) {
  const fileInput = useRef(null);
  const exportBackup = () => {
    downloadBlob(`job-tracker-backup-${jobTrackerToday()}.json`, JSON.stringify(data, null, 2), "application/json");
    toast.success("Job tracker backup downloaded.");
  };
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const replacement = JSON.parse(await file.text());
      if (!replacement || typeof replacement !== "object" || jobTrackerCollections.some((collection) => !Array.isArray(replacement[collection]))) {
        throw new Error("This file is not a valid job tracker backup.");
      }
      if (!window.confirm("Replace all current job tracker records with this backup?")) return;
      onReplace(replacement);
      toast.success("Job tracker backup restored.");
    } catch (error) {
      toast.error(error.message || "Unable to restore this backup.");
    } finally {
      event.target.value = "";
    }
  };
  return <section className="jt-panel jt-view-panel">
    <div className="jt-view-toolbar"><div><h2>Backup & restore</h2><p>All job tracking data stays in this browser’s LocalStorage.</p></div></div>
    <div className="jt-backup-grid"><article><span className="jt-backup-icon"><Download size={20} /></span><h3>Download backup</h3><p>Save companies, applications, status history, interviews, offers, and preparation notes as JSON.</p><button className="jt-button jt-button-primary" onClick={exportBackup}><Download size={15} /> Export JSON</button></article>
      <article><span className="jt-backup-icon jt-backup-blue"><Upload size={20} /></span><h3>Restore backup</h3><p>Choose a previously exported JSON file. Restoring replaces the current job tracker data.</p><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importBackup} /><button className="jt-button jt-button-light" onClick={() => fileInput.current?.click()}><Upload size={15} /> Choose backup file</button></article>
      <article className="jt-backup-danger"><span className="jt-backup-icon jt-backup-red"><Trash2 size={20} /></span><h3>Clear job tracker</h3><p>Remove all job tracker data from this browser. This does not affect company management records.</p><button className="jt-button jt-button-danger" onClick={onClear}><Trash2 size={15} /> Clear all job data</button></article>
    </div>
  </section>;
}

function downloadCsv(filename, rows) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = rows.map((row) => row.map(quote).join(",")).join("\r\n");
  downloadBlob(filename, `\uFEFF${content}`, "text/csv;charset=utf-8");
}
function downloadBlob(filename, content, type) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function JobTrackerWorkspace() {
  const { data, add, update, remove, setApplicationStatus, markReminderSent, replaceAll, clearAll } = useJobTracker();
  const [activeTab, setActiveTab] = useState("Overview");
  const [modal, setModal] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationStatus, setApplicationStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(jobTrackerToday());

  useEffect(() => {
    const scanReminders = () => {
      const now = Date.now();
      const reminderOptions = [
        ["remindOneDay", 24 * 60, "1 day"],
        ["remindThreeHours", 3 * 60, "3 hours"],
        ["remindThirtyMinutes", 30, "30 minutes"],
      ];
      data.interviews.filter((interview) => ["Scheduled", "Rescheduled"].includes(interview.status)).forEach((interview) => {
        const scheduledAt = interviewTime(interview)?.getTime();
        if (!scheduledAt || scheduledAt <= now) return;
        const minutesLeft = (scheduledAt - now) / 60000;
        reminderOptions.forEach(([field, minutes, label]) => {
          const reminderId = `${interview.id}-${field}`;
          if (interview[field] && minutesLeft <= minutes && !data.reminderSent.includes(reminderId)) {
            toast(`Interview with ${interview.companyName} in ${label}.`, { icon: "🔔", duration: 7000 });
            markReminderSent(reminderId);
          }
        });
      });
    };
    scanReminders();
    const timer = window.setInterval(scanReminders, 30000);
    return () => window.clearInterval(timer);
  }, [data.interviews, data.reminderSent, markReminderSent]);

  const openAdd = (collection) => setModal({ collection, record: null });
  const openEdit = (collection, record) => setModal({ collection, record });
  const saveRecord = (values) => {
    try {
      if (modal.collection === "applications") {
        const duplicate = data.applications.some((application) =>
          application.id !== modal.record?.id &&
          String(application.companyName || "").trim().toLowerCase() === String(values.companyName || "").trim().toLowerCase() &&
          String(application.jobRole || "").trim().toLowerCase() === String(values.jobRole || "").trim().toLowerCase(),
        );
        if (duplicate && !values.allowDuplicate) throw new Error("An application for this company and role already exists. Enable the duplicate option to continue.");
      }
      if (modal.record) update(modal.collection, modal.record.id, values);
      else add(modal.collection, values);
      toast.success(`${COLLECTION_LABELS[modal.collection]} ${modal.record ? "updated" : "added"}.`);
      setModal(null);
    } catch (error) {
      toast.error(error.message || "Unable to save this record.");
    }
  };
  const deleteRecord = (collection, record) => {
    const linkedCount = collection === "companies"
      ? data.applications.filter((item) => item.companyId === record.id).length
      : collection === "applications"
        ? data.interviews.filter((item) => item.applicationId === record.id).length + data.invitations.filter((item) => item.applicationId === record.id).length + data.offers.filter((item) => item.applicationId === record.id).length
        : 0;
    const warning = collection === "companies" && linkedCount
      ? ` Delete its ${linkedCount} linked application(s) and related records too.`
      : collection === "applications" && linkedCount ? ` Delete its ${linkedCount} linked invitations, interviews, and offers too.` : "";
    if (!window.confirm(`Permanently delete this ${COLLECTION_LABELS[collection].toLowerCase()}?${warning} This cannot be undone.`)) return;
    remove(collection, record.id);
    toast.success(`${COLLECTION_LABELS[collection]} deleted.`);
  };
  const onStatusChange = (id, status, note) => {
    setApplicationStatus(id, status, note || `Moved to ${status}`);
    toast.success(`Application moved to ${status}.`);
  };
  const navigate = (tab) => setActiveTab(tab);
  const interviews = data.interviews;

  const renderActiveView = () => {
    if (activeTab === "Overview") return <JobDashboard data={data} onAdd={openAdd} onNavigate={navigate} />;
    if (activeTab === "Companies") return <CollectionView title="Companies" description="Manage saved company profiles and recruiter contacts." rows={data.companies} onEdit={(row) => openEdit("companies", row)} onDelete={(row) => deleteRecord("companies", row)} emptyText="Add companies directly or create a profile while recording an application." columns={[
      { key: "name", label: "Company", render: (row) => <span className="jt-primary-cell"><b>{row.name}</b><small>{row.location || "Location not added"}</small></span> },
      { key: "website", label: "Website", render: (row) => row.website ? <a href={row.website} target="_blank" rel="noreferrer">Open website</a> : "—" },
      { key: "address", label: "Office address" },
      { key: "hrName", label: "HR / recruiter" },
      { key: "hrMobile", label: "HR mobile" },
      { key: "hrEmail", label: "HR email" },
    ]} />;
    if (activeTab === "Applications") return <ApplicationsView applications={data.applications} search={applicationSearch} setSearch={setApplicationSearch} statusFilter={applicationStatus} setStatusFilter={setApplicationStatusFilter} onEdit={(row) => openEdit("applications", row)} onDelete={(row) => deleteRecord("applications", row)} />;
    if (activeTab === "Pipeline") return <section className="jt-panel jt-view-panel"><div className="jt-view-toolbar"><div><h2>Application pipeline</h2><p>{data.applications.length} applications · drag cards or choose a status to update history</p></div><button className="jt-button jt-button-primary" onClick={() => openAdd("applications")}><Plus size={15} /> Add application</button></div><PipelineView applications={data.applications} onStatusChange={onStatusChange} onEdit={(row) => openEdit("applications", row)} onDelete={(row) => deleteRecord("applications", row)} /></section>;
    if (activeTab === "Invitations") return <CollectionView title="Job invitations" description="Invitations received from calls, email, LinkedIn, WhatsApp, and walk-ins." rows={data.invitations} onEdit={(row) => openEdit("invitations", row)} onDelete={(row) => deleteRecord("invitations", row)} emptyText="Record invitations from companies to keep follow-ups together." columns={[
      { key: "companyName", label: "Company", render: (row) => <span className="jt-primary-cell"><b>{row.companyName}</b><small>{row.hrName || row.hrContact || "Contact not added"}</small></span> },
      { key: "invitationDate", label: "Received", render: (row) => formatDate(row.invitationDate) },
      { key: "invitationType", label: "Invitation type" },
      { key: "interviewDate", label: "Interview date", render: (row) => row.interviewDate ? `${formatDate(row.interviewDate)} ${row.interviewTime || ""}` : "—" },
      { key: "interviewMode", label: "Mode" },
      { key: "status", label: "Status", render: (row) => <span className={`jt-badge ${badgeClass(row.status)}`}>{row.status}</span> },
      { key: "meetingLink", label: "Link", render: (row) => row.meetingLink ? <a href={row.meetingLink} target="_blank" rel="noreferrer">Open link</a> : "—" },
    ]} />;
    if (activeTab === "Interviews") return <InterviewsView interviews={interviews} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEdit={(row) => openEdit("interviews", row)} onDelete={(row) => deleteRecord("interviews", row)} />;
    if (activeTab === "Company visits") return <CollectionView title="Company visits" description="Track office visits, travel details, and follow-up dates." rows={data.visits} onEdit={(row) => openEdit("visits", row)} onDelete={(row) => deleteRecord("visits", row)} emptyText="Add a company visit to keep location and follow-up details." columns={[
      { key: "companyName", label: "Company" },
      { key: "officeAddress", label: "Office address" },
      { key: "visitDate", label: "Visit date", render: (row) => formatDate(row.visitDate) },
      { key: "purpose", label: "Purpose" },
      { key: "contactPerson", label: "Contact" },
      { key: "interviewResult", label: "Result" },
      { key: "nextVisitDate", label: "Next visit", render: (row) => formatDate(row.nextVisitDate) },
      { key: "mapLink", label: "Map", render: (row) => row.mapLink ? <a className="jt-map-link" href={row.mapLink} target="_blank" rel="noreferrer"><MapPin size={13} /> Open map</a> : "—" },
    ]} />;
    if (activeTab === "Rejections") return <RejectionsView applications={data.applications} onEdit={(row) => openEdit("applications", row)} onDelete={(row) => deleteRecord("applications", row)} onArchive={(row) => { update("applications", row.id, { archived: !row.archived }); toast.success(row.archived ? "Rejection restored." : "Rejection archived."); }} />;
    if (activeTab === "Offers") return <CollectionView title="Job offers" description="Compare compensation, offers, and joining dates." rows={data.offers} onEdit={(row) => openEdit("offers", row)} onDelete={(row) => deleteRecord("offers", row)} emptyText="Add an offer when a company shares its compensation details." columns={[
      { key: "companyName", label: "Company", render: (row) => <span className="jt-primary-cell"><b>{row.companyName}</b><small>{row.jobRole}</small></span> },
      { key: "offeredCtc", label: "Offered CTC", render: (row) => formatMoney(row.offeredCtc) },
      { key: "inHandSalary", label: "In-hand", render: (row) => formatMoney(row.inHandSalary) },
      { key: "offerReceivedDate", label: "Received", render: (row) => formatDate(row.offerReceivedDate) },
      { key: "joiningDate", label: "Joining date", render: (row) => formatDate(row.joiningDate) },
      { key: "offerStatus", label: "Status", render: (row) => <span className={`jt-badge ${badgeClass(row.offerStatus)}`}>{row.offerStatus}</span> },
      { key: "offerLetter", label: "Offer letter", render: (row) => row.offerLetter ? <a href={row.offerLetter} target="_blank" rel="noreferrer">Open letter</a> : "—" },
    ]} />;
    if (activeTab === "Preparation") return <section className="jt-panel jt-view-panel"><div className="jt-view-toolbar"><div><h2>Job preparation notes</h2><p>Questions, answers, and revision status across interview topics.</p></div><button className="jt-button jt-button-primary" onClick={() => openAdd("preparation")}><Plus size={15} /> Add note</button></div><PreparationView rows={data.preparation} onEdit={(row) => openEdit("preparation", row)} onDelete={(row) => deleteRecord("preparation", row)} onToggle={(row) => { update("preparation", row.id, { status: row.status === "Revised" ? "Pending" : "Revised" }); toast.success("Revision status updated."); }} /></section>;
    if (activeTab === "Reports") return <ReportsView data={data} />;
    return <BackupView data={data} onReplace={replaceAll} onClear={() => {
      if (!window.confirm("Permanently delete all job tracker data from this browser? This cannot be undone.")) return;
      clearAll();
      toast.success("Job tracker data cleared.");
    }} />;
  };

  const title = activeTab === "Overview" ? "Job tracker" : activeTab;
  const activeCollection = modal?.collection;
  return <div className="jt-shell">
    <header className="jt-main-header"><div><p className="jt-eyebrow">PERSONAL RECRUITMENT WORKSPACE</p><h1>{title}</h1></div><div className="jt-main-actions"><button className="jt-button jt-button-light" onClick={() => openAdd("companies")}><Plus size={15} /> Add company</button><button className="jt-button jt-button-primary" onClick={() => openAdd("applications")}><Plus size={15} /> Add job application</button></div></header>
    <nav className="jt-tabs" aria-label="Job tracker sections">{NAV_ITEMS.map(([label, Icon]) => <button key={label} className={activeTab === label ? "is-active" : ""} onClick={() => setActiveTab(label)}><Icon size={15} />{label}</button>)}</nav>
    <main className="jt-content">{renderActiveView()}</main>
    {modal && <RecordModal key={`${modal.collection}-${modal.record?.id || "new"}`} collection={activeCollection} record={modal.record} data={data} onClose={() => setModal(null)} onSave={saveRecord} />}
  </div>;
}

export default function JobTracker() {
  return <JobTrackerProvider><JobTrackerWorkspace /></JobTrackerProvider>;
}
