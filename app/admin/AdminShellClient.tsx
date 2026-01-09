"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  SolutionOutlined,
  SyncOutlined,
  TableOutlined,
  TagsOutlined,
  TeamOutlined,
  BgColorsOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Layout, Menu, Space, Spin, Typography, message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const { Sider, Header, Content } = Layout;

type AdminMenuNode = {
  key: string;
  icon: React.ReactNode;
  labelText: string;
  href?: string;
  children?: AdminMenuNode[];
};

const ADMIN_MENU: AdminMenuNode[] = [
  { key: "dashboard", icon: <HomeOutlined />, labelText: "Dashboard", href: "/admin" },
  { key: "hero-slides", icon: <FileProtectOutlined />, labelText: "Hero Slides", href: "/admin/hero-slides" },
  {
    key: "catalog",
    icon: <AppstoreOutlined />,
    labelText: "Catalog",
    children: [
      { key: "catalog-products-new", icon: <TableOutlined />, labelText: "Products", href: "/admin/products" },
      { key: "catalog-categories", icon: <TagsOutlined />, labelText: "Categories", href: "/admin/categories" },
      { key: "catalog-product-types", icon: <TagsOutlined />, labelText: "Product Types", href: "/admin/product-types" },
      { key: "catalog-colors", icon: <BgColorsOutlined />, labelText: "Colors", href: "/admin/colors" },
      { key: "catalog-menu-groups", icon: <TagsOutlined />, labelText: "Menu Groups", href: "/admin/menu-groups" },
      { key: "catalog-activity-categories", icon: <TagsOutlined />, labelText: "Activity Categories", href: "/admin/activity-categories" },
      { key: "catalog-tags", icon: <GlobalOutlined />, labelText: "Tags", href: "/admin/tags" },
    ],
  },
  { key: "test-image", icon: <FileProtectOutlined />, labelText: "Test Image", href: "/admin/test-image" },
  { key: "pages", icon: <FileProtectOutlined />, labelText: "Pages" },
  { key: "shop", icon: <ShoppingCartOutlined />, labelText: "Shop" },
  {
    key: "users",
    icon: <TeamOutlined />,
    labelText: "Users",
    children: [
      { key: "users-customers", icon: <SolutionOutlined />, labelText: "Customers", href: "/admin/users/customers" },
      { key: "users-admins", icon: <SolutionOutlined />, labelText: "Admins", href: "/admin/users/admins" },
    ],
  },
  { key: "settings", icon: <SettingOutlined />, labelText: "Settings", href: "/admin/settings" },
];

function toAntdItems(nodes: AdminMenuNode[]): any[] {
  return nodes.map((n) => {
    const label = n.href ? <Link href={n.href}>{n.labelText}</Link> : n.labelText;
    if (n.children?.length) {
      return { key: n.key, icon: n.icon, label: n.labelText, children: toAntdItems(n.children) };
    }
    return { key: n.key, icon: n.icon, label };
  });
}

function maxLabelChars(nodes: AdminMenuNode[]): number {
  let max = 0;
  const walk = (list: AdminMenuNode[]) => {
    for (const n of list) {
      max = Math.max(max, (n.labelText || "").length);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return max;
}

function useSelectedKey() {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return "dashboard";
    if (pathname === "/admin/products" || pathname.startsWith("/admin/products/")) {
      return "catalog-products-new";
    }
    const parts = pathname.split("/").filter(Boolean); // e.g. ['admin','catalog','products']
    if (parts.length <= 1) return "dashboard";
    return parts.slice(1).join("-");
  }, [pathname]);
}

function initialOpenKeysForSelectedKey(selectedKey: string) {
  const parts = selectedKey.split("-");
  return parts.length > 1 ? [parts[0]] : [];
}

