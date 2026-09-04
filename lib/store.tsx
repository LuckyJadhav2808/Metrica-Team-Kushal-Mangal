"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Instrument,
  VerificationApplication,
  Verification,
  Certificate,
  Complaint,
  UserRole,
  User,
  Notification,
  AuditLog,
} from "./types";
import { supabase } from "./supabase";

function mapSupabaseInstrument(data: any): Instrument {
  return {
    id: data.id,
    digitalInstrumentId: data.digital_instrument_id || data.digitalInstrumentId,
    serialNumber: data.serial_number || data.serialNumber,
    modelName: data.model_name || data.modelName,
    category: data.category || "ELECTRONIC_COUNTER_SCALE",
    accuracyClass: data.accuracy_class || data.accuracyClass || "CLASS_III",
    nominalUnit: data.nominal_unit || data.nominalUnit || "KG",
    maxCapacity: Number(data.max_capacity ?? data.maxCapacity ?? 30),
    minCapacity: Number(data.min_capacity ?? data.minCapacity ?? 0.1),
    verificationInterval: Number(data.verification_interval ?? data.verificationInterval ?? 0.005),
    manufacturerName: data.manufacturer_name || data.manufacturerName || "Apex Metrology Ltd",
    ownerName: data.owner_name || data.ownerName,
    ownerAddress: data.owner_address || data.ownerAddress,
    pincode: data.pincode || "110001",
    jurisdictionCircle: data.jurisdiction_circle || data.jurisdictionCircle || "Delhi North District Circle",
    status: data.status || "REGISTERED_PENDING_VERIFICATION",
    riskScore: Number(data.risk_score ?? data.riskScore ?? 10),
    trustScore: Number(data.trust_score ?? data.trustScore ?? 90),
    priorityFlag: data.priority_flag || data.priorityFlag || "LOW",
    lastVerifiedAt: data.last_verified_at || data.lastVerifiedAt,
    validUntil: data.valid_until || data.validUntil,
    currentSealNumber: data.current_seal_number || data.currentSealNumber,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  };
}

function mapSupabaseApplication(data: any): VerificationApplication {
  return {
    id: data.id,
    applicationNumber: data.application_number || data.applicationNumber,
    instrumentId: data.instrument_id || data.instrumentId,
    instrumentSerial: data.instrument_serial || data.instrumentSerial || "UNKNOWN",
    instrumentCategory: data.category || "ELECTRONIC_COUNTER_SCALE",
    applicantName: data.applicant_name || data.applicantName,
    applicantPhone: data.applicant_phone || data.applicantPhone || "+91 98000 00000",
    jurisdictionCircle: data.jurisdiction_circle || "Delhi North District Circle",
    type: data.type || "INITIAL_VERIFICATION",
    status: data.status || "PENDING_ASSIGNMENT",
    readinessScore: Number(data.readiness_score ?? data.readinessScore ?? 85),
    statutoryFee: Number(data.fee_amount ?? data.statutoryFee ?? 150),
    penaltyFee: 0,
    paymentStatus: data.payment_status || data.paymentStatus || "PAID",
    paymentRefNumber: data.payment_ref_number || data.paymentRefNumber,
    assignedOfficerId: data.assigned_officer_id || data.assignedOfficerId,
    assignedOfficerName: data.assigned_officer_name || data.assignedOfficerName,
    scheduledDate: data.scheduled_date || data.scheduledDate,
    scheduledSlot: data.scheduled_slot || data.scheduledSlot,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  };
}

function mapSupabaseComplaint(data: any): Complaint {
  return {
    id: data.id,
    digitalInstrumentId: data.digital_instrument_id || data.digitalInstrumentId,
    instrumentId: data.instrument_id || data.instrumentId,
    complaintType: data.category || data.complaintType || "SHORT_WEIGHT",
    description: data.description || "",
    complainantPhone: data.complainant_phone || data.complainantPhone,
    status: data.status || "LOGGED",
    impactOnRiskScore: Number(data.impact_on_risk_score ?? 25),
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  };
}

