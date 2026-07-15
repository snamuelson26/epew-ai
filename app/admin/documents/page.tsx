"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [entrepreneurName, setEntrepreneurName] = useState("");
  const [documentType, setDocumentType] = useState("Entrepreneur Document");
  const [documentName, setDocumentName] = useState("");
  const [documentLink, setDocumentLink] = useState("");
  const [status, setStatus] = useState("Pending Review");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setDocuments([]);
      setLoading(false);
      return;
    }

    setDocuments(data || []);
    setLoading(false);
  }

  async function createDocument() {
    if (!documentName || !documentType) {
      alert("Please enter document name and type.");
      return;
    }

    const { error } = await supabase.from("admin_documents").insert([
      {
        business_name: businessName,
        entrepreneur_name: entrepreneurName,
        document_type: documentType,
        document_name: documentName,
        document_link: documentLink,
        status,
        notes,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setBusinessName("");
    setEntrepreneurName("");
    setDocumentType("Entrepreneur Document");
    setDocumentName("");
    setDocumentLink("");
    setStatus("Pending Review");
    setNotes("");

    loadDocuments();
  }

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase
      .from("admin_documents")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadDocuments();
  }

  function statusColor(documentStatus: string) {
    if (documentStatus === "Approved") return "bg-green-100 text-green-800";
    if (documentStatus === "Pending Review") return "bg-yellow-100 text-yellow-800";
    if (documentStatus === "Rejected") return "bg-red-100 text-red-800";
    if (documentStatus === "Archived") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return <div className="p-10 text-2xl font-bold">Loading Documents Center...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Documents Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage entrepreneur documents, coach review files, funding approvals,
        vendor invoices, rent agreements, business opening documents, and
        quarterly report files.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Document
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Entrepreneur Name"
            value={entrepreneurName}
            onChange={(e) => setEntrepreneurName(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option>Entrepreneur Document</option>
            <option>Coach Review Document</option>
            <option>Funding Approval Document</option>
            <option>Vendor Invoice</option>
            <option>Rent Agreement</option>
            <option>Business Opening Document</option>
            <option>Quarterly Report File</option>
            <option>Other</option>
          </select>

          <input
            className="border rounded-xl p-4"
            placeholder="Document Name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />

          <input
            className="border rounded-xl p-4"
            placeholder="Document Link"
            value={documentLink}
            onChange={(e) => setDocumentLink(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Pending Review</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Archived</option>
          </select>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[140px] mb-6"
          placeholder="Document notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={createDocument}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No documents added yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Business</th>
                <th className="text-left p-4">Entrepreneur</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Document</th>
                <th className="text-left p-4">Link</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Notes</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b align-top">
                  <td className="p-4 font-bold">{doc.business_name || "-"}</td>
                  <td className="p-4">{doc.entrepreneur_name || "-"}</td>
                  <td className="p-4">{doc.document_type || "-"}</td>
                  <td className="p-4 font-bold">{doc.document_name || "-"}</td>

                  <td className="p-4">
                    {doc.document_link ? (
                      <a
                        href={doc.document_link}
                        target="_blank"
                        className="text-blue-700 font-bold underline"
                      >
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-4">
                    <span className={`px-4 py-2 rounded-xl font-bold ${statusColor(doc.status)}`}>
                      {doc.status || "Pending Review"}
                    </span>
                  </td>

                  <td className="p-4 max-w-[350px]">{doc.notes || "-"}</td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(doc.id, "Approved")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => updateStatus(doc.id, "Rejected")}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => updateStatus(doc.id, "Archived")}
                      className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}