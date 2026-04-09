import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, ExternalLink, Download, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchRegistrations, deleteRegistration, fetchEvents } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const RegistrationSubmissions = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReg, setSelectedReg] = useState<any | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (eventId) {
           const events = await fetchEvents();
           const ev = events.find(e => e.id === eventId);
           setEventData(ev || null);

           const data = await fetchRegistrations(eventId);
           setRegistrations(data || []);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load submissions", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [eventId, toast]);

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
    
    // We try to normalize columns based on first team member data or root data
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["ID", "Registered At", "Team Name", "Payment Proof"];
    
    // Attempting to collect dynamic headers
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
    csvContent += headers.concat(dynamicHeadersArray).join(",") + "\\r\\n";

    registrations.forEach(reg => {
      const row = [
         reg.id, 
         new Date(reg.created_at).toLocaleString(),
         reg.team_name ? \`"\${reg.team_name}"\` : "N/A",
         reg.payment_proof_url || "N/A"
      ];
      
      const primaryData = (reg.team_members && reg.team_members[0]) || reg.dynamic_fields || { name: reg.name, email: reg.email };
      
      dynamicHeadersArray.forEach(header => {
         const val = primaryData[header] || "";
         row.push(\`"\${val}"\`);
      });
      csvContent += row.join(",") + "\\r\\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`submissions_\${eventId}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = registrations.filter(r => {
      const searchStr = \`\${r.name} \${r.email} \${r.team_name} \${r.id}\`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={() => navigate("/admin")} size="icon" className="text-gray-400 hover:text-white">
             <ArrowLeft className="w-5 h-5"/>
           </Button>
           <div>
             <h2 className="text-2xl font-bold text-white tracking-tight">Submissions</h2>
             <p className="text-gray-400 text-sm">{eventData?.title ? \`For: \${eventData.title}\` : 'Loading event...'}</p>
           </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" className="border-blue-900/40 text-blue-400 hover:bg-blue-900/20">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
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