function sameStringArray(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function AdminShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedKey = useSelectedKey();
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    initialOpenKeysForSelectedKey(selectedKey),
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/admin/login");
  const [runningTranslations, setRunningTranslations] = useState(false);
  const antdMenuItems = useMemo(() => toAntdItems(ADMIN_MENU), []);
  const siderLabelCh = useMemo(() => maxLabelChars(ADMIN_MENU), []);
  const adminShellStyle = useMemo(
    () =>
      ({
        ["--admin-sider-label-ch" as any]: String(siderLabelCh),
      }) as React.CSSProperties,
    [siderLabelCh],
  );

  useEffect(() => {
    // Keep current behavior (auto-open parent menu) but make first paint stable
    // by matching the initial state to the computed value.
    const desired = initialOpenKeysForSelectedKey(selectedKey);
    setOpenKeys((prev) => (sameStringArray(prev, desired) ? prev : desired));
  }, [selectedKey]);

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const payload = await res.json();

        if (cancelled) return;

        if (res.ok && payload?.authenticated) {
          setUserEmail(payload.user?.email || null);
        } else {
          setUserEmail(null);
          router.replace('/admin/login');
        }
      } catch (error) {
        console.error('session check failed', error);
        if (!cancelled) {
          setUserEmail(null);
          router.replace('/admin/login');
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('logout failed', error);
    }
    setUserEmail(null);
    router.push('/admin/login');
  };

  // For non-login pages, block UI until auth check completes / redirects
  if (!isLoginPage && !authChecked) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content
          style={{
            margin: "24px",
            minHeight: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin />
        </Content>
      </Layout>
    );
  }

  // If not logged in (redirect pending), render nothing to avoid flashing content
  if (!isLoginPage && authChecked && !userEmail) {
    return null;
  }

  // Login page renders without sidebar/header
  if (isLoginPage) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ margin: "24px", minHeight: 360 }}>{children}</Content>
      </Layout>
    );
  }

  return (
    <Layout className="AdminShell" style={{ minHeight: "100vh", ...adminShellStyle }}>
      <Sider
        width={240}
        collapsedWidth={0}
        breakpoint="lg"
        trigger={null}
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, left: 0, zIndex: 100 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BarChartOutlined style={{ color: "#fff", fontSize: 20 }} />
            <Typography.Text
              className="AdminLogoText"
              style={{ color: "#fff", fontWeight: 700, margin: 0 }}
            >
              Admin
            </Typography.Text>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            items={antdMenuItems}
            style={{ flex: 1, borderRight: 0 }}
          />
          <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography.Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
              v 1.17
            </Typography.Text>
          </div>
        </div>
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space size={12}>
            <Button
              className="AdminHamburger lg:hidden"
              type="text"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              icon={<MenuOutlined />}
            />
            <Typography.Title level={4} style={{ margin: 0 }}>
              Slingshot Admin
            </Typography.Title>
          </Space>
          {userEmail ? (
            <Space size={8}>
              <Button
                size="small"
                icon={<SyncOutlined />}
                loading={runningTranslations}
                onClick={async () => {
                  if (runningTranslations) return;
                  setRunningTranslations(true);
                  try {
                    const res = await fetch("/api/admin/translations/run", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "Failed to run translations");
                    message.success("Bulk translation started. This may take a while.");
                  } catch (err: any) {
                    message.error(err?.message || "Translation request failed");
                  } finally {
                    setRunningTranslations(false);
                  }
                }}
              >
                Run Translations
              </Button>
              <Typography.Text type="secondary">{userEmail}</Typography.Text>
              <Button size="small" onClick={handleLogout}>
                Logout
              </Button>
            </Space>
          ) : (
            <Link href="/admin/login">
              <Button type="primary" size="small">
                Login
              </Button>
            </Link>
          )}
        </Header>
        <Content style={{ margin: "24px", minHeight: 360 }}>{children}</Content>
      </Layout>

      <Drawer
        title="Navigation"
        placement="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        style={{ width: 'var(--admin-sider-width)' }}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          items={antdMenuItems}
          onClick={() => setMobileNavOpen(false)}
        />
      </Drawer>
    </Layout>
  );
}


