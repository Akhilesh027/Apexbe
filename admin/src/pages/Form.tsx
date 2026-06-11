import { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";

const Forms = () => {
  const [forms, setForms] = useState<any[]>([]);

  // Fetch form submissions
  const fetchForms = async () => {
    try {
      const res = await axios.get("https://api.apexbee.in/api/admin/forms");
      setForms(res.data.forms || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Table Columns
  const columns = [
    { header: "Name", accessor: (item: any) => item.name },
    { header: "Email", accessor: (item: any) => item.email },
    { header: "Phone", accessor: (item: any) => item.phone },
    { header: "Message", accessor: (item: any) => item.message },
    { header: "Form Type", accessor: (item: any) => item.formType },
    {
      header: "Created At",
      accessor: (item: any) =>
        new Date(item.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Form Submissions</h1>
        <p className="text-muted-foreground">View all submitted forms</p>
      </div>

      <DataTable data={forms} columns={columns} searchKey="name" />
    </div>
  );
};

export default Forms;
