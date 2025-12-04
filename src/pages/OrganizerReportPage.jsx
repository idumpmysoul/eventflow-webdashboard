import React, { useEffect, useState } from 'react';
import api from '../services/api';
import IncidentFeed from '../components/IncidentFeed.jsx';
import OrganizerReportDetailModal from '../components/OrganizerReportDetailModal.jsx';

const OrganizerReportPage = () => {
  const [reports, setReports] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Utilities
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [filteredReports, setFilteredReports] = useState([]);

  // Helper function to clean markdown JSON wrapper
  const cleanJsonString = (str) => {
    if (typeof str !== 'string') return str;
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    return str.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim();
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const eventId = localStorage.getItem('selectedEventId');
        if (!eventId) throw new Error('Event ID tidak ditemukan');
        const reports = await api.getReports(eventId);
        setReports(reports);
        // Fetch AI insights for all reports
        const aiResults = await Promise.all(
          reports.map(async (r) => {
            try {
              const aiRes = await api.getReportAIResultsByReportId(r.id);
              return Array.isArray(aiRes) ? aiRes : [];
            } catch (e) {
              console.error('Gagal fetch AI Insight untuk report', r.id, e);
              return [];
            }
          })
        );
        setAiInsights(aiResults.flat());
        setLoading(false);
      } catch (err) {
        console.error('Gagal memuat laporan:', err);
        setError('Gagal memuat laporan');
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Filtering, searching, sorting (AI Insight based)
  useEffect(() => {
    console.log('=== FILTERING START ===');
    console.log('Total reports:', reports.length);
    console.log('Total AI insights:', aiInsights.length);
    console.log('Filter severity:', filterSeverity);
    console.log('Raw aiInsights:', aiInsights);
    
    let filtered = reports;
    // Attach AI Insight to each report for easier filtering
    filtered = filtered.map(r => {
      const ai = aiInsights.find(i => i.reportId === r.id);
      let aiSeverity = null;
      let aiSummary = '';
      let aiPayload = null;
      
      console.log(`\n--- Processing Report ${r.id} ---`);
      console.log('Found AI insight:', ai);
      
      if (ai && ai.aiPayload) {
        console.log('AI Payload type:', typeof ai.aiPayload);
        console.log('AI Payload raw:', ai.aiPayload);
        
        try {
          // Step 1: Extract insight string if nested
          let insightString = null;
          
          if (typeof ai.aiPayload === 'string') {
            console.log('aiPayload is string, using directly');
            insightString = ai.aiPayload;
          } else if (ai.aiPayload.insight) {
            console.log('Found insight property');
            insightString = ai.aiPayload.insight;
          } else {
            console.log('Using aiPayload as object directly');
            aiPayload = ai.aiPayload;
          }
          
          // Step 2: If we have insight string, clean and parse it
          if (insightString) {
            console.log('Insight string before cleaning:', insightString.substring(0, 100));
            const cleanedString = cleanJsonString(insightString);
            console.log('Insight string after cleaning:', cleanedString.substring(0, 100));
            aiPayload = JSON.parse(cleanedString);
          }
          
          console.log('Parsed aiPayload:', aiPayload);
          aiSeverity = aiPayload.severity || null;
          aiSummary = aiPayload.summary || '';
          
          console.log('Extracted severity:', aiSeverity);
          console.log('Extracted summary:', aiSummary);
        } catch (e) {
          console.error('AI Insight parsing error for report', r.id, ':', e);
          console.error('Failed on:', ai);
        }
      } else {
        console.log('No AI insight or aiPayload found');
      }
      
      return { ...r, aiSeverity, aiSummary, aiPayload };
    });

    // Filter by severity (from AI only, strict, case-insensitive)
    if (filterSeverity) {
      console.log('\n Applying severity filter:', filterSeverity);
      console.log('Reports before filter:', filtered.length);
      
      filtered = filtered.filter(r => {
        console.log(`  - Report ${r.id}: aiSeverity = "${r.aiSeverity}"`);
        
        if (!r.aiSeverity) {
          console.log(`Filtered out: no AI severity`);
          return false;
        }
        
        const normalizedReportSeverity = String(r.aiSeverity).trim().toUpperCase();
        const normalizedFilterSeverity = String(filterSeverity).trim().toUpperCase();
        const match = normalizedReportSeverity === normalizedFilterSeverity;
        
        console.log(`    Comparing: "${normalizedReportSeverity}" === "${normalizedFilterSeverity}" => ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
        return match;
      });
      
      console.log('Reports after filter:', filtered.length);
    }
    
    // Search by description, summary, or category
    if (searchTerm) {
      filtered = filtered.filter(r =>
        (r.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.aiSummary?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.category?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort
    if (sortBy === "time") {
      filtered = filtered.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "severity") {
      const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      filtered = filtered.slice().sort((a, b) => {
        const sevA = sevOrder[a.aiSeverity?.toUpperCase()] ?? 99;
        const sevB = sevOrder[b.aiSeverity?.toUpperCase()] ?? 99;
        return sevA - sevB;
      });
    }
    
    console.log('Filtered reports count:', filtered.length);
    console.log('=== FILTERING END ===\n');
    setFilteredReports(filtered);
  }, [reports, aiInsights, searchTerm, filterSeverity, sortBy]);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">Daftar Laporan Event</h1>
      {/* Utilities: Search, Filter, Sort */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Cari laporan..."
          className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
        >
          <option value="">Semua Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="time">Urutkan: Waktu</option>
          <option value="severity">Urutkan: Severity</option>
        </select>
      </div>
      {loading ? (
        <div className="text-slate-400">Memuat laporan...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <p className="text-lg">Tidak ada laporan ditemukan.</p>
          {filterSeverity && (
            <p className="text-sm mt-2">Coba hapus filter severity untuk melihat semua laporan.</p>
          )}
        </div>
      ) : (
        <>
          <IncidentFeed
            reports={filteredReports}
            aiInsights={aiInsights}
            onIncidentSelect={(report) => {
              setSelectedReport(report);
              setModalOpen(true);
            }}
          />
          {/* Modal for report detail */}
          {modalOpen && selectedReport && (
            <OrganizerReportDetailModal
              report={selectedReport}
              aiInsights={aiInsights.filter(i => i.reportId === selectedReport.id)}
              onClose={() => setModalOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default OrganizerReportPage;