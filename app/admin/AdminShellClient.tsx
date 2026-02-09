"use client";

import {
  AppstoreOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  SolutionOutlined,
  TableOutlined,
  TagsOutlined,
  TeamOutlined,
  BgColorsOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Layout, Menu, Space, Typography } from "antd";
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
  { key: "hero-slides", icon: <FileProtectOutlined />, labelText: "Homepage Hero", href: "/admin/hero-slides" },
  {
    key: "catalog",
    icon: <AppstoreOutlined />,
    labelText: "Catalog",
    children: [
      { key: "catalog-products-new", icon: <TableOutlined />, labelText: "Products", href: "/admin/products" },
      { key: "catalog-slingshot-collections", icon: <AppstoreOutlined />, labelText: "Slingshot Collections", href: "/admin/collections-slingshot" },
      { key: "catalog-rideengine-collections", icon: <AppstoreOutlined />, labelText: "Ride Engine Collections", href: "/admin/collections-rideengine" },
      { key: "catalog-homepage-collections", icon: <AppstoreOutlined />, labelText: "Homepage Collections", href: "/admin/collections-homepage" },

      { key: "catalog-categories", icon: <TagsOutlined />, labelText: "Categories", href: "/admin/categories" },
      // { key: "catalog-colors", icon: <BgColorsOutlined />, labelText: "Colors", href: "/admin/colors" },
      // { key: "catalog-menu-groups", icon: <TagsOutlined />, labelText: "Menu Groups", href: "/admin/menu-groups" },
      // { key: "catalog-activity-categories", icon: <TagsOutlined />, labelText: "Activity Categories", href: "/admin/activity-categories" },
      { key: "catalog-tags", icon: <GlobalOutlined />, labelText: "Tags", href: "/admin/tags" },
      { key: "catalog-shop-by-cat", icon: <AppstoreOutlined />, labelText: "Shop by CAT", href: "/admin/homepage-categories" },
      { key: "catalog-shop-by-kw", icon: <TagsOutlined />, labelText: "Shop by KW", href: "/admin/homepage-keywords" },
      { key: "catalog-research", icon: <ThunderboltOutlined />, labelText: "SEO Research", href: "/admin/research" },
      { key: "catalog-audit", icon: <AreaChartOutlined />, labelText: "Visual Audit", href: "/admin/audit" },
      { key: "catalog-shop-settings", icon: <SettingOutlined />, labelText: "Shop Settings", href: "/admin/shop-settings" },
    ],
  },

  { key: "inquiries", icon: <ShoppingCartOutlined />, labelText: "Inquiries", href: "/admin/inquiries" },
  { key: "promotions", icon: <BulbOutlined />, labelText: "Notifications", href: "/admin/promotions" },
  { key: "research", icon: <SearchOutlined />, labelText: "SEO Research", href: "/admin/research" },
  { key: "pages-new", icon: <FileProtectOutlined />, labelText: "Pages", href: "/admin/pages-new" },
  { key: "faq", icon: <QuestionCircleOutlined />, labelText: "FAQ Module", href: "/admin/faq" },
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
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname?.startsWith("/admin/login");
  const siderLabelCh = useMemo(() => maxLabelChars(ADMIN_MENU), []);
  const adminShellStyle = useMemo(
    () =>
      ({
        ["--admin-sider-label-ch" as any]: String(siderLabelCh),
      }) as React.CSSProperties,
    [siderLabelCh],
  );

  useEffect(() => {
    // Keep current behavior but make first paint stable
    // User wants "Catalog" always open or at least open by default.
    const desired = initialOpenKeysForSelectedKey(selectedKey);
    if (!desired.includes('catalog')) {
      desired.push('catalog');
    }
    setOpenKeys((prev) => {
      // Merge with previous, ensuring catalog is always there if we want it forced open
      const setKeys = new Set([...prev, ...desired, 'catalog']);
      return Array.from(setKeys);
    });
  }, [selectedKey]);

  // Recursively add style for indentation to children if needed
  // User wants MORE indentation (15px extra).
  const styledMenuItems = useMemo(() => {
    return toAntdItems(ADMIN_MENU).map(item => {
      if (item.key === 'catalog' && item.children) {
        return {
          ...item,
          children: item.children.map((child: any) => ({
            ...child,
            style: { ...child.style, paddingLeft: '48px' } // Override for specific 15px extra indent (default is ~24+24?)
          }))
        }
      }
      return item;
    });
  }, []);

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserEmail(data.user.email);
        } else {
          router.replace('/admin/login');
        }
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace('/admin/login');
        setAuthChecked(true);
      });
  }, [isLoginPage, router]);

  // Login page renders without sidebar/header
  if (isLoginPage) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ margin: "24px", minHeight: 360 }}>{children}</Content>
      </Layout>
    );
  }

  // Show nothing while checking auth (prevents flash)
  if (!authChecked || !userEmail) {
    return (
      <Layout style={{ minHeight: "100vh", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography.Text type="secondary">Loading...</Typography.Text>
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
            items={styledMenuItems}
            style={{ flex: 1, borderRight: 0 }}
          />
          <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography.Text type="secondary" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
              v 1.7.9
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
              <Typography.Text type="secondary">{userEmail}</Typography.Text>
              <Button
                size="small"
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST' })
                    .then(() => {
                      setUserEmail(null);
                      router.replace('/admin/login');
                    });
                }}
              >
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
          items={styledMenuItems}
          onClick={() => setMobileNavOpen(false)}
        />
      </Drawer>
    </Layout>
  );
}
