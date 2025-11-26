import React, { useState, useEffect, useMemo } from "react";

export default function GreenQuestPrototypeComplete() {
  const ADMIN_PASSWORD = "greenquest-admin";

  const LOCATIONS = [
    { id: "kuta_beach", name: "Kuta Beach" },
    { id: "ubud_village", name: "Ubud Eco Village" },
    { id: "sanur_shore", name: "Sanur Shore" },
  ];

  const INITIAL_MISSIONS = [
    { id: "m1", location: "kuta_beach", title: "Bring a Reusable Tumbler", points: 10, description: "Show you brought a reusable tumbler instead of a single-use bottle." },
    { id: "m2", location: "kuta_beach", title: "Beach Micro Clean-up (10 items)", points: 25, description: "Collect at least 10 small pieces of litter and take a photo with the collected items." },
    { id: "m3", location: "ubud_village", title: "Buy from a Sustainable MSME", points: 15, description: "Purchase one item from a listed sustainable MSME and upload the receipt or photo." },
    { id: "m4", location: "sanur_shore", title: "Use Reusable Bag for Shopping", points: 8, description: "Demonstrate you've used a reusable bag at a local market." },
  ];

  const REWARDS = [
    { id: "r1", title: "Coffee Voucher (Local MSME)", cost: 20, description: "Rp20k voucher for partner coffee shop" },
    { id: "r2", title: "Eco Sticker Pack", cost: 5, description: "Set of recycled-material stickers" },
    { id: "r3", title: "Discount at Partner Cafe (10%)", cost: 15, description: "10% discount redeemable at partner cafes" },
  ];

  const [user, setUser] = useState(() => {
    try {
      const v = localStorage.getItem("gq_user");
      return v ? JSON.parse(v) : { name: "", email: "" };
    } catch (e) {
      return { name: "", email: "" };
    }
  });
  const [stage, setStage] = useState(() => localStorage.getItem("gq_stage") || "intro");
  const [selectedLocation, setSelectedLocation] = useState(() => localStorage.getItem("gq_location") || "");
  const [points, setPoints] = useState(() => { const v = localStorage.getItem("gq_points"); return v ? Number(v) : 0; });
  const [missions, setMissions] = useState(() => {
    try {
      const v = localStorage.getItem("gq_missions");
      return v ? JSON.parse(v) : INITIAL_MISSIONS;
    } catch (e) {
      return INITIAL_MISSIONS;
    }
  });

  const [submissions, setSubmissions] = useState(() => {
    try {
      const v = localStorage.getItem("gq_subs");
      return v ? JSON.parse(v) : {};
    } catch (e) {
      return {};
    }
  });
  const [redeems, setRedeems] = useState(() => {
    try {
      const v = localStorage.getItem("gq_redeems");
      return v ? JSON.parse(v) : [];
    } catch (e) {
      return [];
    }
  });

  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => Boolean(localStorage.getItem("gq_is_admin")));
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [notif, setNotif] = useState("");

  useEffect(() => {
    try { localStorage.setItem("gq_user", JSON.stringify(user)); } catch (e) {}
  }, [user]);
  useEffect(() => { try { localStorage.setItem("gq_stage", stage); } catch (e) {} }, [stage]);
  useEffect(() => { try { localStorage.setItem("gq_location", selectedLocation); } catch (e) {} }, [selectedLocation]);
  useEffect(() => { try { localStorage.setItem("gq_points", String(points)); } catch (e) {} }, [points]);
  useEffect(() => { try { localStorage.setItem("gq_missions", JSON.stringify(missions)); } catch (e) {} }, [missions]);
  useEffect(() => { try { localStorage.setItem("gq_subs", JSON.stringify(submissions)); } catch (e) {} }, [submissions]);
  useEffect(() => { try { localStorage.setItem("gq_redeems", JSON.stringify(redeems)); } catch (e) {} }, [redeems]);
  useEffect(() => { try { localStorage.setItem("gq_is_admin", isAdmin ? "1" : ""); } catch (e) {} }, [isAdmin]);

  function handleIntroSubmit(e) {
    e.preventDefault();
    if (!user.name || !user.email) return setNotif("Please enter name and email to continue.");
    setNotif("");
    setStage("selectLocation");
  }

  function handleSelectLocation(locId) {
    setSelectedLocation(locId);
    setStage("missions");
  }

  function dataURLFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileUpload(missionId, file) {
    if (!file) return;
    try {
      const url = await dataURLFromFile(file);
      const now = new Date().toISOString();
      const id = `sub_${missionId}_${now.replace(/[:.]/g, "-")}`;
      const mission = missions.find((m) => m.id === missionId);
      const sub = {
        id,
        missionId,
        userName: user.name,
        userEmail: user.email,
        fileUrl: url,
        timestamp: now,
        verified: null,
        pointsAwarded: 0,
        adminNote: "",
        missionPoints: mission ? mission.points : 0,
      };
      setSubmissions((s) => ({ ...s, [id]: sub }));
      setNotif("Submission uploaded and pending verification.");
    } catch (err) {
      setNotif("Failed to read file.");
    }
  }

  function openAdmin() { setAdminOpen(true); }

  function handleAdminLogin() {
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminOpen(false);
      setAdminPasswordInput("");
      setNotif("Admin logged in.");
    } else {
      setNotif("Wrong admin password.");
    }
  }

  function adminVerifySubmission(subId, accept = true, pointsOverride = null) {
    setSubmissions((s) => {
      const copy = { ...s };
      const item = copy[subId];
      if (!item) return s;
      const previouslyAccepted = item.verified === true;
      const pointsToAward = accept ? (pointsOverride !== null ? pointsOverride : item.missionPoints) : 0;
      item.verified = accept;
      item.pointsAwarded = accept ? pointsToAward : 0;
      item.adminNote = accept ? "Accepted by admin" : "Rejected by admin";
      if (accept && !previouslyAccepted) {
        setPoints((p) => p + pointsToAward);
      }
      if (!accept && previouslyAccepted) {
        setPoints((p) => Math.max(0, p - item.pointsAwarded));
      }
      return copy;
    });
  }

  function adminDeleteSubmission(subId) {
    setSubmissions((s) => {
      const copy = { ...s };
      const item = copy[subId];
      if (item && item.verified === true && item.pointsAwarded) {
        setPoints((p) => Math.max(0, p - item.pointsAwarded));
      }
      delete copy[subId];
      return copy;
    });
  }

  function handleRedeem(rewardId) {
    const reward = REWARDS.find((r) => r.id === rewardId);
    if (!reward) return setNotif("Reward not found.");
    if (points < reward.cost) return setNotif("Not enough points to redeem this reward.");
    setPoints((p) => p - reward.cost);
    const now = new Date().toISOString();
    const rec = { id: `redeem_${now.replace(/[:.]/g, "-")}`, rewardId: reward.id, title: reward.title, timestamp: now, userName: user.name, userEmail: user.email };
    setRedeems((r) => [...r, rec]);
    setNotif(`Redeemed: ${reward.title}. Show this confirmation at partner to claim.`);
  }

  function exportCSVFromArray(arr, filename = "export.csv") {
    if (!arr || arr.length === 0) return setNotif("No data to export.");
    const keys = Object.keys(arr[0]);
    const csvRows = [keys.join(",")].concat(arr.map((row) => keys.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(",")));
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function adminExportSubmissions() {
    const arr = Object.values(submissions).map((s) => ({ id: s.id, missionId: s.missionId, missionPoints: s.missionPoints, userName: s.userName, userEmail: s.userEmail, timestamp: s.timestamp, verified: s.verified, pointsAwarded: s.pointsAwarded, adminNote: s.adminNote }));
    exportCSVFromArray(arr, "greenquest_submissions.csv");
  }

  function adminExportRedeems() {
    const arr = redeems.map((item) => ({ id: item.id, rewardId: item.rewardId, title: item.title, timestamp: item.timestamp, userName: item.userName, userEmail: item.userEmail }));
    exportCSVFromArray(arr, "greenquest_redeems.csv");
  }

  function resetAll() {
    if (!confirm("Reset all data? This will clear progress and all submissions.")) return;
    try { localStorage.removeItem("gq_user"); localStorage.removeItem("gq_stage"); localStorage.removeItem("gq_location"); localStorage.removeItem("gq_points"); localStorage.removeItem("gq_missions"); localStorage.removeItem("gq_subs"); localStorage.removeItem("gq_redeems"); localStorage.removeItem("gq_is_admin"); } catch (e) {}
    window.location.reload();
  }

  const visibleMissions = useMemo(() => missions.filter((m) => m.location === selectedLocation), [missions, selectedLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-700">GreenQuest Bali — Prototype (Complete)</h1>
            <p className="text-sm text-gray-600">Gamified eco-behavior platform — QR-based, admin verification & CSV export</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Points</div>
            <div className="text-xl font-semibold text-emerald-600">{points}</div>
          </div>
        </header>

        {notif && (
          <div className="mb-4 p-3 rounded-md bg-emerald-100 text-emerald-800">{notif} <button onClick={() => setNotif("")} className="ml-3 text-sm underline">dismiss</button></div>
        )}

        {stage === "intro" && (
          <form onSubmit={handleIntroSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-sm text-gray-700">Full name</div>
                <input className="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} placeholder="e.g. Putu Sari" />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">Email</div>
                <input className="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} placeholder="e.g. you@example.com" />
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md">Start Quest</button>
              <button type="button" onClick={() => setStage("selectLocation")} className="px-4 py-2 bg-gray-200 rounded-md">Skip (Demo)</button>
              <button type="button" onClick={resetAll} className="ml-auto text-sm text-red-600">Reset demo</button>
            </div>

            <div className="pt-4 text-sm text-gray-500">For admin tools, open the Admin panel button at top-right.</div>
          </form>
        )}

        {stage === "selectLocation" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Choose a tourism location</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOCATIONS.map((loc) => (
                <button key={loc.id} onClick={() => handleSelectLocation(loc.id)} className="p-4 border rounded-lg hover:shadow-sm text-left">
                  <div className="font-semibold">{loc.name}</div>
                  <div className="text-sm text-gray-500">Tap to view missions</div>
                </button>
              ))}
            </div>
            <div className="pt-4">
              <button onClick={() => setStage("intro")} className="px-3 py-2 rounded-md bg-gray-100">Back</button>
            </div>
          </div>
        )}

        {stage === "missions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Missions — {LOCATIONS.find((l) => l.id === selectedLocation)?.name}</h2>
                <p className="text-sm text-gray-500">Complete green missions and upload proof. Submissions will be verified by an admin.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStage("selectLocation")} className="px-3 py-2 rounded-md bg-gray-100">Change Location</button>
                <button onClick={() => setStage("rewards")} className="px-3 py-2 rounded-md bg-emerald-50">Go to Rewards</button>
                <button onClick={openAdmin} className="px-3 py-2 rounded-md bg-emerald-600 text-white">Admin</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleMissions.length === 0 && <div className="text-gray-500">No missions available at this location.</div>}
              {visibleMissions.map((m) => (
                <div key={m.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-sm text-gray-500">{m.description}</div>
                    </div>
                    <div className="text-emerald-600 font-semibold">+{m.points} pts</div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2">
                      <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; handleFileUpload(m.id, file); }} className="hidden" />
                      <span className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm">Upload Proof</span>
                    </label>

                    <div className="text-sm text-gray-500">
                      {Object.values(submissions).filter((s) => s.missionId === m.id && s.userEmail === user.email).length > 0 ? (
                        <span>Submitted • Pending verification</span>
                      ) : (
                        <span>Not submitted yet</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button onClick={() => setStage("selectLocation")} className="px-3 py-2 rounded-md bg-gray-100">Back</button>
            </div>
          </div>
        )}

        {stage === "rewards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Exchange Rewards</h2>
                <p className="text-sm text-gray-500">Spend your points to claim rewards at partner MSMEs.</p>
              </div>
              <div className="text-sm text-gray-500">Current points: <span className="font-semibold text-emerald-600">{points}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {REWARDS.map((r) => (
                <div key={r.id} className="p-4 border rounded-lg">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-gray-500">{r.description}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-emerald-600 font-semibold">{r.cost} pts</div>
                    <button onClick={() => handleRedeem(r.id)} className="px-3 py-1 rounded-md bg-emerald-600 text-white text-sm">Redeem</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex gap-3">
              <button onClick={() => setStage("missions")} className="px-3 py-2 rounded-md bg-gray-100">Back to Missions</button>
              <button onClick={() => setStage("selectLocation")} className="px-3 py-2 rounded-md bg-white border">Choose another Location</button>
            </div>
          </div>
        )}

        {adminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Admin Login</h3>
              <div className="grid grid-cols-1 gap-3">
                <input type="password" className="p-2 border rounded" placeholder="Enter admin password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAdminOpen(false)} className="px-3 py-2 rounded bg-gray-100">Cancel</button>
                  <button onClick={handleAdminLogin} className="px-3 py-2 rounded bg-emerald-600 text-white">Login</button>
                </div>
                <div className="text-sm text-gray-500">Admin password is for demo only. Use it to verify submissions during pitch.</div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Admin Panel</h3>
              <div className="flex gap-2">
                <button onClick={adminExportSubmissions} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Export Submissions CSV</button>
                <button onClick={adminExportRedeems} className="px-3 py-1 rounded bg-emerald-50 text-emerald-600 text-sm">Export Redeems CSV</button>
                <button onClick={() => { setIsAdmin(false); setNotif('Admin logged out'); }} className="px-3 py-1 rounded bg-red-100 text-red-600 text-sm">Logout Admin</button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Pending Submissions</h4>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-sm text-gray-600">
                        <th className="p-2">#</th>
                        <th className="p-2">Mission</th>
                        <th className="p-2">User</th>
                        <th className="p-2">Time</th>
                        <th className="p-2">Preview</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(submissions).length === 0 && (
                        <tr><td className="p-2" colSpan={6}>No submissions yet.</td></tr>
                      )}
                      {Object.values(submissions).map((s, idx) => (
                        <tr key={s.id} className="text-sm border-t">
                          <td className="p-2 align-top">{idx + 1}</td>
                          <td className="p-2 align-top">{missions.find((m) => m.id === s.missionId)?.title || s.missionId} <div className="text-xs text-gray-500">Points: {s.missionPoints}</div></td>
                          <td className="p-2 align-top">{s.userName}<br/><span className="text-xs text-gray-500">{s.userEmail}</span></td>
                          <td className="p-2 align-top">{new Date(s.timestamp).toLocaleString()}</td>
                          <td className="p-2 align-top">
                            <img src={s.fileUrl} alt="preview" style={{ maxWidth: 120, borderRadius: 8 }} />
                          </td>
                          <td className="p-2 align-top">
                            <div className="flex flex-col gap-2">
                              {s.verified === null ? (
                                <>
                                  <button onClick={() => adminVerifySubmission(s.id, true)} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Accept (full pts)</button>
                                  <button onClick={() => adminVerifySubmission(s.id, false)} className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs">Reject</button>
                                </>
                              ) : (
                                <div className="text-xs">Status: {s.verified ? "Accepted" : "Rejected"} • Pts: {s.pointsAwarded}</div>
                              )}
                              <button onClick={() => adminDeleteSubmission(s.id)} className="px-2 py-1 rounded bg-gray-100 text-xs">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Redeem Records</h4>
                <div className="mt-2 text-sm text-gray-700">
                  {redeems.length === 0 ? (
                    <div>No redeems yet.</div>
                  ) : (
                    <ul className="list-disc ml-5">
                      {redeems.map((r) => (
                        <li key={r.id}>{r.title} — {new Date(r.timestamp).toLocaleString()} — {r.userName} ({r.userEmail})</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        <footer className="mt-6 text-xs text-gray-500">
          <div>Prototype — client-side demo. All data stored in browser localStorage for offline pitching.</div>
          <div className="mt-2">Suggested next steps: connect to a backend, secure admin, and use a hosted storage for images.</div>
        </footer>
      </div>
    </div>
  );
}
