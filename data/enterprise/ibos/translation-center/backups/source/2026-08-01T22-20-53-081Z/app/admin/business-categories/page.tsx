"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminBusinessCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_business_categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setCategories([]);
      setLoading(false);
      return;
    }

    setCategories(data || []);
    setLoading(false);
  }

  async function createCategory() {
    if (!categoryName) {
      alert("Please enter a category name.");
      return;
    }

    const { error } = await supabase.from("admin_business_categories").insert([
      {
        category_name: categoryName,
        description,
        status,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setCategoryName("");
    setDescription("");
    setStatus("Active");

    loadCategories();
  }

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase
      .from("admin_business_categories")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadCategories();
  }

  function statusColor(categoryStatus: string) {
    if (categoryStatus === "Active") return "bg-green-100 text-green-800";
    if (categoryStatus === "Hidden") return "bg-yellow-100 text-yellow-800";
    if (categoryStatus === "Archived") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  if (loading) {
    return (
      <div className="p-10 text-2xl font-bold">
        Loading Business Categories...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Business Categories
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage EPEW business categories used for entrepreneur applications,
        marketplace filtering, funded business directory, supporter matching,
        and coach assignment.
      </p>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
        <h2 className="text-3xl font-bold text-[#06245c] mb-6">
          Add Business Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            className="border rounded-xl p-4"
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <select
            className="border rounded-xl p-4"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Active</option>
            <option>Hidden</option>
            <option>Archived</option>
          </select>
        </div>

        <textarea
          className="border rounded-xl p-4 w-full min-h-[160px] mb-6"
          placeholder="Category description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={createCategory}
          className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
        >
          Save Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#06245c] text-center">
            No business categories added yet.
          </h2>
        </div>
      ) : (
        <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b">
                  <td className="p-4 font-bold">
                    {category.category_name || "-"}
                  </td>

                  <td className="p-4 max-w-[500px]">
                    {category.description || "-"}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                        category.status
                      )}`}
                    >
                      {category.status || "Active"}
                    </span>
                  </td>

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(category.id, "Active")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Active
                    </button>

                    <button
                      onClick={() => updateStatus(category.id, "Hidden")}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                    >
                      Hide
                    </button>

                    <button
                      onClick={() => updateStatus(category.id, "Archived")}
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