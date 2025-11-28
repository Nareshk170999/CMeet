import React, { useEffect, useMemo, useState } from "react";
import { VideoIcon, MicIcon } from "./Icons";

const LOGO_SRC = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 64'%3E%3Crect width='220' height='64' rx='16' fill='%23101612'/%3E%3Cpath d='M38.4 16.5C27 16.5 18 24.8 18 35.6c0 10.9 9 19.2 20.4 19.2 8.8 0 14.9-4 18.8-10.2l-8.8-5c-1.8 3.2-4.6 5-8 5-5.8 0-9.9-4.5-9.9-9s4-8.9 9.9-8.9c3.3 0 6.1 1.6 7.9 4.6l8.8-5C53 20.2 46.8 16.5 38.4 16.5Z' fill='%2349c273'/%3E%3Cpath d='M141.6 54.8c11.4 0 20.4-8.3 20.4-19.2 0-10.8-9-19.1-20.4-19.1-8.4 0-14.6 3.7-18.9 9.8l8.8 5c1.8-3 4.7-4.6 8-4.6 5.8 0 9.9 4.4 9.9 8.9 0 4.5-4.1 9-9.9 9-3.4 0-6.2-1.8-8-5l-8.8 5c4 6.2 10 10.2 18.9 10.2Z' fill='%2349c273'/%3E%3Crect x='91' y='17' width='14' height='30' rx='7' fill='%2322a35a'/%3E%3Crect x='104.5' y='24' width='14' height='30' rx='7' transform='rotate(-38 104.5 24)' fill='%231d8d4e'/%3E%3Ctext x='64' y='44' font-family='Arial,sans-serif' font-size='20' fill='%23e4f3e7' font-weight='600'>CMeet%3C/text%3E%3C/svg%3E`;

interface JoinScreenProps {
  onJoin: (name: string, confId: string) => void;
}

