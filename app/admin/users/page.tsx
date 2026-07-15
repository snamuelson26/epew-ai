"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("Entrepreneur");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  }

  async function createUser() {
    if (!fullName || !email) {
      alert("Please enter full name and email.");
      return;
    }

    const { error } = await supabase.from("admin_users").insert([
      {
        full_name: fullName,
        email,
        user_type: userType,
        status,
      },
    ]);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setFullName("");
    setEmail("");
    setUserType("Entrepreneur");
    setStatus("Active");

    loadUsers();
  }

  async function updateStatus(id: number, newStatus: string) {
    const { error } = await supabase
      .from("admin_users")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    loadUsers();
  }

  function statusColor(userStatus: string) {
    if (userStatus === "Active") return "bg-green-100 text-green-800";
    if (userStatus === "Pending") return "bg-yellow-100 text-yellow-800";
    if (userStatus === "Suspended") return "bg-red-100 text-red-800";
    if (userStatus === "Inactive") return "bg-gray-200 text-gray-800";
    return "bg-gray-100 text-gray-700";
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-10">
      <h1 className="text-5xl font-extrabold text-[#06245c] mb-4">
        Users Center
      </h1>

      <p className="text-lg text-gray-700 mb-10">
        Manage EPEW entrepreneurs, supporters, coaches, partners,
        administrators, and guest users.
      </p>

      {loading ? (
        <div className="p-10 text-2xl font-bold">Loading Users...</div>
      ) : (
        <>
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
            <h2 className="text-3xl font-bold text-[#06245c] mb-6">
              Add User
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input
                className="border rounded-xl p-4"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <input
                className="border rounded-xl p-4"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <select
                className="border rounded-xl p-4"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option>Entrepreneur</option>
                <option>Supporter</option>
                <option>Coach</option>
                <option>Partner</option>
                <option>Admin</option>
                <option>Guest</option>
              </select>

              <select
                className="border rounded-xl p-4"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
                <option>Inactive</option>
              </select>
            </div>

            <button
              onClick={createUser}
              className="bg-[#06245c] text-white px-8 py-3 rounded-xl font-bold"
            >
              Save User
            </button>
          </div>

          {users.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-[#06245c] text-center">
                No users added yet.
              </h2>
            </div>
          ) : (
            <div className="overflow-auto bg-white rounded-3xl shadow-xl p-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">User Type</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4 font-bold">
                        {user.full_name || "-"}
                      </td>

                      <td className="p-4">{user.email || "-"}</td>

                      <td className="p-4">{user.user_type || "-"}</td>

                      <td className="p-4">
                        <span
                          className={`px-4 py-2 rounded-xl font-bold ${statusColor(
                            user.status
                          )}`}
                        >
                          {user.status || "Pending"}
                        </span>
                      </td>

                      <td className="p-4 flex gap-2 flex-wrap">
                        <button
                          onClick={() => updateStatus(user.id, "Active")}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl"
                        >
                          Active
                        </button>

                        <button
                          onClick={() => updateStatus(user.id, "Suspended")}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl"
                        >
                          Suspend
                        </button>

                        <button
                          onClick={() => updateStatus(user.id, "Inactive")}
                          className="bg-gray-700 text-white px-4 py-2 rounded-xl"
                        >
                          Inactive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}