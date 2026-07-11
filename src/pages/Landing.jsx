import React from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Globe2, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Star 
} from 'lucide-react';

export default function Landing() {
  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="landing-container" style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#fafafa', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Navigation */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 60px', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
            <Zap size={16} fill="black" />
          </div>
          DispatchIQ
        </div>
        <div style={{ display: 'flex', gap: '32px', color: '#a1a1aa', fontSize: '0.875rem', fontWeight: 500 }}>
          <span style={{ cursor: 'pointer' }}>Features</span>
          <span style={{ cursor: 'pointer' }}>Customers</span>
          <span style={{ cursor: 'pointer' }}>Pricing</span>
          <span style={{ cursor: 'pointer' }}>Changelog</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={navigateToLogin} style={{ background: 'transparent', border: 'none', color: '#fafafa', cursor: 'pointer', fontWeight: 500 }}>Log in</button>
          <button onClick={navigateToLogin} style={{ background: '#fafafa', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            Book a Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ textAlign: 'center', padding: '120px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(255,255,255,0.05)', 
          padding: '6px 12px', 
          borderRadius: '99px', 
          fontSize: '0.85rem', 
          color: '#a1a1aa',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '30px'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#00c969', borderRadius: '50%' }}></span>
          DispatchIQ Copilot 2.0 is now live <ArrowRight size={14} />
        </div>
        
        <h1 style={{ fontSize: '4.5rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 24px 0', background: 'linear-gradient(180deg, #fff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          The operating system for modern delivery.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '40px' }}>
          Predict delays, automate customer retention, and resolve SLA breaches before they happen. Purpose-built for high-volume enterprise logistics.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button onClick={navigateToLogin} style={{ background: '#fafafa', color: '#000', border: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Start Building <ArrowRight size={18} />
          </button>
          <button onClick={navigateToLogin} style={{ background: 'transparent', color: '#fafafa', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
            Read the Docs
          </button>
        </div>
      </header>

      {/* Dashboard Preview */}
      <div style={{ padding: '0 40px', display: 'flex', justifyContent: 'center', marginBottom: '100px' }}>
        <div style={{ width: '100%', maxWidth: '1200px', height: '600px', background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', position: 'relative' }}>
          {/* Faux Dashboard Header */}
          <div style={{ height: '50px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#333' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#333' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#333' }}></div>
          </div>
          {/* Dashboard Skeleton */}
          <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}></div>
              <div style={{ height: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}></div>
              <div style={{ height: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}></div>
              <div style={{ height: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}></div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: 1, height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                <div style={{ flex: 1, height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                <div style={{ flex: 1, height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}></div>
              </div>
              <div style={{ height: '280px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By */}
      <section style={{ textAlign: 'center', padding: '60px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '40px' }}>
          Trusted by the world's most innovative delivery teams
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', opacity: 0.5 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Acme Corp</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>GlobalX</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Nova Logistics</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Apex Freight</span>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '120px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 20px 0' }}>Everything you need to scale.</h2>
          <p style={{ color: '#a1a1aa', fontSize: '1.2rem' }}>A complete toolset designed for maximum operational velocity.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
          <FeatureCard icon={<BarChart3 />} title="Real-time Telemetry" description="Monitor millions of shipments across 40+ carriers with zero latency updates." />
          <FeatureCard icon={<Cpu />} title="AI Delay Prediction" description="Our proprietary model flags high-risk routes days before an SLA breach occurs." />
          <FeatureCard icon={<ShieldCheck />} title="Automated Resolution" description="Trigger instant workflows to divert packages, refund VIPs, or alert teams." />
          <FeatureCard icon={<Globe2 />} title="Global Orchestration" description="Manage regional hubs from a single pane of glass with role-based access." />
          <FeatureCard icon={<Users />} title="CRM Sync" description="Seamlessly integrate with Zendesk, Salesforce, and Intercom in one click." />
          <FeatureCard icon={<Zap />} title="Instant Analytics" description="Generate board-ready operational reports without touching a spreadsheet." />
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: '100px 20px', background: '#09090b', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '20px', color: '#f5a623' }}>
          <Star fill="currentColor" size={20} />
          <Star fill="currentColor" size={20} />
          <Star fill="currentColor" size={20} />
          <Star fill="currentColor" size={20} />
          <Star fill="currentColor" size={20} />
        </div>
        <h3 style={{ fontSize: '2rem', fontWeight: 500, maxWidth: '800px', margin: '0 auto 40px', lineHeight: 1.4 }}>
          "DispatchIQ transformed our operations overnight. We reduced our SLA breaches by 45% in the first quarter alone while scaling our volume by 3x."
        </h3>
        <p style={{ fontWeight: 600, margin: 0 }}>Sarah Jenkins</p>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>VP of Logistics, Acme Corp</p>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#fafafa' }}>
          <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
            <Zap size={12} fill="black" />
          </div>
          DispatchIQ
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Sales</span>
        </div>
        <div>
          © 2026 DispatchIQ, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
      <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#fafafa' }}>
        {icon}
      </div>
      <h4 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 12px 0' }}>{title}</h4>
      <p style={{ color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
}