export const GOVERNMENT_PERSONAS: Record<UserRole, User> = {
  ADMIN: {
    id: "usr-admin-01",
    role: "ADMIN",
    name: "Dr. S. K. Verma",
    designation: "Controller of Legal Metrology",
    email: "controller.lm@nic.in",
    phone: "+91 11 2338 1234",
    jurisdictionCircle: "Central Directorate, Krishi Bhawan, New Delhi",
    officerBadgeId: "DoCA-DIR-001",
    avatarLetter: "V",
  },
  LMO: {
    id: "usr-lmo-01",
    role: "LMO",
    name: "Rajesh Kumar",
    designation: "Legal Metrology Inspector (Grade-I)",
    email: "rajesh.kumar.lmo@gov.in",
    phone: "+91 98100 45678",
    jurisdictionCircle: "Delhi North District Circle",
    officerBadgeId: "LMO-DL-N-884",
    avatarLetter: "R",
  },
  OWNER: {
    id: "usr-owner-01",
    role: "OWNER",
    name: "Ramesh Patel",
    designation: "Commercial Licensee",
    email: "ramesh.patel@greenvalley.in",
    phone: "+91 98234 11223",
    organizationName: "Green Valley Groceries Pvt Ltd",
    jurisdictionCircle: "Delhi North District Circle",
    avatarLetter: "P",
  },
  MANUFACTURER: {
    id: "usr-mfg-01",
    role: "MANUFACTURER",
    name: "Anand Swaminathan",
    designation: "Chief Regulatory Officer",
    email: "regulatory@apexmetrology.com",
    phone: "+91 80 4455 6677",
    organizationName: "Apex Metrology Instruments Ltd",
    jurisdictionCircle: "National Manufacturing Division",
    officerBadgeId: "IND-MFG-LIC-2024",
    avatarLetter: "A",
  },
  GATC: {
    id: "usr-gatc-01",
    role: "GATC",
    name: "Dr. Meenakshi Sundaram",
    designation: "Lead Metrology Scientist",
    email: "director@gatclabs.org",
    phone: "+91 22 2655 8899",
    organizationName: "GATC Precision Calibration Labs",
    jurisdictionCircle: "Western Zone Accredited Testing Circle",
    officerBadgeId: "NABL-GATC-789",
    avatarLetter: "M",
  },
  PUBLIC: {
    id: "usr-public-anon",
    role: "PUBLIC",
    name: "Citizen Consumer",
    designation: "Public Citizen",
    email: "consumer@public.in",
    phone: "",
    jurisdictionCircle: "All India",
    avatarLetter: "C",
  },
};

