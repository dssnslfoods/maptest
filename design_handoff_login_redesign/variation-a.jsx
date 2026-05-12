// Variation A — Single hero photograph
// Real photo (Unsplash placeholder) with floating stat cards over warm gradient.

function VariationA() {
  return (
    <div className="mt-root va-root">
      {/* Form pane — right */}
      <div className="mt-form-wrap">
        <LoginForm heading={<h1 className="mt-h1">Welcome <em>back</em></h1>} />
      </div>

      {/* Hero pane — left */}
      <div className="mt-hero va-hero">
        {/* Background tint behind the photo */}
        <div className="va-photo-frame">
          <img
            className="va-photo-img"
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1400&q=85&auto=format&fit=crop"
            alt=""
            aria-hidden="true"
            onError={(e) => { e.currentTarget.style.opacity = '0'; }}
          />
          {/* Gradient overlay for legibility of top hero copy */}
          <div className="va-photo-overlay"/>
          {/* Bottom shadow gradient for stats legibility */}
          <div className="va-photo-shadow"/>
        </div>

        {/* Hero text on top of photo */}
        <div className="mt-hero-head va-head">
          <span className="mt-eyebrow va-eyebrow">Map · Test</span>
          <h2 className="mt-hero-h va-h">Measure growth.<br/>Inspire <em>progress.</em></h2>
          <p className="mt-hero-sub va-sub">An adaptive K-12 assessment platform that meets every student where they are — and shows them where to go next.</p>
        </div>

        {/* Floating stat cards over the photo */}
        <div className="mt-stats va-stats">
          <div className="mt-stat">
            <div className="mt-stat-n">12<sup>M+</sup></div>
            <div className="mt-stat-label">Adaptive assessments delivered each year</div>
          </div>
          <div className="mt-stat">
            <div className="mt-stat-n">RIT</div>
            <div className="mt-stat-label">Reliable growth scale across all grades</div>
          </div>
          <div className="mt-stat">
            <div className="mt-stat-n">98<sup>%</sup></div>
            <div className="mt-stat-label">Educator satisfaction across 8K+ schools</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.VariationA = VariationA;
