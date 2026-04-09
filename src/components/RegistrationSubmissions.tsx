import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, ExternalLink, Download, Search, CheckCircle, Settings, CreditCard, UserPlus, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { fetchRegistrations, deleteRegistration, fetchEvents, saveEvent } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FormField {
  id: string;
  label: string;
  type: string;
  enabled: boolean;
  required: boolean;
  category: "Common" | "Organization" | "University";
}

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "name", label: "Name", type: "text", enabled: true, required: true, category: "Common" },
  { id: "email", label: "Email", type: "email", enabled: true, required: true, category: "Common" },
  { id: "dob", label: "Date of Birth", type: "date", enabled: false, required: false, category: "Common" },
  { id: "github", label: "GitHub Profile", type: "url", enabled: false, required: false, category: "Common" },
  { id: "org_name", label: "Organization Name", type: "text", enabled: false, required: false, category: "Organization" },
  { id: "aadhar", label: "Aadhar Number", type: "text", enabled: false, required: false, category: "Organization" },
  { id: "emp_title", label: "Employment Title", type: "text", enabled: false, required: false, category: "Organization" },
  { id: "uni_name", label: "University Name", type: "text", enabled: false, required: false, category: "University" },
  { id: "address", label: "Address", type: "textarea", enabled: false, required: false, category: "University" },
  { id: "roll_no", label: "Roll Number", type: "text", enabled: false, required: false, category: "University" },
  { id: "batch", label: "Batch", type: "text", enabled: false, required: false, category: "University" },
  { id: "semester", label: "Semester", type: "text", enabled: false, required: false, category: "University" },
];

type MainTabType = "submissions" | "settings";
type FormTabType = "payment" | "participation" | "fields";

