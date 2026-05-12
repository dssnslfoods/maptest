// MAP Test — Shared login form panel. Used identically across all 3 hero variations.

const Icon = {
  Book: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect width="18" height="11" x="3" y="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Eye: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  Student: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Teacher: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M7 21v-2a4 4 0 0 1 3-3.87"/>
      <circle cx="10.5" cy="7" r="3.5"/>
      <path d="M17 13l4-2v8"/>
    </svg>
  ),
  Parent: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 21v-2a4 4 0 0 0-3-3.87"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

function SSOGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
function SSOMicrosoft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}
function SSOApple() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" fill="#0F172A">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function Logo() {
  return (
    <div className="mt-logo">
      <div className="mt-logo-mark">
        <Icon.Book width="20" height="20"/>
      </div>
      <div className="mt-logo-word"><b>MAP</b> Test</div>
    </div>
  );
}

function RoleSelector({ value, onChange }) {
  const roles = [
    { id: 'student', label: 'Student',  Ic: Icon.Student },
    { id: 'teacher', label: 'Teacher',  Ic: Icon.Teacher },
    { id: 'parent',  label: 'Parent',   Ic: Icon.Parent  },
  ];
  return (
    <div className="mt-roles" role="tablist">
      {roles.map((r) => (
        <button
          key={r.id}
          role="tab"
          aria-selected={value === r.id}
          className={`mt-role ${value === r.id ? 'active' : ''}`}
          onClick={() => onChange(r.id)}
          type="button"
        >
          <r.Ic width="14" height="14"/>
          {r.label}
        </button>
      ))}
    </div>
  );
}

function LoginForm({ heading }) {
  const [showPw, setShowPw] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [remember, setRemember] = React.useState(true);

  return (
    <form className="mt-form" onSubmit={(e) => e.preventDefault()}>
      <Logo />

      <div className="mt-form-head">
        <span className="mt-chip"><span className="dot"/>Spring 2026 testing window</span>
        {heading}
        <p className="mt-sub">Sign in to view your adaptive growth report and continue your assessment.</p>
      </div>

      <div className="mt-field">
        <label className="mt-label" htmlFor="mt-email">Email address</label>
        <div className="mt-input-wrap has-icon">
          <span className="mt-input-icon"><Icon.Mail width="18" height="18"/></span>
          <input
            id="mt-email"
            type="email"
            className="mt-input"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="mt-field">
        <div className="mt-field-row">
          <label className="mt-label" htmlFor="mt-pw">Password</label>
          <a className="mt-link" href="#" tabIndex={-1}>Forgot password?</a>
        </div>
        <div className="mt-input-wrap has-icon">
          <span className="mt-input-icon"><Icon.Lock width="18" height="18"/></span>
          <input
            id="mt-pw"
            type={showPw ? 'text' : 'password'}
            className="mt-input"
            placeholder="••••••••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
          />
          <button type="button" className="mt-input-trail" onClick={() => setShowPw(s => !s)} aria-label="Toggle password visibility">
            <Icon.Eye width="18" height="18"/>
          </button>
        </div>
      </div>

      <label className="mt-check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Keep me signed in on this device
      </label>

      <button type="submit" className="mt-btn mt-btn-primary mt-btn-block">
        Sign in
        <Icon.Arrow width="16" height="16"/>
      </button>

      <div className="mt-foot">
        <span className="mt-foot-sm">Developed by <b>Arnon Arpaket</b> · © 2026</span>
      </div>
    </form>
  );
}

Object.assign(window, { Icon, Logo, RoleSelector, LoginForm, SSOGoogle, SSOMicrosoft, SSOApple });
