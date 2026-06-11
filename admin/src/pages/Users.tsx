import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);

  // Fetch all users from backend
  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/admin/users");
      setUsers(res.data.user || []);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Change User Role
  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      await axios.put(`https://api.apexbee.in/api/admin/users/${userId}/role`, {
        role: newRole,
      });

      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success("User role updated");
    } catch (error) {
      toast.error("Failed to update role");
      console.error(error);
    }
  };

  // Block / Unblock User
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      await axios.put(`https://api.apexbee.in/api/admin/users/${userId}/status`, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      );

      toast.success("User status updated");
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  // Table Columns
  const columns = [
    { header: "Name", accessor: (item: any) => item.name },
    { header: "Email", accessor: (item: any) => item.email },
    { header: "Phone", accessor: (item: any) => item.phone },
    { header: "Wallet", accessor: (item: any) => `₹${item.walletBalance}` },
  
    {
      header: "Status",
      accessor: (item: any) => (
        <Badge variant={item.status === "active" ? "default" : "destructive"}>
          {item.status || "active"}
        </Badge>
      ),
    },
    {
      header: "Joined",
      accessor: (item: any) =>
        new Date(item.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: (item: any) => (
        <Button
          size="sm"
          variant="outline"
          className={
            item.status === "blocked"
              ? "text-green-600 hover:bg-green-100"
              : "text-red-600 hover:bg-red-100"
          }
          onClick={() => toggleUserStatus(item._id, item.status || "active")}
        >
          {item.status === "blocked" ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Unblock
            </>
          ) : (
            <>
              <Ban className="h-4 w-4 mr-1" />
              Block
            </>
          )}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage user accounts & roles</p>
      </div>

      <DataTable data={users} columns={columns} searchKey="name" />
    </div>
  );
};

export default Users;