export const RegistrationSubmissions = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>("submissions");
  const [activeFormTab, setActiveFormTab] = useState<FormTabType>("payment");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (eventId) {
           const events = await fetchEvents();
           const ev = events.find(e => e.id === eventId);
           if (ev) {
             setEventData(ev);
             setFormData({
                ...ev,
                form_fields: ev.form_fields && ev.form_fields.length > 0 ? ev.form_fields : JSON.parse(JSON.stringify(DEFAULT_FORM_FIELDS))
             });
           }

           const data = await fetchRegistrations(eventId);
           setRegistrations(data || []);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [eventId, toast]);

  const handleSaveConfig = async () => {
     setIsSaving(true);
     try {
        await saveEvent(formData, eventId!);
        toast({ title: "Success", description: "Registration Configuration Saved!" });
        setEventData(formData);
     } catch(e) {
        toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
     } finally {
        setIsSaving(false);
     }
  };

  const toggleField = (id: string, property: 'enabled' | 'required') => {
    setFormData((prev: any) => ({
      ...prev,
      form_fields: prev.form_fields?.map((f: any) => f.id === id ? { ...f, [property]: !f[property] } : f)
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      await deleteRegistration(id);
      setRegistrations(registrations.filter(r => r.id !== id));
      toast({ title: "Success", description: "Submission deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete submission.", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    if (!registrations.length) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID", "Registered At", "Team Name", "Payment Proof"];
    
    const dynamicHeaders = new Set<string>();
    registrations.forEach(reg => {
       if (reg.team_members && Array.isArray(reg.team_members)) {
          reg.team_members.forEach((m: any) => Object.keys(m).forEach(k => dynamicHeaders.add(k)));
       } else if (reg.dynamic_fields) {
          Object.keys(reg.dynamic_fields).forEach(k => dynamicHeaders.add(k));
       } else {
          dynamicHeaders.add("name");
          dynamicHeaders.add("email");
       }
    });
    
    const dynamicHeadersArray = Array.from(dynamicHeaders);
    csvContent += headers.concat(dynamicHeadersArray).join(",") + "\r\n";

    registrations.forEach(reg => {
      const row = [
         reg.id, 
         new Date(reg.created_at).toLocaleString(),
         reg.team_name ? `"${reg.team_name}"` : "N/A",
         reg.payment_proof_url || "N/A"
      ];
      
      const primaryData = (reg.team_members && reg.team_members[0]) || reg.dynamic_fields || { name: reg.name, email: reg.email };
      
      dynamicHeadersArray.forEach(header => {
         const val = primaryData[header] || "";
         row.push(`"${val}"`);
      });
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `submissions_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter(r => {
      const searchStr = `${r.name} ${r.email} ${r.team_name} ${r.id}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => navigate("/admin/registrations")} size="icon" className="text-gray-400 hover:text-white">
             <ArrowLeft className="w-5 h-5"/>
           </Button>
           <div>
             <h2 className="text-2xl font-bold text-white tracking-tight">{eventData?.title || 'Loading event...'}</h2>
             <p className="text-gray-400 text-sm">Managing Registrations</p>
           </div>
        </div>
      </div>

      <div className="flex bg-[#121224]/70 p-1 rounded-xl border border-blue-900/40 w-max">
        <Button 
          variant="ghost" 
          onClick={() => setActiveMainTab("submissions")} 
          className={`rounded-lg px-6 ${activeMainTab === 'submissions' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          View Submissions
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setActiveMainTab("settings")} 
          className={`rounded-lg px-6 ${activeMainTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          Registration Form Builder
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeMainTab === 'submissions' ? (
          <motion.div key="submissions" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>
            <div className="flex justify-end mb-4">
              <Button onClick={exportCSV} variant="outline" className="border-blue-900/40 text-blue-400 hover:bg-blue-900/20">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="bg-[#121224]/70 backdrop-blur-md rounded-2xl border border-blue-900/40 overflow-hidden flex flex-col min-h-[500px]">
               <div className="p-4 border-b border-blue-900/40 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="relative w-full sm:w-72">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                     <Input placeholder="Search registrations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-[#1a1a2e]/50 border-blue-900/40 placeholder-gray-500 text-sm h-9"/>
                   </div>
                   <div className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="bg-blue-900/30 text-blue-300 px-2 rounded border border-blue-900/50">{filtered.length}</span> Total
                   </div>
               </div>
               
               <div className="flex-1 overflow-x-auto">
                 {isLoading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">Loading submissions...</div>
                 ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                       <CheckCircle className="w-8 h-8 mb-2 opacity-50"/>
                       <p>No submissions found.</p>
                    </div>
                 ) : (
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-gray-400 uppercase bg-black/20 border-b border-blue-900/40">
                         <tr>
                           <th className="px-6 py-4 font-medium">Timestamp</th>
                           <th className="px-6 py-4 font-medium">Primary Info</th>
                           <th className="px-6 py-4 font-medium">Team Details</th>
                           <th className="px-6 py-4 font-medium">Payment</th>
                           <th className="px-6 py-4 font-medium text-right">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-blue-900/20">
                         {filtered.map(reg => (
                            <tr key={reg.id} className="hover:bg-[#1a1a2e]/40 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap text-gray-400">{new Date(reg.created_at).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                 <div className="font-medium text-white">{reg.name}</div>
                                 <div className="text-gray-500 text-xs">{reg.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                 {reg.team_name ? (
                                    <div className="text-blue-300">
                                      <span className="font-bold">{reg.team_name}</span> 
                                      <span className="text-gray-500 ml-2">({reg.team_members?.length || 1} members)</span>
                                    </div>
                                 ) : <span className="text-gray-600">Solo</span>}
                              </td>
                              <td className="px-6 py-4">
                                 {reg.payment_proof_url ? (
                                    <a href={reg.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline flex items-center gap-1 text-xs"><ExternalLink className="w-3 h-3"/> View Screenshot</a>
                                 ) : <span className="text-gray-600">N/A</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Button size="sm" variant="outline" className="border-blue-900/40 text-blue-400 h-8 text-xs" onClick={() => setSelectedReg(reg)}>View All</Button>
                                   <Button size="icon" variant="ghost" onClick={() => handleDelete(reg.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="w-4 h-4"/></Button>
                                 </div>
                              </td>
                            </tr>
                         ))}
                       </tbody>
                    </table>
                 )}
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="settings" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>
             <div className="bg-[#121224]/70 backdrop-blur-md rounded-2xl border border-blue-900/40 p-6">
                
                <div className="flex gap-2 border-b border-blue-900/40 pb-4 mb-6">
                  <Button variant="ghost" onClick={() => setActiveFormTab('payment')} className={`text-sm ${activeFormTab === 'payment' ? 'bg-blue-900/40 text-blue-400' : 'text-gray-400'}`}><CreditCard className="w-4 h-4 mr-2"/>Payment Logic</Button>
                  <Button variant="ghost" onClick={() => setActiveFormTab('participation')} className={`text-sm ${activeFormTab === 'participation' ? 'bg-blue-900/40 text-blue-400' : 'text-gray-400'}`}><UserPlus className="w-4 h-4 mr-2"/>Team sizes</Button>
                  <Button variant="ghost" onClick={() => setActiveFormTab('fields')} className={`text-sm ${activeFormTab === 'fields' ? 'bg-blue-900/40 text-blue-400' : 'text-gray-400'}`}><FileText className="w-4 h-4 mr-2"/>Dynamic Form Fields</Button>
                </div>

                <div className="min-h-[300px]">
                  {activeFormTab === 'payment' && (
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center space-x-2 border border-blue-900/40 p-4 rounded-xl bg-[#1a1a2e]/50">
                        <Label className="text-white flex-1 text-base">Is this a paid event?</Label>
                        <Switch checked={formData.registration_type === 'paid'} onCheckedChange={(c) => setFormData({...formData, registration_type: c ? 'paid' : 'unpaid'})} />
                      </div>
                      {formData.registration_type === 'paid' && (
                        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-5">
                          {/* QR Code Section */}
                          <div className="border border-blue-900/40 rounded-xl bg-[#1a1a2e]/30 p-4 space-y-3">
                            <Label className="text-gray-200 font-semibold text-sm block">Payment QR Code</Label>
                            {/* Preview */}
                            {formData.payment_qr_url && (
                              <div className="flex items-start gap-4">
                                <div className="bg-white p-2 rounded-lg inline-block">
                                  <img src={formData.payment_qr_url} alt="QR Preview" className="w-36 h-36 object-contain rounded" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <p className="text-green-400 text-xs flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> QR Code active
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setFormData({...formData, payment_qr_url: ''})}
                                    className="text-red-400 text-xs hover:text-red-300 underline"
                                  >
                                    Remove QR Code
                                  </button>
                                </div>
                              </div>
                            )}
                            {/* Upload */}
                            <div>
                              <Label className="text-gray-400 text-xs mb-1 block">Upload QR Image (PNG/JPG)</Label>
                              <label className="flex items-center gap-3 cursor-pointer border border-dashed border-blue-900/60 hover:border-blue-500/60 rounded-xl p-4 bg-[#0f0f1e]/50 transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-blue-900/20 group-hover:bg-blue-900/40 flex items-center justify-center flex-shrink-0 transition-colors">
                                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                  <p className="text-gray-300 text-sm">Click to upload QR code image</p>
                                  <p className="text-gray-600 text-xs">PNG, JPG up to 2MB</p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 2 * 1024 * 1024) {
                                      alert('File too large. Please use an image under 2MB.');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setFormData((prev: any) => ({...prev, payment_qr_url: ev.target?.result as string}));
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                              </label>
                            </div>
                            {/* Or paste URL */}
                            <div>
                              <Label className="text-gray-400 text-xs mb-1 block">Or paste QR image URL</Label>
                              <Input
                                placeholder="https://..."
                                value={formData.payment_qr_url?.startsWith('data:') ? '' : (formData.payment_qr_url || '')}
                                onChange={e => setFormData({...formData, payment_qr_url: e.target.value})}
                                className="bg-[#1a1a2e]/50 border-blue-900/40 text-white text-sm"
                              />
                            </div>
                          </div>

                          {/* Instructions */}
                          <div>
                            <Label className="text-gray-300">Payment Instructions</Label>
                            <Textarea
                              placeholder="UPI ID: mr@ybl&#10;Amount: ₹499&#10;&#10;After paying, upload the screenshot below."
                              value={formData.payment_instructions}
                              onChange={e => setFormData({...formData, payment_instructions: e.target.value})}
                              className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white min-h-[100px]"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeFormTab === 'participation' && (
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center space-x-2 border border-blue-900/40 p-4 rounded-xl bg-[#1a1a2e]/50">
                         <div className="flex-1">
                           <Label className="text-white text-base block">Allow Team Participation?</Label>
                           <p className="text-gray-400 text-xs">Switch to enable team sizes.</p>
                         </div>
                        <Switch checked={formData.participation_type === 'team'} onCheckedChange={(c) => setFormData({...formData, participation_type: c ? 'team' : 'solo'})} />
                      </div>
                      {formData.participation_type === 'team' && (
                        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                             <div><Label className="text-gray-300">Min Members</Label><Input type="number" min="1" value={formData.team_min_members} onChange={e => setFormData({...formData, team_min_members: parseInt(e.target.value)})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white" /></div>
                             <div><Label className="text-gray-300">Max Members</Label><Input type="number" min="1" value={formData.team_max_members} onChange={e => setFormData({...formData, team_max_members: parseInt(e.target.value)})} className="mt-2 bg-[#1a1a2e]/50 border-blue-900/40 text-white" /></div>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Switch checked={formData.team_enforce_details} onCheckedChange={(c) => setFormData({...formData, team_enforce_details: c})} />
                              <Label className="text-gray-300 flex-1">Enforce Member Details (All team members must fill out the form fields)</Label>
                           </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeFormTab === 'fields' && (
                    <div className="space-y-6 max-w-3xl">
                      <p className="text-gray-400 text-sm">Configure what details you want to collect from the users during registration. "Name" and "Email" are recommended to always remain enabled.</p>
                      {(['Common', 'Organization', 'University'] as const).map(category => (
                        <div key={category} className="border border-blue-900/40 rounded-xl bg-[#1a1a2e]/30 overflow-hidden">
                          <div className="bg-blue-900/20 px-4 py-3"><h4 className="font-bold text-blue-300">{category} Fields</h4></div>
                          <div className="divide-y divide-blue-900/20">
                            {formData.form_fields?.filter((f: any) => f.category === category).map((field: any) => (
                              <div key={field.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-[#1a1a2e]/60 transition-colors gap-4">
                                <div className="flex-1">
                                  <Label className="text-white text-base">{field.label}</Label>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={field.enabled} onCheckedChange={() => toggleField(field.id, 'enabled')} id={`enable-${field.id}`}/> <Label htmlFor={`enable-${field.id}`} className="w-12 text-xs text-gray-400">Enable</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch checked={field.required} disabled={!field.enabled} onCheckedChange={() => toggleField(field.id, 'required')} id={`req-${field.id}`}/> <Label htmlFor={`req-${field.id}`} className="w-12 text-xs text-gray-400">Required</Label>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-blue-900/40 mt-8 pt-4 flex justify-end">
                   <Button onClick={handleSaveConfig} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[200px]">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Configuration"}
                   </Button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!selectedReg} onOpenChange={(o) => !o && setSelectedReg(null)}>
        {selectedReg && (
          <DialogContent className="bg-[#121224] border border-blue-900/40 text-gray-200 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle className="text-xl text-green-400">Submission Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
               <div>
                  <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Meta</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 block text-xs">ID</span> <span className="font-mono">{selectedReg.id}</span></div>
                    <div><span className="text-gray-500 block text-xs">Timestamp</span> <span>{new Date(selectedReg.created_at).toLocaleString()}</span></div>
                  </div>
               </div>

               {selectedReg.payment_proof_url && (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Payment Proof</h4>
                    <a href={selectedReg.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{selectedReg.payment_proof_url}</a>
                  </div>
               )}

               {selectedReg.team_members ? (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Team Data</h4>
                    <div className="mb-4">
                       <span className="text-gray-500 block text-xs mb-1">Team Name</span>
                       <span className="font-bold text-lg text-blue-300">{selectedReg.team_name}</span>
                    </div>
                    <div className="space-y-4">
                       {selectedReg.team_members.map((member: any, i: number) => (
                          <div key={i} className="bg-black/30 p-4 rounded-lg border border-blue-900/20">
                             <h5 className="font-bold text-white mb-3 tracking-wide">Member {i + 1}</h5>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(member).map(([k, v]) => (
                                   <div key={k} className="bg-[#1a1a2e]/50 px-3 py-2 rounded">
                                      <span className="text-gray-500 block text-[10px] uppercase mb-0.5">{k}</span>
                                      <span className="text-sm">{String(v || 'N/A')}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
               ) : (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Form Data</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(selectedReg.dynamic_fields || { name: selectedReg.name, email: selectedReg.email }).map(([k, v]) => (
                            <div key={k} className="bg-[#1a1a2e]/50 px-3 py-2 rounded">
                              <span className="text-gray-500 block text-[10px] uppercase mb-0.5">{k}</span>
                              <span className="text-sm">{String(v || 'N/A')}</span>
                            </div>
                        ))}
                    </div>
                  </div>
               )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
