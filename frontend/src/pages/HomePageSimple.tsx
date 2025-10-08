import React from 'react'
import { Link } from 'react-router-dom'

const HomePageSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px', color: 'white', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 'bold' }}>
            WriteCareNotes
          </h1>
          <p style={{ fontSize: '24px', marginBottom: '30px' }}>
            Enterprise Care Home Management Platform
          </p>
          <p style={{ fontSize: '18px', maxWidth: '800px', margin: '0 auto 40px' }}>
            The only British Isles care management platform with AI-powered policy authoring, 
            multi-jurisdiction compliance, and zero-hallucination RAG technology.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/demo" style={{ padding: '15px 30px', background: 'white', color: '#667eea', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
              Book Demo
            </Link>
            <Link to="/platform/ai-features" style={{ padding: '15px 30px', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
              View Features
            </Link>
          </div>
        </div>

        {/* Platform Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '60px' }}>
          {[
            { value: "100+", label: "Microservices", description: "Production-ready services" },
            { value: "15+", label: "AI Systems", description: "RAG-based, zero hallucination" },
            { value: "7", label: "Jurisdictions", description: "All British Isles regulators" },
            { value: "50,000+", label: "Lines of Code", description: "100% production-ready" }
          ].map((stat, index) => (
            <div key={index} style={{ background: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Key Features */}
        <h2 style={{ fontSize: '36px', textAlign: 'center', marginBottom: '40px', color: '#333' }}>
          Enterprise Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
          {[
            {
              title: "RAG-Based AI Policy Assistant",
              description: "Zero-hallucination AI policy authoring with verified sources. UNIQUE in British Isles market.",
              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            },
            {
              title: "WriteCare Connect",
              description: "Supervised family communications with AI-powered video calling and messaging.",
              gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            },
            {
              title: "Multi-Jurisdiction Compliance",
              description: "Automated compliance with all 7 British Isles regulators: CQC, CI, CIW, RQIA, and Crown Dependencies.",
              gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            },
            {
              title: "HMRC Payroll Integration",
              description: "Direct HMRC connectivity with real-time PAYE processing and automatic pension contributions.",
              gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            },
            {
              title: "Academy & Training Platform",
              description: "11 comprehensive training modules covering all roles and regulatory requirements.",
              gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            },
            {
              title: "Domiciliary Care Management",
              description: "Complete care visit management with service user planning and compliance tracking.",
              gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
            }
          ].map((feature, index) => (
            <div key={index} style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: feature.gradient, marginBottom: '20px' }}></div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '20px', color: '#333' }}>
            Ready to Transform Your Care Home?
          </h2>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px', maxWidth: '700px', margin: '0 auto 30px' }}>
            Join leading care providers across the British Isles using WriteCareNotes to deliver exceptional care.
          </p>
          <Link to="/demo" style={{ display: 'inline-block', padding: '15px 40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
            Schedule Your Demo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePageSimple;
