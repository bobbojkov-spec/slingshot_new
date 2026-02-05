import "antd/dist/reset.css";
import "./admin.css";

import AntdRegistry from "@/lib/antd/AntdRegistry";
import AdminShellClient from "./AdminShellClient";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <AdminShellClient>{children}</AdminShellClient>
    </AntdRegistry>
  );
}

