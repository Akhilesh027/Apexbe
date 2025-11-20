import { useState } from "react";
import { mockUsers, User } from "@/data/mockData";
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
  const [users, setUsers] = useState(mockUsers);

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === "active" ? "blocked" : "active" }
          : user
      )
    );
    toast.success("User status updated");
  };

  const changeUserRole = (userId: string, newRole: User["role"]) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
    );
    toast.success("User role updated");
  };

  const columns = [
    { header: "Name", accessor: (item: User) => item.name },
    { header: "Email", accessor: (item: User) => item.email },
    {
      header: "Role",
      accessor: (item: User) => (
        <Select
          value={item.role}
          onValueChange={(value) => changeUserRole(item.id, value as User["role"])}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      header: "Status",
      accessor: (item: User) => (
        <Badge variant={item.status === "active" ? "default" : "destructive"}>
          {item.status}
        </Badge>
      ),
    },
    { header: "Joined Date", accessor: (item: User) => item.joinedDate },
    {
      header: "Actions",
      accessor: (item: User) => (
        <Button
          size="sm"
          variant="outline"
          className={
            item.status === "blocked"
              ? "text-success hover:bg-success/10"
              : "text-destructive hover:bg-destructive/10"
          }
          onClick={() => toggleUserStatus(item.id)}
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
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>

      <DataTable data={users} columns={columns} searchKey="name" />
    </div>
  );
};

export default Users;
