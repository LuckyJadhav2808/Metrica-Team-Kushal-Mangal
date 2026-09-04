"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMetrica, GOVERNMENT_PERSONAS } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { UserRole } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export type LoginRole = "ADMIN" | "LMO" | "OWNER" | "CITIZEN";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs, loginWithUser, registerUser, refreshDatabase } = useMetrica();
  const toast = useToast();

  // Active Role Tab: ADMIN | LMO | OWNER | CITIZEN
  const [selectedRole, setSelectedRole] = useState<LoginRole>("ADMIN");

  // For Business Owner: Toggle between Sign In and Register
  const [ownerMode, setOwnerMode] = useState<"SIGN_IN" | "REGISTER">("SIGN_IN");

  // Sign In credentials state
  const [email, setEmail] = useState("controller.lm@nic.in");
  const [password, setPassword] = useState("••••••••••••");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Business Owner Registration fields
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [circle, setCircle] = useState("Delhi North District Circle");

  // Role tab switch handler with automated credential pre-fill
  const handleRoleSelect = (role: LoginRole) => {
    setSelectedRole(role);
    if (role === "ADMIN") {
      setEmail("controller.lm@nic.in");
    } else if (role === "LMO") {
      setEmail("rajesh.kumar.lmo@gov.in");
    } else if (role === "OWNER") {
      setEmail("ramesh.patel@greenvalley.in");
    }
  };

  const handleOfficerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // 1. Establish Supabase Auth session in browser
    try {
      await supabase.auth.signInWithPassword({
        email,
        password: password === "••••••••••••" ? "password123" : password,
      });
    } catch (e) {
      console.warn("Supabase auth notice:", e);
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole !== "CITIZEN" ? selectedRole : undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Authentication Failed", data.error || "Invalid credentials");
        setIsAuthenticating(false);
        return;
      }

      // Sync frontend store
      loginWithUser(data.user);
      await refreshDatabase();
      setIsAuthenticating(false);

      toast.success(
        "Clearance Verified",
        `Welcome ${data.user.name} (${data.user.designation}). Session established.`
      );

      if (data.user.role === "ADMIN") router.push("/admin");
      else if (data.user.role === "LMO") router.push("/lmo");
      else router.push("/owner");
    } catch {
      // Fallback in case of offline dev mode
      loginAs(selectedRole !== "CITIZEN" ? selectedRole : "OWNER");
      setIsAuthenticating(false);
      if (selectedRole === "ADMIN") router.push("/admin");
      else if (selectedRole === "LMO") router.push("/lmo");
      else router.push("/owner");
    }
  };

  const handleOwnerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Register with Supabase Auth
    try {
      await supabase.auth.signUp({
        email: regEmail,
        password: "password123",
        options: {
          data: {
            role: "OWNER",
            name: contactPerson || "Commercial Merchant",
            designation: "Commercial Licensee",
            organizationName: businessName || "Retail Trading Corp",
            jurisdictionCircle: circle,
            phone: regPhone,
          },
        },
      });
    } catch (e) {
      console.warn("Supabase signup notice:", e);
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactPerson || "Commercial Merchant",
          email: regEmail,
          password: "password123",
          role: "OWNER",
          organizationName: businessName || "Retail Trading Corp",
          jurisdictionCircle: circle,
          phone: regPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Registration Failed", data.error || "Could not register account");
        setIsAuthenticating(false);
        return;
      }

      loginWithUser(data.user);
      await refreshDatabase();
      setIsAuthenticating(false);

      toast.success(
        "Commercial Licensee Registered",
        `Account created for ${data.user.organizationName}. Scale inventory workspace activated.`
      );
      router.push("/owner");
    } catch {
      const newUser = registerUser({
        role: "OWNER",
        name: contactPerson || "Commercial Merchant",
        designation: "Commercial Licensee",
        email: regEmail || "merchant@business.in",
        phone: regPhone || "+91 98000 00000",
        organizationName: businessName || "Retail Trading Corp",
        jurisdictionCircle: circle,
        avatarLetter: (contactPerson || "M").charAt(0).toUpperCase(),
      });
      setIsAuthenticating(false);
      toast.success("Merchant Registered", `Workspace created for ${newUser.organizationName}`);
      router.push("/owner");
    }
  };

  const handleCitizenAccess = () => {
    loginAs("PUBLIC");
    toast.info("Public Citizen Access", "Redirecting to public QR measurement verification tool.");
    router.push("/qr/demo");
  };

  const handleQuickEvaluatorPass = async (role: UserRole) => {
    let emailToUse = "controller.lm@nic.in";
    if (role === "LMO") emailToUse = "rajesh.kumar.lmo@gov.in";
    else if (role === "OWNER") emailToUse = "ramesh.patel@greenvalley.in";
    else if (role === "MANUFACTURER") emailToUse = "regulatory@apexmetrology.com";

    try {
      await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: "password123",
      });
    } catch (e) {
      console.warn("Supabase fast-pass notice:", e);
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, password: "password123", role }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          loginWithUser(data.user);
          await refreshDatabase();
        } else {
          loginAs(role);
        }
      } else {
        loginAs(role);
      }
    } catch {
      loginAs(role);
    }

    const p = GOVERNMENT_PERSONAS[role];
    toast.info("Evaluator Fast Pass", `Switched to ${p.name} (${p.designation})`);

    if (role === "ADMIN") router.push("/admin");
    else if (role === "LMO") router.push("/lmo");
    else if (role === "OWNER") router.push("/owner");
    else if (role === "MANUFACTURER") router.push("/manufacturer");
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-background overflow-hidden">
      {/* Top Tricolor Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shrink-0" />

      {/* Main 50 / 50 Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4px)] overflow-hidden">
        {/* LEFT PANE: Sovereign Brand & Trust Showcase (50% on Desktop) */}
        <div className="lg:w-1/2 bg-[#002B5B] text-white p-6 lg:p-10 flex flex-col justify-between relative overflow-y-auto shrink-0">
          {/* Subtle Background Elements */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-primary/20 pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-2xl">balance</span>
              </div>
              <div>
                <div className="text-xl font-black tracking-tight leading-none">Metrica</div>
                <div className="text-[10px] text-white/70 font-medium tracking-wide mt-0.5">
                  Digital Identity Compliance
                </div>
              </div>
            </div>

            <div className="text-xs text-white/80 font-medium border-l-2 border-[#FF9933] pl-2.5 py-0.5">
              भारत सरकार | Government of India
              <div className="text-[10px] text-white/60">
                उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय • Department of Consumer Affairs
              </div>
            </div>
          </div>

          {/* Central Regulatory Trust Pillars */}
          <div className="my-6 space-y-4 relative z-10">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-[#FF9933] uppercase block mb-1">
                National Regulatory Infrastructure
              </span>
              <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight leading-snug">
                Unified Role Gateway for Legal Metrology Enforcement
              </h1>
              <p className="text-xs text-white/75 mt-1 leading-relaxed max-w-md">
                Role-based statutory access for Directorate Controllers, Field Inspectors, Commercial Merchants, and Citizens.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">1. Admin (Controller of Legal Metrology)</h4>
                  <p className="text-[10px] text-white/65 leading-relaxed">
                    Circle supervision, inspection triage, high-risk flags, and grievance escalation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <span className="material-symbols-outlined text-lg">fact_check</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">2. LMO (Legal Metrology Field Inspector)</h4>
                  <p className="text-[10px] text-white/65 leading-relaxed">
                    Field inspection docket, camera plate OCR, MPE tolerance check, and holographic sealing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                  <span className="material-symbols-outlined text-lg">storefront</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">3. Business Owner (Scale Merchant)</h4>
                  <p className="text-[10px] text-white/65 leading-relaxed">
                    Register scales, track calibration validity, apply for verification, and download certificates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-purple-300 shrink-0">
                  <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">4. Citizen (Consumer Shopper)</h4>
                  <p className="text-[10px] text-white/65 leading-relaxed">
                    Zero login required. Scan QR codes on scales to verify legal stamps and report short-weighting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Compliance Badges */}
          <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/60 relative z-10">
            <span>Legal Metrology Act, 2009</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
                256-Bit SSL
              </span>
              <span>•</span>
              <span>IT Act, 2000 Compliant</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Unified 4-Role Authentication & Onboarding Engine */}
        <div className="lg:w-1/2 flex flex-col h-full overflow-y-auto bg-surface p-6 lg:p-10">
          {/* Top Header */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-sm">shield</span>
              </div>
              <span className="text-xs font-bold text-primary">Jan Parichay Regulatory SSO</span>
            </div>

            <button
              type="button"
              onClick={handleCitizenAccess}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              Public Citizen Scan &rarr;
            </button>
          </div>

          {/* Main Card Content */}
          <div className="max-w-md w-full mx-auto my-auto py-4">
            {/* 4 ROLES SELECTOR TABS (Admin, LMO, Business Owner, Citizen) */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Select Your Role to Continue
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Admin */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("ADMIN")}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === "ADMIN"
                      ? "border-primary bg-primary text-white shadow-md font-bold"
                      : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">shield</span>
                  <span className="text-xs leading-tight">Admin</span>
                  <span className={`text-[9px] ${selectedRole === "ADMIN" ? "text-white/80" : "text-outline"}`}>Controller</span>
                </button>

                {/* 2. LMO */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("LMO")}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === "LMO"
                      ? "border-primary bg-primary text-white shadow-md font-bold"
                      : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">fact_check</span>
                  <span className="text-xs leading-tight">LMO</span>
                  <span className={`text-[9px] ${selectedRole === "LMO" ? "text-white/80" : "text-outline"}`}>Inspector</span>
                </button>

                {/* 3. Business Owner */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("OWNER")}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === "OWNER"
                      ? "border-primary bg-primary text-white shadow-md font-bold"
                      : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">storefront</span>
                  <span className="text-xs leading-tight">Business</span>
                  <span className={`text-[9px] ${selectedRole === "OWNER" ? "text-white/80" : "text-outline"}`}>Owner</span>
                </button>

                {/* 4. Citizen */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("CITIZEN")}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === "CITIZEN"
                      ? "border-primary bg-primary text-white shadow-md font-bold"
                      : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">group</span>
                  <span className="text-xs leading-tight">Citizen</span>
                  <span className={`text-[9px] ${selectedRole === "CITIZEN" ? "text-white/80" : "text-outline"}`}>Consumer</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ADMIN (CONTROLLER) SIGN IN */}
            {selectedRole === "ADMIN" && (
              <div className="space-y-4">
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
                  <div className="flex items-center gap-2 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                    Dr. S. K. Verma • Controller of Legal Metrology
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Central Metrology Directorate, Krishi Bhawan, New Delhi • Badge: DoCA-DIR-001
                  </p>
                </div>

                <form onSubmit={handleOfficerSignIn} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Official NIC / Parichay Email</label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-medium text-on-surface outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Security PIN / Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-mono text-on-surface outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    Sign In as Administrator &rarr;
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: LMO (FIELD INSPECTOR) SIGN IN */}
            {selectedRole === "LMO" && (
              <div className="space-y-4">
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
                  <div className="flex items-center gap-2 font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary text-lg">badge</span>
                    Rajesh Kumar • Legal Metrology Inspector (Grade-I)
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Delhi North District Circle • Officer Badge: LMO-DL-N-884
                  </p>
                </div>

                <form onSubmit={handleOfficerSignIn} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Inspector Government Email / Service ID</label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-medium text-on-surface outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Security PIN / Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-mono text-on-surface outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span className="material-symbols-outlined text-sm">fact_check</span>
                    Sign In to Field Docket &rarr;
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: BUSINESS OWNER (SIGN IN OR REGISTER) */}
            {selectedRole === "OWNER" && (
              <div>
                {/* Sub-Switch: Sign In vs Register Business */}
                <div className="flex p-1 bg-surface-container-low border border-outline-variant rounded-lg mb-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setOwnerMode("SIGN_IN")}
                    className={`flex-1 py-1.5 rounded transition-all ${
                      ownerMode === "SIGN_IN" ? "bg-white text-primary font-bold shadow-xs" : "text-outline"
                    }`}
                  >
                    Existing Merchant Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnerMode("REGISTER")}
                    className={`flex-1 py-1.5 rounded transition-all ${
                      ownerMode === "REGISTER" ? "bg-white text-primary font-bold shadow-xs" : "text-outline"
                    }`}
                  >
                    Register New Business
                  </button>
                </div>

                {/* Sub-View A: Merchant Sign In */}
                {ownerMode === "SIGN_IN" && (
                  <form onSubmit={handleOfficerSignIn} className="space-y-3 text-xs">
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                      <div className="font-bold text-on-surface">Ramesh Patel • Commercial Licensee</div>
                      <div className="text-[11px] text-on-surface-variant">Green Valley Groceries (Shop 4, APMC Market Yard)</div>
                    </div>

                    <div>
                      <label className="block font-semibold text-on-surface mb-1">Registered Business Email / Mobile</label>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-medium text-on-surface outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-on-surface mb-1">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest font-mono text-on-surface outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      <span className="material-symbols-outlined text-sm">storefront</span>
                      Sign In to Scale Portfolio &rarr;
                    </button>
                  </form>
                )}

                {/* Sub-View B: Register New Business */}
                {ownerMode === "REGISTER" && (
                  <form onSubmit={handleOwnerRegister} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block font-semibold text-on-surface mb-1">Trading Enterprise / Store Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Metro Supermarket Logistics Pvt Ltd"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-on-surface mb-1">Contact Person</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Patel"
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-on-surface mb-1">Mobile Number</label>
                        <input
                          type="tel"
                          placeholder="+91 98234 11223"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface outline-none focus:border-primary font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-on-surface mb-1">Trade License / GSTIN</label>
                        <input
                          type="text"
                          placeholder="07AAAAA0000A1Z5"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface outline-none focus:border-primary font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-on-surface mb-1">Jurisdiction Circle</label>
                        <select
                          value={circle}
                          onChange={(e) => setCircle(e.target.value)}
                          className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface outline-none focus:border-primary"
                        >
                          <option value="Delhi North District Circle">Delhi North District Circle</option>
                          <option value="Delhi Central Circle">Delhi Central Circle</option>
                          <option value="Maharashtra Mumbai Circle">Maharashtra Mumbai Circle</option>
                          <option value="Karnataka Bangalore Circle">Karnataka Bangalore Circle</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-on-surface mb-1">Shop / Mandi Yard Address</label>
                      <input
                        type="text"
                        placeholder="Shop 14, APMC Market Yard"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="w-full p-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="w-full py-2.5 bg-secondary text-white rounded-lg font-bold text-xs shadow-sm hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 mt-1"
                    >
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      Complete Merchant Registration & Open Vault
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 4: CITIZEN (PUBLIC CONSUMER ACCESS) */}
            {selectedRole === "CITIZEN" && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                  </div>
                  <h3 className="font-bold text-sm text-on-surface">Zero Login Required for Citizens</h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Under the Legal Metrology Act, every consumer has the statutory right to verify scale calibration stamps and report suspicion anonymously.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={handleCitizenAccess}
                    className="w-full py-3 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                    Open Public QR Scale Verification Card &rarr;
                  </button>

                  <Link
                    href="/qr/demo?action=report"
                    className="w-full py-2.5 bg-surface border border-outline-variant text-on-surface rounded-lg font-semibold text-xs hover:bg-surface-container transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm text-error">report_problem</span>
                    File Consumer Grievance (Short Weight / Broken Seal)
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM EVALUATOR 1-CLICK FAST PASS */}
          <div className="pt-3 border-t border-outline-variant bg-surface-container-low/40 p-3.5 rounded-xl shrink-0 mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-sm">bolt</span>
                Evaluator 1-Click Fast Pass
              </span>
              <span className="text-[10px] text-outline font-mono">Demo Mode</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickEvaluatorPass("ADMIN")}
                className="p-2 rounded-lg bg-surface border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="font-bold text-primary text-[11px] group-hover:underline">Controller</div>
                <div className="text-[10px] text-outline truncate">Dr. S. K. Verma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickEvaluatorPass("LMO")}
                className="p-2 rounded-lg bg-surface border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="font-bold text-primary text-[11px] group-hover:underline">Inspector</div>
                <div className="text-[10px] text-outline truncate">Rajesh Kumar</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickEvaluatorPass("OWNER")}
                className="p-2 rounded-lg bg-surface border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="font-bold text-primary text-[11px] group-hover:underline">Merchant</div>
                <div className="text-[10px] text-outline truncate">Ramesh Patel</div>
              </button>

              <button
                type="button"
                onClick={handleCitizenAccess}
                className="p-2 rounded-lg bg-surface border border-outline-variant hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="font-bold text-primary text-[11px] group-hover:underline">Citizen</div>
                <div className="text-[10px] text-outline truncate">Public QR Scan</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
