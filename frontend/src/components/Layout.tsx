import { Link, useLocation } from 'react-router-dom';
import { ReactNode, useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  setIsAuthenticated: (value: boolean) => void;
}

export default function Layout({ children, setIsAuthenticated }: LayoutProps) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  // Get user from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/schemes', label: 'Chit Schemes', icon: '💰' },
    { path: '/payments', label: 'Payments', icon: '💳' },
    { path: '/auctions', label: 'Auctions', icon: '🔨' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const sidebarWidth = sidebarCollapsed ? '70px' : '250px';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        background: '#2c3e50',
        color: 'white',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 1000
      }}>
        {/* Profile Section at Top */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #34495e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: '#007bff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0
          }}>
            👤
          </div>
          {!sidebarCollapsed && (
            <div style={{ textAlign: 'center', overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: '#bdc3c7', whiteSpace: 'nowrap' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div style={{
          padding: '10px',
          borderBottom: '1px solid #34495e',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#34495e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '10px 0', flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  textDecoration: 'none',
                  color: active ? '#fff' : '#bdc3c7',
                  background: active ? '#007bff' : 'transparent',
                  borderLeft: active ? '4px solid #fff' : '4px solid transparent',
                  transition: 'all 0.3s',
                  fontWeight: active ? '600' : '400',
                  fontSize: '16px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = '#34495e';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#bdc3c7';
                  }
                }}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* Logout Button at Bottom */}
        <div style={{
          padding: '10px',
          borderTop: '1px solid #34495e'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              color: '#bdc3c7',
              cursor: 'pointer',
              fontSize: '16px',
              borderRadius: '4px',
              transition: 'all 0.3s',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e74c3c';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#bdc3c7';
            }}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🚪</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Footer in sidebar */}
        {!sidebarCollapsed && (
          <div style={{
            padding: '15px',
            borderTop: '1px solid #34495e',
            fontSize: '11px',
            color: '#95a5a6',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0 }}>&copy; 2024</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '20px',
        overflow: 'auto',
        background: '#f5f5f5',
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

