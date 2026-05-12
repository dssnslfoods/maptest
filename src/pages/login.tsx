import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Book, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import './login.css';

/**
 * MAP Test — /login (Variation A · hero photograph)
 *
 * Implements `design_handoff_login_redesign/README.md`.
 * Layout: split-screen — left hero pane (photo + overlays + hero copy + 3
 * glass stat cards), right form pane (560px white, logo, chip, H1, fields,
 * sign-in CTA, footer attribution). No SSO / role selector / create-account
 * by design — handoff §"Goal".
 */

const REMEMBER_KEY = 'map_test_remember_email';

export function LoginPage() {
  const session = useAuthStore((s) => s.session);
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(
    () => localStorage.getItem(REMEMBER_KEY) ?? '',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Default ON per handoff §"State management"
  const [remember, setRemember] = useState<boolean>(
    () => localStorage.getItem(REMEMBER_KEY) !== null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (session) return <Navigate to="/dashboard" replace />;

  const validate = (): boolean => {
    let ok = true;
    setEmailError(null);
    setPasswordError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email is required');
      ok = false;
    } else if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailError('Enter a valid email address');
      ok = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      ok = false;
    }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      // handoff §"Interactions" — focus email on auth error
      document.getElementById('login-email')?.focus();
      return;
    }
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    navigate('/dashboard');
  };

  return (
    <div className="login-root">
      <LoginHero />

      {/* <768px banner — replaces the hero (handoff §"Responsive") */}
      <div className="login-banner" aria-hidden="true">
        <span className="login-logo-mark">
          <Book width={18} height={18} strokeWidth={2} />
        </span>
        <span className="login-logo-word">
          <b>MAP</b> Test
        </span>
        <span className="tagline">Measure growth. Inspire progress.</span>
      </div>

      <div className="login-form-pane">
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <Logo />

          <div className="login-head">
            <span className="login-chip">
              <span className="dot" aria-hidden="true" />
              Spring 2026 testing window
            </span>
            <h1 className="login-h1">
              Welcome <em>back</em>
            </h1>
            <p className="login-sub">
              Sign in to view your adaptive growth report and continue your assessment.
            </p>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-email">
              Email address
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
                <Mail width={18} height={18} strokeWidth={1.75} />
              </span>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={`login-input${emailError ? ' is-error' : ''}`}
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'login-email-err' : undefined}
                required
              />
            </div>
            {emailError && (
              <p id="login-email-err" className="login-error-text" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon" aria-hidden="true">
                <Lock width={18} height={18} strokeWidth={1.75} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`login-input${passwordError ? ' is-error' : ''}`}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'login-password-err' : undefined}
                required
              />
              <button
                type="button"
                className="login-input-trail"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <Eye width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
                )}
              </button>
            </div>
            {passwordError && (
              <p id="login-password-err" className="login-error-text" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <label className="login-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Keep me signed in on this device
          </label>

          <button
            type="submit"
            className="login-cta"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Loader2 width={16} height={16} className="login-spin" aria-hidden="true" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight width={16} height={16} strokeWidth={2} aria-hidden="true" />
              </>
            )}
          </button>

          <p className="login-foot">
            Developed by <b>Arnon Arpaket</b> · © 2026
          </p>
        </form>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="login-logo">
      <div className="login-logo-mark" aria-hidden="true">
        <Book width={20} height={20} strokeWidth={2} />
      </div>
      <div className="login-logo-word">
        <b>MAP</b> Test
      </div>
    </div>
  );
}

function LoginHero() {
  // TODO(launch): Swap the Unsplash placeholder for a licensed, brand-aligned
  // photograph before going live. See `design_handoff_login_redesign/README.md`
  // §"Assets" for the photo brief — single learner age 8–16, natural light,
  // 3/4 angle on a notebook/tablet, ≥2400px long edge, WebP q=80.
  const PHOTO_SRC =
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&q=85&auto=format&fit=crop';

  return (
    <div className="login-hero">
      <div className="login-hero-photo">
        <img
          src={PHOTO_SRC}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0';
          }}
        />
        <div className="login-hero-overlay" aria-hidden="true" />
        <div className="login-hero-tint" aria-hidden="true" />
      </div>

      <div className="login-hero-head">
        <span className="login-eyebrow">MAP · TEST</span>
        <h2 className="login-hero-h">
          Measure growth.
          <br />
          Inspire <em>progress.</em>
        </h2>
        <p className="login-hero-sub">
          An adaptive K-12 assessment platform that meets every student where they are — and shows them where to go next.
        </p>
      </div>

      {/* Real-product stats — replaces handoff's marketing numbers per product
          decision (option 7=B). Source: this codebase's spec. */}
      <div className="login-stats">
        <div className="login-stat">
          <div className="login-stat-n">40</div>
          <div className="login-stat-label">
            Adaptive items per assessment, Math + English interleaved
          </div>
        </div>
        <div className="login-stat">
          <div className="login-stat-n">RIT</div>
          <div className="login-stat-label">
            Equal-interval growth scale across all grade levels
          </div>
        </div>
        <div className="login-stat">
          <div className="login-stat-n">K–12</div>
          <div className="login-stat-label">
            Norm-referenced bands from Kindergarten through Grade 12
          </div>
        </div>
      </div>
    </div>
  );
}
