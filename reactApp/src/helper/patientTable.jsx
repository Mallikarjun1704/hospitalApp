import React, { useState, useMemo } from "react";

/* Dummy 15 records */
const DUMMY_DATA = Array.from({ length: 5 }).map((_, i) => ({
  id: i + 1,
  patientName: `Patient ${i + 1}`,
  age: 20 + (i % 30),
  contactNumber: `90000${10000 + i}`,
  ipdNumber: `IPD-${1000 + i}`,
  admissionDate: `2025-10-${(i % 28) + 1}`.padStart(10, "0"),
  consultantName: `Dr. Consultant ${(i % 5) + 1}`,
}));

export default function PatientTable({ data = DUMMY_DATA, onEdit, onDelete, onView }) {
  const isAdmin = localStorage.getItem('userType') === 'admin';
  const formatIsoDate = (val) => {
    if (!val) return '';
    try {
      // Construct a Date and return ISO string (UTC) to avoid local timezone shifting the day
      const d = new Date(val);
      if (isNaN(d)) return String(val);
      return d.toISOString();
    } catch (err) {
      return String(val);
    }
  };
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // clamp current page when pageSize changes
  useMemo(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [pageSize, totalPages]); // eslint-disable-line

  const start = (currentPage - 1) * pageSize;
  const currentData = data.slice(start, start + pageSize);

  const gotoPage = (p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div className="max-w-6xl mx-auto my-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Patients</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Age</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Contact</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">IPD No.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Admission</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Consultant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentData.map((r) => (
                <tr key={r._id || r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{r.name || r.patientName}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.age}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.contact || r.contactNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.ipdNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.date ? formatIsoDate(r.date) : formatIsoDate(r.admissionDate)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{r.consultDoctor || r.consultantName}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <div className="flex gap-2">
                      {onEdit && isAdmin && (
                        <button
                          onClick={() => onEdit(r)}
                          className="bg-yellow-300 px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(r._id || r.id)}
                          className="bg-red-400 px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      )}
                      {onView && (
                        <button onClick={() => onView(r)} className="bg-blue-500 px-3 py-1 rounded text-white">View</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={7}>
                    No records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {start + 1} to {Math.min(start + pageSize, data.length)} of {data.length} entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => gotoPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Prev
            </button>

            {/* simple page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                const active = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => gotoPage(p)}
                    className={`px-3 py-1 rounded border ${active ? "bg-blue-600 text-white" : "bg-white"}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => gotoPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}