const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [name, setName] = useState("");
  const [confId, setConfId] = useState("");
  const [inviteeName, setInviteeName] = useState("Guest");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"agent" | "customer" | "guest">("agent");
  const [shareBase, setShareBase] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);

    const looseParams = new Map<string, string>();
    const ingest = (raw: string) => {
      raw
        .replace(/\?/g, "&")
        .split("&")
        .forEach((pair) => {
          const [k, v] = pair.split("=");
          if (k && v) {
            looseParams.set(k.toLowerCase(), decodeURIComponent(v));
          }
        });
    };

    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    pathSegments
      .filter((segment) => segment.includes("="))
      .forEach((segment) => ingest(segment));

    queryParams.forEach((value, key) => {
      looseParams.set(key.toLowerCase(), value);
    });

    const agentName =
      looseParams.get("agent") || looseParams.get("advisor") || "";
    const customerName = looseParams.get("customer") || looseParams.get("user");
    const roomParam =
      looseParams.get("conferenceid") || looseParams.get("conferenceId");

    if (roomParam) {
      setConfId(roomParam);
    }

    if (customerName) {
      setName(customerName);
      setRole("customer");
    } else if (agentName) {
      setName(agentName);
      setRole("agent");
    }

    if (customerName) {
      setInviteeName(customerName);
    }

    const baseSegments = pathSegments.filter((segment) => !segment.includes("="));
    const basePath = baseSegments.length ? `/${baseSegments.join("/")}` : "/CMeet";
    setShareBase(`${window.location.origin}${basePath}`);
  }, []);

  const agentLabel = useMemo(() => (role === "customer" ? "Agent" : "Your"), [role]);

  const copyLink = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && confId) {
      setIsLoading(true);
      onJoin(name.trim(), confId.trim());
    }
  };

  const normalizedConf = confId || "CX-12345";
  const encodedConf = encodeURIComponent(normalizedConf);
  const encodedAgent = encodeURIComponent(name || "Agent");
  const encodedCustomer = encodeURIComponent(inviteeName || "Guest");
  const safeBase =
    shareBase || (typeof window !== "undefined" ? window.location.origin : "");

  const agentInvite = `${safeBase}/agent=${encodedAgent}?conferenceID=${encodedConf}`;
  const customerInvite = `${safeBase}/customer=${encodedCustomer}?agent=${encodedAgent}?conferenceID=${encodedConf}`;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gradient-to-br from-[#0f1512] via-[#101c16] to-[#0b1110] text-white overflow-hidden">
      {/* Left: logo + form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-14 relative z-10">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <img
              src={LOGO_SRC}
              alt="Cognicx Meet"
              className="h-16 md:h-18 object-contain"
            />
            <div>
              <p className="uppercase tracking-[0.3em] text-sm text-[#66d39d] font-semibold">
                Cognicx Meet
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-[#e4f3e7]">
                Join your secure CMeet room
              </h1>
              <p className="text-sm text-[#9fcfb5] mt-1">
                Built for quick agent-customer handoffs with smart invite links.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-[#111b16]/60 border border-[#1e2c26] rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0f1512] rounded-xl p-4 border border-[#1f2c25] shadow-inner">
                <p className="text-xs uppercase tracking-[0.2em] text-[#66d39d] font-semibold mb-2">
                  Presence
                </p>
                <div className="flex items-center gap-3 text-[#e4f3e7]">
                  <div className="h-3 w-3 rounded-full bg-[#66d39d] animate-pulse" />
                  <span className="font-medium">Status: Ready</span>
                </div>
              </div>
              <div className="bg-[#0f1512] rounded-xl p-4 border border-[#1f2c25] shadow-inner">
                <p className="text-xs uppercase tracking-[0.2em] text-[#66d39d] font-semibold mb-2">
                  Role
                </p>
                <div className="flex gap-3">
                  {["agent", "customer", "guest"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value as typeof role)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        role === value
                          ? "border-[#66d39d] bg-[#14201a] text-[#e4f3e7]"
                          : "border-[#1f2c25] text-[#9fcfb5] hover:border-[#29402f]"
                      }`}
                    >
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <VideoIcon className="h-5 w-5 text-[#608f73] group-focus-within:text-[#66d39d] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Conference ID"
                  value={confId}
                  onChange={(e) => setConfId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#131d17] border border-[#1f2c25] rounded focus:outline-none focus:ring-2 focus:ring-[#66d39d] text-[#e4f3e7] placeholder-[#4c6456]"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MicIcon className="h-5 w-5 text-[#608f73] group-focus-within:text-[#66d39d] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder={`${agentLabel} Name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#131d17] border border-[#1f2c25] rounded focus:outline-none focus:ring-2 focus:ring-[#66d39d] text-[#e4f3e7] placeholder-[#4c6456]"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-[#0f1512] border border-[#1f2c25] rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#66d39d] font-semibold">
                Share meeting links
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-[#9fcfb5]">Agent invite</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={agentInvite}
                      className="flex-1 px-3 py-2 bg-[#131d17] border border-[#1f2c25] rounded text-[#e4f3e7] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(agentInvite)}
                      className="px-3 py-2 bg-[#66d39d] text-[#0f1512] rounded font-semibold hover:bg-[#7ce2ae] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[#9fcfb5]">Customer invite</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={customerInvite}
                      className="flex-1 px-3 py-2 bg-[#131d17] border border-[#1f2c25] rounded text-[#e4f3e7] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(customerInvite)}
                      className="px-3 py-2 bg-[#66d39d] text-[#0f1512] rounded font-semibold hover:bg-[#7ce2ae] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm text-[#9fcfb5]">Customer display name</label>
                  <input
                    type="text"
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131d17] border border-[#1f2c25] rounded text-[#e4f3e7] placeholder-[#4c6456]"
                    placeholder="Guest"
                  />
                </div>
                <div className="flex items-end text-sm text-[#9fcfb5]">
                  <p>
                    Links follow the requested pattern: <code>/agent=NAME?conferenceID=ID</code> and
                    <code className="ml-1">/customer=NAME?agent=AGENT?conferenceID=ID</code>.
                  </p>
                </div>
              </div>
              {copiedLink && (
                <div className="text-[#66d39d] text-sm">Copied link to clipboard</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 bg-gradient-to-r from-[#22a35a] via-[#49c273] to-[#66d39d] text-[#0f1512] font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Connecting..." : "Join Meeting"}
              </button>
            </div>
            </form>
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className="hidden md:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-[#0c1411] to-[#0f1c16]">
        <div className="relative w-full max-w-lg aspect-video bg-[#111b16] rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-[#1f2c25]">
          <div className="text-[#9fcfb5] flex flex-col items-center">
            <img src={LOGO_SRC} alt="Logo" className="h-24 opacity-90 mb-4" />
            <p className="text-xl font-medium opacity-80 text-center px-6">
              Launch CMeet with Cognicx branding, agent/customer aware links, and live fallback UI.
            </p>
          </div>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-[#22a35a]/20 via-transparent to-[#66d39d]/20" />
        </div>
      </div>
    </div>
  );
};

export default JoinScreen;
