import { useState } from "react";

const settingsSections = ["Profile", "Workspace", "Team", "Security", "Notifications", "AI Preferences"];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200"
      style={{ background: on ? "#5B6FA8" : "#D4D1CB" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-all duration-200"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Profile");
  const [notifs, setNotifs] = useState({ email: true, weekly: true, agents: true, anomalies: true, reports: false });
  const [aiPrefs, setAiPrefs] = useState({ contextWindow: true, citations: true, proactive: false, tone: "professional" });

  return (
    <div className="sn-page-enter max-w-5xl">
      <div className="mb-6">
        <div className="sn-label mb-1">Account Settings</div>
        <h1 className="text-xl font-medium" style={{ color: "#1A1F3C" }}>Settings</h1>
      </div>

      <div className="flex gap-6">
        {/* Section nav */}
        <div className="hidden md:flex flex-col w-44 shrink-0">
          {settingsSections.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className="text-left px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-200"
              style={{
                background: activeSection === s ? "#F0EFF8" : "transparent",
                color: activeSection === s ? "#5B6FA8" : "#8C887F",
                fontWeight: activeSection === s ? 500 : 400,
              }}
              onMouseEnter={(e) => { if (activeSection !== s) e.currentTarget.style.background = "#F4F3F0"; }}
              onMouseLeave={(e) => { if (activeSection !== s) e.currentTarget.style.background = "transparent"; }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "Profile" && (
            <div className="flex flex-col gap-4">
              <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
                <div className="sn-label mb-4">Personal Information</div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold"
                    style={{ background: "#1A1F3C", color: "#F8F6F2" }}>JR</div>
                  <div>
                    <button className="text-sm font-medium transition-colors" style={{ color: "#6B7FBF" }}>Change avatar</button>
                    <p className="text-xs mt-0.5" style={{ color: "#8C887F" }}>PNG, JPG up to 4 MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[["First Name", "Jane"], ["Last Name", "Reeves"], ["Work Email", "jane@meridian.com"], ["Title", "Chief Technology Officer"]].map(([label, val]) => (
                    <div key={label}>
                      <label className="sn-label block mb-1.5">{label}</label>
                      <input defaultValue={val} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                        style={{ background: "#F4F3F0", border: "1.5px solid transparent", color: "#1A1F3C" }}
                        onFocus={(e) => { e.currentTarget.style.border = "1.5px solid #6B7FBF"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,127,191,0.08)"; }}
                        onBlur={(e) => { e.currentTarget.style.border = "1.5px solid transparent"; e.currentTarget.style.boxShadow = ""; }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: "#1A1F3C", color: "#F8F6F2" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#252B4A"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#1A1F3C"}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "Notifications" && (
            <div className="flex flex-col gap-4">
              <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
                <div className="sn-label mb-4">Notification Channels</div>
                <div className="flex flex-col gap-4">
                  {([["email", "Email notifications", "Receive updates at jane@meridian.com"],
                    ["weekly", "Weekly digest", "Summary of the week every Monday morning"],
                  ] as [keyof typeof notifs, string, string][]).map(([key, label, desc]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#F4F3F0" }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#8C887F" }}>{desc}</div>
                      </div>
                      <Toggle on={notifs[key] as boolean} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
                <div className="sn-label mb-4">Alert Types</div>
                <div className="flex flex-col gap-4">
                  {([["agents", "AI Agent completions", "When an agent finishes a task"],
                    ["anomalies", "Anomaly detections", "When Intelligence detects a business anomaly"],
                    ["reports", "Automated report delivery", "When a scheduled report is generated"],
                  ] as [keyof typeof notifs, string, string][]).map(([key, label, desc]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#F4F3F0" }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{label}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#8C887F" }}>{desc}</div>
                      </div>
                      <Toggle on={notifs[key] as boolean} onChange={(v) => setNotifs((n) => ({ ...n, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "AI Preferences" && (
            <div className="p-6 rounded-2xl" style={{ background: "#FAFAF8", border: "1px solid #E8E6E2" }}>
              <div className="sn-label mb-6">Intelligence Configuration</div>
              <div className="flex flex-col gap-5">
                {([["contextWindow", "Extended context window", "Include full conversation history for richer analysis"],
                  ["citations", "Always cite sources", "Show data source references in every response"],
                  ["proactive", "Proactive insights", "Surface relevant insights without being asked"],
                ] as [keyof typeof aiPrefs, string, string][]).map(([key, label, desc]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#F4F3F0" }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#8C887F" }}>{desc}</div>
                    </div>
                    <Toggle on={aiPrefs[key] as boolean} onChange={(v) => setAiPrefs((a) => ({ ...a, [key]: v }))} />
                  </div>
                ))}

                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: "#1A1F3C" }}>Response tone</div>
                  <div className="text-xs mb-3" style={{ color: "#8C887F" }}>How SOPRANOVA Intelligence communicates with you</div>
                  <div className="flex gap-2">
                    {["concise", "professional", "detailed"].map((tone) => (
                      <button key={tone} onClick={() => setAiPrefs((a) => ({ ...a, tone }))}
                        className="px-4 py-2 rounded-xl text-sm capitalize transition-all"
                        style={{ background: aiPrefs.tone === tone ? "#1A1F3C" : "#F4F3F0", color: aiPrefs.tone === tone ? "#F8F6F2" : "#6B6660" }}>
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
