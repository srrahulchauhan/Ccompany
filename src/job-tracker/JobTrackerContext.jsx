import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "orbit-job-tracker-v1";
const COLLECTIONS = ["companies", "applications", "invitations", "interviews", "visits", "offers", "preparation"];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const normalize = (value) => String(value || "").trim().toLowerCase();
const emptyData = () => ({ ...Object.fromEntries(COLLECTIONS.map((collection) => [collection, []])), reminderSent: [] });
const statusEvent = (application, status, note) => ({
  ...application,
  status,
  rejectionDate: status === "Rejected" ? application.rejectionDate || today() : application.rejectionDate,
  statusHistory: [...(application.statusHistory || []), { date: today(), status, note }],
});

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyData();
    const parsed = JSON.parse(saved);
    return {
      ...emptyData(),
      ...parsed,
      ...Object.fromEntries(COLLECTIONS.map((collection) => [collection, Array.isArray(parsed[collection]) ? parsed[collection] : []])),
      reminderSent: Array.isArray(parsed.reminderSent) ? parsed.reminderSent : [],
    };
  } catch (error) {
    console.error("Could not load job tracker data.", error);
    return emptyData();
  }
}

const JobTrackerContext = createContext(null);

export function JobTrackerProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save job tracker data.", error);
    }
  }, [data]);

  const actions = useMemo(() => {
    const ensureCompany = (companyName, values = {}) => {
      const name = String(companyName || "").trim();
      if (!name) return { company: null, companies: data.companies };
      const existing = data.companies.find((company) => normalize(company.name) === normalize(name));
      if (existing) return { company: existing, companies: data.companies };
      const company = { id: makeId("company"), name, website: values.companyWebsite || "", location: values.companyLocation || "", address: values.officeAddress || "", hrName: values.hrName || "", hrMobile: values.hrMobile || values.hrContact || "", hrEmail: values.hrEmail || "" };
      return { company, companies: [...data.companies, company] };
    };

    return {
      add: (collection, values) => {
        if (!COLLECTIONS.includes(collection)) throw new Error("Unsupported job tracker record.");
        const record = { ...values, id: makeId(collection.slice(0, 3)), createdAt: new Date().toISOString() };
        let companies = data.companies;

        if (collection === "companies" && data.companies.some((company) => normalize(company.name) === normalize(values.name))) {
          throw new Error("This company is already in your tracker.");
        }
        if (collection === "applications") {
          const duplicate = data.applications.some((application) =>
            normalize(application.companyName) === normalize(values.companyName) && normalize(application.jobRole) === normalize(values.jobRole),
          );
          if (duplicate && !values.allowDuplicate) throw new Error("An application for this company and role already exists.");
          const prefix = `JOB-${today().slice(0, 7).replace("-", "")}-`;
          const latest = data.applications.reduce((max, application) => {
            const number = Number(String(application.applicationId || "").startsWith(prefix) ? String(application.applicationId).slice(prefix.length) : 0);
            return Math.max(max, Number.isFinite(number) ? number : 0);
          }, 0);
          record.applicationId = `${prefix}${String(latest + 1).padStart(3, "0")}`;
          record.status ||= "Applied";
          record.statusHistory = [{ date: record.applicationDate || today(), status: record.status, note: "Application created" }];
          delete record.allowDuplicate;
        }
        if (["applications", "invitations", "interviews", "visits", "offers"].includes(collection)) {
          const companyResult = ensureCompany(values.companyName, values);
          companies = companyResult.companies;
          if (companyResult.company) record.companyId = companyResult.company.id;
        }

        if (collection === "interviews" && record.applicationId) {
          const application = data.applications.find((item) => item.id === record.applicationId);
          if (application) {
            record.companyName = record.companyName || application.companyName;
            record.jobRole = record.jobRole || application.jobRole;
            record.companyId = application.companyId || record.companyId;
            record.status ||= "Scheduled";
            record.result ||= "Pending";
          }
        }
        setData((previous) => {
          let applications = previous.applications;
          if (record.applicationId && collection === "interviews") {
            applications = applications.map((application) => application.id === record.applicationId
              ? statusEvent(application, "Interview Scheduled", "Interview scheduled")
              : application);
          }
          if (record.applicationId && collection === "invitations" && record.status === "Accepted") {
            applications = applications.map((application) => application.id === record.applicationId
              ? statusEvent(application, "Invitation Received", "Invitation accepted")
              : application);
          }
          if (record.applicationId && collection === "offers") {
            const status = record.offerStatus === "Joined" ? "Joined" : "Selected";
            applications = applications.map((application) => application.id === record.applicationId
              ? statusEvent(application, status, `Offer status: ${record.offerStatus || "Offer Received"}`)
              : application);
          }
          return {
            ...previous,
            companies,
            applications,
            [collection]: [...previous[collection], record],
          };
        });
        return record;
      },
      update: (collection, recordId, values) => {
        if (!COLLECTIONS.includes(collection)) throw new Error("Unsupported job tracker record.");
        if (collection === "companies" && data.companies.some((company) => company.id !== recordId && normalize(company.name) === normalize(values.name))) {
          throw new Error("This company is already in your tracker.");
        }
        if (collection === "applications") {
          const duplicate = data.applications.some((application) =>
            application.id !== recordId &&
            normalize(application.companyName) === normalize(values.companyName) &&
            normalize(application.jobRole) === normalize(values.jobRole),
          );
          if (duplicate && !values.allowDuplicate) throw new Error("An application for this company and role already exists.");
        }
        setData((previous) => {
          const current = previous[collection].find((item) => item.id === recordId);
          const cleanValues = { ...values };
          delete cleanValues.statusNote;
          delete cleanValues.allowDuplicate;
          let next = {
            ...previous,
            [collection]: previous[collection].map((item) => item.id === recordId
              ? { ...item, ...(collection === "applications" ? cleanValues : values), updatedAt: new Date().toISOString() }
              : item),
          };
          if (collection === "applications") {
            if (current && values.status && values.status !== current.status) {
              next.applications = next.applications.map((item) => item.id === recordId
                ? {
                    ...item,
                    rejectionDate: values.status === "Rejected" ? item.rejectionDate || today() : item.rejectionDate,
                    statusHistory: [...(current.statusHistory || []), { date: today(), status: values.status, note: values.statusNote || "Status updated" }],
                  }
                : item);
            }
            if (current && values.companyName) {
              const companyResult = ensureCompany(values.companyName, values);
              next.companies = companyResult.companies;
              next.applications = next.applications.map((item) => item.id === recordId
                ? { ...item, companyId: companyResult.company?.id || item.companyId }
                : item);
            }
          }
          if (collection === "companies" && current && values.name && values.name !== current.name) {
            for (const related of ["applications", "invitations", "interviews", "visits", "offers"]) {
              next[related] = next[related].map((item) => item.companyId === recordId ? { ...item, companyName: values.name } : item);
            }
          }
          if (collection === "interviews" && values.result && values.result !== "Pending") {
            const interview = previous.interviews.find((item) => item.id === recordId);
            const applicationId = values.applicationId || interview?.applicationId;
            const nextStatus = values.result === "Selected" ? "Selected" : values.result === "Rejected" ? "Rejected" : null;
            if (applicationId && nextStatus) {
              next.applications = next.applications.map((item) => item.id === applicationId && item.status !== nextStatus
                ? statusEvent(item, nextStatus, `Interview result: ${values.result}`)
                : item);
            }
          } else if (collection === "interviews" && values.status === "Completed") {
            const interview = previous.interviews.find((item) => item.id === recordId);
            const applicationId = values.applicationId || interview?.applicationId;
            if (applicationId) {
              next.applications = next.applications.map((item) => item.id === applicationId && item.status !== "Interview Completed"
                ? statusEvent(item, "Interview Completed", "Interview completed")
                : item);
            }
          }
          if (collection === "invitations" && values.status === "Accepted") {
            const invitation = previous.invitations.find((item) => item.id === recordId);
            const applicationId = values.applicationId || invitation?.applicationId;
            if (applicationId) {
              next.applications = next.applications.map((item) => item.id === applicationId && item.status !== "Invitation Received"
                ? statusEvent(item, "Invitation Received", "Invitation accepted")
                : item);
            }
          }
          if (collection === "offers") {
            const offer = previous.offers.find((item) => item.id === recordId);
            const applicationId = values.applicationId || offer?.applicationId;
            const status = values.offerStatus === "Joined" ? "Joined" : ["Offer Received", "Negotiation", "Accepted"].includes(values.offerStatus) ? "Selected" : null;
            if (applicationId && status) {
              next.applications = next.applications.map((item) => item.id === applicationId && item.status !== status
                ? statusEvent(item, status, `Offer status: ${values.offerStatus}`)
                : item);
            }
          }
          return next;
        });
      },
      remove: (collection, recordId) => {
        if (!COLLECTIONS.includes(collection)) throw new Error("Unsupported job tracker record.");
        setData((previous) => {
          const next = { ...previous, [collection]: previous[collection].filter((item) => item.id !== recordId) };
          if (collection === "applications") {
            next.invitations = previous.invitations.filter((item) => item.applicationId !== recordId);
            next.interviews = previous.interviews.filter((item) => item.applicationId !== recordId);
            next.offers = previous.offers.filter((item) => item.applicationId !== recordId);
            next.reminderSent = previous.reminderSent.filter((id) => !previous.interviews.some((item) => item.applicationId === recordId && id.startsWith(`${item.id}-`)));
          }
          if (collection === "companies") {
            const applicationIds = new Set(previous.applications.filter((item) => item.companyId === recordId).map((item) => item.id));
            const belongsToCompany = (item) => item.companyId === recordId || applicationIds.has(item.applicationId);
            next.applications = previous.applications.filter((item) => !belongsToCompany(item));
            next.invitations = previous.invitations.filter((item) => !belongsToCompany(item));
            next.interviews = previous.interviews.filter((item) => !belongsToCompany(item));
            next.visits = previous.visits.filter((item) => !belongsToCompany(item));
            next.offers = previous.offers.filter((item) => !belongsToCompany(item));
            next.reminderSent = previous.reminderSent.filter((id) => !previous.interviews.some((item) => belongsToCompany(item) && id.startsWith(`${item.id}-`)));
          }
          if (collection === "interviews") next.reminderSent = previous.reminderSent.filter((id) => !id.startsWith(`${recordId}-`));
          return next;
        });
      },
      setApplicationStatus: (applicationId, status, note = "Moved on pipeline") => {
        const application = data.applications.find((item) => item.id === applicationId);
        if (!application || application.status === status) return;
        const rejectionDate = status === "Rejected" ? application.rejectionDate || today() : application.rejectionDate;
        setData((previous) => ({
          ...previous,
          applications: previous.applications.map((item) => item.id === applicationId
            ? { ...item, status, rejectionDate, statusHistory: [...(item.statusHistory || []), { date: today(), status, note }] }
            : item),
        }));
      },
      markReminderSent: (reminderId) => setData((previous) => ({ ...previous, reminderSent: [...new Set([...previous.reminderSent, reminderId])] })),
      replaceAll: (replacement) => {
        if (!replacement || COLLECTIONS.some((collection) => !Array.isArray(replacement[collection]))) throw new Error("This is not a valid job tracker backup.");
        setData({ ...emptyData(), ...replacement, reminderSent: Array.isArray(replacement.reminderSent) ? replacement.reminderSent : [] });
      },
      clearAll: () => setData(emptyData()),
    };
  }, [data]);

  return <JobTrackerContext.Provider value={{ data, ...actions }}>{children}</JobTrackerContext.Provider>;
}

export function useJobTracker() {
  const store = useContext(JobTrackerContext);
  if (!store) throw new Error("useJobTracker must be used inside JobTrackerProvider.");
  return store;
}

export const jobTrackerCollections = COLLECTIONS;
export const jobTrackerToday = today;