interface MetricaContextType {
  currentUser: User;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  loginAs: (role: UserRole) => void;
  loginWithUser: (user: User) => void;
  registerUser: (userData: Omit<User, "id">) => User;
  logout: () => void;
  refreshDatabase: () => Promise<void>;
  instruments: Instrument[];
  applications: VerificationApplication[];
  verifications: Verification[];
  certificates: Certificate[];
  complaints: Complaint[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  // Actions
  addInstrument: (instrument: Omit<Instrument, "id" | "digitalInstrumentId" | "createdAt" | "riskScore" | "trustScore" | "priorityFlag">) => Instrument;
  claimInstrument: (serialNumber: string, ownerName: string, ownerAddress: string, pincode: string) => Instrument | null;
  submitApplication: (data: { instrumentId: string; type: VerificationApplication["type"]; applicantName: string; applicantPhone: string; readinessScore: number }) => VerificationApplication;
  payApplicationFee: (applicationId: string, paymentRef: string) => void;
  assignOfficer: (applicationId: string, officerId: string, officerName: string, date: string, slot: string) => void;
  submitVerification: (verification: Omit<Verification, "id" | "inspectionDate">) => { verification: Verification; certificate?: Certificate };
  fileComplaint: (complaint: Omit<Complaint, "id" | "createdAt" | "status" | "impactOnRiskScore">) => Complaint;
  updateComplaintStatus: (complaintId: string, status: Complaint["status"], resolutionNotes?: string) => void;
  dispatchRaidForComplaint: (complaintId: string, officerId: string, officerName: string, date: string, slot: string, notes?: string) => VerificationApplication;
  updateInstrumentFlag: (instrumentId: string, flag: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", notes?: string, suspendTampered?: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllData: () => void;
}

const MetricaContext = createContext<MetricaContextType | undefined>(undefined);

const STORAGE_KEY = "metrica_data_v3";

export function MetricaProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(GOVERNMENT_PERSONAS.ADMIN);
  const [isLoaded, setIsLoaded] = useState(false);

  // Collections (zero hardcoded mock data)
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Function to sync with SQLite database via REST API
  const refreshDatabase = async () => {
    try {
      // 1. Session user
      const authRes = await fetch("/api/auth/me");
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          setCurrentUser(authData.user);
        }
      }

      // 2. Instruments
      const instRes = await fetch("/api/instruments");
      if (instRes.ok) {
        const dbInstruments = await instRes.json();
        if (Array.isArray(dbInstruments)) {
          const mappedInstruments: Instrument[] = dbInstruments.map((dbInst: any) => ({
            id: dbInst.id,
            digitalInstrumentId: dbInst.digitalInstrumentId,
            serialNumber: dbInst.serialNumber,
            modelName: dbInst.modelName,
            category: dbInst.category,
            accuracyClass: dbInst.accuracyClass,
            nominalUnit: dbInst.nominalUnit,
            maxCapacity: dbInst.maxCapacity,
            minCapacity: dbInst.minCapacity,
            verificationInterval: dbInst.verificationInterval,
            manufacturerName: dbInst.manufacturerName,
            ownerName: dbInst.ownerName,
            ownerAddress: dbInst.ownerAddress,
            jurisdictionCircle: dbInst.jurisdictionCircle,
            pincode: dbInst.pincode || "110001",
            status: dbInst.status,
            riskScore: dbInst.riskScore,
            trustScore: dbInst.trustScore,
            priorityFlag: dbInst.priorityFlag,
            lastVerifiedAt: dbInst.lastVerifiedAt,
            validUntil: dbInst.validUntil,
            currentSealNumber: dbInst.currentSealNumber,
            createdAt: typeof dbInst.createdAt === "string" ? dbInst.createdAt : new Date(dbInst.createdAt).toISOString(),
          }));
          setInstruments(mappedInstruments);

          // Extract any nested certificates
          const dbCerts: Certificate[] = [];
          dbInstruments.forEach((dbInst: any) => {
            if (Array.isArray(dbInst.certificates)) {
              dbInst.certificates.forEach((c: any) => {
                dbCerts.push({
                  id: c.id,
                  certificateNumber: c.certificateNumber,
                  instrumentId: c.instrumentId,
                  digitalInstrumentId: c.digitalInstrumentId,
                  issueDate: c.issueDate,
                  validUntil: c.validUntil,
                  status: c.status,
                  physicalSealNumber: c.physicalSealNumber,
                  digitalSignatureHash: c.digitalSignatureHash,
                  signedByOfficerName: c.signedByOfficerName,
                  qrPayloadUrl: c.qrPayloadUrl,
                });
              });
            }
          });
          if (dbCerts.length > 0) {
            setCertificates(dbCerts);
          } else if (dbInstruments.length === 0) {
            setCertificates([]);
          }
        }
      }

      // 3. Applications
      const appRes = await fetch("/api/applications");
      if (appRes.ok) {
        const dbApps = await appRes.json();
        if (Array.isArray(dbApps)) {
          const mappedApps: VerificationApplication[] = dbApps.map((dbApp: any) => ({
            id: dbApp.id,
            applicationNumber: dbApp.applicationNumber,
            instrumentId: dbApp.instrumentId,
            instrumentSerial: dbApp.instrumentSerial,
            instrumentCategory: dbApp.instrument?.category || "ELECTRONIC_COUNTER_SCALE",
            applicantName: dbApp.applicantName,
            applicantPhone: dbApp.applicantPhone,
            jurisdictionCircle: dbApp.instrument?.jurisdictionCircle || "Delhi North District Circle",
            type: dbApp.type,
            status: dbApp.status,
            readinessScore: dbApp.readinessScore,
            statutoryFee: dbApp.feeAmount || 150,
            penaltyFee: 0,
            paymentStatus: dbApp.paymentStatus,
            paymentRefNumber: dbApp.paymentRefNumber,
            assignedOfficerId: dbApp.assignedOfficerId,
            assignedOfficerName: dbApp.assignedOfficerName,
            scheduledDate: dbApp.scheduledDate,
            scheduledSlot: dbApp.scheduledSlot,
            createdAt: typeof dbApp.createdAt === "string" ? dbApp.createdAt : new Date(dbApp.createdAt).toISOString(),
          }));
          setApplications(mappedApps);
        }
      }

      // 4. Certificates
      const certRes = await fetch("/api/certificates");
      if (certRes.ok) {
        const fetchedCerts = await certRes.json();
        if (Array.isArray(fetchedCerts)) {
          setCertificates(fetchedCerts);
        }
      }

      // 5. Complaints
      const cmpRes = await fetch("/api/complaints");
      if (cmpRes.ok) {
        const fetchedComplaints = await cmpRes.json();
        if (Array.isArray(fetchedComplaints)) {
          setComplaints(
            fetchedComplaints.map((c: any) => ({
              id: c.id,
              digitalInstrumentId: c.digitalInstrumentId,
              instrumentId: c.instrumentId,
              complaintType: c.category,
              description: c.description,
              complainantPhone: c.complainantPhone,
              status: c.status,
              impactOnRiskScore: c.impactOnRiskScore,
              createdAt: typeof c.createdAt === "string" ? c.createdAt : new Date(c.createdAt).toISOString(),
            }))
          );
        }
      }

      // 6. Audit Logs
      const logRes = await fetch("/api/audit-logs");
      if (logRes.ok) {
        const fetchedLogs = await logRes.json();
        if (Array.isArray(fetchedLogs)) {
          setAuditLogs(
            fetchedLogs.map((l: any) => ({
              id: l.id,
              entityType: l.entityType,
              entityId: l.entityId,
              actorName: l.actorName,
              actorRole: l.actorRole,
              action: l.action,
              details: l.details,
              timestamp: typeof l.timestamp === "string" ? l.timestamp : new Date(l.timestamp).toISOString(),
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Backend sync notice (offline mode active):", err);
    }
  };

  // Load from localStorage on client mount, then sync with backend DB
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim() !== "" && saved !== "undefined" && saved !== "null") {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (parsed.currentRole && GOVERNMENT_PERSONAS[parsed.currentRole as UserRole]) {
            setCurrentUser(GOVERNMENT_PERSONAS[parsed.currentRole as UserRole]);
          }
          if (Array.isArray(parsed.instruments)) setInstruments(parsed.instruments);
          if (Array.isArray(parsed.applications)) setApplications(parsed.applications);
          if (Array.isArray(parsed.verifications)) setVerifications(parsed.verifications);
          if (Array.isArray(parsed.certificates)) setCertificates(parsed.certificates);
          if (Array.isArray(parsed.complaints)) setComplaints(parsed.complaints);
          if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
          if (Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);
        }
      }
    } catch (e) {
      console.warn("Could not load from localStorage, clearing corrupted key:", e);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setIsLoaded(true);

    // Initial database synchronization
    refreshDatabase();
  }, []);

  // Supabase Realtime Channel Subscription & Auth State Listener
  useEffect(() => {
    // 1. Supabase Auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        if (meta.role) {
          const userObj: User = {
            id: session.user.id,
            email: session.user.email || "",
            role: meta.role as UserRole,
            name: meta.name || "Authorized User",
            designation: meta.designation || "Regulatory User",
            phone: meta.phone || "",
            organizationName: meta.organizationName,
            jurisdictionCircle: meta.jurisdictionCircle || "Delhi North District Circle",
            officerBadgeId: meta.officerBadgeId,
            avatarLetter: meta.avatarLetter || (meta.name ? meta.name[0].toUpperCase() : "U"),
          };
          setCurrentUser(userObj);
        }
      }
    });

    // 2. Realtime WebSocket Channel for Live Postgres Updates
    const channel = supabase
      .channel("metrica-realtime-database")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instruments" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newItem = mapSupabaseInstrument(payload.new);
            setInstruments((prev) => [newItem, ...prev.filter((i) => i.digitalInstrumentId !== newItem.digitalInstrumentId)]);
          } else if (payload.eventType === "UPDATE") {
            const updatedItem = mapSupabaseInstrument(payload.new);
            setInstruments((prev) =>
              prev.map((i) => (i.digitalInstrumentId === updatedItem.digitalInstrumentId || i.id === updatedItem.id ? updatedItem : i))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_applications" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newApp = mapSupabaseApplication(payload.new);
            setApplications((prev) => [newApp, ...prev.filter((a) => a.applicationNumber !== newApp.applicationNumber)]);
          } else if (payload.eventType === "UPDATE") {
            const updatedApp = mapSupabaseApplication(payload.new);
            setApplications((prev) =>
              prev.map((a) => (a.applicationNumber === updatedApp.applicationNumber || a.id === updatedApp.id ? updatedApp : a))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "complaints" },
        (payload: any) => {
          const newComplaint = mapSupabaseComplaint(payload.new);
          setComplaints((prev) => [newComplaint, ...prev.filter((c) => c.id !== newComplaint.id)]);
        }
      )
      .subscribe();

    return () => {
      authListener?.subscription?.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentRole: currentUser.role,
          instruments,
          applications,
          verifications,
          certificates,
          complaints,
          notifications,
          auditLogs,
        })
      );
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }, [isLoaded, currentUser, instruments, applications, verifications, certificates, complaints, notifications, auditLogs]);

  const loginAs = (role: UserRole) => {
    const user = GOVERNMENT_PERSONAS[role] || GOVERNMENT_PERSONAS.PUBLIC;
    setCurrentUser(user);
    logAudit("User", user.id, user.name, role, "LOGIN", `Signed in as ${user.designation}`);
  };

  const loginWithUser = (user: User) => {
    setCurrentUser(user);
    logAudit("User", user.id, user.name, user.role, "LOGIN", `Signed in as ${user.designation} (${user.name})`);
  };

  const registerUser = (userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: "usr-" + Date.now().toString(36),
    };
    setCurrentUser(newUser);
    logAudit("User", newUser.id, newUser.name, newUser.role, "REGISTER", `Self-registered as ${newUser.role} (${newUser.organizationName || newUser.name})`);
    return newUser;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout API notice:", e);
    }
    setCurrentUser(GOVERNMENT_PERSONAS.PUBLIC);
  };

  const setCurrentRole = (role: UserRole) => {
    loginAs(role);
  };

  const logAudit = (entityType: string, entityId: string, actorName: string, actorRole: UserRole, action: string, details: string) => {
    const newLog: AuditLog = {
      id: "LOG-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      entityType,
      entityId,
      actorName,
      actorRole,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const pushNotification = (notif: Omit<Notification, "id" | "read" | "createdAt">) => {
    const newNotification: Notification = {
      ...notif,
      id: "NOTIF-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Add Instrument (Birth / Registration)
  const addInstrument = (
    data: Omit<Instrument, "id" | "digitalInstrumentId" | "createdAt" | "riskScore" | "trustScore" | "priorityFlag">
  ): Instrument => {
    const generatedId = "ins-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const digitalId = `IND-MET-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newInst: Instrument = {
      ...data,
      id: generatedId,
      digitalInstrumentId: digitalId,
      riskScore: 10,
      trustScore: 90,
      priorityFlag: "LOW",
      createdAt: new Date().toISOString(),
    };

    setInstruments((prev) => [newInst, ...prev]);
    logAudit("Instrument", digitalId, currentUser.name, currentUser.role, "REGISTER_INSTRUMENT", `Registered new scale ${data.modelName} (SN: ${data.serialNumber})`);

    pushNotification({
      targetRole: "ADMIN",
      type: "STATUS_CHANGE",
      title: "New Instrument Registered",
      message: `${data.modelName} (Serial: ${data.serialNumber}) registered in ${data.jurisdictionCircle}.`,
      severity: "LOW",
    });

    // Asynchronous Database Save
    fetch("/api/instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serialNumber: data.serialNumber,
        modelName: data.modelName,
        category: data.category,
        accuracyClass: data.accuracyClass,
        nominalUnit: data.nominalUnit,
        maxCapacity: data.maxCapacity,
        minCapacity: data.minCapacity,
        verificationInterval: data.verificationInterval,
        manufacturerName: data.manufacturerName,
        ownerId: currentUser.id,
        ownerName: data.ownerName,
        ownerAddress: data.ownerAddress,
        pincode: data.pincode,
        jurisdictionCircle: data.jurisdictionCircle,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((dbInst) => {
        if (dbInst) {
          setInstruments((prev) =>
            prev.map((i) =>
              i.id === generatedId
                ? {
                    ...i,
                    id: dbInst.id,
                    digitalInstrumentId: dbInst.digitalInstrumentId,
                  }
                : i
            )
          );
        }
      })
      .catch((err) => console.warn("Instrument API sync notice:", err));

    // Push to Supabase Realtime Database (Postgres broadcast)
    try {
      supabase
        .from("instruments")
        .insert({
          digital_instrument_id: digitalId,
          serial_number: data.serialNumber,
          model_name: data.modelName,
          category: data.category,
          accuracy_class: data.accuracyClass,
          nominal_unit: data.nominalUnit,
          max_capacity: data.maxCapacity,
          min_capacity: data.minCapacity,
          verification_interval: data.verificationInterval,
          manufacturer_name: data.manufacturerName,
          owner_name: data.ownerName,
          owner_address: data.ownerAddress,
          pincode: data.pincode,
          jurisdiction_circle: data.jurisdictionCircle,
          status: data.status,
        })
        .then((res) => {
          if (res.error) console.warn("Supabase Realtime instrument notice:", res.error.message);
        });
    } catch (e) {
      console.warn("Supabase Realtime notice:", e);
    }

    return newInst;
  };

  // Claim Instrument (Manufacturer -> Owner)
  const claimInstrument = (
    serialNumber: string,
    ownerName: string,
    ownerAddress: string,
    pincode: string
  ): Instrument | null => {
    let updated: Instrument | null = null;
    setInstruments((prev) =>
      prev.map((inst) => {
        if (inst.serialNumber.trim().toUpperCase() === serialNumber.trim().toUpperCase()) {
          updated = {
            ...inst,
            ownerName,
            ownerAddress,
            pincode,
            status: "REGISTERED_PENDING_VERIFICATION",
          };
          return updated;
        }
        return inst;
      })
    );
    if (updated) {
      logAudit("Instrument", (updated as Instrument).digitalInstrumentId, currentUser.name, currentUser.role, "CLAIM_INSTRUMENT", `Claimed custody by ${ownerName}`);
    }
    return updated;
  };

  // Submit Verification Application
  const submitApplication = (data: {
    instrumentId: string;
    type: VerificationApplication["type"];
    applicantName: string;
    applicantPhone: string;
    readinessScore: number;
  }): VerificationApplication => {
    const inst = instruments.find((i) => i.id === data.instrumentId || i.digitalInstrumentId === data.instrumentId);
    const appNum = `APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newApp: VerificationApplication = {
      id: "app-" + Date.now(),
      applicationNumber: appNum,
      instrumentId: data.instrumentId,
      instrumentSerial: inst?.serialNumber || "UNKNOWN",
      instrumentCategory: inst?.category || "ELECTRONIC_COUNTER_SCALE",
      applicantName: data.applicantName,
      applicantPhone: data.applicantPhone,
      jurisdictionCircle: inst?.jurisdictionCircle || "North District Circle",
      type: data.type,
      status: "PAYMENT_COMPLETED_PENDING_ASSIGNMENT",
      readinessScore: data.readinessScore,
      statutoryFee: 250,
      penaltyFee: 0,
      paymentStatus: "PAID",
      createdAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    // Update instrument status
    setInstruments((prev) =>
      prev.map((i) =>
        i.id === data.instrumentId || i.digitalInstrumentId === data.instrumentId
          ? { ...i, status: "REGISTERED_PENDING_VERIFICATION" }
          : i
      )
    );

    logAudit("VerificationApplication", appNum, currentUser.name, currentUser.role, "SUBMIT_APPLICATION", `Submitted statutory verification application for ${inst?.digitalInstrumentId}`);

    pushNotification({
      targetRole: "ADMIN",
      type: "ASSIGNMENT",
      title: "New Verification Application",
      message: `Application ${appNum} submitted for ${inst?.digitalInstrumentId}. Ready for LMO dispatch.`,
      severity: "MEDIUM",
    });

    // Asynchronous Database Save
    fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instrumentId: data.instrumentId,
        applicantName: data.applicantName,
        applicantPhone: data.applicantPhone,
        type: data.type,
        readinessScore: data.readinessScore,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((dbApp) => {
        if (dbApp) {
          setApplications((prev) =>
            prev.map((a) =>
              a.id === newApp.id
                ? {
                    ...a,
                    id: dbApp.id,
                    applicationNumber: dbApp.applicationNumber,
                  }
                : a
            )
          );
        }
      })
      .catch((err) => console.warn("Application API sync notice:", err));

    // Push to Supabase Realtime Database (Postgres broadcast)
    try {
      supabase
        .from("verification_applications")
        .insert({
          application_number: appNum,
          instrument_serial: inst?.serialNumber || "UNKNOWN",
          applicant_name: data.applicantName,
          applicant_phone: data.applicantPhone,
          type: data.type,
          readiness_score: data.readinessScore,
          fee_amount: 150.0,
          payment_status: "PAID",
          status: "PENDING_ASSIGNMENT",
        })
        .then((res) => {
          if (res.error) console.warn("Supabase Realtime application notice:", res.error.message);
        });
    } catch (e) {
      console.warn("Supabase Realtime notice:", e);
    }

    return newApp;
  };

  // Pay Application Fee
  const payApplicationFee = (applicationId: string, paymentRef: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              paymentStatus: "PAID",
              paymentRefNumber: paymentRef,
              status: "PAYMENT_COMPLETED_PENDING_ASSIGNMENT",
            }
          : app
      )
    );

    fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        paymentStatus: "PAID",
      }),
    }).catch((err) => console.warn("Payment API sync notice:", err));
  };

  // Assign Officer
  const assignOfficer = (
    applicationId: string,
    officerId: string,
    officerName: string,
    date: string,
    slot: string
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              assignedOfficerId: officerId,
              assignedOfficerName: officerName,
              scheduledDate: date,
              scheduledSlot: slot,
              status: "SCHEDULED",
            }
          : app
      )
    );

    logAudit("VerificationApplication", applicationId, currentUser.name, currentUser.role, "ASSIGN_OFFICER", `Assigned ${officerName} for ${date} (${slot})`);

    pushNotification({
      targetRole: "LMO",
      type: "ASSIGNMENT",
      title: "New Case Assigned",
      message: `You have been assigned case ${applicationId} on ${date} (${slot}).`,
      severity: "HIGH",
    });

    fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        officerId,
        officerName,
        scheduledDate: date,
        scheduledSlot: slot,
      }),
    }).catch((err) => console.warn("Assign Officer API notice:", err));
  };

  // Submit Verification (LMO Field Tool)
  const submitVerification = (
    verificationData: Omit<Verification, "id" | "inspectionDate">
  ): { verification: Verification; certificate?: Certificate } => {
    const vId = "ver-" + Date.now();
    const newVerification: Verification = {
      ...verificationData,
      id: vId,
      inspectionDate: new Date().toISOString().split("T")[0],
    };

    setVerifications((prev) => [newVerification, ...prev]);

    let newCert: Certificate | undefined;

    if (verificationData.result === "PASS") {
      const inst = instruments.find((i) => i.id === verificationData.instrumentId || i.digitalInstrumentId === verificationData.instrumentId);
      const certId = "cert-" + Date.now();
      const certNumber = `CERT-DL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const issueDate = new Date();
      const validUntilDate = new Date();
      validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);

      newCert = {
        id: certId,
        certificateNumber: certNumber,
        instrumentId: verificationData.instrumentId,
        digitalInstrumentId: inst?.digitalInstrumentId || "UNKNOWN",
        issueDate: issueDate.toISOString().split("T")[0],
        validUntil: validUntilDate.toISOString().split("T")[0],
        status: "ACTIVE_VALID",
        physicalSealNumber: verificationData.appliedSealNumber || "SEAL-GOVT-001",
        digitalSignatureHash: "HMAC-SHA256-" + Math.random().toString(36).substring(2, 15).toUpperCase(),
        signedByOfficerName: verificationData.officerName,
        qrPayloadUrl: `/qr/${inst?.digitalInstrumentId || verificationData.instrumentId}`,
      };

      setCertificates((prev) => [newCert!, ...prev]);

      // Update instrument status to Verified
      setInstruments((prev) =>
        prev.map((i) =>
          i.id === verificationData.instrumentId || i.digitalInstrumentId === verificationData.instrumentId
            ? {
                ...i,
                status: "VERIFIED_ACTIVE",
                riskScore: 5,
                trustScore: 98,
                priorityFlag: "LOW",
                lastVerifiedAt: newCert!.issueDate,
                validUntil: newCert!.validUntil,
                currentSealNumber: newCert!.physicalSealNumber,
              }
            : i
        )
      );

      // Update application status
      setApplications((prev) =>
        prev.map((app) =>
          app.id === verificationData.applicationId || app.applicationNumber === verificationData.applicationId
            ? { ...app, status: "PASSED_CERTIFIED" }
            : app
        )
      );

      logAudit("Certificate", certNumber, currentUser.name, currentUser.role, "ISSUE_CERTIFICATE", `Verification PASSED. Legal stamp & cert issued for ${inst?.digitalInstrumentId}`);

      pushNotification({
        targetRole: "OWNER",
        type: "STATUS_CHANGE",
        title: "Certificate Issued",
        message: `Legal Metrology Certificate ${certNumber} issued for your scale. Valid until ${newCert.validUntil}.`,
        severity: "LOW",
      });
    } else {
      // Failed Verification
      setInstruments((prev) =>
        prev.map((i) =>
          i.id === verificationData.instrumentId || i.digitalInstrumentId === verificationData.instrumentId
            ? {
                ...i,
                status: "REJECTION_NOTICE_ISSUED",
                riskScore: 85,
                priorityFlag: "HIGH",
              }
            : i
        )
      );

      setApplications((prev) =>
        prev.map((app) =>
          app.id === verificationData.applicationId || app.applicationNumber === verificationData.applicationId
            ? { ...app, status: "REJECTION_NOTICE_ISSUED" }
            : app
        )
      );

      logAudit("Verification", vId, currentUser.name, currentUser.role, "VERIFICATION_FAILED", `Verification FAILED. Rejection notice Form-B issued.`);

      pushNotification({
        targetRole: "OWNER",
        type: "STATUS_CHANGE",
        title: "Verification Rejection Notice",
        message: `Scale failed statutory tolerance check. 15 days granted to repair and apply for re-inspection.`,
        severity: "HIGH",
      });
    }

    // Fire Asynchronous Database Verification Record
    fetch("/api/verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: verificationData.applicationId,
        instrumentId: verificationData.instrumentId,
        officerId: verificationData.officerId,
        officerName: verificationData.officerName,
        result: verificationData.result,
        appliedSealNumber: verificationData.appliedSealNumber,
        ocrSerialMatched: verificationData.ocrSerialMatched,
        mpeTolerancePassed: verificationData.mpeTolerancePassed,
        observations: verificationData.observations,
        summaryNotes: verificationData.summaryNotes,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.certificate) {
          setCertificates((prev) => [resData.certificate, ...prev.filter((c) => c.id !== newCert?.id)]);
        }
      })
      .catch((err) => console.warn("Verification API sync notice:", err));

    return { verification: newVerification, certificate: newCert };
  };

  // File Citizen / Consumer Complaint
  const fileComplaint = (
    complaintData: Omit<Complaint, "id" | "createdAt" | "status" | "impactOnRiskScore">
  ): Complaint => {
    const cId = "cmp-" + Date.now();
    const newComplaint: Complaint = {
      ...complaintData,
      id: cId,
      status: "LOGGED",
      impactOnRiskScore: 25,
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    // Increase risk score of the flagged instrument
    if (complaintData.digitalInstrumentId || complaintData.instrumentId) {
      setInstruments((prev) =>
        prev.map((inst) => {
          if (
            inst.digitalInstrumentId === complaintData.digitalInstrumentId ||
            inst.id === complaintData.instrumentId
          ) {
            const updatedRisk = Math.min(100, inst.riskScore + 30);
            return {
              ...inst,
              riskScore: updatedRisk,
              priorityFlag: updatedRisk >= 70 ? "CRITICAL" : "HIGH",
              status: "SUSPENDED_TAMPERED",
            };
          }
          return inst;
        })
      );
    }

    logAudit("Complaint", cId, "Citizen Reporter", "PUBLIC", "FILE_COMPLAINT", `Filed ${complaintData.complaintType} on instrument ${complaintData.digitalInstrumentId}`);

    pushNotification({
      targetRole: "ADMIN",
      type: "COMPLAINT_FILED",
      title: "Citizen Complaint Logged",
      message: `Report filed on ${complaintData.digitalInstrumentId}: ${complaintData.description.substring(0, 60)}...`,
      severity: "CRITICAL",
    });

    fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        digitalInstrumentId: complaintData.digitalInstrumentId,
        instrumentId: complaintData.instrumentId,
        complaintType: complaintData.complaintType,
        description: complaintData.description,
      }),
    }).catch((err) => console.warn("Complaint API sync notice:", err));

    // Push to Supabase Realtime Database (Postgres broadcast)
    try {
      supabase
        .from("complaints")
        .insert({
          complaint_number: "CMP-2026-" + Math.floor(1000 + Math.random() * 9000),
          digital_instrument_id: complaintData.digitalInstrumentId,
          category: complaintData.complaintType,
          description: complaintData.description,
          status: "LOGGED",
        })
        .then((res) => {
          if (res.error) console.warn("Supabase Realtime complaint notice:", res.error.message);
        });
    } catch (e) {
      console.warn("Supabase Realtime notice:", e);
    }

    return newComplaint;
  };

  // Update Complaint Status & Official Findings
  const updateComplaintStatus = (
    complaintId: string,
    status: Complaint["status"],
    resolutionNotes?: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status,
              resolutionNotes: resolutionNotes || c.resolutionNotes,
            }
          : c
      )
    );

    const cmp = complaints.find((c) => c.id === complaintId);
    if (cmp && (status === "RESOLVED" || status === "DISMISSED")) {
      // De-escalate risk score on target instrument
      setInstruments((prev) =>
        prev.map((inst) => {
          if (inst.digitalInstrumentId === cmp.digitalInstrumentId || inst.id === cmp.instrumentId) {
            const newRisk = Math.max(10, inst.riskScore - 25);
            return {
              ...inst,
              riskScore: newRisk,
              priorityFlag: newRisk >= 75 ? "CRITICAL" : newRisk >= 50 ? "HIGH" : "LOW",
              status: inst.status === "SUSPENDED_TAMPERED" && status === "RESOLVED" ? "VERIFIED_ACTIVE" : inst.status,
            };
          }
          return inst;
        })
      );
    }

    logAudit("Complaint", complaintId, currentUser.name, currentUser.role, "UPDATE_COMPLAINT", `Grievance status updated to ${status}. ${resolutionNotes || ""}`);

    pushNotification({
      targetRole: "ADMIN",
      type: "STATUS_CHANGE",
      title: "Grievance Status Updated",
      message: `Complaint ${complaintId} marked as ${status}.`,
      severity: "LOW",
    });
  };

  // Dispatch Emergency LMO Raid for Citizen Grievance
  const dispatchRaidForComplaint = (
    complaintId: string,
    officerId: string,
    officerName: string,
    date: string,
    slot: string,
    notes?: string
  ): VerificationApplication => {
    const cmp = complaints.find((c) => c.id === complaintId);
    const targetInst = instruments.find(
      (i) => i.id === cmp?.instrumentId || i.digitalInstrumentId === cmp?.digitalInstrumentId
    );

    const raidAppId = "app-raid-" + Date.now();
    const raidAppNum = "RAID-2026-" + Math.floor(1000 + Math.random() * 9000);

    const newRaidApp: VerificationApplication = {
      id: raidAppId,
      applicationNumber: raidAppNum,
      instrumentId: targetInst?.id || cmp?.instrumentId || "inst-target",
      instrumentSerial: targetInst?.serialNumber || "SURPRISE-RAID",
      instrumentCategory: targetInst?.category || "ELECTRONIC_COUNTER_SCALE",
      applicantName: targetInst?.ownerName || "Statutory Enforcement Target",
      applicantPhone: "+91 11 2338 0000",
      jurisdictionCircle: targetInst?.jurisdictionCircle || "Delhi North District Circle",
      type: "POST_REPAIR_VERIFICATION",
      status: "SCHEDULED",
      readinessScore: 100,
      statutoryFee: 0,
      penaltyFee: 5000,
      paymentStatus: "PAID",
      assignedOfficerId: officerId,
      assignedOfficerName: officerName,
      scheduledDate: date,
      scheduledSlot: slot,
      createdAt: new Date().toISOString(),
    };

    setApplications((prev) => [newRaidApp, ...prev]);

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status: "ACTION_TAKEN_RAID",
              investigationApplicationId: raidAppId,
              resolutionNotes: notes || `Surprise inspection dispatched under Section 25. Assigned to ${officerName}.`,
            }
          : c
      )
    );

    logAudit("Enforcement", raidAppNum, currentUser.name, currentUser.role, "DISPATCH_RAID", `Surprise raid dispatched on scale ${targetInst?.digitalInstrumentId || cmp?.digitalInstrumentId}. Officer: ${officerName}`);

    pushNotification({
      targetRole: "LMO",
      type: "ASSIGNMENT",
      title: "EMERGENCY: Enforcement Raid Dispatched",
      message: `Priority raid scheduled for ${targetInst?.digitalInstrumentId || "scale"} on ${date} (${slot}). Reason: Consumer Grievance.`,
      severity: "CRITICAL",
    });

    return newRaidApp;
  };

  // Update Instrument Priority Flag & Section 25 Stop-Use Status
  const updateInstrumentFlag = (
    instrumentId: string,
    flag: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    notes?: string,
    suspendTampered: boolean = false
  ) => {
    setInstruments((prev) =>
      prev.map((inst) => {
        if (inst.id === instrumentId || inst.digitalInstrumentId === instrumentId) {
          return {
            ...inst,
            priorityFlag: flag,
            status: suspendTampered
              ? "SUSPENDED_TAMPERED"
              : flag === "LOW" && inst.status === "SUSPENDED_TAMPERED"
              ? "VERIFIED_ACTIVE"
              : inst.status,
            riskScore: flag === "CRITICAL" ? 95 : flag === "HIGH" ? 75 : flag === "MEDIUM" ? 45 : 15,
          };
        }
        return inst;
      })
    );

    logAudit("Instrument", instrumentId, currentUser.name, currentUser.role, "UPDATE_FLAG", `Flag updated to ${flag}. Stop-use suspended: ${suspendTampered}. ${notes || ""}`);

    pushNotification({
      targetRole: "ADMIN",
      type: "STATUS_CHANGE",
      title: suspendTampered ? "Section 25 Stop-Use Notice Issued" : "Instrument Risk Flag Updated",
      message: `Instrument ${instrumentId} updated to ${flag} priority. ${notes || ""}`,
      severity: flag === "CRITICAL" ? "CRITICAL" : "MEDIUM",
    });
  };

  const clearAllData = () => {
    setInstruments([]);
    setApplications([]);
    setVerifications([]);
    setCertificates([]);
    setComplaints([]);
    setNotifications([]);
    setAuditLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <MetricaContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        setCurrentRole,
        loginAs,
        loginWithUser,
        registerUser,
        logout,
        refreshDatabase,
        instruments,
        applications,
        verifications,
        certificates,
        complaints,
        notifications,
        auditLogs,
        addInstrument,
        claimInstrument,
        submitApplication,
        payApplicationFee,
        assignOfficer,
        submitVerification,
        fileComplaint,
        updateComplaintStatus,
        dispatchRaidForComplaint,
        updateInstrumentFlag,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllData,
      }}
    >
      {children}
    </MetricaContext.Provider>
  );
}

export function useMetrica() {
  const context = useContext(MetricaContext);
  if (!context) {
    throw new Error("useMetrica must be used within a MetricaProvider");
  }
  return context;
}
